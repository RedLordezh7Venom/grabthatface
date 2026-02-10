# 🚀 GrabThatFace - Production Deployment Checklist

## Pre-Deployment Checklist

### ✅ Phase 1: Environment Preparation

- [ ] **Install Required Services**
  ```bash
  # PostgreSQL 15+
  sudo apt-get install postgresql-15
  
  # Redis 7+
  sudo apt-get install redis-server
  
  # Qdrant (via Docker or binary)
  docker run -d -p 6333:6333 -p 6334:6334 qdrant/qdrant
  ```

- [ ] **Create Application User** (Bare Metal only)
  ```bash
  sudo useradd -r -s /bin/bash -d /opt/grabthatface grabthatface
  ```

- [ ] **Setup Database**
  ```bash
  sudo -u postgres psql
  CREATE USER grabthatface WITH PASSWORD 'STRONG_PASSWORD_HERE';
  CREATE DATABASE grabthatface OWNER grabthatface;
  GRANT ALL PRIVILEGES ON DATABASE grabthatface TO grabthatface;
  \q
  ```

- [ ] **Generate Secret Key**
  ```bash
  python3 -c "import secrets; print(secrets.token_urlsafe(32))"
  # Save this for SECRET_KEY in environment
  ```

---

### ✅ Phase 2: Application Deployment

#### For Kubernetes:

- [ ] **Build Docker Images**
  ```bash
  docker build -t grabthatface/api:latest -f Dockerfile .
  docker build -t grabthatface/worker:latest -f Dockerfile.worker .
  docker push grabthatface/api:latest
  docker push grabthatface/worker:latest
  ```

- [ ] **Update K8s Secrets**
  ```bash
  # Edit deployment/kubernetes/02-secrets.yaml
  # Change SECRET_KEY and passwords
  ```

- [ ] **Deploy to Kubernetes**
  ```bash
  cd deployment/kubernetes
  kubectl apply -f 00-namespace.yaml
  kubectl apply -f 01-configmap.yaml
  kubectl apply -f 02-secrets.yaml
  kubectl apply -f 03-pvcs.yaml
  kubectl apply -f 04-postgres.yaml
  kubectl apply -f 05-redis.yaml
  kubectl apply -f 06-qdrant.yaml
  
  # Wait for infrastructure
  kubectl wait --for=condition=ready pod -l app=postgres -n grabthatface --timeout=300s
  kubectl wait --for=condition=ready pod -l app=redis -n grabthatface --timeout=300s
  kubectl wait --for=condition=ready pod -l app=qdrant -n grabthatface --timeout=300s
  
  # Deploy application
  kubectl apply -f 07-api.yaml
  kubectl apply -f 08-worker.yaml
  kubectl apply -f 09-ingress.yaml
  ```

- [ ] **Verify Deployment**
  ```bash
  kubectl get pods -n grabthatface
  kubectl logs -f deployment/api -n grabthatface
  ```

#### For Bare Metal:

- [ ] **Run Setup Script**
  ```bash
  sudo bash deployment/scripts/setup_production.sh
  ```

- [ ] **Copy Application Code**
  ```bash
  sudo cp -r /path/to/code/* /opt/grabthatface/
  sudo chown -R grabthatface:grabthatface /opt/grabthatface
  ```

- [ ] **Install Python Dependencies**
  ```bash
  cd /opt/grabthatface
  sudo -u grabthatface ./venv/bin/pip install -r requirements.txt
  ```

- [ ] **Configure Environment**
  ```bash
  sudo nano /opt/grabthatface/.env
  # Update SECRET_KEY, DATABASE_URL, etc.
  ```

- [ ] **Initialize Database**
  ```bash
  cd /opt/grabthatface
  sudo -u grabthatface ./venv/bin/python verify_production.py
  ```

- [ ] **Start Services**
  ```bash
  sudo systemctl enable qdrant grabthatface-api grabthatface-worker
  sudo systemctl start qdrant
  sleep 5
  sudo systemctl start grabthatface-api
  sudo systemctl start grabthatface-worker
  ```

