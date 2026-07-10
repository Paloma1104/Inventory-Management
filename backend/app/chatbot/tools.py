import json
import logging
import re

from langchain.tools import tool
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


def get_inventory_tool(role: str, user_id: int):
    """
    Creates a database tool bound to the authenticated user.
    """

    @tool
    def execute_inventory_query(sql: str) -> str:
        """
        Executes a safe read-only SQL query against the inventory database.
        """

        try:
            validate_sql(sql)
            validate_role(sql, role, user_id)
        except (ValueError, PermissionError) as val_err:
            logger.warning("Query validation failed for user %s: %s", user_id, val_err)
            return json.dumps(
                {
                    "success": False,
                    "error": str(val_err)
                }
            )

        db = SessionLocal()

        try:

            result = db.execute(text(sql))

            rows = result.mappings().all()

            if not rows:
                return json.dumps(
                    {
                        "success": True,
                        "rows": [],
                        "message": "No records found.",
                    },
                    default=str,
                )

            return json.dumps(
                {
                    "success": True,
                    "rows": rows,
                },
                default=str,
            )

        except Exception as e:
            logger.exception("SQL execution failed for query: %s", sql)
            return json.dumps(
                {
                    "success": False,
                    "error": f"Database error during execution: {str(e)}",
                }
            )

        finally:
            db.close()

    return execute_inventory_query