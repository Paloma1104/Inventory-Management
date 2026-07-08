from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models import User, Product, UserRole
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])

api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

class ChatRequest(BaseModel):
    message: str

def make_secure_stock_tool(current_user: User):
    def check_stock_level(product_name: str) -> str:
        """
        Call this tool when the user asks about the stock availability, status, 
        quantity, or pricing metrics of a specific product name.
        """
        from app.database import db_manager
        db = db_manager.get_session("default")
        try:
            product = db.query(Product).filter(Product.product_name.ilike(f"%{product_name}%")).first()
            if not product:
                return f"Product '{product_name}' was not found in the inventory system."
            
            if current_user.role == UserRole.ADMIN:
                return f"Product: {product.product_name} | Stock: {product.current_quantity} units | Price: ${product.price} | Status: {product.currency}"
            
            if product.current_quantity <= 0:
                availability = "OUT OF STOCK"
            elif product.current_quantity <= product.minimum_stock_level:
                availability = "LOW STOCK (Restock soon)"
            else:
                availability = "IN STOCK"
                
            return f"Product: {product.product_name} | Availability Status: {availability}. Exact quantities and commercial pricing metrics are restricted to Administrators only."
        finally:
            db.close()
    return check_stock_level

def make_secure_metrics_tool(current_user: User):
    def get_system_metrics() -> str:
        """
        Call this tool when the user asks generic system dashboard metrics, 
        total count profiles, or system-wide resource summaries.
        """
        if current_user.role != UserRole.ADMIN:
            return "Access Denied: High-level operational metrics and user tallies are strictly restricted to Administrators only."
            
        from app.database import db_manager
        db = db_manager.get_session("default")
        try:
            total_products = db.query(Product.product_id).count()
            total_users = db.query(User.user_id).count()
            return f"Admin System Metrics: Handling {total_products} active product SKUs and {total_users} registered user profiles."
        finally:
            db.close()
    return get_system_metrics

@router.post("/chat")
def chat(request: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not os.getenv("GEMINI_API_KEY"):
        return {"response": "Gemini API key is not configured. Please set the GEMINI_API_KEY in your backend/.env file."}
        
    try:
        check_stock_level = make_secure_stock_tool(current_user)
        get_system_metrics = make_secure_metrics_tool(current_user)
        
        model = genai.GenerativeModel(
            model_name='gemini-1.5-flash',
            tools=[check_stock_level, get_system_metrics]
        )
        
        chat_session = model.start_chat(enable_automatic_function_calling=True)
        
        system_instruction = (
            f"You are a secure, role-based AI Agent for an Inventory Management System. "
            f"The current user conversing with you has the role authorization profile: {current_user.role.value}. "
            f"Use your tools to query the live system whenever asked about stock or system data. "
            f"Always honor the text outputs returned by your tools—if a tool states access is restricted or gives limited data, "
            f"convey that limitation politely to the user. Do not invent restricted parameters under any circumstances. "
            f"Keep responses short and helpful."
        )
        
        response = chat_session.send_message(
            system_instruction + "\n\nUser Question: " + request.message
        )
        
        return {"response": response.text}
    except Exception as e:
        return {"response": f"An error occurred while generating chatbot response: {str(e)}"}