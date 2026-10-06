from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from bson import ObjectId
from app.db.mongo import get_mongo_db

class MongoService:
    def log_activity(
        self,
        action_type: str,
        user_id: int,
        document_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> str:
        """Logs user interactions, search telemetry, or document access into MongoDB."""
        try:
            db = get_mongo_db()
            record = {
                "action_type": action_type,
                "user_id": user_id,
                "document_id": document_id,
                "details": details or {},
                "timestamp": datetime.now(timezone.utc)
            }
            res = db.activity_logs.insert_one(record)
            return str(res.inserted_id)
        except Exception as e:
            return ""

    def add_document_review(
        self,
        document_id: int,
        user_id: int,
        user_name: str,
        rating: int,
        review_text: str
    ) -> Dict[str, Any]:
        """Adds a semi-structured user review/rating for a document in MongoDB."""
        db = get_mongo_db()
        doc = {
            "document_id": document_id,
            "user_id": user_id,
            "user_name": user_name,
            "rating": max(1, min(5, rating)),
            "review_text": review_text.strip(),
            "created_at": datetime.now(timezone.utc)
        }
        res = db.document_reviews.insert_one(doc)
        doc["id"] = str(res.inserted_id)
        doc["_id"] = str(res.inserted_id)
        doc["created_at"] = doc["created_at"].isoformat()
        return doc

    def list_reviews_for_document(self, document_id: int) -> List[Dict[str, Any]]:
        db = get_mongo_db()
        cursor = db.document_reviews.find({"document_id": document_id}).sort("created_at", -1)
        results = []
        for r in cursor:
            results.append({
                "id": str(r["_id"]),
                "document_id": r["document_id"],
                "user_id": r["user_id"],
                "user_name": r.get("user_name", f"User {r['user_id']}"),
                "rating": r["rating"],
                "review_text": r["review_text"],
                "created_at": r["created_at"].isoformat() if isinstance(r["created_at"], datetime) else str(r["created_at"])
            })
        return results

    def get_telemetry_aggregation(self, user_id: Optional[int] = None, accessible_doc_ids: Optional[List[int]] = None) -> Dict[str, Any]:
        """
        Executes real MongoDB Aggregation Pipelines:
        1. Action Type distribution using $group
        2. Average ratings by document using $group, $sort, and $limit
        """
        db = get_mongo_db()

        # Pipeline 1: Action type distribution
        pipeline_actions = [
            {"$group": {"_id": "$action_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        activity_filter = {} if user_id is None else {"user_id": user_id}
        review_filter = {} if accessible_doc_ids is None else {"document_id": {"$in": accessible_doc_ids}}
        pipeline_actions.insert(0, {"$match": activity_filter})
        action_results = list(db.activity_logs.aggregate(pipeline_actions))
        action_dist = {item["_id"]: item["count"] for item in action_results if item.get("_id")}

        # Pipeline 2: Document reviews aggregation
        pipeline_reviews = [
            {
                "$group": {
                    "_id": "$document_id",
                    "average_rating": {"$avg": "$rating"},
                    "review_count": {"$sum": 1}
                }
            },
            {"$sort": {"review_count": -1, "average_rating": -1}},
            {"$limit": 10}
        ]
        pipeline_reviews.insert(0, {"$match": review_filter})
        review_aggregates = list(db.document_reviews.aggregate(pipeline_reviews))
        doc_reviews_summary = [
            {
                "document_id": item["_id"],
                "average_rating": round(float(item["average_rating"]), 2),
                "review_count": item["review_count"]
            }
            for item in review_aggregates
        ]

        total_activities = db.activity_logs.count_documents(activity_filter)
        total_reviews = db.document_reviews.count_documents(review_filter)
        averages = list(db.document_reviews.aggregate([{"$match": review_filter}, {"$group": {"_id": None, "average": {"$avg": "$rating"}}}]))
        ratings = list(db.document_reviews.aggregate([{"$match": review_filter}, {"$group": {"_id": "$rating", "count": {"$sum": 1}}}]))
        recent = []
        for activity in db.activity_logs.find(activity_filter).sort("timestamp", -1).limit(20):
            recent.append({"id": str(activity["_id"]), "action_type": activity["action_type"], "user_id": activity["user_id"], "timestamp": activity["timestamp"].isoformat()})

        return {
            "total_activities": total_activities,
            "total_reviews": total_reviews,
            "average_rating": round(float(averages[0]["average"]), 2) if averages else 0.0,
            "ratings_distribution": {str(r["_id"]): r["count"] for r in ratings},
            "action_distribution": action_dist,
            "recent_activities": recent,
            "status": "HEALTHY",
            "action_type_distribution": action_dist,
            "top_reviewed_documents": doc_reviews_summary,
            "average_ratings_by_document": doc_reviews_summary
        }

mongo_service = MongoService()
