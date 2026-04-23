import edge_tts
import os
import uuid

# Mapping for emotion simulation using pitch and rate tweaks
# Edge-TTS natively supports some SSML tags, but tweaking pitch/rate is universally supported.
EMOTION_MODIFIERS = {
    "Normal": {"rate": "+0%", "pitch": "+0Hz"},
    "Happy": {"rate": "+10%", "pitch": "+10Hz"},
    "Sad": {"rate": "-15%", "pitch": "-10Hz"},
    "Angry": {"rate": "+15%", "pitch": "-5Hz"},
    "Excited": {"rate": "+20%", "pitch": "+15Hz"},
    "Calm": {"rate": "-10%", "pitch": "-5Hz"}
}

# Example Neural voices (High quality)
VOICES = {
    "male": "en-US-ChristopherNeural",
    "female": "en-US-JennyNeural"
}

async def generate_audio(text: str, voice_type: str, emotion: str, speed: float) -> str:
    voice = VOICES.get(voice_type.lower(), VOICES["female"])
    
    # Speed mapping: param is float (0.5 to 2.0). Default = 1.0.
    base_speed_percent = int((speed - 1.0) * 100)
    
    # Emotion modifiers
    emotion_rates = EMOTION_MODIFIERS.get(emotion, EMOTION_MODIFIERS["Normal"])
    emotion_rate_val = int(emotion_rates["rate"].replace("%", ""))
    
    total_rate = base_speed_percent + emotion_rate_val
    rate_str = f"+{total_rate}%" if total_rate >= 0 else f"{total_rate}%"
    
    pitch_str = emotion_rates["pitch"]
    
    output_filename = f"{uuid.uuid4().hex}.mp3"
    output_path = os.path.join("static", "audio", output_filename)
    
    # Initialize Engine
    communicate = edge_tts.Communicate(text, voice, rate=rate_str, pitch=pitch_str)
    
    # Save directly to our static folder
    await communicate.save(output_path)
    
    return output_filename
