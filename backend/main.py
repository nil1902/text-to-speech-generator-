from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import time

from backend.tts_engine import generate_audio

app = FastAPI(title="TTS Web App")

# Create required directories
os.makedirs(os.path.join("static", "audio"), exist_ok=True)
os.makedirs("frontend", exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TTSRequest(BaseModel):
    text: str
    voice: str
    emotion: str
    speed: float

def cleanup_old_files():
    """Delete audio files older than 1 hour to save disk space."""
    audio_dir = os.path.join("static", "audio")
    now = time.time()
    for filename in os.listdir(audio_dir):
        file_path = os.path.join(audio_dir, filename)
        if os.path.isfile(file_path):
            if os.stat(file_path).st_mtime < now - 3600:
                try:
                    os.remove(file_path)
                except:
                    pass

@app.post("/generate-speech")
async def generate_speech(request: TTSRequest, background_tasks: BackgroundTasks):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    if len(request.text) > 5000:
        raise HTTPException(status_code=400, detail="Text exceeds character limit of 5000")
        
    try:
        # Generate the audio file asynchronously
        filename = await generate_audio(request.text.strip(), request.voice, request.emotion, request.speed)
        
        # Schedule cleanup task
        background_tasks.add_task(cleanup_old_files)
        
        return {"audio_url": f"/static/audio/{filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join("static", "audio", filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="audio/mpeg", filename=filename)
    else:
        raise HTTPException(status_code=404, detail="File not found")


# Mount static files and frontend
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_index():
    return FileResponse(os.path.join("frontend", "index.html"))

# Catch-all for other frontend files (css, js)
app.mount("/", StaticFiles(directory="frontend"), name="frontend")
