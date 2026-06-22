from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import require_admin
from app.models import Category, Product, User
from app.schemas import CategoryCreate, CategoryResponse, ProductCreate, ProductResponse, ProductUpdate
from app.services.audit import create_audit_log

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
        current_quantity=product.current_quantity,
        minimum_stock_level=product.minimum_stock_level,
        status=_product_status(product),
        created_at=product.created_at,
        updated_at=product.updated_at,
    )


@router.get("/categories", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(Category).order_by(Category.category_name).all()


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    if db.query(Category).filter(Category.category_name == data.category_name).first():
        raise HTTPException(status_code=400, detail="Category already exists")
    category = Category(category_name=data.category_name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.get("/products", response_model=list[ProductResponse])
def list_products(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    products = db.query(Product).order_by(Product.product_name).all()
    return [_to_product_response(p) for p in products]


@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return _to_product_response(product)


@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if db.query(Product).filter(Product.sku == data.sku).first():
        raise HTTPException(status_code=400, detail="SKU already exists")
    if not db.query(Category).filter(Category.category_id == data.category_id).first():
        raise HTTPException(status_code=400, detail="Category not found")

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


@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = data.model_dump(exclude_unset=True)
    if "sku" in update_data:
        existing = db.query(Product).filter(
            Product.sku == update_data["sku"], Product.product_id != product_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="SKU already exists")
    if "category_id" in update_data:
        if not db.query(Category).filter(Category.category_id == update_data["category_id"]).first():
            raise HTTPException(status_code=400, detail="Category not found")

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


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    create_audit_log(
        db,
        current_user.user_id,
        "Product Deleted",
        f"Deleted product '{product.product_name}' (SKU: {product.sku})",
    )
    db.delete(product)
    db.commit()
