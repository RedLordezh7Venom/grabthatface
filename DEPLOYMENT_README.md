# GrabThatFace - Production-Ready Face Recognition System

A state-of-the-art, production-grade face recognition system using **InsightFace ArcFace** and **Qdrant HNSW** vector search.

## 🚀 Features

- **State-of-the-Art ML**: InsightFace ArcFace with 512-dimensional embeddings
- **Distributed Vector Search**: Qdrant HNSW for O(log N) similarity search
- **Async Processing**: Celery workers for background face extraction
- **Production-Ready**: PostgreSQL, Redis, rate limiting, JWT auth
- **Highly Scalable**: Kubernetes-ready with auto-scaling
- **Monitoring**: Prometheus metrics, Grafana dashboards
- **Dual Deployment**: Supports both Kubernetes and bare metal

## 📋 Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│   Client    │────▶│  API Server  │────▶│ PostgreSQL │
└─────────────┘     │  (FastAPI)   │     └────────────┘
                    └──────────────┘            │
                           │                    │
                           ▼                    ▼
                    ┌──────────────┐     ┌────────────┐
                    │    Redis     │────▶│   Qdrant   │
                    │  (Queue/Cache)│     │  (Vectors) │
                    └──────────────┘     └────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │Celery Workers│
                    │ (Face Extract)│
                    └──────────────┘
