import logging
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class SQLQuery(BaseModel):
    """
    Structured output returned by Gemini for SQL generation.
    """

    sql: str = Field(
        description="A single valid MySQL SELECT query."
    )


def get_database_schema(role: str) -> str:
    """
    Returns a static representation of the database schema based on the user's role.
    Only exposes the tables and columns the role is authorized to see.
    """
    role = role.lower()

    # Common tables exposed to both admins and users
    products_schema = """
Table: products
Columns:
- product_id (INT, Primary Key)
- product_name (VARCHAR)
- category_id (INT, Foreign Key to categories.category_id)
- sku (VARCHAR, Unique)
- description (TEXT)
- price (DOUBLE)
- currency (VARCHAR)
- current_quantity (INT)
- minimum_stock_level (INT)
- created_at (DATETIME)
- updated_at (DATETIME)
"""

    categories_schema = """
Table: categories
Columns:
- category_id (INT, Primary Key)
- category_name (VARCHAR, Unique)
"""

    product_requests_schema = """
Table: product_requests
Columns:
- request_id (INT, Primary Key)
- product_id (INT, Foreign Key to products.product_id)
- product_name (VARCHAR)
- category_id (INT, Foreign Key to categories.category_id)
- quantity (INT)
- user_id (INT, Foreign Key to users.user_id)
- status (VARCHAR)
- remarks (TEXT)
- created_at (DATETIME)
- updated_at (DATETIME)
"""

    if role == "admin":
        users_schema = """
Table: users
Columns:
- user_id (INT, Primary Key)
- name (VARCHAR)
- email (VARCHAR, Unique)
- role (ENUM: 'admin', 'user')
- status (VARCHAR)
- created_at (DATETIME)
"""

        inventory_transactions_schema = """
Table: inventory_transactions
Columns:
- transaction_id (INT, Primary Key)
- product_id (INT, Foreign Key to products.product_id)
- user_id (INT, Foreign Key to users.user_id)
- transaction_type (ENUM: 'stock_in', 'stock_out')
- quantity (INT)
- remarks (TEXT)
- ordered_at (DATETIME)
- created_at (DATETIME)
"""

        audit_logs_schema = """
Table: audit_logs
Columns:
- log_id (INT, Primary Key)
- user_id (INT, Foreign Key to users.user_id)
- product_id (INT, Foreign Key to products.product_id)
- action (VARCHAR)
- details (TEXT)
- created_at (DATETIME)
"""
        return "\n".join([
            users_schema,
            categories_schema,
            products_schema,
            inventory_transactions_schema,
            audit_logs_schema,
            product_requests_schema
        ])
    else:
        # Regular user schema: only categories, products, and product_requests
        return "\n".join([
            categories_schema,
            products_schema,
            product_requests_schema
        ])