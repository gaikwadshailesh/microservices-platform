import os
import aiohttp
from typing import Optional, Dict, Any
from fastapi import HTTPException
from .models import GitHubAuthResponse, GitHubUser, Repository

class GitHubService:
    def __init__(self):
        self.client_id = os.environ.get('GITHUB_CLIENT_ID')
        self.client_secret = os.environ.get('GITHUB_CLIENT_SECRET')
        self.base_url = "https://api.github.com"
        self.oauth_url = "https://github.com/login/oauth"

        if not self.client_id or not self.client_secret:
            raise ValueError("GitHub OAuth credentials not configured")

    def get_oauth_url(self, state: str) -> str:
        """Generate GitHub OAuth authorization URL"""
        params = {
            'client_id': self.client_id,
            'redirect_uri': 'http://localhost:5000/api/auth/github/callback',
            'scope': 'repo user',
            'state': state
        }
        query = '&'.join(f'{k}={v}' for k, v in params.items())
        return f"{self.oauth_url}/authorize?{query}"

    async def exchange_code_for_token(self, code: str) -> GitHubAuthResponse:
        """Exchange OAuth code for access token"""
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.oauth_url}/access_token",
                headers={'Accept': 'application/json'},
                data={
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                    'code': code
                }
            ) as response:
                if response.status != 200:
                    raise HTTPException(
                        status_code=400,
                        detail="Failed to exchange code for token"
                    )
                data = await response.json()
                return GitHubAuthResponse(**data)

    async def get_user(self, access_token: str) -> GitHubUser:
        """Get authenticated user's information"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.base_url}/user",
                headers={
                    'Authorization': f'Bearer {access_token}',
                    'Accept': 'application/vnd.github.v3+json'
                }
            ) as response:
                if response.status != 200:
                    raise HTTPException(
                        status_code=response.status,
                        detail="Failed to fetch user information"
                    )
                data = await response.json()
                return GitHubUser(**data)

    async def list_repositories(self, access_token: str) -> list[Repository]:
        """List repositories accessible to the authenticated user"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.base_url}/user/repos",
                headers={
                    'Authorization': f'Bearer {access_token}',
                    'Accept': 'application/vnd.github.v3+json'
                },
                params={'sort': 'updated', 'per_page': 100}
            ) as response:
                if response.status != 200:
                    raise HTTPException(
                        status_code=response.status,
                        detail="Failed to fetch repositories"
                    )
                data = await response.json()
                return [Repository(**repo) for repo in data]

    async def create_repository(
        self, 
        access_token: str, 
        name: str, 
        private: bool = False,
        description: Optional[str] = None
    ) -> Repository:
        """Create a new repository"""
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/user/repos",
                headers={
                    'Authorization': f'Bearer {access_token}',
                    'Accept': 'application/vnd.github.v3+json'
                },
                json={
                    'name': name,
                    'private': private,
                    'description': description,
                    'auto_init': True
                }
            ) as response:
                if response.status != 201:
                    raise HTTPException(
                        status_code=response.status,
                        detail="Failed to create repository"
                    )
                data = await response.json()
                return Repository(**data)