
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password, create_access_token, verify_password

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate


class EmailAlreadyRegisteredError(Exception):
    """Raised when a registration email is already in use."""

class InvalidCredentialsError(Exception):
    """Raised when login credentials are invalid."""


class InactiveUserError(Exception):
    """Raised when an inactive user attempts to log in."""


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)

    def register_user(self, data: UserCreate) -> User:
        email = str(data.email).strip().lower()

        if self.users.get_by_email(email) is not None:
            raise EmailAlreadyRegisteredError(
                "An account with this email already exists."
            )

        user = self.users.create(
            email=email,
            full_name=data.full_name.strip(),
            hashed_password=hash_password(data.password),
        )

        try:
            self.db.commit()
            self.db.refresh(user)
        except IntegrityError as exc:
            self.db.rollback()
            raise EmailAlreadyRegisteredError(
                "An account with this email already exists."
            ) from exc

        return user

    def login(self, email: str, password: str) -> dict[str, str]:
        normalized_email = email.strip().lower()
        user = self.users.get_by_email(normalized_email)

        if user is None or not verify_password(
            password, user.hashed_password
        ):
            raise InvalidCredentialsError("Invalid email or password.")

        if not user.is_active:
            raise InactiveUserError("This account is inactive.")

        return {
            "access_token": create_access_token(user.id),
            "token_type": "bearer",
        }