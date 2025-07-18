#!/bin/bash
# Voice Assistant Web Server Launcher

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌐 Voice Assistant Web Server${NC}"
echo "===================================="

# Get the local IP address
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo -e "${GREEN}📍 Server will be accessible at:${NC}"
echo -e "   Local:    http://localhost:5000"
echo -e "   Network:  http://${LOCAL_IP}:5000"
echo ""

# Check if Ollama is running
if ! pgrep -x "ollama" > /dev/null; then
    echo -e "${YELLOW}⚠️  Ollama is not running. Starting Ollama...${NC}"
    if ! systemctl is-active --quiet ollama; then
        sudo systemctl start ollama
        sleep 3
    fi
fi

# Check if Ollama is accessible
if ! curl -s http://localhost:11434/api/version > /dev/null; then
    echo -e "${RED}❌ Ollama is not accessible at localhost:11434${NC}"
    echo "Please ensure Ollama is running and accessible."
    exit 1
fi

echo -e "${GREEN}✅ Ollama is running${NC}"

# Activate the whisper environment and run the web server
echo -e "${GREEN}🚀 Starting Voice Assistant Web Server...${NC}"
echo -e "${YELLOW}📝 Note: Make sure to allow microphone access in your browser${NC}"
echo ""

source /home/don/whisper-env/bin/activate
cd /home/don/voice-assistant/web
python app.py
