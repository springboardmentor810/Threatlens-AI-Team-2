from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.base import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    file_id = Column(
        Integer,
        ForeignKey("files.id")
    )

    severity = Column(
        String(50)
    )

    message = Column(
        String(500)
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    acknowledged = Column(
        Boolean,
        default=False,
        nullable=False
    )

    file = relationship(
        "File",
        back_populates="alerts"
    )