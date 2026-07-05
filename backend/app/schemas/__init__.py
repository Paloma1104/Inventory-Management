from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models import TransactionType, UserRole


# Auth
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    name: str


class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[UserRole] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)


# Users
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    role: UserRole = UserRole.USER


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    status: Optional[str] = None


class UserResponse(UserBase):
    user_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=6)


# Categories
class CategoryBase(BaseModel):
    category_name: str = Field(..., min_length=1, max_length=100)


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    category_id: int

    class Config:
        from_attributes = True


# Products
class ProductBase(BaseModel):
    product_name: str = Field(..., min_length=1, max_length=200)
    category_id: int
    sku: str = Field(..., min_length=1, max_length=50)
    description: str = ""
    price: float = Field(..., ge=0)
    currency: str = "USD"
    current_quantity: int = Field(0, ge=0)
    minimum_stock_level: int = Field(10, ge=0)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    product_name: Optional[str] = Field(None, min_length=1, max_length=200)
    category_id: Optional[int] = None
    sku: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = None
    current_quantity: Optional[int] = Field(None, ge=0)
    minimum_stock_level: Optional[int] = Field(None, ge=0)


class ProductResponse(ProductBase):
    product_id: int
    category_name: Optional[str] = None
    status: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Transactions
class TransactionCreate(BaseModel):
    product_id: int
    transaction_type: TransactionType
    quantity: int = Field(..., gt=0)
    remarks: str = ""
    ordered_at: Optional[datetime] = None


class TransactionResponse(BaseModel):
    transaction_id: int
    product_id: int
    product_name: str
    user_id: int
    user_name: str
    transaction_type: TransactionType
    quantity: int
    remarks: str
    ordered_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Audit Logs
class AuditLogResponse(BaseModel):
    log_id: int
    user_id: int
    user_name: str
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    action: str
    details: str
    created_at: datetime

    class Config:
        from_attributes = True


# Dashboard
class DashboardStats(BaseModel):
    total_products: int
    total_users: int
    low_stock_products: int
    recent_transactions: list[TransactionResponse]


class CategoryAnalytics(BaseModel):
    category_name: str
    product_count: int
    total_quantity: int


class MonthlyChange(BaseModel):
    month: str
    stock_in: int
    stock_out: int


class AnalyticsResponse(BaseModel):
    inventory_by_category: list[CategoryAnalytics]
    monthly_changes: list[MonthlyChange]
    low_stock_products: list[ProductResponse]
    recent_activity: list[AuditLogResponse]


# Product Requests
class ProductRequestCreate(BaseModel):
    product_id: Optional[int] = None
    product_name: str = Field(..., min_length=1, max_length=200)
    category_id: Optional[int] = None
    quantity: int = Field(1, ge=1)
    remarks: Optional[str] = ""


class ProductRequestUpdate(BaseModel):
    status: str = Field(..., description="approved or rejected")
    remarks: Optional[str] = None


class ProductRequestResponse(BaseModel):
    request_id: int
    product_id: Optional[int] = None
    product_name: str
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    quantity: int
    user_id: int
    user_name: str
    status: str
    remarks: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StockRunwayPrediction(BaseModel):
    product_id: int
    product_name: str
    current_stock: int
    predicted_30_day_demand: int
    stock_runway_status: str
    average_lead_time_days: int
    order_frequency_pattern: str
    recommended_reorder_window_days: int

    class Config:
        from_attributes = True


