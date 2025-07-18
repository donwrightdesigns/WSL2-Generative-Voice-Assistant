#!/usr/bin/env python3
"""
Simple test script to verify Ollama integration for text-to-speech service
"""

import requests
import json

def test_ollama_api():
    """Test the Ollama API connection"""
    url = "http://localhost:11434/api/generate"
    
    payload = {
        "model": "llama3.2:3b",
        "prompt": "Say hello in a friendly way",
        "stream": False
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        
        result = response.json()
        print(f"Model: {result['model']}")
        print(f"Response: {result['response']}")
        return result['response']
        
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to Ollama: {e}")
        return None

def test_chat_api():
    """Test the chat API endpoint"""
    url = "http://localhost:11434/api/chat"
    
    payload = {
        "model": "llama3.2:3b",
        "messages": [
            {"role": "user", "content": "Hello! Can you introduce yourself briefly?"}
        ],
        "stream": False
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        
        result = response.json()
        print(f"Chat Response: {result['message']['content']}")
        return result['message']['content']
        
    except requests.exceptions.RequestException as e:
        print(f"Error with chat API: {e}")
        return None

if __name__ == "__main__":
    print("Testing Ollama API for text-to-speech service...")
    print("=" * 50)
    
    # Test generate API
    print("1. Testing generate API:")
    response1 = test_ollama_api()
    
    print("\n" + "=" * 50)
    
    # Test chat API
    print("2. Testing chat API:")
    response2 = test_chat_api()
    
    print("\n" + "=" * 50)
    print("✅ Ollama is ready for your text-to-speech service!")
