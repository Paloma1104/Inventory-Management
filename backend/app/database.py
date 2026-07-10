import logging
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger(__name__)
Base = declarative_base()

class DatabaseManager:
    def __init__(self):
        self._engines = {}
        self._session_factories = {}
        
        self.connect_args = {}
        if settings.DATABASE_URL.startswith(("mysql://", "mysql+pymysql://")):
            self.connect_args["connect_timeout"] = 5

        self.register_database("default", settings.DATABASE_URL)

    def register_database(self, name: str, database_url: str):
        try:
            engine = create_engine(
                database_url,
                pool_pre_ping=True,
                pool_recycle=3600,
                pool_size=15,
                max_overflow=10,
                connect_args=self.connect_args,
            )
            self._engines[name] = engine
            self._session_factories[name] = sessionmaker(
                autocommit=False, autoflush=False, bind=engine
            )
            logger.info(f"Successfully registered database connection: '{name}'")
        except Exception as e:
            logger.error(f"Failed to register database '{name}': {e}")
            raise e

    def get_session(self, name: str = "default"):
        if name not in self._session_factories:
            raise ValueError(f"Database connection '{name}' has not been registered.")
        return self._session_factories[name]()

    def verify_health(self, name: str = "default") -> bool:
        if name not in self._engines:
            return False
        try:
            with self._engines[name].connect() as connection:
                connection.execute(text("SELECT 1"))
            return True
        except SQLAlchemyError as exc:
            logger.error(f"Health check failed for database '{name}': {exc}")
            return False

    def get_safe_url(self, name: str = "default") -> str:
        if name not in self._engines:
            return "Unknown Connection Target"
        return make_url(self._engines[name].url).render_as_string(hide_password=True)


db_manager = DatabaseManager()


def SessionLocal():
    return db_manager.get_session("default")


def init_db():
    import app.models  # Ensure models are loaded and registered on Base
    engine = db_manager._engines.get("default")
    if engine is None:
        raise RuntimeError("Database engine not registered.")
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as exc:
        raise RuntimeError(f"Database initialization failed: {exc}") from exc


def get_db():
    db = db_manager.get_session("default")
    try:
        yield db
    finally:
        db.close()