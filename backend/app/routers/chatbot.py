import logging
from fastapi import APIRouter, Depends, HTTPException, status

from app.chatbot.schemas import ChatRequest, ChatResponse
from app.dependencies.auth import get_current_user
from app.models import User
from app.chatbot.service import ChatbotService

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["AI Chatbot"],
)


chatbot_service = ChatbotService()


@router.post("/", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        response_text = chatbot_service.chat(
            message=request.message,
            role=current_user.role.value,
            user_id=current_user.user_id,
        )
        return ChatResponse(response=response_text)
    except Exception as exc:
        logger.exception("Unexpected error in chatbot endpoint")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chatbot service is currently unavailable. Please try again later."
        )