import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.models import AuditLog, Category, InventoryTransaction, Product, ProductRequest, TransactionType, User, UserRole
from app.schemas import ProductRequestCreate, ProductRequestResponse, ProductRequestUpdate
from app.services.audit import create_audit_log

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Product Requests"])


def _to_request_response(req: ProductRequest) -> ProductRequestResponse:
    return ProductRequestResponse(
        request_id=req.request_id,
        product_id=req.product_id,
        product_name=req.product_name,
        category_id=req.category_id,
        category_name=req.category.category_name if req.category else None,
        quantity=req.quantity,
        user_id=req.user_id,
        user_name=req.user.name,
        status=req.status,
        remarks=req.remarks or "",
        created_at=req.created_at,
        updated_at=req.updated_at,
    )


@router.post("", response_model=ProductRequestResponse, status_code=status.HTTP_201_CREATED)
def create_product_request(
    data: ProductRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product_id = data.product_id
    product_name = data.product_name
    category_id = data.category_id

    # If referencing an existing product, validate and retrieve its details
    if product_id:
        try:
            product = db.query(Product).filter(Product.product_id == product_id).first()
        except SQLAlchemyError as exc:
            logger.exception("Database error occurred while fetching product for request")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection error. Please try again later."
            )
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        product_name = product.product_name
        category_id = product.category_id

    # Validate category if provided
    if category_id:
        try:
            category = db.query(Category).filter(Category.category_id == category_id).first()
        except SQLAlchemyError as exc:
            logger.exception("Database error occurred while validating category for product request")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection error. Please try again later."
            )
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

    try:
        req = ProductRequest(
            product_id=product_id,
            product_name=product_name,
            category_id=category_id,
            quantity=data.quantity,
            user_id=current_user.user_id,
            status="pending",
            remarks=data.remarks,
        )
        db.add(req)
        db.flush()

        create_audit_log(
            db,
            current_user.user_id,
            "Product Requested",
            f"Requested {data.quantity} x '{product_name}'",
            product_id=product_id,
        )
        db.commit()
        db.refresh(req)
        return _to_request_response(req)
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Database error occurred while creating product request")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit product request due to a database error."
        )


@router.get("", response_model=list[ProductRequestResponse])
def list_product_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        query = db.query(ProductRequest)
        
        # Non-admins can only see their own requests
        if current_user.role != UserRole.ADMIN:
            query = query.filter(ProductRequest.user_id == current_user.user_id)
            
        requests = query.order_by(ProductRequest.created_at.desc()).all()
        return [_to_request_response(r) for r in requests]
    except SQLAlchemyError as exc:
        logger.exception("Database error occurred while listing product requests")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load product requests due to a database error."
        )


@router.put("/{request_id}", response_model=ProductRequestResponse)
def update_product_request(
    request_id: int,
    data: ProductRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        req = db.query(ProductRequest).filter(ProductRequest.request_id == request_id).first()
    except SQLAlchemyError as exc:
        logger.exception("Database error occurred while finding product request")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error. Please try again later."
        )
        
    if not req:
        raise HTTPException(status_code=404, detail="Product request not found")

    if data.status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status value. Use 'approved' or 'rejected'")

    try:
        # If transitions to approved and is an existing product, perform automatic stock-in
        if data.status == "approved" and req.status == "pending" and req.product_id:
            product = db.query(Product).filter(Product.product_id == req.product_id).first()
            if product:
                product.current_quantity += req.quantity
                txn = InventoryTransaction(
                    product_id=req.product_id,
                    user_id=current_user.user_id,
                    transaction_type=TransactionType.STOCK_IN,
                    quantity=req.quantity,
                    remarks=f"Approved Request #{req.request_id}. {data.remarks or ''}".strip(),
                )
                db.add(txn)

        req.status = data.status
        req.remarks = data.remarks or ""
        db.flush()

        action = "Request Approved" if data.status == "approved" else "Request Rejected"
        details = f"{action} request #{req.request_id} for '{req.product_name}' (Qty: {req.quantity})"
        if data.remarks:
            details += f" - Remarks: {data.remarks}"

        create_audit_log(
            db,
            current_user.user_id,
            action,
            details,
            product_id=req.product_id,
        )
        db.commit()
        db.refresh(req)
        return _to_request_response(req)
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Database error occurred while updating product request status")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update product request due to a database error."
        )
