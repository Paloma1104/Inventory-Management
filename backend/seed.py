"""Seed script to populate initial data."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, init_db
from app.models import AuditLog, Category, InventoryTransaction, Product, User, UserRole, ProductRequest
from app.utils.auth import get_password_hash

IOT_CATEGORIES = [
    "Sensors",
    "Gateways",
    "Controllers",
    "IoT Modules",
]

IOT_PRODUCTS = [
    {
        "product_name": "DHT22 Temperature & Humidity Sensor",
        "category": "Sensors",
        "sku": "IOT-SEN-001",
        "description": "Digital temperature and humidity sensor for environmental monitoring",
        "price": 12.99,
        "current_quantity": 120,
        "minimum_stock_level": 25,
    },
    {
        "product_name": "PIR Motion Detection Sensor",
        "category": "Sensors",
        "sku": "IOT-SEN-002",
        "description": "Passive infrared motion sensor for occupancy detection",
        "price": 8.49,
        "current_quantity": 6,
        "minimum_stock_level": 20,
    },
    {
        "product_name": "Ultrasonic Distance Sensor HC-SR04",
        "category": "Sensors",
        "sku": "IOT-SEN-003",
        "description": "Ultrasonic range finder for proximity and level sensing",
        "price": 4.99,
        "current_quantity": 85,
        "minimum_stock_level": 30,
    },
    {
        "product_name": "LoRaWAN Multi-Channel Gateway",
        "category": "Gateways",
        "sku": "IOT-GW-001",
        "description": "8-channel LoRaWAN gateway for long-range IoT connectivity",
        "price": 349.99,
        "current_quantity": 12,
        "minimum_stock_level": 5,
    },
    {
        "product_name": "WiFi MQTT Smart Gateway Hub",
        "category": "Gateways",
        "sku": "IOT-GW-002",
        "description": "Dual-band WiFi gateway with MQTT broker for edge device management",
        "price": 89.99,
        "current_quantity": 4,
        "minimum_stock_level": 10,
    },
    {
        "product_name": "4-Channel Relay Control Module",
        "category": "Controllers",
        "sku": "IOT-CTL-001",
        "description": "Optocoupler-isolated relay board for remote actuator control",
        "price": 14.99,
        "current_quantity": 60,
        "minimum_stock_level": 15,
    },
    {
        "product_name": "ESP32 WiFi + Bluetooth Module",
        "category": "IoT Modules",
        "sku": "IOT-MOD-001",
        "description": "Dual-core ESP32 development board with WiFi and BLE support",
        "price": 11.99,
        "current_quantity": 200,
        "minimum_stock_level": 40,
    },
    {
        "product_name": "RFID RC522 Reader Module",
        "category": "IoT Modules",
        "sku": "IOT-MOD-002",
        "description": "13.56MHz RFID reader/writer module for asset tracking",
        "price": 9.99,
        "current_quantity": 45,
        "minimum_stock_level": 15,
    },
]


def reset_admin_password(db):
    admin = db.query(User).filter(User.email == "admin@inventory.com").first()
    if admin:
        admin.password_hash = get_password_hash("admin123")
        admin.role = UserRole.ADMIN
        admin.status = "active"
        db.commit()
        print("Admin password reset to: admin123")
        return True
    return False


def seed_inventory(db):
    db.query(InventoryTransaction).delete()
    db.query(AuditLog).filter(AuditLog.product_id.isnot(None)).delete()
    db.query(ProductRequest).delete()
    db.query(Product).delete()
    db.query(Category).delete()
    db.flush()

    categories = {name: Category(category_name=name) for name in IOT_CATEGORIES}
    db.add_all(categories.values())
    db.flush()

    products = [
        Product(
            product_name=item["product_name"],
            category_id=categories[item["category"]].category_id,
            sku=item["sku"],
            description=item["description"],
            price=item["price"],
            current_quantity=item["current_quantity"],
            minimum_stock_level=item["minimum_stock_level"],
        )
        for item in IOT_PRODUCTS
    ]
    db.add_all(products)
    db.commit()
    print(f"Inventory reseeded with {len(products)} IoT devices across {len(categories)} categories.")


def seed(reset_admin: bool = False, reseed_inventory: bool = False):
    try:
        init_db()
    except RuntimeError as exc:
        print(exc)
        raise SystemExit(1) from exc

    db = SessionLocal()

    try:
        if reset_admin:
            if reset_admin_password(db):
                if not reseed_inventory:
                    return
            else:
                print("No admin user found. Creating fresh seed data...")

        if reseed_inventory:
            seed_inventory(db)
            return

        if db.query(User).filter(User.email == "admin@inventory.com").first():
            print("Database already seeded.")
            print("To reset admin password run: python seed.py --reset-admin")
            print("To refresh IoT inventory run: python seed.py --reseed-inventory")
            return

        admin = User(
            name="Admin User",
            email="admin@inventory.com",
            password_hash=get_password_hash("admin123"),
            role=UserRole.ADMIN,
        )
        db.add(admin)
        db.flush()

        seed_inventory(db)
        print("Database seeded successfully!")
        print("Admin login: admin@inventory.com / admin123")
    finally:
        db.close()


if __name__ == "__main__":
    reset = "--reset-admin" in sys.argv
    reseed = "--reseed-inventory" in sys.argv
    seed(reset_admin=reset, reseed_inventory=reseed)
