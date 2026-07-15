import logging
import re
import time
from sqlalchemy import text

from app.database import SessionLocal

logger = logging.getLogger(__name__)


# Tables only admins can access
ADMIN_ONLY_TABLES = {
    "users",
    "audit_logs",
    "inventory_transactions",
}


# SQL statements that are never allowed
BLOCKED_KEYWORDS = {
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "ALTER",
    "TRUNCATE",
    "CREATE",
    "REPLACE",
}


def validate_sql(sql: str) -> None:
    """
    Allows only SELECT statements.
    """
    sql_upper = sql.upper().strip()

    if not sql_upper.startswith("SELECT"):
        raise ValueError("Only SELECT queries are allowed.")

    for keyword in BLOCKED_KEYWORDS:
        if re.search(rf"\b{keyword}\b", sql_upper):
            raise ValueError(f"{keyword} statements are not allowed.")


def validate_role(sql: str, role: str, user_id: int) -> None:
    """
    Enforces role-based access control.
    """
    if role.lower() == "admin":
        return

    sql_lower = sql.lower()

    # Admin-only tables
    for table in ADMIN_ONLY_TABLES:
        if table in sql_lower:
            raise PermissionError(
                f"You do not have permission to access '{table}'."
            )

    # Users may only access their own requests
    if "product_requests" in sql_lower:
        if f"user_id = {user_id}" not in sql_lower:
            raise PermissionError(
                "Users can only access their own product requests."
            )


def execute_inventory_query(sql: str, role: str, user_id: int) -> list:
    """
    Executes a safe read-only SQL query against the inventory database.
    """
    validate_sql(sql)
    validate_role(sql, role, user_id)

    db = SessionLocal()
    try:
        start = time.perf_counter()
        result = db.execute(text(sql))
        logger.info(f"SQL execution took: {time.perf_counter() - start:.3f}s")

        rows = result.mappings().all()
        return [dict(row) for row in rows]
    except Exception as e:
        logger.exception("SQL execution failed for query: %s", sql)
        raise e
    finally:
        db.close()