```

## 🛠️ Tech Stack

- **Backend**: FastAPI (async)
- **ML**: InsightFace (ArcFace), ONNX Runtime
- **Vector DB**: Qdrant (HNSW indexing)
- **Database**: PostgreSQL 15
- **Queue**: Redis + Celery
- **Server**: Gunicorn + Uvicorn workers
- **Monitoring**: Prometheus + Grafana
- **Deployment**: Docker, Kubernetes, SystemD

## 📦 Requirements

### Hardware
- **CPU**: 4+ cores (8+ recommended)
- **RAM**: 8GB minimum (16GB recommended for 10k users)
- **Storage**: 100GB+ for photos
- **Network**: 100Mbps+

### Software
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Nginx (for bare metal)
- Docker + Docker Compose (for containers)
- Kubernetes 1.25+ (for K8s deployment)

## 🚀 Deployment Options

### Option 1: Kubernetes Deployment (Recommended for Scale)

1. **Prerequisites**:
   ```bash
   # Install kubectl
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
   chmod +x kubectl && sudo mv kubectl /usr/local/bin/
   
   # Verify cluster access
   kubectl cluster-info
   ```

2. **Deploy to Kubernetes**:
   ```bash
   cd deployment/kubernetes
   
   # Create namespace and resources
   kubectl apply -f 00-namespace.yaml
   kubectl apply -f 01-configmap.yaml
   
   # IMPORTANT: Edit secrets first!
   kubectl apply -f 02-secrets.yaml
   
   # Deploy infrastructure
   kubectl apply -f 03-pvcs.yaml
   kubectl apply -f 04-postgres.yaml
   kubectl apply -f 05-redis.yaml
   kubectl apply -f 06-qdrant.yaml
   
   # Wait for infrastructure to be ready
   kubectl wait --for=condition=ready pod -l app=postgres -n grabthatface --timeout=300s
   kubectl wait --for=condition=ready pod -l app=redis -n grabthatface --timeout=300s
   kubectl wait --for=condition=ready pod -l app=qdrant -n grabthatface --timeout=300s
   
   # Deploy application
   kubectl apply -f 07-api.yaml
   kubectl apply -f 08-worker.yaml
   kubectl apply -f 09-ingress.yaml
   
   # Check status
   kubectl get pods -n grabthatface
   kubectl get svc -n grabthatface
   ```

3. **Configure Ingress**:
   ```bash
   # Edit 09-ingress.yaml and set your domain
   # Install cert-manager for SSL (optional)
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
   ```

4. **Scale Application**:
   ```bash
   # Manual scaling
   kubectl scale deployment api --replicas=5 -n grabthatface
   kubectl scale deployment worker --replicas=3 -n grabthatface
   
   # Auto-scaling is configured via HPA (see 07-api.yaml)
   kubectl get hpa -n grabthatface
   ```

### Option 2: Bare Metal Deployment (SystemD)

1. **Run Setup Script**:
   ```bash
   cd deployment/scripts
   chmod +x setup_production.sh
   sudo ./setup_production.sh
   ```

2. **Deploy Application Code**:
   ```bash
   sudo cp -r /path/to/your/code/* /opt/grabthatface/
   sudo chown -R grabthatface:grabthatface /opt/grabthatface
   ```

3. **Install Dependencies**:
   ```bash
   sudo -u grabthatface /opt/grabthatface/venv/bin/pip install -r /opt/grabthatface/requirements.txt
   ```

4. **Configure Environment**:
   ```bash
   # Edit environment file
   sudo nano /opt/grabthatface/.env
   
   # IMPORTANT: Change SECRET_KEY!
   # Generate with: python -c \"import secrets; print(secrets.token_urlsafe(32))\"
   ```

5. **Initialize Database**:
   ```bash
   cd /opt/grabthatface
   sudo -u grabthatface ./venv/bin/python -c \"from app.core.database import init_db; import asyncio; asyncio.run(init_db())\"
   ```

6. **Start Services**:
   ```bash
   # Enable and start services
   sudo systemctl enable qdrant grabthatface-api grabthatface-worker
   sudo systemctl start qdrant grabthatface-api grabthatface-worker
   
   # Check status
   sudo systemctl status grabthatface-api
   sudo systemctl status grabthatface-worker
   ```

7. **Verify Deployment**:
   ```bash
   curl http://localhost/health
   curl http://localhost/health/detailed
   ```

### Option 3: Docker Compose (Development/Small Production)

1. **Configure Environment**:
   ```bash
   # Create .env file
   cat > .env <<EOF
   SECRET_KEY=$(python -c \"import secrets; print(secrets.token_urlsafe(32))\")
   GRAFANA_PASSWORD=your_secure_password
   EOF
   ```

2. **Build and Start**:
   ```bash
   cd deployment
   docker-compose -f docker-compose-production.yml up -d
   ```

3. **Initialize Database**:
   ```bash
   docker-compose -f docker-compose-production.yml exec api python -c \"from app.core.database import init_db; import asyncio; asyncio.run(init_db())\"
   ```

4. **Check Services**:
   ```bash
   docker-compose -f docker-compose-production.yml ps
   docker-compose -f docker-compose-production.yml logs -f api
   ```

5. **Access Services**:
   - API: http://localhost:8000
   - Grafana: http://localhost:3000
   - Prometheus: http://localhost:9090

## 📡 API Endpoints

### Upload Photo
```bash
curl -X POST http://localhost:8000/api/v1/photos/upload \
  -F \"file=@photo.jpg\" \
  -F \"event_id=birthday-2024\"
```

### Search by Face
```bash
curl -X POST http://localhost:8000/api/v1/search/by-face \
  -F \"file=@selfie.jpg\" \
  -F \"top_k=20\"
```

### Get Photo Status
```bash
curl http://localhost:8000/api/v1/photos/status/123
```

### Health Check
```bash
curl http://localhost:8000/health
curl http://localhost:8000/health/detailed
```

## 📊 Monitoring

### Prometheus Metrics
Access at: `http://localhost:9090`

Key metrics:
- `http_request_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency
- Custom ML metrics from `/metrics` endpoint

### Grafana Dashboards
Access at: `http://localhost:3000`

Default credentials:
- Username: admin
- Password: (set in GRAFANA_PASSWORD env var)

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | JWT secret key | **CHANGE IN PRODUCTION** |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `QDRANT_HOST` | Qdrant server host | localhost |
| `REDIS_URL` | Redis connection string | redis://localhost:6379 |
| `WORKERS` | Gunicorn worker count | 4 |
| `RATE_LIMIT_PER_MINUTE` | API rate limit | 60 |

### Performance Tuning

**For 100 concurrent users**:
- API replicas: 3
- Worker replicas: 2
- PostgreSQL: 2GB RAM
- Qdrant: 2GB RAM
- Redis: 512MB RAM

**For 10,000 concurrent users**:
- API replicas: 10-20 (auto-scale)
- Worker replicas: 5-10 (auto-scale)
- PostgreSQL: 8GB RAM, read replicas
- Qdrant: 16GB RAM, clustering
- Redis: 2GB RAM, cluster mode

## 🔐 Security

1. **Change default secrets**:
   ```bash
   # Generate strong SECRET_KEY
   python -c \"import secrets; print(secrets.token_urlsafe(32))\"
   
   # Update passwords in K8s secrets or .env
   ```

2. **Enable SSL/TLS**:
   - For K8s: Use cert-manager with Let's Encrypt
   - For bare metal: Configure Nginx with SSL certificates

3. **Configure firewall**:
   ```bash
   # Allow only necessary ports
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

4. **JWT Authentication** (optional):
   - Implement user registration endpoint
   - Require JWT tokens for upload/search
   - See `app/core/security.py` for helpers

## 🧪 Testing

### Basic Health Check
```bash
curl http://localhost:8000/health
```

### Upload Test
```bash
curl -X POST http://localhost:8000/api/v1/photos/upload \
  -F \"file=@test.jpg\" \
  -F \"event_id=test\"
```

### Search Test
```bash
curl -X POST http://localhost:8000/api/v1/search/by-face \
  -F \"file=@face.jpg\"
```

### Load Testing
```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:8000/health

# Using k6
k6 run deployment/tests/load_test.js
```

## 📈 Scaling Guidelines

### Horizontal Scaling

**Kubernetes**:
```bash
# Scale API
kubectl scale deployment api --replicas=10 -n grabthatface

# Scale Workers
kubectl scale deployment worker --replicas=5 -n grabthatface
```

**Bare Metal**:
- Add more servers
- Use load balancer (HAProxy, Nginx)
- Configure shared storage (NFS, S3)

### Vertical Scaling

Increase resources in:
- K8s: Edit deployment YAML
- Docker: Edit docker-compose resource limits
- Bare metal: Upgrade server hardware

### Database Scaling

1. **Connection pooling**: Already configured
2. **Read replicas**: For heavy read workloads
3. **Partitioning**: By event_id or timestamp
4. **Caching**: Redis caching layer

## 🐛 Troubleshooting

### Services Not Starting

```bash
# Check logs
kubectl logs -f deployment/api -n grabthatface  # K8s
journalctl -u grabthatface-api -f  # SystemD
docker-compose logs -f api  # Docker

# Check dependencies
kubectl get pods -n grabthatface  # K8s
systemctl status postgres redis qdrant  # SystemD
```

### Face Detection Failing

```bash
# Check InsightFace model
python -c \"import insightface; app = insightface.app.FaceAnalysis('buffalo_l'); print('OK')\"

# Check Qdrant connection
curl http://localhost:6333
```

### High Memory Usage

```bash
# Reduce worker concurrency
# Edit CELERY_WORKER_CONCURRENCY in config

# Adjust PostgreSQL pool size
# Edit DB_POOL_SIZE in config
```

## 📝 License

[Your License Here]

## 🤝 Support

For issues and questions:
- GitHub Issues: [Your Repo]
- Email: support@grabthatface.example.com
- Docs: https://docs.grabthatface.example.com

## 🎯 Roadmap

- [ ] GPU support for faster inference
- [ ] Multi-model face recognition
- [ ] Real-time face tracking
- [ ] Advanced analytics dashboard
- [ ] S3/Cloud storage integration
- [ ] Distributed Qdrant clustering
- [ ] A/B testing framework

---

**Built with ❤️ for production workloads**
