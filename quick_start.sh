#!/bin/bash
#
# Quick Start Script for Local Development
#

set -e

echo "🚀 GrabThatFace - Quick Start (Development Mode)"
echo "================================================"
echo ""

# Check Python version
if ! command -v python3.11 &> /dev/null; then
    echo "❌ Python 3.11 not found. Please install it first."
    exit 1
fi

# 1. Install system dependencies (Debian/Ubuntu)
echo "📦 Installing system dependencies..."
if command -v apt-get &> /dev/null; then
    sudo apt-get update
    sudo apt-get install -y build-essential cmake libopenblas-dev liblapack-dev postgresql redis-server
fi

# 2. Setup PostgreSQL
echo "🗄️  Setting up PostgreSQL..."
sudo -u postgres psql -c "CREATE USER grabthatface WITH PASSWORD 'grabthatface_pass';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "CREATE DATABASE grabthatface OWNER grabthatface;" 2>/dev/null || echo "Database already exists"

# 3. Create virtual environment
echo "🐍 Creating Python virtual environment..."
python3.11 -m venv venv
source venv/bin/activate

# 4. Install Python dependencies
echo "📚 Installing Python packages..."
pip install --upgrade pip
pip install -r requirements.txt

# 5. Create data directories
echo "📁 Creating data directories..."
mkdir -p data/uploads data/faces

# 6. Create .env file
echo "⚙️  Creating environment configuration..."
cat > .env <<EOF
# Development Environment

SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
DATABASE_URL=postgresql+asyncpg://grabthatface:grabthatface_pass@localhost:5432/grabthatface
QDRANT_HOST=localhost
QDRANT_PORT=6333
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
ENVIRONMENT=development
STORAGE_PATH=data/uploads
FACE_DIR=data/faces
EOF

echo "✓ Environment file created"

# 7. Install and start Qdrant (Docker)
echo "🔍 Setting up Qdrant..."
if command -v docker &> /dev/null; then
    docker run -d --name qdrant -p 6333:6333 -p 6334:6334 -v $(pwd)/data/qdrant:/qdrant/storage qdrant/qdrant:latest
    echo "✓ Qdrant started in Docker"
else
    echo "⚠️  Docker not found. Please install Qdrant manually: https://qdrant.tech/documentation/quick-start/"
fi

# 8. Initialize database
echo "🗄️  Initializing database..."
python -c "from app.core.database import init_db; import asyncio; asyncio.run(init_db())"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Start the API server:"
echo "   source venv/bin/activate"
echo "   python -m uvicorn app.main_production:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "2. Start Celery worker (in another terminal):"
echo "   source venv/bin/activate"
echo "   celery -A app.workers.celery_app worker --loglevel=info"
echo ""
echo "3. Access the API:"
echo "   http://localhost:8000"
echo "   http://localhost:8000/docs  (Swagger UI)"
echo ""
echo "4. Test the API:"
echo "   curl http://localhost:8000/health"
echo ""
