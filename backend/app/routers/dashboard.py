from collections import defaultdict
from datetime import datetime, timedelta
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.dependencies.auth import require_admin
from app.models import AuditLog, Category, InventoryTransaction, Product, TransactionType, User
from app.routers.products import _product_status, _to_product_response
from app.routers.transactions import _to_transaction_response
from app.schemas import AnalyticsResponse, CategoryAnalytics, DashboardStats, MonthlyChange, ProductResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        total_products = db.query(Product).count()
        total_users = db.query(User).count()
        low_stock = db.query(Product).filter(
            Product.current_quantity <= Product.minimum_stock_level
        ).count()

        recent_txns = (
            db.query(InventoryTransaction)
            .order_by(InventoryTransaction.created_at.desc())
            .limit(5)
            .all()
        )

        return DashboardStats(
            total_products=total_products,
            total_users=total_users,
            low_stock_products=low_stock,
            recent_transactions=[_to_transaction_response(t) for t in recent_txns],
        )
    except SQLAlchemyError as exc:
        logger.exception("Database error occurred while fetching dashboard stats")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load dashboard statistics due to a database error."
        )


@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        category_data = (
            db.query(
                Category.category_name,
                func.count(Product.product_id).label("product_count"),
                func.coalesce(func.sum(Product.current_quantity), 0).label("total_quantity"),
            )
            .outerjoin(Product, Product.category_id == Category.category_id)
            .group_by(Category.category_id, Category.category_name)
            .all()
        )

        inventory_by_category = [
            CategoryAnalytics(
                category_name=row.category_name,
                product_count=row.product_count,
                total_quantity=int(row.total_quantity),
            )
            for row in category_data
        ]

        six_months_ago = datetime.utcnow() - timedelta(days=180)
        txns = (
            db.query(InventoryTransaction)
            .filter(InventoryTransaction.created_at >= six_months_ago)
            .all()
        )

        monthly_map: dict[str, dict[str, int]] = defaultdict(lambda: {"stock_in": 0, "stock_out": 0})
        for txn in txns:
            month_key = txn.created_at.strftime("%Y-%m")
            if txn.transaction_type == TransactionType.STOCK_IN:
                monthly_map[month_key]["stock_in"] += txn.quantity
            else:
                monthly_map[month_key]["stock_out"] += txn.quantity

        monthly_changes = [
            MonthlyChange(month=month, stock_in=data["stock_in"], stock_out=data["stock_out"])
            for month, data in sorted(monthly_map.items())
        ]

        low_stock_products = (
            db.query(Product)
            .filter(Product.current_quantity <= Product.minimum_stock_level)
            .order_by(Product.current_quantity)
            .limit(10)
            .all()
        )

        recent_logs = (
            db.query(AuditLog)
            .order_by(AuditLog.created_at.desc())
            .limit(10)
            .all()
        )

        from app.schemas import AuditLogResponse

        recent_activity = [
            AuditLogResponse(
                log_id=log.log_id,
                user_id=log.user_id,
                user_name=log.user.name,
                product_id=log.product_id,
                product_name=log.product.product_name if log.product else None,
                action=log.action,
                details=log.details,
                created_at=log.created_at,
            )
            for log in recent_logs
        ]

        return AnalyticsResponse(
            inventory_by_category=inventory_by_category,
            monthly_changes=monthly_changes,
            low_stock_products=[_to_product_response(p) for p in low_stock_products],
            recent_activity=recent_activity,
        )
    except SQLAlchemyError as exc:
        logger.exception("Database error occurred while fetching analytics data")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load analytics due to a database error."
        )
