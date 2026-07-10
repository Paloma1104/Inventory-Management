import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.dependencies.auth import require_admin
from app.models import InventoryTransaction, Product, TransactionType, User
from app.schemas import TransactionCreate, TransactionResponse
from app.services.audit import create_audit_log

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Transactions"])


def _to_transaction_response(txn: InventoryTransaction) -> TransactionResponse:
    return TransactionResponse(
        transaction_id=txn.transaction_id,
        product_id=txn.product_id,
        product_name=txn.product.product_name,
        user_id=txn.user_id,
        user_name=txn.user.name,
        transaction_type=txn.transaction_type,
        quantity=txn.quantity,
        remarks=txn.remarks,
        ordered_at=txn.ordered_at,
        created_at=txn.created_at,
    )


@router.get("/", response_model=list[TransactionResponse])
def list_transactions(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        transactions = (
            db.query(InventoryTransaction)
            .order_by(InventoryTransaction.created_at.desc())
            .all()
        )
        return [_to_transaction_response(t) for t in transactions]
    except SQLAlchemyError as exc:
        logger.exception("Database error occurred while listing transactions")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load transaction history due to a database error."
        )


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        product = db.query(Product).filter(Product.product_id == data.product_id).first()
    except SQLAlchemyError as exc:
        logger.exception("Database error occurred while verifying product for transaction")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error. Please try again later."
        )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if data.transaction_type == TransactionType.STOCK_OUT:
        if product.current_quantity < data.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock. Available: {product.current_quantity}",
            )
        product.current_quantity -= data.quantity
    else:
        product.current_quantity += data.quantity

    try:
        txn = InventoryTransaction(
            product_id=data.product_id,
            user_id=current_user.user_id,
            transaction_type=data.transaction_type,
            quantity=data.quantity,
            remarks=data.remarks,
            ordered_at=data.ordered_at,
        )
        db.add(txn)

        action_label = "Stock In" if data.transaction_type == TransactionType.STOCK_IN else "Stock Out"
        create_audit_log(
            db,
            current_user.user_id,
            "Stock Updated",
            f"{action_label}: {data.quantity} units of '{product.product_name}'. New qty: {product.current_quantity}",
            product_id=product.product_id,
        )

        db.commit()
        db.refresh(txn)
        return _to_transaction_response(txn)
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Database error occurred while committing stock transaction")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record transaction due to a database error."
        )
