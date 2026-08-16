from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.base import Base


class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)

    original_filename = Column(
        String(255),
        nullable=False
    )

    stored_filename = Column(
        String(255),
        nullable=False
    )

    file_type = Column(String(50))

    file_size = Column(Integer)

    sha256 = Column(
        String(64),
        unique=True
    )

    md5 = Column(String(32))

    status = Column(
        String(50),
        default="Uploaded"
    )

    upload_time = Column(
        DateTime,
        default=datetime.utcnow
    )

    uploaded_by = Column(
        String(36),
        ForeignKey("users.id")
    )

    # Relationship with user
    uploader = relationship(
        "User",
        back_populates="files"
    )

    # Relationships with analysis results
    predictions = relationship(
        "Prediction",
        back_populates="file"
    )

    analyses = relationship(
        "Analysis",
        back_populates="file"
    )

    alerts = relationship(
        "Alert",
        back_populates="file"
    )

    reports = relationship(
        "Report",
        back_populates="file"
    )