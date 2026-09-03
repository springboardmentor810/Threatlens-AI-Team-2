from pymongo import MongoClient
from app.config.settings import settings

client = MongoClient(settings.MONGODB_URL)

mongodb = client["malware_db"]