# Deployment Guide - Voice Assistant

## Quick Deployment

### Local Development
`ash
# Clone and setup
git clone https://github.com/YOUR-USERNAME/voice-assistant.git
cd voice-assistant
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start services
ollama serve &
./run_web.sh
`

### Production Deployment

#### Using Docker (Recommended)
`ash
# Build image
docker build -t voice-assistant .

# Run container
docker run -p 5000:5000 -v /path/to/models:/app/models voice-assistant
`

#### Using systemd (Linux)
`ash
# Create service file
sudo cp deployment/voice-assistant.service /etc/systemd/system/
sudo systemctl enable voice-assistant
sudo systemctl start voice-assistant
`

## Configuration

### Environment Variables
- OLLAMA_HOST - Ollama server URL (default: localhost:11434)
- FLASK_HOST - Web server host (default: 0.0.0.0)
- FLASK_PORT - Web server port (default: 5000)

### Network Access
- Local: http://localhost:5000
- Network: http://YOUR_IP:5000

## Security

### Production Considerations
- Use HTTPS in production
- Configure firewall rules
- Set up authentication if needed
- Use reverse proxy (nginx)

### HTTPS Setup
`ash
# Generate SSL certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365

# Update Flask configuration
export FLASK_SSL_CERT=cert.pem
export FLASK_SSL_KEY=key.pem
`

## Monitoring

### Health Check
`ash
curl http://localhost:5000/health
`

### Logs
`ash
tail -f logs/voice-assistant.log
`

## Troubleshooting

### Common Issues
1. **Port in use**: Change port in configuration
2. **Ollama not accessible**: Check Ollama service status
3. **Audio not working**: Verify audio device permissions
4. **GPU memory**: Use smaller models or CPU fallback

### Debug Mode
`ash
export FLASK_DEBUG=1
python web/app.py
`

---

**Ready for deployment!** 🚀
