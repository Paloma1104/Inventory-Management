import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.dependencies.auth import require_admin
from app.models import AuditLog, User
from app.schemas import AuditLogResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Audit Logs"])


@router.get("/", response_model=list[AuditLogResponse])
def list_audit_logs(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).all()
        return [
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
            for log in logs
        ]
    except SQLAlchemyError as exc:
        logger.exception("Database error occurred while listing audit logs")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load audit logs due to a database error."
        )
