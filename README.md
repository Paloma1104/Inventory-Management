# Inventory Management System

A full-stack inventory management application with role-based authentication (Admin/User), built with React, FastAPI, and MySQL.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Recharts
- **Backend:** FastAPI, SQLAlchemy, JWT Authentication
- **Database:** MySQL 8

## Features

### Authentication & Authorization
- Login and registration with JWT tokens
- Role-based access control (Admin / User)
- Admin: full access to all modules
- User: view inventory and submit product requests for out-of-stock or new items

### Product Requests
- Standard users can request a restock of low/out-of-stock items, or suggest a new product.
- Admin reviews, adds remarks, and approves/rejects requests from the Dashboard.
- Approving a restock request automatically updates the stock level and creates a Stock In transaction.
- Pending requests are displayed on the Admin Dashboard until resolved.
- Users can track their submitted requests and status updates directly on their Dashboard.


### Admin Modules
- **Dashboard** — Stats, quick actions, recent transactions
- **User Management** — Create, edit, delete users; assign roles
- **Inventory Management** — CRUD products, stock in/out
- **Transactions** — Full transaction history
- **Audit Logs** — Track all system actions
- **Analytics** — Charts, low stock widget, recent activity

## Quick Start

### Prerequisites
- Docker Desktop (for MySQL)
- Python 3.11+
- Node.js 18+

### 1. Start MySQL

```bash
docker compose up -d
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
copy .env.example .env
python seed.py
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the App

Visit **http://localhost:5173**

## Demo Flow

1. **Login** as a standard user
2. **Request Product** — Request a restock on a low-stock product or submit a request for a new item from the inventory page
3. **User Dashboard** — Track the request status under "My Product Requests"

1. **Login** as admin
2. **Manage Requests** — See active requests on the dashboard and approve/reject them with optional remarks
3. **Stock updates** — Observe the inventory automatically updated when a restock request is approved
4. **Audit Logs & Transactions** — Verify actions are fully logged for audit
5. **User Management** — Create, edit, delete users; assign roles


## API Documentation

With the backend running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
Inventory Management/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── config.py            # Settings
│   │   ├── database.py          # SQLAlchemy setup
│   │   ├── models/              # Database models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── routers/             # API route handlers
│   │   ├── services/            # Business logic
│   │   ├── dependencies/        # Auth dependencies
│   │   └── utils/               # JWT & password utils
│   ├── seed.py                  # Database seeder
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Route pages
│   │   ├── context/             # Auth context
│   │   ├── services/            # API client
│   │   └── types/               # TypeScript types
│   └── package.json
└── docker-compose.yml
```

## Database Schema

| Table | Key Fields |
|-------|-----------|
| users | user_id, name, email, password_hash, role, status |
| categories | category_id, category_name |
| products | product_id, product_name, category_id, sku, price, current_quantity, minimum_stock_level |
| inventory_transactions | transaction_id, product_id, user_id, transaction_type, quantity, created_at |
| audit_logs | log_id, user_id, product_id, action, details, created_at |
| product_requests | request_id, product_id, product_name, category_id, quantity, user_id, status, remarks, created_at, updated_at |

## License

MIT
