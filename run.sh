#!/bin/bash
# Voice Assistant Launcher

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🤖 Voice Assistant Launcher${NC}"
echo "================================"

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

# Activate the whisper environment and run the assistant
echo -e "${GREEN}🚀 Starting Voice Assistant...${NC}"
source /home/don/voice-assistant/venv/bin/activate
cd /home/don/voice-assistant
python src/main.py
