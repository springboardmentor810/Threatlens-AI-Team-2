from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.base import Base


class Analysis(Base):
    __tablename__ = "analysis"

    id = Column(Integer, primary_key=True, index=True)

    file_id = Column(
        Integer,
        ForeignKey("files.id")
    )

    analysis_type = Column(String(100))

    result = Column(Text)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    file = relationship(
        "File",
        back_populates="analyses"
    )