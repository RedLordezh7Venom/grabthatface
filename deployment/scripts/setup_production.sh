#!/bin/bash
#
# GrabThatFace Production Setup Script for Bare Metal Servers
# This script installs and configures all dependencies
#
# Usage: sudo bash setup_production.sh
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  GrabThatFace Production Setup${NC}"
echo -e "${GREEN}================================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Variables
APP_USER="grabthatface"
APP_GROUP="grabthatface"
APP_DIR="/opt/grabthatface"
LOG_DIR="/var/log/grabthatface"
RUN_DIR="/var/run/grabthatface"
DATA_DIR="${APP_DIR}/data"

# 1. System Update
echo -e "\n${YELLOW}[1/10] Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# 2. Install system dependencies
echo -e "\n${YELLOW}[2/10] Installing system dependencies...${NC}"
apt-get install -y \
    python3.11 \
    python3.11-venv \
    python3-pip \
    build-essential \
    cmake \
    git \
    nginx \
    supervisor \
    postgresql-15 \
    postgresql-contrib \
    redis-server \
    libpq-dev \
    libopenblas-dev \
    liblapack-dev \
    libssl-dev \
    libffi-dev \
    pkg-config \
    curl \
    wget \
    net-tools

echo -e "${GREEN}✓ System dependencies installed${NC}"

# 3. Create application user and directories
echo -e "\n${YELLOW}[3/10] Creating application user and directories...${NC}"
if ! id "$APP_USER" &>/dev/null; then
    useradd -r -s /bin/bash -d "$APP_DIR" "$APP_USER"
    echo -e "${GREEN}✓ User $APP_USER created${NC}"
else
    echo -e "${GREEN}✓ User $APP_USER already exists${NC}"
fi

# Create directories
mkdir -p "$APP_DIR" "$LOG_DIR" "$RUN_DIR" "$DATA_DIR/uploads" "$DATA_DIR/faces"
chown -R "$APP_USER:$APP_GROUP" "$APP_DIR" "$LOG_DIR" "$RUN_DIR" "$DATA_DIR"
chmod -R 755 "$APP_DIR"
chmod -R 775 "$DATA_DIR"

echo -e "${GREEN}✓ Directories created${NC}"

# 4. Install Qdrant
echo -e "\n${YELLOW}[4/10] Installing Qdrant vector database...${NC}"
QDRANT_VERSION="v1.7.4"
QDRANT_DIR="/opt/qdrant"

if [ ! -d "$QDRANT_DIR" ]; then
    mkdir -p "$QDRANT_DIR"
    cd "$QDRANT_DIR"
    
    # Download Qdrant binary
    ARCH=$(uname -m)
    if [ "$ARCH" = "x86_64" ]; then
        wget https://github.com/qdrant/qdrant/releases/download/${QDRANT_VERSION}/qdrant-${ARCH}-unknown-linux-gnu.tar.gz
    else
        wget https://github.com/qdrant/qdrant/releases/download/${QDRANT_VERSION}/qdrant-aarch64-unknown-linux-gnu.tar.gz
    fi
    
    tar -xzf qdrant-*.tar.gz
    rm qdrant-*.tar.gz
    
    # Create Qdrant user and directories
    useradd -r -s /bin/false qdrant || true
    mkdir -p /var/lib/qdrant /var/log/qdrant /etc/qdrant
    chown -R qdrant:qdrant /var/lib/qdrant /var/log/qdrant /opt/qdrant
    
    # Create Qdrant config
    cat > /etc/qdrant/config.yaml <<EOF
service:
  host: 0.0.0.0
  http_port: 6333
  grpc_port: 6334

storage:
  storage_path: /var/lib/qdrant/storage
  snapshots_path: /var/lib/qdrant/snapshots
  
hnsw_index:
  m: 16
  ef_construct: 100
  full_scan_threshold: 10000
EOF
    
    echo -e "${GREEN}✓ Qdrant installed${NC}"
else
    echo -e "${GREEN}✓ Qdrant already installed${NC}"
fi

# 5. Configure PostgreSQL
echo -e "\n${YELLOW}[5/10] Configuring PostgreSQL...${NC}"
sudo -u postgres psql -c "CREATE USER grabthatface WITH PASSWORD 'grabthatface_pass';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "CREATE DATABASE grabthatface OWNER grabthatface;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE grabthatface TO grabthatface;" 2>/dev/null

