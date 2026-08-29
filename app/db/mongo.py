from pymongo import MongoClient, ASCENDING, DESCENDING
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

mongo_client = None

def get_mongo_client() -> MongoClient:
    global mongo_client
    if mongo_client is None:
        mongo_client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=3000)
    return mongo_client

def get_mongo_db():
    client = get_mongo_client()
    return client[settings.MONGO_DB]

def init_mongo_indexes():
    """Initializes NoSQL indexes for activity telemetry and document reviews."""
    try:
        db = get_mongo_db()
        # Activity Logs collection indexes
        db.activity_logs.create_index([("user_id", ASCENDING), ("timestamp", DESCENDING)])
        db.activity_logs.create_index([("action_type", ASCENDING)])
        db.activity_logs.create_index([("document_id", ASCENDING)])

        # Document Reviews / Feedback collection indexes
        db.document_reviews.create_index([("document_id", ASCENDING), ("rating", DESCENDING)])
        db.document_reviews.create_index([("user_id", ASCENDING)])
        
        logger.info("MongoDB indexes initialized successfully in %s", settings.MONGO_DB)
    except Exception as e:
        logger.warning("MongoDB index initialization skipped: %s", e)
