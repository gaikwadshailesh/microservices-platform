import subprocess
import sys
import os

def start_services():
    # Configure Redis connection
    os.environ.setdefault('REDIS_HOST', '0.0.0.0')
    os.environ.setdefault('REDIS_PORT', '6379')

    # Start user service
    user_service = subprocess.Popen([sys.executable, "-m", "uvicorn", "services.user_service.main:app", "--host", "0.0.0.0", "--port", "8001"])

    # Start product service
    product_service = subprocess.Popen([sys.executable, "-m", "uvicorn", "services.product_service.main:app", "--host", "0.0.0.0", "--port", "8002"])

    # Start GitHub service
    github_service = subprocess.Popen([sys.executable, "-m", "uvicorn", "services.github_service.main:app", "--host", "0.0.0.0", "--port", "8003"])

    try:
        user_service.wait()
        product_service.wait()
        github_service.wait()
    except KeyboardInterrupt:
        user_service.terminate()
        product_service.terminate()
        github_service.terminate()
        sys.exit(0)

if __name__ == "__main__":
    start_services()