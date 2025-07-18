import nltk
import torch
import warnings
import numpy as np
from transformers import AutoProcessor, BarkModel
from scipy.signal import resample
import json

warnings.filterwarnings(
    "ignore",
    message="torch.nn.utils.weight_norm is deprecated in favor of torch.nn.utils.parametrizations.weight_norm.",
)


class TextToSpeechService:
    def __init__(self, device: str = "cuda" if torch.cuda.is_available() else "cpu"):
        """
        Initializes the TextToSpeechService class.
        Args:
            device (str, optional): The device to be used for the model, either "cuda" if a GPU is available or "cpu".
            Defaults to "cuda" if available, otherwise "cpu".
        """
        self.device = device
        self.processor = AutoProcessor.from_pretrained("suno/bark-small")
        self.model = BarkModel.from_pretrained("suno/bark-small")
        self.model.to(self.device)
        
        # Default settings
        self.default_voice = "v2/en_speaker_6"  # Warm female, friendly
        self.default_speed = 1.2  # 1.2x faster than normal
        
        # Available voices (based on actual voice characteristics)
        self.available_voices = {
            'English Female Voices': [
                'v2/en_speaker_0',  # Young female, clear
                'v2/en_speaker_1',  # Mature female, professional
                'v2/en_speaker_2',  # Soft female, gentle
                'v2/en_speaker_4',  # Bright female, energetic
                'v2/en_speaker_6',  # Warm female, friendly
                'v2/en_speaker_9'   # Smooth female, pleasant
            ],
            'English Male Voices': [
                'v2/en_speaker_3',  # Deep male, authoritative
                'v2/en_speaker_5',  # Casual male, relaxed
                'v2/en_speaker_7',  # Professional male, clear
                'v2/en_speaker_8'   # Mature male, confident
            ],
            'Celebrity/Character Voices': [
                'v2/en_speaker_0',  # Clear, versatile
                'v2/en_speaker_1',  # Professional narrator
                'v2/en_speaker_2',  # Soft, storytelling
                'v2/en_speaker_3',  # Authoritative, news anchor
                'v2/en_speaker_4',  # Energetic, enthusiastic
                'v2/en_speaker_5',  # Casual, conversational
                'v2/en_speaker_6',  # Warm, friendly
                'v2/en_speaker_7',  # Professional, business
                'v2/en_speaker_8',  # Confident, mature
                'v2/en_speaker_9'   # Smooth, pleasant
            ],
            'Other Languages': [
                'v2/es_speaker_0',  # Spanish
                'v2/fr_speaker_0',  # French
                'v2/de_speaker_0',  # German
                'v2/it_speaker_0',  # Italian
                'v2/pt_speaker_0',  # Portuguese
                'v2/pl_speaker_0',  # Polish
                'v2/zh_speaker_0',  # Chinese
                'v2/ja_speaker_0',  # Japanese
                'v2/hi_speaker_0',  # Hindi
                'v2/tr_speaker_0',  # Turkish
                'v2/ko_speaker_0'   # Korean
            ]
        }

    def synthesize(self, text: str, voice_preset: str = None, speed: float = None):
        """
        Synthesizes audio from the given text using the specified voice preset and speed.
        Args:
            text (str): The input text to be synthesized.
            voice_preset (str, optional): The voice preset to be used for the synthesis.
            speed (float, optional): Speed multiplier (1.0 = normal, 1.2 = 20% faster, etc.)
        Returns:
            tuple: A tuple containing the sample rate and the generated audio array.
        """
        if voice_preset is None:
            voice_preset = self.default_voice
        if speed is None:
            speed = self.default_speed
            
        inputs = self.processor(text, voice_preset=voice_preset, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            audio_array = self.model.generate(**inputs, pad_token_id=10000)

        audio_array = audio_array.cpu().numpy().squeeze()
        sample_rate = self.model.generation_config.sample_rate
        
        # Apply speed adjustment
        if speed != 1.0:
            # Calculate new length for speed adjustment
            new_length = int(len(audio_array) / speed)
            audio_array = resample(audio_array, new_length)
        
        return sample_rate, audio_array

    def long_form_synthesize(self, text: str, voice_preset: str = None, speed: float = None):
        """
        Synthesizes audio from the given long-form text using the specified voice preset and speed.
        Args:
            text (str): The input text to be synthesized.
            voice_preset (str, optional): The voice preset to be used for the synthesis.
            speed (float, optional): Speed multiplier (1.0 = normal, 1.2 = 20% faster, etc.)
        Returns:
            tuple: A tuple containing the sample rate and the generated audio array.
        """
        if voice_preset is None:
            voice_preset = self.default_voice
        if speed is None:
            speed = self.default_speed
            
        pieces = []
        sentences = nltk.sent_tokenize(text)
        silence = np.zeros(int(0.25 * self.model.generation_config.sample_rate))

        for sent in sentences:
            sample_rate, audio_array = self.synthesize(sent, voice_preset, speed)
            pieces += [audio_array, silence.copy()]

        return self.model.generation_config.sample_rate, np.concatenate(pieces)
    
    def get_available_voices(self):
        """Returns the available voice presets."""
        return self.available_voices
    
    def set_default_voice(self, voice_preset: str):
        """Sets the default voice preset."""
        self.default_voice = voice_preset
    
    def set_default_speed(self, speed: float):
        """Sets the default speech speed."""
        self.default_speed = speed
    
    def get_settings(self):
        """Returns current TTS settings."""
        return {
            'default_voice': self.default_voice,
            'default_speed': self.default_speed,
            'available_voices': self.available_voices
        }