#### For Docker Compose:

- [ ] **Configure Environment**
  ```bash
  cat > .env <<EOF
  SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
  GRAFANA_PASSWORD=your_secure_password
  EOF
  ```

- [ ] **Start Services**
  ```bash
  docker-compose -f deployment/docker-compose-production.yml up -d
  ```

- [ ] **Initialize Database**
  ```bash
  docker-compose -f deployment/docker-compose-production.yml exec api \
    python -c "from app.core.database import init_db; import asyncio; asyncio.run(init_db())"
  ```

---

### ✅ Phase 3: Verification

- [ ] **Test Health Endpoints**
  ```bash
  # Basic health
  curl http://localhost/health
  # Expected: {"status":"healthy","version":"2.0.0","environment":"production"}
  
  # Detailed health
  curl http://localhost/health/detailed
  # Check all components are "healthy"
  ```

- [ ] **Test Upload**
  ```bash
  curl -X POST http://localhost/api/v1/photos/upload \
    -F "file=@test_photo.jpg" \
    -F "event_id=test-event"
  # Expected: {"id":1,"filename":"...","status":"processing"}
  ```

- [ ] **Check Processing Status**
  ```bash
  curl http://localhost/api/v1/photos/status/1
  # Wait for status to become "completed"
  ```

- [ ] **Test Search**
  ```bash
  curl -X POST http://localhost/api/v1/search/by-face \
    -F "file=@selfie.jpg"
  # Expected: {"matches":[...],"count":X}
  ```

- [ ] **Run Verification Script**
  ```bash
  python verify_production.py
  # All tests should pass
  ```

---

### ✅ Phase 4: Monitoring Setup

- [ ] **Access Prometheus**
  - URL: http://localhost:9090
  - Check targets: Status → Targets
  - Verify all endpoints are "UP"

- [ ] **Access Grafana** (if deployed)
  - URL: http://localhost:3000
  - Login: admin / [GRAFANA_PASSWORD]
  - Import dashboards from deployment/monitoring/

- [ ] **Check Logs**
  ```bash
  # Kubernetes
  kubectl logs -f deployment/api -n grabthatface
  kubectl logs -f deployment/worker -n grabthatface
  
  # Bare Metal
  sudo journalctl -u grabthatface-api -f
  sudo tail -f /var/log/grabthatface/*.log
  
  # Docker Compose
  docker-compose logs -f api worker
  ```

---

### ✅ Phase 5: Performance Testing

- [ ] **Load Test** (Use Apache Bench)
  ```bash
  # Health endpoint
  ab -n 1000 -c 10 http://localhost/health
  
  # Target: >100 requests/sec, <100ms average latency
  ```

- [ ] **Upload Test**
  ```bash
  # Upload 10 photos concurrently
  for i in {1..10}; do
    curl -X POST http://localhost/api/v1/photos/upload \
      -F "file=@test$i.jpg" \
      -F "event_id=load-test" &
  done
  wait
  ```

- [ ] **Search Performance**
  ```bash
  # Measure search time
  time curl -X POST http://localhost/api/v1/search/by-face \
    -F "file=@selfie.jpg"
  
  # Target: <500ms for search
  ```

---

### ✅ Phase 6: Security Hardening

- [ ] **Change Default Passwords**
  - PostgreSQL password
  - SECRET_KEY
  - Grafana admin password

- [ ] **Enable Firewall**
  ```bash
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw allow 22/tcp  # SSH
  sudo ufw enable
  ```

- [ ] **Setup SSL/TLS**
  ```bash
  # For Kubernetes with cert-manager
  kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
  
  # For Bare Metal with Let's Encrypt
  sudo apt-get install certbot python3-certbot-nginx
  sudo certbot --nginx -d your-domain.com
  ```

