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

def cleanup_old_files(path: str):
    """Delete audio file after sending it."""
    try:
        os.remove(path)
    except:
        pass

@app.post("/generate-speech")
async def generate_speech(request: TTSRequest, background_tasks: BackgroundTasks):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    if len(request.text) > 5000:
        raise HTTPException(status_code=400, detail="Text exceeds character limit of 5000")
        
    try:
        # Generate the audio file asynchronously in /tmp
        file_path = await generate_audio(request.text.strip(), request.voice, request.emotion, request.speed)
        
        # Schedule cleanup task to delete the file after it is sent
        background_tasks.add_task(cleanup_old_files, file_path)
        
        # Return the file directly as a binary stream
        return FileResponse(file_path, media_type="audio/mpeg", filename=os.path.basename(file_path))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# Mount static files and frontend
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_index():
    return FileResponse(os.path.join("frontend", "index.html"))

# Catch-all for other frontend files (css, js)
app.mount("/", StaticFiles(directory="frontend"), name="frontend")
