from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.models import User
from app.schemas import UserCreate, UserResponse, UserUpdate
from app.services.audit import create_audit_log
from app.utils.auth import get_password_hash

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return db.query(User).filter(User.status == "active").order_by(User.created_at.desc()).all()


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(data: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    existing_user = db.query(User).filter(User.email == data.email).first()
    
    if existing_user:
        if existing_user.status == "active":
            raise HTTPException(status_code=400, detail="Email already exists and account is active")
        
        existing_user.name = data.name
        existing_user.password_hash = get_password_hash(data.password)
        existing_user.role = data.role
        existing_user.status = "active"
        
        create_audit_log(
            db, 
            current_user.user_id, 
            "User Reactivated", 
            f"Reactivated existing inactive account for '{data.name}' ({data.email}) with role {data.role.value}"
        )
        db.commit()
        db.refresh(existing_user)
        return existing_user

    user = User(
        name=data.name,
        email=data.email,
        password_hash=get_password_hash(data.password),
        role=data.role,
        status="active"
    )
    db.add(user)
    
    create_audit_log(
        db, 
        current_user.user_id, 
        "User Created", 
        f"Created a brand new user '{data.name}' with role {data.role.value}"
    )
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = data.model_dump(exclude_unset=True)
    if "email" in update_data:
        existing = db.query(User).filter(
            User.email == update_data["email"], User.user_id != user_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already exists")

    for field, value in update_data.items():
        setattr(user, field, value)

    create_audit_log(
        db,
        current_user.user_id,
        "User Updated",
        f"Updated user '{user.name}'",
    )
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.status = "inactive"

    create_audit_log(
        db,
        current_user.user_id,
        "User Deactivated",
        f"Soft-deleted/Deactivated user '{user.name}' ({user.email})"
    )
    db.commit()
    return None