- [ ] **Configure Rate Limiting** (verify in config)
  - Upload limit: 100/hour per IP
  - Search limit: 60/minute per IP

- [ ] **Enable JWT Authentication** (optional)
  - Implement user registration
  - Require tokens for sensitive endpoints

---

### ✅ Phase 7: Backup & Disaster Recovery

- [ ] **Database Backup**
  ```bash
  # Automated daily backups
  sudo crontab -e
  # Add: 0 2 * * * pg_dump grabthatface > /backup/grabthatface_$(date +\%Y\%m\%d).sql
  ```

- [ ] **Qdrant Backup**
  ```bash
  # Create snapshot via API
  curl -X POST http://localhost:6333/collections/face_embeddings/snapshots
  ```

- [ ] **Application Backup**
  ```bash
  # Backup uploaded photos
  rsync -av /opt/grabthatface/data/uploads/ /backup/uploads/
  ```

---

### ✅ Phase 8: Scaling Configuration

For 100 users (current):
- [ ] API replicas: 3
- [ ] Worker replicas: 2
- [ ] PostgreSQL: 2GB RAM, 20 connections
- [ ] Qdrant: 2GB RAM
- [ ] Redis: 512MB RAM

For 10,000 users (future):
- [ ] API replicas: 10-20 (auto-scale)
- [ ] Worker replicas: 5-10 (auto-scale)
- [ ] PostgreSQL: 8GB RAM, read replicas
- [ ] Qdrant: 16GB RAM, cluster mode
- [ ] Redis: 2GB RAM, cluster mode

---

## 📊 Performance Benchmarks

### Expected Performance Metrics

| Operation | Target Latency | Throughput |
|-----------|----------------|------------|
| Health Check | <10ms | 1000+ req/s |
| Photo Upload | <200ms | 100+ req/s |
| Face Extraction | <2s | 10+ photos/s |
| Face Search | <500ms | 50+ req/s |

### System Capacity

| Scale | Users | Photos | Faces | Search Time |
|-------|-------|--------|-------|-------------|
| Small | 100 | 10K | 50K | <300ms |
| Medium | 1,000 | 100K | 500K | <500ms |
| Large | 10,000 | 1M | 5M | <800ms |
| X-Large | 100,000 | 10M | 50M | <1.5s |

---

## 🆘 Troubleshooting

### Common Issues

**1. Service Won't Start**
```bash
# Check logs
journalctl -u grabthatface-api -n 50

# Common causes:
# - Port already in use
# - Database connection failed
# - Qdrant not running
```

**2. Face Detection Not Working**
```bash
# Verify InsightFace model
python -c "import insightface; app = insightface.app.FaceAnalysis('buffalo_l'); print('OK')"

# Model will auto-download on first run
```

**3. Qdrant Connection Failed**
```bash
# Check Qdrant status
curl http://localhost:6333

# Restart Qdrant
sudo systemctl restart qdrant  # SystemD
kubectl rollout restart statefulset/qdrant -n grabthatface  # K8s
```

**4. High Memory Usage**
```bash
# Reduce worker concurrency
# Edit CELERY_WORKER_CONCURRENCY in config

# Reduce database pool
# Edit DB_POOL_SIZE in config
```

---

## 📞 Support

- **Documentation**: /app/DEPLOYMENT_README.md
- **Verification**: python verify_production.py
- **Service Management**: bash deployment/scripts/manage_services.sh status

---

## ✅ Final Checklist Before Going Live

- [ ] All health checks pass
- [ ] Monitoring is configured and working
- [ ] Backups are automated
- [ ] SSL/TLS is enabled
- [ ] Firewall rules are configured
- [ ] Secrets are changed from defaults
- [ ] Rate limiting is enabled
- [ ] Load testing completed successfully
- [ ] Documentation is accessible to team
- [ ] Rollback plan is documented

---

**🎉 Congratulations! Your production system is ready!**

Monitor the first 24 hours closely and adjust scaling parameters as needed.
