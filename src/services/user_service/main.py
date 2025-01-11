from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from .models import UserCreate
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

app = FastAPI(title="User Service")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
def get_db_connection():
    try:
        conn = psycopg2.connect(
            os.environ["DATABASE_URL"],
            cursor_factory=RealDictCursor
        )
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        raise HTTPException(status_code=500, detail="Database connection error")

@app.get("/health")
def health_check():
    """Health check endpoint"""
    try:
        conn = get_db_connection()
        conn.close()
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.get("/users")
def get_users():
    """Get all users"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, name, email, created_at 
            FROM users 
            ORDER BY created_at DESC
        """)
        users = cur.fetchall()
        cur.close()
        conn.close()
        return list(users)
    except Exception as e:
        logger.error(f"Error getting users: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/users")
async def create_user(user: UserCreate):
    """Create a new user"""
    try:
        logger.info(f"Creating new user with data: {user.model_dump(exclude_none=True)}")

        conn = get_db_connection()
        cur = conn.cursor()

        try:
            # First check if username exists
            cur.execute("SELECT id FROM users WHERE username = %s", (user.username,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="Username already exists")

            # Then check if email exists
            cur.execute("SELECT id FROM users WHERE email = %s", (user.email,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="Email already registered")

            # Insert new user
            cur.execute(
                """
                INSERT INTO users (name, email, username, password)
                VALUES (%s, %s, %s, %s)
                RETURNING id, name, email, username, created_at
                """,
                (user.name, user.email, user.username, user.password)
            )
            new_user = dict(cur.fetchone())
            conn.commit()

            # Convert datetime to string for JSON serialization
            if 'created_at' in new_user:
                new_user['created_at'] = new_user['created_at'].isoformat()

            logger.info(f"Successfully created user: {new_user}")
            return new_user

        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Database error while creating user: {str(e)}")
            conn.rollback()
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            cur.close()
            conn.close()

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error creating user: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/users/{user_id}")
def get_user(user_id: int):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        cur.close()
        conn.close()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except Exception as e:
        logger.error(f"Error getting user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)