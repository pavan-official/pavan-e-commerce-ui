# 🧪 Local Testing Guide - Enterprise E-Commerce Platform

## 📋 **Prerequisites Checklist**

Before you begin, ensure you have the following installed:

- ✅ **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- ✅ **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- ✅ **Redis** (v6 or higher) - [Download](https://redis.io/download/)
- ✅ **pnpm** (recommended) or npm - `npm install -g pnpm`
- ✅ **Git** - [Download](https://git-scm.com/downloads)

---

## 🚀 **Quick Start Guide**

### **Step 1: Clone and Install**

```bash
# Navigate to your project directory
cd /Users/pavan/Pictures/MY-lesnpic-full-edited\ folders/LOCAL-documents/e-commerce-ui

# Install dependencies for the client
cd client
npm install

# Install dependencies for the admin (optional)
cd ../admin
npm install
```

### **Step 2: Set Up Environment Variables**

Create a `.env` file in the `client` directory:

```bash
cd /Users/pavan/Pictures/MY-lesnpic-full-edited\ folders/LOCAL-documents/e-commerce-ui/client
cp .env.example .env
```

Edit the `.env` file with your local configuration:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/ecommerce_db"

# Redis Cache
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-in-production"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="TrendLama"
NEXT_PUBLIC_APP_DESCRIPTION="Modern E-commerce Platform"

# API Configuration
API_BASE_URL="http://localhost:3000/api"
API_TIMEOUT="30000"

# Performance & Security
DATABASE_CONNECTION_LIMIT="10"
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"

# Stripe Payment (Test Mode)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Encryption
ENCRYPTION_KEY="your-32-character-encryption-key-here-change-me"

# Monitoring (Optional)
SLACK_WEBHOOK_URL=""
ALERT_EMAIL_TO=""

# Logging
LOG_LEVEL="debug"
NODE_ENV="development"
```

### **Step 3: Set Up PostgreSQL Database**

```bash
# Create the database
createdb ecommerce_db

# Or using psql
psql -U postgres
CREATE DATABASE ecommerce_db;
\q
```

### **Step 4: Set Up Redis**

```bash
# Start Redis (macOS with Homebrew)
brew services start redis

# Or start Redis manually
redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### **Step 5: Run Database Migrations**

```bash
cd client

# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Seed the database with initial data
npm run db:seed
```

### **Step 6: Start the Development Server**

```bash
cd client
npm run dev
```

The application should now be running at: **http://localhost:3000**

---

## 🧪 **Testing Checklist**

### **1. Database & API Foundation** ✅

#### **Test Database Connection**
```bash
# Open Prisma Studio to view database
npm run db:studio
# Opens at http://localhost:5555
```

**What to verify:**
- ✅ Database tables created
- ✅ Seed data loaded (categories, products, users)
- ✅ Relations working correctly

#### **Test API Endpoints**
Navigate to: http://localhost:3000/api-test

**What to verify:**
- ✅ Categories API working
- ✅ Products API returning data
- ✅ Pagination working
- ✅ Filtering by category working

### **2. Authentication & Authorization** ✅

#### **Test User Registration**
1. Navigate to: http://localhost:3000/auth/register
2. Register a new user:
   - Name: Test User
   - Email: test@example.com
   - Password: Test123!@#

**What to verify:**
- ✅ User registration successful
- ✅ Password hashed securely
- ✅ Redirected after registration

#### **Test User Login**
1. Navigate to: http://localhost:3000/auth/signin
2. Sign in with:
   - Email: admin@example.com
   - Password: Admin123!@# (from seed data)

**What to verify:**
- ✅ Login successful
- ✅ Session created
- ✅ User name displayed in navbar
- ✅ Role-based access working

#### **Test Multi-Factor Authentication (MFA)**
1. Sign in as admin
2. Navigate to settings/security
3. Enable MFA
4. Scan QR code with authenticator app

**What to verify:**
- ✅ QR code generated
- ✅ Backup codes provided
- ✅ TOTP verification working
- ✅ Session verified after MFA

### **3. Product Management** ✅

#### **Test Product Browsing**
1. Navigate to: http://localhost:3000
2. Browse products on homepage
3. Use category filters
4. Try search functionality

**What to verify:**
- ✅ Products displayed with images
- ✅ Category filters working
- ✅ Search suggestions appearing
- ✅ Product details loading
- ✅ Average ratings displayed

#### **Test Admin Product Management**
1. Sign in as admin
2. Navigate to: http://localhost:3000/admin/products
3. Create a new product
4. Edit existing product
5. Delete a product

**What to verify:**
- ✅ Product CRUD operations working
- ✅ Image upload working
- ✅ Variants can be added
- ✅ Stock management working
- ✅ Validation working correctly

### **4. Shopping Cart & Wishlist** ✅

#### **Test Shopping Cart**
1. Browse products
2. Click "Add to Cart" on a product
3. View cart by clicking cart icon
4. Update quantity
5. Remove items

**What to verify:**
- ✅ Products added to cart
- ✅ Cart count updated in navbar
- ✅ Quantity updates working
- ✅ Total price calculated correctly
- ✅ Stock validation working
- ✅ Cart persists across sessions

#### **Test Wishlist**
1. Browse products
2. Click heart icon to add to wishlist
3. Navigate to: http://localhost:3000/wishlist
4. Remove items from wishlist
5. Move items to cart

**What to verify:**
- ✅ Items added to wishlist
- ✅ Wishlist count in navbar
- ✅ Duplicate prevention working
- ✅ Move to cart working
- ✅ Wishlist persists

### **5. Checkout & Orders** ✅

#### **Test Checkout Process**
1. Add items to cart
2. Click "Checkout"
3. Fill in shipping address
4. Fill in billing address
5. Select payment method
6. Create order

**What to verify:**
- ✅ Checkout form validation
- ✅ Address validation working
- ✅ Order created successfully
- ✅ Cart cleared after order
- ✅ Order confirmation displayed
- ✅ Notification sent

#### **Test Order Tracking**
1. Navigate to: http://localhost:3000/orders
2. View order list
3. Click on an order to view details

**What to verify:**
- ✅ Order history displayed
- ✅ Order details loading
- ✅ Order status visible
- ✅ Order items displayed
- ✅ Tracking information shown

### **6. Payment Integration** ✅

#### **Test Stripe Payment**
1. Complete checkout process
2. Navigate to payment page
3. Use Stripe test card: `4242 4242 4242 4242`
4. Expiry: Any future date
5. CVC: Any 3 digits
6. Submit payment

**What to verify:**
- ✅ Payment form loads
- ✅ Stripe elements render
- ✅ Payment processing
- ✅ Payment success redirect
- ✅ Order status updated
- ✅ Payment notification sent

**Stripe Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Auth Required: `4000 0025 0000 3155`

### **7. Search & Filtering** ✅

#### **Test Advanced Search**
1. Navigate to products page
2. Use search bar with suggestions
3. Apply filters:
   - Category filter
   - Price range
   - Rating filter
   - Stock filter
4. Sort results

**What to verify:**
- ✅ Search suggestions working
- ✅ Text search functional
- ✅ Category filter working
- ✅ Price range filter working
- ✅ Rating filter working
- ✅ Sorting working
- ✅ Pagination working

### **8. Reviews & Ratings** ✅

#### **Test Review System**
1. Navigate to a product page
2. Scroll to reviews section
3. Submit a review:
   - Select star rating
   - Enter title
   - Enter content
4. Vote on review helpfulness

**What to verify:**
- ✅ Review form validation
- ✅ Review submission working
- ✅ Average rating updated
- ✅ Review count updated
- ✅ Helpfulness voting working
- ✅ Review moderation (admin)

#### **Test Review Moderation (Admin)**
1. Sign in as admin
2. Navigate to admin review moderation
3. Approve/reject reviews

**What to verify:**
- ✅ Pending reviews displayed
- ✅ Approve/reject working
- ✅ Rejection reason captured
- ✅ Approved reviews visible

### **9. Notifications** ✅

#### **Test Notification System**
1. Perform actions that trigger notifications:
   - Create an order
   - Payment success/failure
   - Review submission
2. Click notification bell in navbar
3. View notification center
4. Mark as read
5. Delete notifications

**What to verify:**
- ✅ Notifications created
- ✅ Bell icon shows count
- ✅ Real-time updates via SSE
- ✅ Mark as read working
- ✅ Delete working
- ✅ Bulk actions working

### **10. Analytics Dashboard** ✅

#### **Test Analytics (Admin)**
1. Sign in as admin
2. Navigate to: http://localhost:3000/admin/analytics
3. View dashboard metrics
4. Check charts and graphs
5. Review recent orders
6. View top products

**What to verify:**
- ✅ Dashboard loading
- ✅ Metric cards displaying
- ✅ Charts rendering (Recharts)
- ✅ Sales trends visible
- ✅ User growth data
- ✅ Product insights
- ✅ Recent orders table
- ✅ Top products table

---

## 🔍 **Performance Testing**

### **Test Redis Caching**

```bash
# Monitor Redis in real-time
redis-cli monitor

# Or check specific keys
redis-cli
> KEYS *
> GET "products:*"
> TTL "products:*"
```

**What to verify:**
- ✅ Cache keys being created
- ✅ TTL set correctly
- ✅ Cache hits improving performance
- ✅ Cache invalidation on updates

### **Test Rate Limiting**

1. Make rapid API requests
2. Check rate limit headers:
   - `X-RateLimit-Limit`
   - `X-RateLimit-Remaining`
   - `X-RateLimit-Reset`

**What to verify:**
- ✅ Rate limits enforced
- ✅ 429 status on limit exceeded
- ✅ Headers present
- ✅ Different limits for different endpoints

### **Test Database Performance**

```bash
# Check database indexes
npm run db:studio

# Or via psql
psql -U postgres -d ecommerce_db
\di
```

**What to verify:**
- ✅ Indexes created on key columns
- ✅ Query performance acceptable
- ✅ No N+1 queries

---

## 🔐 **Security Testing**

### **Test Input Validation**

1. Try submitting invalid data:
   - Invalid email format
   - Weak password
   - XSS attempts: `<script>alert('xss')</script>`
   - SQL injection: `' OR '1'='1`

**What to verify:**
- ✅ Validation errors shown
- ✅ XSS prevented (sanitized)
- ✅ SQL injection prevented
- ✅ CSRF tokens present

### **Test Authorization**

1. Try accessing admin routes without admin role
2. Try accessing other users' orders
3. Try modifying unauthorized resources

**What to verify:**
- ✅ 401/403 errors for unauthorized access
- ✅ RBAC permissions enforced
- ✅ Resource ownership checked

### **Test Data Encryption**

1. Check database for encrypted fields
2. Verify sensitive data masked in logs

**What to verify:**
- ✅ Passwords hashed with bcrypt
- ✅ Sensitive data encrypted
- ✅ Data masked in logs (emails, phones)

---

## 📊 **Monitoring Testing**

### **Test Health Checks**

```bash
# Check overall health
curl http://localhost:3000/api/health

# Check readiness
curl http://localhost:3000/api/health/readiness

# Check liveness
curl http://localhost:3000/api/health/liveness
```

**What to verify:**
- ✅ Health status returned
- ✅ Component health shown
- ✅ Response times included
- ✅ Database health checked
- ✅ Redis health checked

### **Test Logging**

```bash
# View logs in development
cd client
npm run dev

# Check log files (production)
tail -f logs/combined-*.log
tail -f logs/error-*.log
```

**What to verify:**
- ✅ Request/response logged
- ✅ Errors logged with stack traces
- ✅ Sensitive data masked
- ✅ Log levels working
- ✅ Log rotation working

### **Test Metrics**

```bash
# Get metrics (admin only)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/metrics
```

**What to verify:**
- ✅ Request metrics collected
- ✅ Error rates tracked
- ✅ Response times (P50, P95, P99)
- ✅ Business metrics included

### **Test Alerting**

1. Trigger alert conditions:
   - High error rate (create errors)
   - Slow response time (load test)
   - High memory usage

**What to verify:**
- ✅ Alerts triggered
- ✅ Alert cooldown working
- ✅ Notifications sent (if configured)
- ✅ Alert history tracked

---

## 🧪 **Running Unit Tests**

```bash
cd client

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm test -- security
npm test -- performance
npm test -- monitoring
```

**What to verify:**
- ✅ All tests passing
- ✅ ~80% code coverage
- ✅ No test failures
- ✅ Coverage report generated

---

## 🐛 **Common Issues & Solutions**

### **Issue: Database Connection Failed**

**Solution:**
```bash
# Check PostgreSQL is running
pg_isready

# Restart PostgreSQL
brew services restart postgresql

# Check connection string in .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ecommerce_db"
```

### **Issue: Redis Connection Failed**

**Solution:**
```bash
# Check Redis is running
redis-cli ping

# Start Redis
brew services start redis

# Check Redis configuration in .env
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

### **Issue: Prisma Client Not Generated**

**Solution:**
```bash
cd client
npm run db:generate
npm run db:push
```

### **Issue: Environment Variables Not Loaded**

**Solution:**
```bash
# Ensure .env file exists
ls -la client/.env

# Restart development server
npm run dev
```

### **Issue: Port Already in Use**

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### **Issue: Stripe Webhooks Not Working**

**Solution:**
```bash
# Use Stripe CLI for local testing
stripe listen --forward-to localhost:3000/api/payments/webhook

# Update webhook secret in .env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

---

## 📈 **Performance Benchmarks**

### **Expected Performance** (Local Development)

| Metric | Target | What to Check |
|--------|--------|---------------|
| **API Response Time (P95)** | < 200ms | Chrome DevTools Network tab |
| **Page Load Time** | < 2s | Lighthouse Performance |
| **Database Query Time** | < 100ms | Prisma logs |
| **Cache Hit Ratio** | > 80% | Redis monitor |
| **Memory Usage** | < 512MB | Activity Monitor / htop |

### **How to Measure**

1. **Chrome DevTools:**
   - Open DevTools (F12)
   - Network tab → Check API response times
   - Lighthouse → Run performance audit

2. **Redis Stats:**
   ```bash
   redis-cli info stats
   ```

3. **Database Performance:**
   ```bash
   # Enable query logging in .env
   LOG_LEVEL=debug
   
   # Watch logs for slow queries
   npm run dev
   ```

---

## ✅ **Testing Completion Checklist**

### **Core Functionality**
- [ ] Database connected and seeded
- [ ] API endpoints responding
- [ ] User registration working
- [ ] User login working
- [ ] Product browsing working
- [ ] Cart operations working
- [ ] Checkout process working
- [ ] Order creation working
- [ ] Payment processing working

### **Advanced Features**
- [ ] Search and filtering working
- [ ] Product reviews working
- [ ] Notifications working
- [ ] Analytics dashboard working
- [ ] Admin functions working

### **Performance & Security**
- [ ] Redis caching working
- [ ] Rate limiting enforced
- [ ] Input validation working
- [ ] Authorization working
- [ ] MFA working
- [ ] Data encryption working

### **Monitoring & Logging**
- [ ] Health checks responding
- [ ] Logs being written
- [ ] Metrics being collected
- [ ] Alerts configured

### **Testing**
- [ ] Unit tests passing
- [ ] Performance acceptable
- [ ] No console errors
- [ ] Mobile responsive

---

## 🚀 **Next Steps After Testing**

Once local testing is complete:

1. **Fix any issues** found during testing
2. **Run full test suite** with coverage
3. **Performance optimization** if needed
4. **Document any bugs** or edge cases
5. **Prepare for Sprint 4.4** (Production Deployment)

---

## 📞 **Need Help?**

### **Debugging Tools**

1. **Prisma Studio:** `npm run db:studio`
2. **Redis CLI:** `redis-cli`
3. **PostgreSQL:** `psql -U postgres -d ecommerce_db`
4. **Chrome DevTools:** F12
5. **React DevTools:** Browser extension

### **Useful Commands**

```bash
# View all database tables
npm run db:studio

# Check Redis keys
redis-cli KEYS "*"

# View logs
tail -f logs/combined-*.log

# Check running processes
lsof -i :3000
lsof -i :5432
lsof -i :6379

# Reset database
npm run db:push --force-reset
npm run db:seed
```

---

**Happy Testing! 🎉**

Your enterprise e-commerce platform is ready for thorough local testing. Follow this guide step-by-step to ensure everything is working correctly before production deployment.
