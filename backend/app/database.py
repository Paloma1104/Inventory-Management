from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith(("mysql://", "mysql+pymysql://")):
    connect_args["connect_timeout"] = 5

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args=connect_args,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_database_url_display() -> str:
    return make_url(settings.DATABASE_URL).render_as_string(hide_password=True)


def get_database_unavailable_message() -> str:
    return (
        f"Could not connect to the database at {get_database_url_display()}. "
        "Start MySQL with `docker compose up -d` from the project root, "
        "verify backend/.env DATABASE_URL, then restart the backend."
    )


def init_db() -> None:
    try:
        Base.metadata.create_all(bind=engine)
        with engine.connect() as conn:
            try:
                conn.execute(text("ALTER TABLE inventory_transactions ADD COLUMN ordered_at DATETIME NULL"))
                conn.commit()
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE products ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'USD'"))
                conn.commit()
            except Exception:
                pass
    except SQLAlchemyError as exc:
        raise RuntimeError(get_database_unavailable_message()) from exc


def is_database_available() -> bool:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except SQLAlchemyError:
        return False


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
