from fastapi import APIRouter, FastAPI, Request

from app.routers import ai, audit_logs, auth, dashboard, product_requests, products, transactions, users, chatbot
from fastapi.middleware.cors import CORSMiddleware

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth")
api_router.include_router(users.router, prefix="/users")
api_router.include_router(products.router, prefix="")
api_router.include_router(transactions.router, prefix="/transactions")
api_router.include_router(audit_logs.router, prefix="/audit-logs")
api_router.include_router(dashboard.router, prefix="/dashboard")
api_router.include_router(product_requests.router, prefix="/product-requests")
api_router.include_router(ai.router, prefix="/ai")
api_router.include_router(chatbot.router, prefix="/chatbot")

app = FastAPI(
    title="Inventory Management System",
    description="Full-stack inventory management with RBAC",
    version="1.0.0",
)

TRUSTED_STATIC_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://inventory-management-three-sooty.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=TRUSTED_STATIC_ORIGINS,
    allow_origin_regex="https://.*\\.vercel\\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {"status": "ok"}







