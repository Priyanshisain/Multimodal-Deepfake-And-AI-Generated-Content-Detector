from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import DATABASE_URL

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    # Check for missing columns in existing SQLite users table
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            # Check users columns
            result = conn.execute(text("PRAGMA table_info(users)"))
            cols = [row[1] for row in result.fetchall()]
            if "password_hash" not in cols and len(cols) > 0:
                conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) DEFAULT ''"))
                conn.commit()
            if "salt" not in cols and len(cols) > 0:
                conn.execute(text("ALTER TABLE users ADD COLUMN salt VARCHAR(64) DEFAULT ''"))
                conn.commit()
    except Exception:
        pass
