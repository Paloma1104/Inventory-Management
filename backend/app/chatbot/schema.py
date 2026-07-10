import logging
from langchain_community.utilities import SQLDatabase
from functools import lru_cache
from app.config import settings

logger = logging.getLogger(__name__)

FALLBACK_SCHEMA = """
Table: users
Columns: user_id (Integer, Primary Key), name (String), email (String, Unique), password_hash (String), role (Enum: admin, user), status (String), created_at (DateTime)

Table: categories
Columns: category_id (Integer, Primary Key), category_name (String, Unique)

Table: products
Columns: product_id (Integer, Primary Key), product_name (String), category_id (Integer, ForeignKey), sku (String, Unique), description (Text), price (Float), currency (String), current_quantity (Integer), minimum_stock_level (Integer), created_at (DateTime), updated_at (DateTime)

Table: inventory_transactions
Columns: transaction_id (Integer, Primary Key), product_id (Integer, ForeignKey), user_id (Integer, ForeignKey), transaction_type (Enum: stock_in, stock_out), quantity (Integer), remarks (Text), ordered_at (DateTime), created_at (DateTime)

Table: audit_logs
Columns: log_id (Integer, Primary Key), user_id (Integer, ForeignKey), product_id (Integer, ForeignKey), action (String), details (Text), created_at (DateTime)

Table: product_requests
Columns: request_id (Integer, Primary Key), product_id (Integer, ForeignKey), product_name (String), category_id (Integer, ForeignKey), quantity (Integer), user_id (Integer, ForeignKey), status (String), remarks (Text), created_at (DateTime), updated_at (DateTime)
"""

@lru_cache
def get_database_schema() -> str:
    """
    Returns the complete database schema in a format optimized for LLMs.
    """
    try:
        db = SQLDatabase.from_uri(settings.DATABASE_URL)
        return db.get_table_info()
    except Exception as exc:
        logger.exception("Failed to connect or fetch database schema for chatbot, using fallback")
        return FALLBACK_SCHEMA