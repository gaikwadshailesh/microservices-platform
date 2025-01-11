# Microservices Platform

A comprehensive microservices platform designed for distributed system architectures, providing monitoring, security, and connectivity solutions. The platform implements service management through containerization, circuit breaker patterns with service registry integration, and system health tracking.

## Features

- 🔐 **Authentication Service**: Secure user authentication with JWT
- 🔄 **Message Queue**: Redis-based message queue for service communication
- 📊 **Real-time Monitoring**: System metrics and service health visualization
- 🛡️ **Circuit Breaker Pattern**: Enhanced service reliability with automatic failure handling
- 📝 **User Management**: Complete user CRUD operations
- 🎯 **Service Registry**: Automated service discovery and health checks

## Architecture

The platform consists of several microservices:

1. **API Gateway** (Port 5000)
   - Main entry point for all client requests
   - Route management and authentication
   - Service health monitoring

2. **User Service** (Port 8001)
   - User management and authentication
   - PostgreSQL database integration

3. **Product Service** (Port 8002)
   - Product management
   - PostgreSQL database integration

4. **Message Queue Service**
   - Redis-based message queue
   - Inter-service communication
   - Event handling

## Technology Stack

- **Frontend**:
  - React with TypeScript
  - TanStack Query for data fetching
  - Recharts for data visualization
  - Tailwind CSS & shadcn/ui for styling
  - Wouter for routing

- **Backend**:
  - Express.js API Gateway
  - FastAPI microservices
  - PostgreSQL database
  - Redis message queue
  - Drizzle ORM
  - Passport.js authentication

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL
- Redis

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install        # Install Node.js dependencies
pip install -r requirements.txt  # Install Python dependencies
```

3. Set up environment variables:
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
PGUSER=your_user
PGPASSWORD=your_password
PGDATABASE=your_database
PGHOST=your_host
PGPORT=5432

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

4. Start the services:
```bash
npm run dev  # Starts both frontend and backend services
```

### Database Setup

Create the necessary database tables using the provided SQL scripts in `sql/init.sql`.

## API Endpoints

### Authentication

- `POST /api/register`: Register new user
- `POST /api/login`: User login
- `POST /api/logout`: User logout
- `GET /api/user`: Get current user

### Users

- `GET /api/users`: List all users
- `POST /api/users`: Create new user
- `GET /api/users/{id}`: Get specific user

### Products

- `GET /api/products`: List all products
- `POST /api/products`: Create new product
- `GET /api/products/{id}`: Get specific product

### Monitoring

- `GET /api/health`: Service health status
- `GET /api/metrics`: System metrics and API response times

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions
│   │   └── pages/        # Application pages
├── server/                # API Gateway
│   ├── auth.ts           # Authentication middleware
│   └── routes.ts         # API routes
├── services/             # Microservices
│   ├── user_service/     # User management service
│   ├── product_service/  # Product management service
│   └── message_queue/    # Message queue service
└── sql/                  # Database scripts
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.
