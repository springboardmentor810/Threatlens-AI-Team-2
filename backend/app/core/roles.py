from enum import Enum


class UserRole(str, Enum):
    ANALYST = "analyst"
    SECURITY_ANALYST = "security_analyst"
    ADMIN = "admin"