from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.base import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)

    file_id = Column(
        Integer,
        ForeignKey("files.id")
    )

    predicted_class = Column(String(100))

    confidence_score = Column(Float)

    prediction_time = Column(
        DateTime,
        default=datetime.utcnow
    )

    file = relationship(
        "File",
        back_populates="predictions"
    )