import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import require_admin
from app.models import User
from app.services.forecasting import calculate_stock_predictions
from app.schemas import StockRunwayPrediction

logger = logging.getLogger(__name__)

router = APIRouter(tags=["AI Analytics"])

@router.get("/all-predictions", response_model=list[StockRunwayPrediction])
def get_all_predictions(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    try:
        predictions = calculate_stock_predictions(db)
        return predictions
    except Exception as exc:
        logger.exception("Unexpected error occurred while generating stock runway predictions")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate AI stock forecasts due to an internal error."
        )
