# 🚀 E-Commerce Project Setup Guide

This guide will help you set up the e-commerce project in your local environment with proper configuration.

## 📋 Prerequisites

Before starting, ensure you have the following installed:

- **Node.js 20.x** (LTS version)
- **pnpm** (recommended) or npm
- **PostgreSQL 16.x**
- **Redis 7.2.x**
- **Git**

## 🛠️ Installation Steps

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd e-commerce-ui
```

### 2. Install Dependencies

```bash
# Install client dependencies
cd client
pnpm install

# Install admin dependencies
cd ../admin
pnpm install
```

### 3. Environment Configuration

#### Client Application Setup

```bash
cd client
cp .env.example .env.local
```

Edit `client/.env.local` with your configuration:

```env
# Application Configuration
NEXT_PUBLIC_APP_NAME="Your Store Name"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Payment Configuration (Get from Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_key_here"
STRIPE_SECRET_KEY="sk_test_your_secret_key_here"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_32_character_secret_here"
```

#### Admin Application Setup

```bash
cd admin
cp .env.example .env.local
```

Edit `admin/.env.local` with your configuration:

```env
# Application Configuration
NEXT_PUBLIC_APP_NAME="Your Store Admin"
NEXT_PUBLIC_APP_URL="http://localhost:3001"

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/ecommerce_db"
DATABASE_HOST="localhost"
DATABASE_PORT="5432"
DATABASE_NAME="ecommerce_db"
DATABASE_USER="your_db_user"
DATABASE_PASSWORD="your_db_password"

# Redis Configuration
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Authentication
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your_32_character_secret_here"
ADMIN_EMAIL="admin@yourstore.com"
ADMIN_PASSWORD="secure_password"

# Email Configuration
EMAIL_FROM="noreply@yourstore.com"
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your_email@gmail.com"
EMAIL_SERVER_PASSWORD="your_app_password"
```

### 4. Database Setup

#### PostgreSQL Setup

```bash
# Create database
createdb ecommerce_db

# Or using psql
psql -U postgres
CREATE DATABASE ecommerce_db;
CREATE USER your_db_user WITH PASSWORD 'your_db_password';
GRANT ALL PRIVILEGES ON DATABASE ecommerce_db TO your_db_user;
\q
```

#### Redis Setup

```bash
# Start Redis server
redis-server

# Or using Docker
docker run -d -p 6379:6379 redis:7.2-alpine
```

### 5. Run the Applications

#### Development Mode

```bash
# Terminal 1 - Client Application
cd client
pnpm dev

# Terminal 2 - Admin Application
cd admin
pnpm dev
```

#### Production Mode

```bash
# Build and start client
cd client
pnpm build
pnpm start

# Build and start admin
cd admin
pnpm build
pnpm start
```

## 🔧 Configuration Options

### Environment Variables Reference

#### Client Application Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_APP_NAME` | Application name | ✅ | - |
| `NEXT_PUBLIC_APP_URL` | Application URL | ✅ | - |
| `NEXT_PUBLIC_API_URL` | Backend API URL | ✅ | - |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | ✅ | - |
| `NEXT_PUBLIC_CURRENCY` | Currency code | ❌ | USD |
| `NEXT_PUBLIC_TAX_RATE` | Tax rate (decimal) | ❌ | 0.08 |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable analytics | ❌ | true |
| `NEXT_PUBLIC_ENABLE_PAYMENTS` | Enable payments | ❌ | true |

#### Admin Application Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ | - |
| `DATABASE_HOST` | Database host | ✅ | - |
| `DATABASE_NAME` | Database name | ✅ | - |
| `DATABASE_USER` | Database user | ✅ | - |
| `DATABASE_PASSWORD` | Database password | ✅ | - |
| `REDIS_URL` | Redis connection string | ✅ | - |
| `NEXTAUTH_SECRET` | NextAuth secret key | ✅ | - |
| `ADMIN_EMAIL` | Admin email | ✅ | - |
| `ADMIN_PASSWORD` | Admin password | ✅ | - |

### Feature Flags

Control application features using environment variables:

```env
# Feature toggles
NEXT_PUBLIC_ENABLE_ANALYTICS="true"
NEXT_PUBLIC_ENABLE_PAYMENTS="true"
NEXT_PUBLIC_ENABLE_REVIEWS="true"
NEXT_PUBLIC_ENABLE_WISHLIST="true"
NEXT_PUBLIC_ENABLE_NOTIFICATIONS="true"
```

## 🚀 Quick Start Script

Create a `setup.sh` script for automated setup:

```bash
#!/bin/bash

echo "🚀 Setting up E-Commerce Project..."

# Install dependencies
echo "📦 Installing dependencies..."
cd client && pnpm install
cd ../admin && pnpm install

# Copy environment files
echo "⚙️ Setting up environment files..."
cd ../client && cp .env.example .env.local
cd ../admin && cp .env.example .env.local

echo "✅ Setup complete!"
echo "📝 Please edit .env.local files in both client and admin directories"
echo "🗄️ Make sure PostgreSQL and Redis are running"
echo "🚀 Run 'pnpm dev' in both directories to start development"
```

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   
   # Kill process on port 3001
   lsof -ti:3001 | xargs kill -9
   ```

2. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check database credentials
   - Ensure database exists

3. **Redis Connection Issues**
   - Verify Redis is running
   - Check Redis configuration
   - Test connection: `redis-cli ping`

4. **Environment Variable Issues**
   - Ensure all required variables are set
   - Check for typos in variable names
   - Verify .env.local files exist

### Validation

The configuration system includes automatic validation. If you see configuration errors:

1. Check the error message for the specific variable
2. Ensure the variable is set in your .env.local file
3. Verify the format matches the expected type

## 📚 Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Stripe Documentation](https://stripe.com/docs)

## 🤝 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the configuration validation errors
3. Ensure all prerequisites are installed
4. Verify environment variables are correctly set

---

**Happy coding! 🎉**
