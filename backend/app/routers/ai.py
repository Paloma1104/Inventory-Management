from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import require_admin
from app.models import User
from app.services.forecasting import calculate_stock_predictions
from app.schemas import StockRunwayPrediction

router = APIRouter(prefix="/ai", tags=["AI Analytics"])

@router.get("/all-predictions", response_model=list[StockRunwayPrediction])
def get_all_predictions(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    predictions = calculate_stock_predictions(db)
    return predictions