echo -e "${GREEN}✓ PostgreSQL configured${NC}"

# 6. Configure Redis
echo -e "\n${YELLOW}[6/10] Configuring Redis...${NC}"
sed -i 's/^# maxmemory.*/maxmemory 512mb/' /etc/redis/redis.conf
sed -i 's/^# maxmemory-policy.*/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf
systemctl enable redis-server
systemctl restart redis-server

echo -e "${GREEN}✓ Redis configured${NC}"

# 7. Setup Python virtual environment
echo -e "\n${YELLOW}[7/10] Setting up Python virtual environment...${NC}"
cd "$APP_DIR"
sudo -u "$APP_USER" python3.11 -m venv venv

echo -e "${GREEN}✓ Virtual environment created${NC}"

# 8. Create environment file template
echo -e "\n${YELLOW}[8/10] Creating environment configuration...${NC}"
cat > "${APP_DIR}/.env" <<EOF
# GrabThatFace Production Environment

# Security
SECRET_KEY=CHANGE_ME_TO_RANDOM_STRING

# Database
DATABASE_URL=postgresql+asyncpg://grabthatface:grabthatface_pass@localhost:5432/grabthatface

# Qdrant
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_GRPC_PORT=6334
QDRANT_COLLECTION_NAME=face_embeddings

# Redis
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# Application
ENVIRONMENT=production
WORKERS=4
CELERY_WORKER_CONCURRENCY=4

# Storage
STORAGE_PATH=${DATA_DIR}/uploads
FACE_DIR=${DATA_DIR}/faces
EOF

chown "$APP_USER:$APP_GROUP" "${APP_DIR}/.env"
chmod 600 "${APP_DIR}/.env"

echo -e "${GREEN}✓ Environment file created${NC}"
echo -e "${YELLOW}⚠ IMPORTANT: Edit ${APP_DIR}/.env and change SECRET_KEY!${NC}"

# 9. Install SystemD services
echo -e "\n${YELLOW}[9/10] Installing SystemD services...${NC}"

# Copy service files (assumes they exist in deployment/systemd/)
if [ -d "${APP_DIR}/deployment/systemd" ]; then
    cp "${APP_DIR}/deployment/systemd/"*.service /etc/systemd/system/
    systemctl daemon-reload
    echo -e "${GREEN}✓ SystemD services installed${NC}"
else
    echo -e "${YELLOW}⚠ Service files not found. Please copy them manually.${NC}"
fi

# 10. Configure Nginx
echo -e "\n${YELLOW}[10/10] Configuring Nginx reverse proxy...${NC}"

cat > /etc/nginx/sites-available/grabthatface <<'EOF'
upstream grabthatface_api {
    least_conn;
    server 127.0.0.1:8000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name _; # Change to your domain
    
    client_max_body_size 10M;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=60r/m;
    limit_req zone=api_limit burst=10 nodelay;
    
    location / {
        proxy_pass http://grabthatface_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location /static/ {
        alias /opt/grabthatface/data/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check
    location /health {
        proxy_pass http://grabthatface_api/health;
        access_log off;
    }
}
EOF

ln -sf /etc/nginx/sites-available/grabthatface /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo -e "${GREEN}✓ Nginx configured${NC}"

# Summary
echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}  Installation Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Copy your application code to ${APP_DIR}"
echo "2. Edit ${APP_DIR}/.env and set SECRET_KEY"
echo "3. Install Python dependencies:"
echo "   cd ${APP_DIR}"
echo "   sudo -u grabthatface ./venv/bin/pip install -r requirements.txt"
echo ""
echo "4. Initialize database:"
echo "   sudo -u grabthatface ./venv/bin/python -c 'from app.core.database import init_db; import asyncio; asyncio.run(init_db())'"
echo ""
echo "5. Start services:"
echo "   systemctl enable --now qdrant"
echo "   systemctl enable --now grabthatface-api"
echo "   systemctl enable --now grabthatface-worker"
echo ""
echo "6. Check status:"
echo "   systemctl status grabthatface-api"
echo "   systemctl status grabthatface-worker"
echo "   curl http://localhost/health"
echo ""
echo -e "${GREEN}Logs available at: ${LOG_DIR}${NC}"
echo ""
