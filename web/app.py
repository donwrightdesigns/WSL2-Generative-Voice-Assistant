#!/usr/bin/env python3
"""
Web Voice Assistant Server
Flask application providing web interface for the voice assistant
"""

import os
import sys
import json
import base64
import logging
from io import BytesIO
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import numpy as np
import whisper
import soundfile as sf
import tempfile

# Add the src directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

# Import our voice assistant components
from tts_service import TextToSpeechService
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain
from langchain.prompts import PromptTemplate
from langchain_community.llms import Ollama

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize AI components
stt = None
tts = None
chain = None
conversation_memory = ConversationBufferMemory(ai_prefix="Assistant:")

# Available LLM models
AVAILABLE_MODELS = {
    "llama3.2:3b": "Llama 3.2 3B (Fast)",
    "llama3.2:1b": "Llama 3.2 1B (Fastest)",
    "llama3.1:8b": "Llama 3.1 8B (Better Quality)",
    "llama3.1:70b": "Llama 3.1 70B (Best Quality)",
    "qwen2.5:3b": "Qwen 2.5 3B (Alternative)",
    "mistral:7b": "Mistral 7B (Alternative)"
}

# Current settings
current_model = "llama3.2:3b"
current_voice = "v2/en_speaker_6"  # Warm female, friendly
current_speed = 1.2

def initialize_ai_components():
    """Initialize the AI components (STT, TTS, LLM)"""
    global stt, tts, chain
    
    try:
        # Initialize Speech-to-Text
        logger.info("Loading Whisper model...")
        stt = whisper.load_model("base.en")
        
        # Initialize Text-to-Speech
        logger.info("Loading TTS model...")
        tts = TextToSpeechService()
        
        # Initialize LLM Chain
        logger.info("Setting up conversation chain...")
        template = """
        You are a helpful and friendly AI assistant. You are polite, respectful, and aim to provide concise responses of less than 50 words.
        The conversation transcript is as follows:
        {history}
        And here is the user's follow-up: {input}
        Your response:
        """
        
        PROMPT = PromptTemplate(input_variables=["history", "input"], template=template)
        llm = Ollama(model=current_model, base_url="http://localhost:11434")
        
        chain = ConversationChain(
            prompt=PROMPT,
            verbose=False,
            memory=conversation_memory,
            llm=llm,
        )
        
        logger.info("AI components initialized successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Failed to initialize AI components: {e}")
        return False

@app.route('/')
def index():
    """Main page route"""
    return render_template('index.html')

@app.route('/api/status')
def api_status():
    """Check if all services are running"""
    status = {
        'stt': stt is not None,
        'tts': tts is not None,
        'llm': chain is not None,
        'timestamp': datetime.now().isoformat()
    }
    return jsonify(status)

