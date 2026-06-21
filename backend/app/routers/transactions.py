from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.models import InventoryTransaction, Product, TransactionType, User
from app.schemas import TransactionCreate, TransactionResponse
from app.services.audit import create_audit_log

router = APIRouter(prefix="/transactions", tags=["Transactions"])


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
        created_at=txn.created_at,
    )


@router.get("/", response_model=list[TransactionResponse])
def list_transactions(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    transactions = (
        db.query(InventoryTransaction)
        .order_by(InventoryTransaction.created_at.desc())
        .all()
    )
    return [_to_transaction_response(t) for t in transactions]


@router.post("/", response_model=TransactionResponse, status_code=201)
def create_transaction(
    data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    product = db.query(Product).filter(Product.product_id == data.product_id).first()
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

    txn = InventoryTransaction(
        product_id=data.product_id,
        user_id=current_user.user_id,
        transaction_type=data.transaction_type,
        quantity=data.quantity,
        remarks=data.remarks,
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
