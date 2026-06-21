from sqlalchemy.orm import Session

from app.models import AuditLog, User


def create_audit_log(
    db: Session,
    user_id: int,
    action: str,
    details: str = "",
    product_id: int | None = None,
) -> AuditLog:
    log = AuditLog(
        user_id=user_id,
        product_id=product_id,
        action=action,
        details=details,
    )
    db.add(log)
    return log
