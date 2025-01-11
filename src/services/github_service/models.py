from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class GitHubAuthResponse(BaseModel):
    access_token: str = Field(..., description="GitHub OAuth access token")
    token_type: str = Field(..., description="Token type, usually 'bearer'")
    scope: str = Field(..., description="OAuth scopes granted")

class GitHubUser(BaseModel):
    id: int = Field(..., description="GitHub user ID")
    login: str = Field(..., description="GitHub username")
    name: Optional[str] = Field(None, description="User's full name")
    email: Optional[str] = Field(None, description="User's email")
    avatar_url: str = Field(..., description="URL to user's avatar")
    html_url: str = Field(..., description="URL to user's GitHub profile")
    created_at: datetime = Field(..., description="When the user was created on GitHub")

class Repository(BaseModel):
    id: int = Field(..., description="Repository ID")
    name: str = Field(..., description="Repository name")
    full_name: str = Field(..., description="Full repository name (owner/name)")
    private: bool = Field(..., description="Whether the repository is private")
    html_url: str = Field(..., description="URL to repository on GitHub")
    description: Optional[str] = Field(None, description="Repository description")
    created_at: datetime = Field(..., description="When the repository was created")
    updated_at: datetime = Field(..., description="When the repository was last updated")