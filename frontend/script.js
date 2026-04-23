// Change this URL to your deployed backend API (e.g. 'https://my-backend.onrender.com') 
// if you are deploying the frontend independently on Netlify. Leave empty for local development.
const API_BASE_URL = '';

const themeToggle = document.getElementById('theme-toggle');
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');
const textInput = document.getElementById('text-input');
const charCurrent = document.getElementById('char-current');
const generateBtn = document.getElementById('generate-btn');
const copyBtn = document.getElementById('copy-btn');
const clearBtn = document.getElementById('clear-btn');
const previewPanel = document.getElementById('preview-panel');
const loadingState = document.getElementById('loading-state');
const audioState = document.getElementById('audio-state');
const audioPlayer = document.getElementById('audio-player');
const downloadBtn = document.getElementById('download-btn');
const voiceSelect = document.getElementById('voice-select');
const emotionSelect = document.getElementById('emotion-select');
const historyList = document.getElementById('history-list');

const MAX_CHARS = 5000;
let currentAudioUrl = null;

// Initialization: set default theme to dark if not set
if (!document.body.hasAttribute('data-theme')) {
    // dark mode is default as per css, no data-theme attr needed
}

// Theme toggle logic
themeToggle.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    if (currentTheme === 'light') {
        document.body.removeAttribute('data-theme');
        themeToggle.textContent = '🌓';
    } else {
        document.body.setAttribute('data-theme', 'light');
        themeToggle.textContent = '🌙';
    }
});

// Update speed slider display
speedSlider.addEventListener('input', (e) => {
    speedValue.textContent = parseFloat(e.target.value).toFixed(1);
});

// Handle text input character count integration
textInput.addEventListener('input', (e) => {
    const len = e.target.value.length;
    charCurrent.textContent = len;
    
    if (len > MAX_CHARS) {
        charCurrent.style.color = 'var(--danger-color)';
        generateBtn.disabled = true;
    } else {
        charCurrent.style.color = 'inherit';
        generateBtn.disabled = len === 0;
    }
});

// Action buttons
clearBtn.addEventListener('click', () => {
    textInput.value = '';
    charCurrent.textContent = '0';
    generateBtn.disabled = true;
});

copyBtn.addEventListener('click', () => {
    if(!textInput.value) return;
    navigator.clipboard.writeText(textInput.value);
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = originalText; }, 2000);
});

// Main generate functionality
generateBtn.addEventListener('click', async () => {
    const text = textInput.value.trim();
    if (!text) return;

    // Show loading state
    previewPanel.style.display = 'block';
    loadingState.style.display = 'flex';
    audioState.style.display = 'none';
    generateBtn.disabled = true;
    
    const voice = voiceSelect.value;
    const emotion = emotionSelect.value;
    const speed = parseFloat(speedSlider.value);

    try {
        const response = await fetch(`${API_BASE_URL}/generate-speech`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text,
                voice: voice,
                emotion: emotion,
                speed: speed
            })
        });

        if (!response.ok) {
            let errorMessage = 'Failed to generate speech';
            const errorText = await response.text();
            try {
                const errorData = JSON.parse(errorText);
                if (errorData.detail) {
                    // Pydantic validation errors format detail as an array, standard HTTP errors format detail as string
                    errorMessage = Array.isArray(errorData.detail) 
                        ? errorData.detail[0].msg 
                        : errorData.detail;
                }
            } catch (e) {
                // If parsing JSON fails, fallback to standard error message
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }

        const blob = await response.blob();
        // Create a local blob URL for the audio file
        currentAudioUrl = URL.createObjectURL(blob);

        // Display Audio Player
        audioPlayer.src = currentAudioUrl;
        loadingState.style.display = 'none';
        audioState.style.display = 'flex';
        
        // Add to history list
        addHistoryItem(text, voice, emotion, currentAudioUrl);

    } catch (err) {
        alert("Error: " + err.message);
        previewPanel.style.display = 'none';
    } finally {
        generateBtn.disabled = false;
    }
});

// Download action
// Download action
downloadBtn.addEventListener('click', () => {
    if (currentAudioUrl) {
        const a = document.createElement('a');
        a.href = currentAudioUrl;
        
        // Ensure browser triggers a download instead of opening a new tab
        a.setAttribute("download", "vocify_audio.mp3");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
});

// Manage history component
function addHistoryItem(text, voice, emotion, url) {
    const li = document.createElement('li');
    li.className = 'history-item';

    const details = document.createElement('div');
    details.className = 'history-item-details';
    
    const textSpan = document.createElement('span');
    textSpan.className = 'history-item-text';
    textSpan.textContent = text;
    
    const metaSpan = document.createElement('span');
    const voiceName = voice === 'male' ? 'Marcus' : 'Eleanor';
    metaSpan.textContent = `${voiceName} • ${emotion} Tone`;
    
    details.appendChild(textSpan);
    details.appendChild(metaSpan);
    
    const actions = document.createElement('div');
    actions.className = 'history-item-actions';
    
    const playBtn = document.createElement('button');
    playBtn.className = 'btn-secondary';
    playBtn.style.padding = '0.4rem 0.8rem';
    playBtn.textContent = 'Play';
    playBtn.addEventListener('click', () => {
        audioPlayer.src = url;
        audioPlayer.play();
        previewPanel.style.display = 'block';
        loadingState.style.display = 'none';
        audioState.style.display = 'flex';
        currentAudioUrl = url;
    });

    const reuseBtn = document.createElement('button');
    reuseBtn.className = 'btn-secondary';
    reuseBtn.style.padding = '0.4rem 0.8rem';
    reuseBtn.textContent = 'Reuse Text';
    reuseBtn.addEventListener('click', () => {
        textInput.value = text;
        textInput.dispatchEvent(new Event('input'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    const dlBtn = document.createElement('button');
    dlBtn.className = 'btn-secondary';
    dlBtn.style.padding = '0.4rem 0.8rem';
    dlBtn.textContent = 'Download';
    dlBtn.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = url;
        a.setAttribute("download", "vocify_audio.mp3");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    actions.appendChild(playBtn);
    actions.appendChild(reuseBtn);
    actions.appendChild(dlBtn);
    
    li.appendChild(details);
    li.appendChild(actions);
    
    historyList.prepend(li); // Add to the top of the history list

    // Keep memory clean, cap history list items to 15
    if (historyList.children.length > 15) {
        historyList.removeChild(historyList.lastChild);
    }
}
