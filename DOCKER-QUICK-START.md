# 🚀 **Docker Quick Start Guide**

## **📋 Prerequisites**

```bash
# Verify installations
docker --version          # Should be 20.10+
docker-compose --version  # Should be 2.0+
```

---

## **🎯 Quick Start (3 Commands)**

```bash
# 1. Build the image
cd client
docker build -t ecommerce-client:latest .

# 2. Start all services
cd ..
docker-compose up -d

# 3. Check status
docker-compose ps
```

**Access your app:**
- **Application:** http://localhost:3000
- **PgAdmin:** http://localhost:5050
- **Redis Commander:** http://localhost:8081

---

## **📚 Common Commands**

### **Building**
```bash
# Build with BuildKit (recommended)
DOCKER_BUILDKIT=1 docker build -t ecommerce-client:latest ./client

# Build without cache
docker build --no-cache -t ecommerce-client:latest ./client

# Build for specific platform
docker buildx build --platform linux/amd64 -t ecommerce-client:latest ./client
```

### **Running**
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d client

# View logs
docker-compose logs -f client

# Follow logs of all services
docker-compose logs -f
```

### **Stopping**
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop specific service
docker-compose stop client
```

### **Debugging**
```bash
# Execute command in running container
docker-compose exec client sh

# Check container logs
docker-compose logs client

# Inspect container
docker inspect ecommerce-client

# Check resource usage
docker stats
```

---

## **🔧 Configuration**

### **Environment Variables**
Create `.env` file in root:
```env
# Database
DATABASE_URL=postgresql://ecommerce:password@postgres:5432/ecommerce_db

# Redis
REDIS_URL=redis://redis:6379

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

---

## **🐛 Troubleshooting**

### **Issue: Build fails**
```bash
# Clear build cache
docker builder prune -a

# Remove all containers and rebuild
docker-compose down -v
docker-compose up -d --build
```

### **Issue: Port already in use**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "3001:3000"  # Host:Container
```

### **Issue: Database connection fails**
```bash
# Check PostgreSQL health
docker-compose exec postgres pg_isready

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### **Issue: Out of disk space**
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a --volumes
```

---

## **📊 Monitoring**

### **Check container status**
```bash
docker-compose ps
```

### **View resource usage**
```bash
docker stats
```

### **Check health**
```bash
curl http://localhost:3000/api/health
```

---

## **🎓 Interview Preparation**

### **Key Concepts to Master:**

1. **Multi-stage builds** - Explain size reduction
2. **Layer caching** - How Docker caches layers
3. **Health checks** - Liveness vs readiness
4. **Networking** - Service discovery, DNS
5. **Volumes** - Data persistence
6. **Security** - Non-root user, minimal images
7. **Resource limits** - CPU, memory constraints
8. **Logging** - Stdout/stderr, log drivers

### **Practice Questions:**

**Q: How would you reduce image size?**
```
A: 
1. Multi-stage builds
2. Alpine base images
3. .dockerignore file
4. Combine RUN commands
5. Clean up in same layer
```

**Q: How do services communicate?**
```
A: Docker DNS - service names are resolvable
Example: postgres:5432, redis:6379
```

**Q: What's the purpose of HEALTHCHECK?**
```
A: 
1. Determine container health
2. Used by orchestrators (Kubernetes)
3. Enable auto-healing
4. Support zero-downtime deployments
```

---

## **📁 Project Structure**

```
e-commerce-ui/
├── client/
│   ├── Dockerfile              # Production-ready multi-stage build
│   ├── .dockerignore           # Exclude unnecessary files
│   ├── next.config.ts          # Standalone output enabled
│   └── src/
│       └── app/
│           └── api/
│               └── health/
│                   └── route.ts # Health check endpoint
├── docker-compose.yml          # Local development environment
├── DOCKER-STRATEGY.md          # Detailed documentation
└── DOCKER-QUICK-START.md       # This file
```

---

## **🚀 Next Steps**

1. ✅ **Learn**: Read DOCKER-STRATEGY.md for deep dive
2. ✅ **Practice**: Build and run the application
3. ✅ **Experiment**: Modify Dockerfile and observe changes
4. ✅ **Kubernetes**: Ready for the next level

**You're now ready for Docker interviews!** 🎉
