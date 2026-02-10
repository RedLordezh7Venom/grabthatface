#!/bin/bash
#
# GrabThatFace Service Management Script
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

show_usage() {
    echo "Usage: $0 {start|stop|restart|status|logs}"
    echo ""
    echo "Commands:"
    echo "  start    - Start all GrabThatFace services"
    echo "  stop     - Stop all GrabThatFace services"
    echo "  restart  - Restart all services"
    echo "  status   - Show status of all services"
    echo "  logs     - Tail logs from all services"
    exit 1
}

if [ $# -eq 0 ]; then
    show_usage
fi

COMMAND=$1

case $COMMAND in
    start)
        echo -e "${GREEN}Starting GrabThatFace services...${NC}"
        systemctl start qdrant
        sleep 2
        systemctl start grabthatface-api
        systemctl start grabthatface-worker
        sleep 3
        echo -e "${GREEN}✓ All services started${NC}"
        systemctl status grabthatface-api --no-pager
        ;;
    
    stop)
        echo -e "${YELLOW}Stopping GrabThatFace services...${NC}"
        systemctl stop grabthatface-worker
        systemctl stop grabthatface-api
        systemctl stop qdrant
        echo -e "${GREEN}✓ All services stopped${NC}"
        ;;
    
    restart)
        echo -e "${YELLOW}Restarting GrabThatFace services...${NC}"
        systemctl restart qdrant
        sleep 2
        systemctl restart grabthatface-api
        systemctl restart grabthatface-worker
        sleep 3
        echo -e "${GREEN}✓ All services restarted${NC}"
        systemctl status grabthatface-api --no-pager
        ;;
    
    status)
        echo -e "${GREEN}Service Status:${NC}"
        echo ""
        echo "PostgreSQL:"
        systemctl status postgresql --no-pager | grep Active
        echo ""
        echo "Redis:"
        systemctl status redis-server --no-pager | grep Active
        echo ""
        echo "Qdrant:"
        systemctl status qdrant --no-pager | grep Active
        echo ""
        echo "API Server:"
        systemctl status grabthatface-api --no-pager | grep Active
        echo ""
        echo "Celery Worker:"
        systemctl status grabthatface-worker --no-pager | grep Active
        echo ""
        echo "Nginx:"
        systemctl status nginx --no-pager | grep Active
        echo ""
        echo -e "${GREEN}Health Check:${NC}"
        curl -s http://localhost/health | python3 -m json.tool || echo "API not responding"
        ;;
    
    logs)
        echo -e "${GREEN}Tailing logs (Ctrl+C to exit)...${NC}"
        tail -f /var/log/grabthatface/*.log
        ;;
    
    *)
        show_usage
        ;;
esac