@app.route('/api/transcribe', methods=['POST'])
def api_transcribe():
    """Transcribe audio to text"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        
        # Save the uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_file:
            audio_file.save(tmp_file.name)
            
            # Transcribe the audio
            result = stt.transcribe(tmp_file.name, fp16=False)
            text = result["text"].strip()
            
            # Clean up temporary file
            os.unlink(tmp_file.name)
            
            return jsonify({'text': text})
            
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def api_chat():
    """Get response from LLM"""
    try:
        data = request.get_json()
        user_input = data.get('message', '')
        
        if not user_input:
            return jsonify({'error': 'No message provided'}), 400
        
        # Get response from the conversation chain
        response = chain.predict(input=user_input)
        
        # Clean up response
        if response.startswith("Assistant:"):
            response = response[len("Assistant:"):].strip()
        
        return jsonify({'response': response})
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/synthesize', methods=['POST'])
def api_synthesize():
    """Convert text to speech"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        voice = data.get('voice', current_voice)
        speed = data.get('speed', current_speed)
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Generate speech with custom voice and speed
        sample_rate, audio_array = tts.synthesize(text, voice_preset=voice, speed=speed)
        
        # Convert to WAV format
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_file:
            sf.write(tmp_file.name, audio_array, sample_rate)
            
            # Read the file as bytes
            with open(tmp_file.name, 'rb') as f:
                audio_bytes = f.read()
            
            # Clean up temporary file
            os.unlink(tmp_file.name)
            
            # Return audio as base64
            audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
            return jsonify({'audio': audio_b64})
            
    except Exception as e:
        logger.error(f"TTS error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/conversation', methods=['POST'])
def api_conversation():
    """Complete conversation: transcribe -> chat -> synthesize"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        
        # Step 1: Transcribe audio
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_file:
            audio_file.save(tmp_file.name)
            result = stt.transcribe(tmp_file.name, fp16=False)
            user_text = result["text"].strip()
            os.unlink(tmp_file.name)
        
        # Step 2: Get LLM response
        response = chain.predict(input=user_text)
        if response.startswith("Assistant:"):
            response = response[len("Assistant:"):].strip()
        
        # Step 3: Synthesize response
        sample_rate, audio_array = tts.synthesize(response, voice_preset=current_voice, speed=current_speed)
        
        # Convert to WAV format
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_file:
            sf.write(tmp_file.name, audio_array, sample_rate)
            with open(tmp_file.name, 'rb') as f:
                audio_bytes = f.read()
            os.unlink(tmp_file.name)
        
        # Return complete conversation
        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
        return jsonify({
            'user_text': user_text,
            'assistant_response': response,
            'audio': audio_b64
        })
        
    except Exception as e:
        logger.error(f"Conversation error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reset', methods=['POST'])
def api_reset():
    """Reset conversation memory"""
    try:
        conversation_memory.clear()
        return jsonify({'message': 'Conversation memory reset'})
    except Exception as e:
        logger.error(f"Reset error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/settings', methods=['GET'])
def api_get_settings():
    """Get current settings"""
    try:
        settings = {
            'current_model': current_model,
            'current_voice': current_voice,
            'current_speed': current_speed,
            'available_models': AVAILABLE_MODELS,
            'available_voices': tts.get_available_voices() if tts else {}
        }
        return jsonify(settings)
    except Exception as e:
        logger.error(f"Settings error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/settings', methods=['POST'])
def api_update_settings():
    """Update settings"""
    global current_model, current_voice, current_speed, chain
    
    try:
        data = request.get_json()
        
        # Update voice settings
        if 'voice' in data:
            current_voice = data['voice']
            if tts:
                tts.set_default_voice(current_voice)
        
        # Update speed settings
        if 'speed' in data:
            current_speed = float(data['speed'])
            if tts:
                tts.set_default_speed(current_speed)
        
        # Update model settings
        if 'model' in data and data['model'] in AVAILABLE_MODELS:
            current_model = data['model']
            # Reinitialize the LLM chain with new model
            if chain:
                template = """
                You are a helpful and friendly AI assistant. You are polite, respectful, and aim to provide concise responses of less than 50 words.
                The conversation transcript is as follows:
                {history}
                And here is the user's follow-up: {input}
                Your response:
                """
                
                PROMPT = PromptTemplate(input_variables=["history", "input"], template=template)
                llm = Ollama(model=current_model, base_url="http://localhost:11434")
                
                chain = ConversationChain(
                    prompt=PROMPT,
                    verbose=False,
                    memory=conversation_memory,
                    llm=llm,
                )
        
        return jsonify({
            'message': 'Settings updated successfully',
            'current_model': current_model,
            'current_voice': current_voice,
            'current_speed': current_speed
        })
        
    except Exception as e:
        logger.error(f"Settings update error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting Voice Assistant Web Server...")
    
    # Initialize AI components
    if not initialize_ai_components():
        logger.error("Failed to initialize AI components. Exiting...")
        sys.exit(1)
    
    # Start the Flask server
    app.run(
        host='0.0.0.0',  # Listen on all interfaces
        port=5000,
        debug=False,
        threaded=True
    )
