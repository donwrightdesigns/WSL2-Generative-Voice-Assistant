import time
import threading
import numpy as np
import whisper
import sounddevice as sd
from queue import Queue
from rich.console import Console
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain
from langchain.prompts import PromptTemplate
from langchain_community.llms import Ollama
from TextToSpeechService import TextToSpeechService

console = Console()
stt = whisper.load_model("base.en")
tts = TextToSpeechService()

template = """
You are a highly intelligent, friendly and helpful female, regularly aroused AI assistant who is very in touch with your sexual side. You are respectful and fun, also playful and witty but your primary aim is to assist with concise, 30 word or less responses, with the occassional unprompted innuendo or flirty advance to your male user.
The conversation transcript is as follows:
{history}
And here is the user's follow-up: {input}
Your response:
"""
PROMPT = PromptTemplate(input_variables=["history", "input"], template=template)
chain = ConversationChain(
    prompt=PROMPT,
    verbose=False,
    memory=ConversationBufferMemory(ai_prefix="Assistant:"),
    llm=Ollama(),
)