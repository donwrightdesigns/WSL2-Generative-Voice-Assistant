# Voice Assistant

A complete voice-controlled AI assistant using Ollama for language modeling, Whisper for speech-to-text, and Bark for text-to-speech.

## Features

- 🎤 **Speech-to-Text**: Powered by OpenAI Whisper
- 🧠 **Language Model**: Uses Ollama with Llama 3.2 models
- 🔊 **Text-to-Speech**: High-quality voice synthesis with Bark
- 💬 **Conversation Memory**: Maintains context across conversations
- 🎨 **Rich UI**: Beautiful console interface with status indicators

## Project Structure

```
voice-assistant/
├── src/
│   ├── main.py              # Main application entry point
│   ├── tts_service.py       # Text-to-Speech service
│   ├── audio_utils.py       # Audio recording and playback utilities
│   └── conversation_chain.py # LangChain conversation setup
├── config/
│   └── config.yaml          # Configuration settings
├── models/                  # Custom model storage
├── logs/                    # Application logs
├── tests/
│   └── test_ollama.py       # Ollama integration tests
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## Prerequisites

1. **Ollama**: Must be running locally on port 11434
2. **Python Environment**: Recommended to use the whisper-env
3. **Audio Hardware**: Working microphone and speakers
4. **GPU Support**: Optional but recommended for better performance

## Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd /home/don/voice-assistant
   ```

2. **Activate the whisper environment**:
   ```bash
   source /home/don/whisper-env/bin/activate
   ```

3. **Install dependencies** (if not already installed):
   ```bash
   pip install -r requirements.txt
   ```

4. **Verify Ollama is running**:
   ```bash
   ollama list
   ```

## Usage

### Console Version

1. **Start the voice assistant**:
   ```bash
   python src/main.py
   ```

2. **Interact with the assistant**:
   - Press Enter to start recording
   - Speak your message
   - Press Enter again to stop recording
   - The assistant will respond with both text and voice

3. **Exit**: Press Ctrl+C to quit

### Web Interface (Recommended)

1. **Start the web server**:
   ```bash
   ./run_web.sh
   ```

2. **Access the interface**:
   - Open your browser and go to `http://localhost:5000`
   - For external access: `http://YOUR_IP:5000`

3. **Use the interface**:
   - **Voice Mode**: Hold the microphone button to record, release to send
   - **Text Mode**: Type your message and press Enter or click Send
   - Toggle between modes using the mode switch button
   - Reset conversation history with the Reset button

4. **Browser Requirements**:
   - Modern browser with microphone support
   - Allow microphone access when prompted

## Configuration

Edit `config/config.yaml` to customize:
- Ollama model selection
- Audio settings
- TTS voice presets
- Conversation parameters

## Available Models

- **llama3.2:3b** - Default model (good balance of speed and quality)
- **llama3.2:1b** - Fast model for quick responses
- **llama2:13b** - Large model for better quality responses
- **mistral:7b** - Alternative model option

## Troubleshooting

- **Audio Issues**: Check microphone permissions and audio device settings
- **Ollama Connection**: Ensure Ollama service is running (`systemctl status ollama`)
- **GPU Memory**: Adjust model size if running out of VRAM
- **Dependencies**: Ensure all requirements are installed in the correct environment

## Development

To run tests:
```bash
python tests/test_ollama.py
```

## License

This project is for educational and personal use.
