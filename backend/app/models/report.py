from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.base import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)

    file_id = Column(
        Integer,
        ForeignKey("files.id")
    )

    report_name = Column(String(255))

    report_path = Column(String(255))

    generated_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    file = relationship(
        "File",
        back_populates="reports"
    )