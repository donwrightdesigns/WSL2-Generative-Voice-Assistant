// Voice Assistant Web App JavaScript

class VoiceAssistant {
    constructor() {
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isVoiceMode = true;
        
        this.initializeElements();
        this.setupEventListeners();
        this.checkStatus();
        this.loadInitialSettings();
        
        // Check status every 30 seconds
        setInterval(() => this.checkStatus(), 30000);
    }

    initializeElements() {
        this.statusText = document.getElementById('status-text');
        this.statusDot = document.getElementById('status-dot');
        this.recordBtn = document.getElementById('record-btn');
        this.recordingIndicator = document.getElementById('recording-indicator');
        this.textInput = document.getElementById('text-input');
        this.sendBtn = document.getElementById('send-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.toggleModeBtn = document.getElementById('toggle-mode');
        this.settingsBtn = document.getElementById('settings-btn');
        this.ttsModeBtn = document.getElementById('tts-mode-btn');
        this.chatMessages = document.getElementById('chat-messages');
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.loadingText = document.getElementById('loading-text');
        this.audioPlayer = document.getElementById('audio-player');
        
        // Settings modal elements
        this.settingsModal = document.getElementById('settings-modal');
        this.closeSettingsBtn = document.getElementById('close-settings');
        this.modelSelect = document.getElementById('model-select');
        this.voiceSelect = document.getElementById('voice-select');
        this.speedSlider = document.getElementById('speed-slider');
        this.speedValue = document.getElementById('speed-value');
        this.testVoiceBtn = document.getElementById('test-voice');
        this.saveSettingsBtn = document.getElementById('save-settings');
        this.cancelSettingsBtn = document.getElementById('cancel-settings');
        
        // TTS modal elements
        this.ttsModal = document.getElementById('tts-modal');
        this.closeTTSBtn = document.getElementById('close-tts');
        this.closeTTSFooterBtn = document.getElementById('close-tts-footer');
        this.ttsTextarea = document.getElementById('tts-text');
        this.ttsVoiceSelect = document.getElementById('tts-voice-select');
        this.ttsSpeedSlider = document.getElementById('tts-speed-slider');
        this.ttsSpeedValue = document.getElementById('tts-speed-value');
        this.playTTSBtn = document.getElementById('play-tts');
        this.stopTTSBtn = document.getElementById('stop-tts');
        this.downloadTTSBtn = document.getElementById('download-tts');
        
        // Current settings
        this.currentSettings = {
            model: 'llama3.2:3b',
            voice: 'v2/en_speaker_6',
            speed: 1.2
        };
        
        // TTS state
        this.currentTTSAudio = null;
        this.isPlaying = false;
    }

    setupEventListeners() {
        // Voice controls
        this.recordBtn.addEventListener('mousedown', () => this.startRecording());
        this.recordBtn.addEventListener('mouseup', () => this.stopRecording());
        this.recordBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startRecording();
        });
        this.recordBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopRecording();
        });

        // Text controls
        this.sendBtn.addEventListener('click', () => this.sendTextMessage());
        this.textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendTextMessage();
            }
        });

        // Action buttons
        this.resetBtn.addEventListener('click', () => this.resetConversation());
        this.toggleModeBtn.addEventListener('click', () => this.toggleMode());
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        
        // Settings modal
        this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.cancelSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.testVoiceBtn.addEventListener('click', () => this.testVoice());
        this.speedSlider.addEventListener('input', (e) => this.updateSpeedValue(e.target.value));
        
        // TTS Mode
        this.ttsModeBtn.addEventListener('click', () =3e this.openTTSMode());
        this.closeTTSBtn.addEventListener('click', () =3e this.closeTTSMode());
        this.closeTTSFooterBtn.addEventListener('click', () =3e this.closeTTSMode());
        this.playTTSBtn.addEventListener('click', () =3e this.playTTS());
        this.stopTTSBtn.addEventListener('click', () =3e this.stopTTS());
        this.downloadTTSBtn.addEventListener('click', () =3e this.downloadTTS());
        this.ttsSpeedSlider.addEventListener('input', (e) =3e this.updateTTSSpeedValue(e.target.value));
        
        // Close modal when clicking outside
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettings();
            }
        });
        
        this.ttsModal.addEventListener('click', (e) => {
            if (e.target === this.ttsModal) {
                this.closeTTSMode();
            }
        });
    }

    async checkStatus() {
        try {
            const response = await fetch('/api/status');
            const status = await response.json();
            
            if (status.stt && status.tts && status.llm) {
                this.setStatus('Online', true);
            } else {
                this.setStatus('Services Loading...', false);
            }
        } catch (error) {
            this.setStatus('Offline', false);
            console.error('Status check failed:', error);
        }
    }

    setStatus(text, isOnline) {
        this.statusText.textContent = text;
        if (isOnline) {
            this.statusDot.classList.add('online');
        } else {
            this.statusDot.classList.remove('online');
        }
    }

    showLoading(text = 'Processing...') {
        this.loadingText.textContent = text;
        this.loadingOverlay.classList.add('active');
    }

    hideLoading() {
        this.loadingOverlay.classList.remove('active');
    }

    addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const icon = document.createElement('i');
        icon.className = isUser ? 'fas fa-user' : 'fas fa-robot';
        
        const text = document.createElement('span');
        text.textContent = content;
        
        messageContent.appendChild(icon);
        messageContent.appendChild(text);
        messageDiv.appendChild(messageContent);
        
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    async startRecording() {
        if (this.isRecording) return;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.recordedChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.processRecording();
            };
            
            this.mediaRecorder.start();
            this.isRecording = true;
            
            this.recordBtn.textContent = 'Release to Send';
            this.recordingIndicator.classList.add('active');
            
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Could not access microphone. Please ensure microphone permissions are granted.');
        }
    }

    stopRecording() {
        if (!this.isRecording) return;
        
        this.mediaRecorder.stop();
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        this.isRecording = false;
        
        this.recordBtn.innerHTML = '<i class="fas fa-microphone"></i><span>Hold to Talk</span>';
        this.recordingIndicator.classList.remove('active');
    }

    async processRecording() {
        if (this.recordedChunks.length === 0) return;
        
        const blob = new Blob(this.recordedChunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', blob, 'recording.wav');
        
        this.showLoading('Processing voice...');
        
        try {
            const response = await fetch('/api/conversation', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Failed to process audio');
            }
            
            const result = await response.json();
            
            // Add messages to chat
            this.addMessage(result.user_text, true);
            this.addMessage(result.assistant_response, false);
            
            // Play audio response
            if (result.audio) {
                this.playAudio(result.audio);
            }
            
        } catch (error) {
            console.error('Error processing recording:', error);
            this.addMessage('Sorry, I encountered an error processing your voice message.', false);
        } finally {
            this.hideLoading();
        }
    }

    async sendTextMessage() {
        const message = this.textInput.value.trim();
        if (!message) return;
        
        this.textInput.value = '';
        this.addMessage(message, true);
        
        this.showLoading('Generating response...');
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });
            
            if (!response.ok) {
                throw new Error('Failed to get response');
            }
            
            const result = await response.json();
            this.addMessage(result.response, false);
            
            // Generate speech for the response
            this.generateSpeech(result.response);
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.addMessage('Sorry, I encountered an error processing your message.', false);
        } finally {
            this.hideLoading();
        }
    }

    async generateSpeech(text) {
        try {
            const response = await fetch('/api/synthesize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    text: text,
                    voice: this.currentSettings.voice,
                    speed: this.currentSettings.speed
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.audio) {
                    this.playAudio(result.audio);
                }
            }
        } catch (error) {
            console.error('Error generating speech:', error);
        }
    }

    playAudio(audioBase64) {
        const audioBlob = this.base64ToBlob(audioBase64, 'audio/wav');
        const audioUrl = URL.createObjectURL(audioBlob);
        
        this.audioPlayer.src = audioUrl;
        this.audioPlayer.play().catch(error => {
            console.error('Error playing audio:', error);
        });
    }

    base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    async resetConversation() {
        if (confirm('Are you sure you want to reset the conversation?')) {
            try {
                const response = await fetch('/api/reset', {
                    method: 'POST'
                });
                
                if (response.ok) {
                    this.chatMessages.innerHTML = `
                        <div class="message assistant-message">
                            <div class="message-content">
                                <i class="fas fa-robot"></i>
                                <span>Hello! I'm your voice assistant. You can either speak to me or type your message.</span>
                            </div>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error resetting conversation:', error);
            }
        }
    }

    toggleMode() {
        this.isVoiceMode = !this.isVoiceMode;
        const body = document.body;
        
        if (this.isVoiceMode) {
            body.classList.remove('text-mode');
            body.classList.add('voice-mode');
            this.toggleModeBtn.innerHTML = '<i class="fas fa-keyboard"></i> Text Mode';
        } else {
            body.classList.remove('voice-mode');
            body.classList.add('text-mode');
            this.toggleModeBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Mode';
        }
    }
    
    async loadInitialSettings() {
        try {
            const response = await fetch('/api/settings');
            const settings = await response.json();
            
            this.currentSettings = {
                model: settings.current_model,
                voice: settings.current_voice,
                speed: settings.current_speed
            };
        } catch (error) {
            console.error('Error loading initial settings:', error);
        }
    }
    
    async openSettings() {
        try {
            // Load current settings
            const response = await fetch('/api/settings');
            const settings = await response.json();
            
            this.currentSettings = {
                model: settings.current_model,
                voice: settings.current_voice,
                speed: settings.current_speed
            };
            
            // Populate dropdowns
            this.populateModelSelect(settings.available_models, settings.current_model);
            this.populateVoiceSelect(settings.available_voices, settings.current_voice);
            
            // Set speed slider
            this.speedSlider.value = settings.current_speed;
            this.updateSpeedValue(settings.current_speed);
            
            // Show modal
            this.settingsModal.classList.add('active');
            
        } catch (error) {
            console.error('Error loading settings:', error);
            alert('Failed to load settings');
        }
    }
    
    closeSettings() {
        this.settingsModal.classList.remove('active');
    }
    
    populateModelSelect(models, currentModel) {
        this.modelSelect.innerHTML = '';
        Object.entries(models).forEach(([key, name]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = name;
            if (key === currentModel) {
                option.selected = true;
            }
            this.modelSelect.appendChild(option);
        });
    }
    
    populateVoiceSelect(voices, currentVoice) {
        this.voiceSelect.innerHTML = '';
        
        // Voice descriptions for better user experience
        const voiceDescriptions = {
            'v2/en_speaker_0': 'Young female, clear',
            'v2/en_speaker_1': 'Mature female, professional',
            'v2/en_speaker_2': 'Soft female, gentle',
            'v2/en_speaker_3': 'Deep male, authoritative',
            'v2/en_speaker_4': 'Bright female, energetic',
            'v2/en_speaker_5': 'Casual male, relaxed',
            'v2/en_speaker_6': 'Warm female, friendly',
            'v2/en_speaker_7': 'Professional male, clear',
            'v2/en_speaker_8': 'Mature male, confident',
            'v2/en_speaker_9': 'Smooth female, pleasant'
        };
        
        Object.entries(voices).forEach(([category, voiceList]) => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = category;
            
            voiceList.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice;
                const description = voiceDescriptions[voice] || '';
                option.textContent = description ? `${voice} - ${description}` : voice;
                if (voice === currentVoice) {
                    option.selected = true;
                }
                optgroup.appendChild(option);
            });
            
            this.voiceSelect.appendChild(optgroup);
        });
    }
    
    updateSpeedValue(speed) {
        this.speedValue.textContent = speed + 'x';
    }
    
    async testVoice() {
        const selectedVoice = this.voiceSelect.value;
        const selectedSpeed = parseFloat(this.speedSlider.value);
        
        try {
            const response = await fetch('/api/synthesize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    text: 'Hello! This is a test of the selected voice and speed.',
                    voice: selectedVoice,
                    speed: selectedSpeed
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.audio) {
                    this.playAudio(result.audio);
                }
            }
        } catch (error) {
            console.error('Error testing voice:', error);
            alert('Failed to test voice');
        }
    }
    
    async saveSettings() {
        const newSettings = {
            model: this.modelSelect.value,
            voice: this.voiceSelect.value,
            speed: parseFloat(this.speedSlider.value)
        };
        
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newSettings)
            });
            
            if (response.ok) {
                this.currentSettings = newSettings;
                this.closeSettings();
                alert('Settings saved successfully!');
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings');
        }
    }
    
    async openTTSMode() {
        try {
            // Load current settings for TTS
            const response = await fetch('/api/settings');
            const settings = await response.json();
            
            // Populate voice select
            this.populateTTSVoiceSelect(settings.available_voices, settings.current_voice);
            
            // Set current speed
            this.ttsSpeedSlider.value = settings.current_speed;
            this.updateTTSSpeedValue(settings.current_speed);
            
            // Show modal
            this.ttsModal.classList.add('active');
            
            // Focus on textarea
            this.ttsTextarea.focus();
            
        } catch (error) {
            console.error('Error opening TTS mode:', error);
            alert('Failed to open TTS mode');
        }
    }
    
    closeTTSMode() {
        this.ttsModal.classList.remove('active');
        this.stopTTS();
    }
    
    populateTTSVoiceSelect(voices, currentVoice) {
        this.ttsVoiceSelect.innerHTML = '';
        
        // Voice descriptions for better user experience
        const voiceDescriptions = {
            'v2/en_speaker_0': 'Young female, clear',
            'v2/en_speaker_1': 'Mature female, professional',
            'v2/en_speaker_2': 'Soft female, gentle',
            'v2/en_speaker_3': 'Deep male, authoritative',
            'v2/en_speaker_4': 'Bright female, energetic',
            'v2/en_speaker_5': 'Casual male, relaxed',
            'v2/en_speaker_6': 'Warm female, friendly',
            'v2/en_speaker_7': 'Professional male, clear',
            'v2/en_speaker_8': 'Mature male, confident',
            'v2/en_speaker_9': 'Smooth female, pleasant'
        };
        
        Object.entries(voices).forEach(([category, voiceList]) => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = category;
            
            voiceList.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice;
                const description = voiceDescriptions[voice] || '';
                option.textContent = description ? `${voice} - ${description}` : voice;
                if (voice === currentVoice) {
                    option.selected = true;
                }
                optgroup.appendChild(option);
            });
            
            this.ttsVoiceSelect.appendChild(optgroup);
        });
    }
    
    updateTTSSpeedValue(speed) {
        this.ttsSpeedValue.textContent = speed + 'x';
    }
    
    async playTTS() {
        const text = this.ttsTextarea.value.trim();
        if (!text) {
            alert('Please enter some text to read');
            return;
        }
        
        const selectedVoice = this.ttsVoiceSelect.value;
        const selectedSpeed = parseFloat(this.ttsSpeedSlider.value);
        
        this.playTTSBtn.disabled = true;
        this.stopTTSBtn.disabled = false;
        this.isPlaying = true;
        
        try {
            const response = await fetch('/api/synthesize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    text: text,
                    voice: selectedVoice,
                    speed: selectedSpeed
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.audio) {
                    this.currentTTSAudio = result.audio;
                    this.playAudio(result.audio);
                    
                    // Re-enable play button when audio finishes
                    this.audioPlayer.addEventListener('ended', () => {
                        this.resetTTSButtons();
                    }, { once: true });
                }
            } else {
                throw new Error('Failed to generate speech');
            }
        } catch (error) {
            console.error('Error playing TTS:', error);
            alert('Failed to generate speech');
            this.resetTTSButtons();
        }
    }
    
    stopTTS() {
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer.currentTime = 0;
        }
        this.resetTTSButtons();
    }
    
    resetTTSButtons() {
        this.playTTSBtn.disabled = false;
        this.stopTTSBtn.disabled = true;
        this.isPlaying = false;
    }
    
    async downloadTTS() {
        const text = this.ttsTextarea.value.trim();
        if (!text) {
            alert('Please enter some text to generate audio');
            return;
        }
        
        const selectedVoice = this.ttsVoiceSelect.value;
        const selectedSpeed = parseFloat(this.ttsSpeedSlider.value);
        
        this.downloadTTSBtn.disabled = true;
        this.downloadTTSBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        
        try {
            const response = await fetch('/api/synthesize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    text: text,
                    voice: selectedVoice,
                    speed: selectedSpeed
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.audio) {
                    // Create download link
                    const audioBlob = this.base64ToBlob(result.audio, 'audio/wav');
                    const url = URL.createObjectURL(audioBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `tts_audio_${Date.now()}.wav`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
            } else {
                throw new Error('Failed to generate audio');
            }
        } catch (error) {
            console.error('Error downloading TTS:', error);
            alert('Failed to generate audio for download');
        } finally {
            this.downloadTTSBtn.disabled = false;
            this.downloadTTSBtn.innerHTML = '<i class="fas fa-download"></i> Download Audio';
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VoiceAssistant();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, stop any ongoing recording
        if (window.voiceAssistant && window.voiceAssistant.isRecording) {
            window.voiceAssistant.stopRecording();
        }
    }
});
