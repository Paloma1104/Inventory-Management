import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.models import Category, Product, User
from app.schemas import CategoryCreate, CategoryResponse, ProductCreate, ProductResponse, ProductUpdate
from app.services.audit import create_audit_log

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Products & Categories"])


def _product_status(product: Product) -> str:
    if product.current_quantity == 0:
        return "out_of_stock"
    if product.current_quantity <= product.minimum_stock_level:
        return "low_stock"
    return "in_stock"


def _to_product_response(product: Product) -> ProductResponse:
    return ProductResponse(
        product_id=product.product_id,
        product_name=product.product_name,
        category_id=product.category_id,
        category_name=product.category.category_name if product.category else None,
        sku=product.sku,
        description=product.description,
        price=product.price,
        currency=product.currency,
        current_quantity=product.current_quantity,
        minimum_stock_level=product.minimum_stock_level,
        status=_product_status(product),
        created_at=product.created_at,
        updated_at=product.updated_at,
    )


@router.get("/categories", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    try:
        return db.query(Category).order_by(Category.category_name).all()
    except SQLAlchemyError as exc:
        logger.exception("Database error occurred while listing categories")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load categories due to a database error."
        )


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        existing = db.query(Category).filter(Category.category_name == data.category_name).first()
    except SQLAlchemyError as exc:
        logger.exception("Database error occurred while checking existing category")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error. Please try again later."
        )
        
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
        
    try:
        category = Category(category_name=data.category_name)
        db.add(category)
        db.commit()
        db.refresh(category)
        return category
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Database error occurred while creating category")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create category due to a database error."
        )


@router.get("/products", response_model=list[ProductResponse])
def list_products(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    try:
        products = db.query(Product).order_by(Product.product_name).all()
        return [_to_product_response(p) for p in products]
    except SQLAlchemyError as exc:
        logger.exception("Database error occurred while listing products")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load products list due to a database error."
        )


@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        product = db.query(Product).filter(Product.product_id == product_id).first()
    except SQLAlchemyError as exc:
        logger.exception("Database error occurred while retrieving product details")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error. Please try again later."
        )
        
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return _to_product_response(product)


@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        existing_sku = db.query(Product).filter(Product.sku == data.sku).first()
        existing_cat = db.query(Category).filter(Category.category_id == data.category_id).first()
    except SQLAlchemyError as exc:
        logger.exception("Database error occurred during product validation checks")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error. Please try again later."
        )

    if existing_sku:
        raise HTTPException(status_code=400, detail="SKU already exists")
    if not existing_cat:
        raise HTTPException(status_code=400, detail="Category not found")

    try:
        product = Product(**data.model_dump())
        db.add(product)
        db.flush()
        create_audit_log(
            db,
            current_user.user_id,
            "Product Added",
            f"Added product '{data.product_name}' (SKU: {data.sku})",
            product_id=product.product_id,
        )
        db.commit()
        db.refresh(product)
        return _to_product_response(product)
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Database error occurred while adding new product")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create product due to a database error."
        )


@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        product = db.query(Product).filter(Product.product_id == product_id).first()
    except SQLAlchemyError as exc:
        logger.exception("Database error occurred while finding product for update")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error. Please try again later."
        )
        
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = data.model_dump(exclude_unset=True)
    if "sku" in update_data:
        try:
            existing = db.query(Product).filter(
                Product.sku == update_data["sku"], Product.product_id != product_id
            ).first()
        except SQLAlchemyError as exc:
            logger.exception("Database error occurred while checking unique SKU constraint")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection error. Please try again later."
            )
        if existing:
            raise HTTPException(status_code=400, detail="SKU already exists")
            
    if "category_id" in update_data:
        try:
            cat_exists = db.query(Category).filter(Category.category_id == update_data["category_id"]).first()
        except SQLAlchemyError as exc:
            logger.exception("Database error occurred while checking category reference")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection error. Please try again later."
            )
        if not cat_exists:
            raise HTTPException(status_code=400, detail="Category not found")

    try:
        for field, value in update_data.items():
            setattr(product, field, value)

        create_audit_log(
            db,
            current_user.user_id,
            "Product Updated",
            f"Updated product '{product.product_name}'",
            product_id=product.product_id,
        )
        db.commit()
        db.refresh(product)
        return _to_product_response(product)
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Database error occurred while updating product data")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update product due to a database error."
        )


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        product = db.query(Product).filter(Product.product_id == product_id).first()
    except SQLAlchemyError as exc:
        logger.exception("Database error occurred while finding product for deletion")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error. Please try again later."
        )
        
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        create_audit_log(
            db,
            current_user.user_id,
            "Product Deleted",
            f"Deleted product '{product.product_name}' (SKU: {product.sku})",
        )
        db.delete(product)
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Database error occurred while deleting product")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete product because it has associated inventory transactions or request logs."
        )
