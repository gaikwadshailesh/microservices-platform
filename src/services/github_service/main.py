from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from .service import GitHubService
from .models import GitHubAuthResponse, GitHubUser, Repository
import logging
import secrets

app = FastAPI(title="GitHub Integration Service")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create GitHub service instance
github_service = GitHubService()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.get("/oauth/url")
async def get_oauth_url():
    """Get GitHub OAuth URL"""
    try:
        # Generate a random state parameter for security
        state = secrets.token_urlsafe(32)
        url = github_service.get_oauth_url(state)
        return {"url": url, "state": state}
    except Exception as e:
        logger.error(f"Error generating OAuth URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/oauth/callback")
async def oauth_callback(code: str, state: str):
    """Handle GitHub OAuth callback"""
    try:
        token = await github_service.exchange_code_for_token(code)
        user = await github_service.get_user(token.access_token)
        return {
            "token": token,
            "user": user
        }
    except Exception as e:
        logger.error(f"Error in OAuth callback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/repositories")
async def list_repositories(access_token: str):
    """List repositories for authenticated user"""
    try:
        repos = await github_service.list_repositories(access_token)
        return repos
    except Exception as e:
        logger.error(f"Error listing repositories: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/repositories")
async def create_repository(
    access_token: str,
    name: str,
    private: bool = False,
    description: str = None
):
    """Create a new repository"""
    try:
        repo = await github_service.create_repository(
            access_token=access_token,
            name=name,
            private=private,
            description=description
        )
        return repo
    except Exception as e:
        logger.error(f"Error creating repository: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8003)