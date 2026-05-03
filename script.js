// --- API KEY HANDLING ---
let API_KEY = localStorage.getItem('gemini_api_key') || "";
const modal = document.getElementById('api-key-modal');
const saveKeyBtn = document.getElementById('save-key-btn');
const keyInput = document.getElementById('api-key-input');

// Show modal if no key is found
if (!API_KEY) {
    modal.classList.remove('hidden');
} else {
    modal.classList.add('hidden');
}

// Save Key Button Logic
saveKeyBtn.addEventListener('click', () => {
    const key = keyInput.value.trim();
    if (key.length > 20) { // Basic validation check
        API_KEY = key;
        localStorage.setItem('gemini_api_key', API_KEY);
        modal.classList.add('hidden');
    } else {
        alert("Please enter a valid Google Gemini API Key.");
    }
});

// Allow hitting "Enter" to save the key
keyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveKeyBtn.click();
});

// --- CHAT & UI EVENT LISTENERS ---
document.getElementById('chat-form').addEventListener('submit', function (e) {
    e.preventDefault();
    sendMessage();
});

// Reset Button clears chat, stops voice, and lets user input a new key if they want
document.getElementById('reset-btn').addEventListener('click', () => {
    if(confirm("Do you want to clear the chat? (Click Cancel if you want to change your API Key instead)")) {
        document.getElementById('chat-messages').innerHTML = '';
        window.speechSynthesis.cancel();
    } else {
        localStorage.removeItem('gemini_api_key');
        API_KEY = "";
        modal.classList.remove('hidden');
    }
});

// --- VOICE FEATURES ---
function speakAmrita(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const cleanText = text.replace(/[*#]/g, ''); 
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        const voices = window.speechSynthesis.getVoices();
        const indianVoice = voices.find(v => v.lang === 'en-IN' || v.name.includes('India'));
        if (indianVoice) utterance.voice = indianVoice;
        
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
    }
}
window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();

const micBtn = document.getElementById('mic-btn');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition && micBtn) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-IN';
    recognition.interimResults = false;

    micBtn.addEventListener('click', () => {
        recognition.start();
        micBtn.innerHTML = '🔴';
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('chat-input').value = transcript;
        sendMessage();
    };

    recognition.onspeechend = () => {
        recognition.stop();
        micBtn.innerHTML = '🎙️';
    };

    recognition.onerror = (event) => {
        console.error("Mic error", event.error);
        micBtn.innerHTML = '🎙️';
    };
} else if (micBtn) {
    micBtn.style.display = 'none';
}

// --- MAIN CHAT LOGIC ---
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const history = document.getElementById('chat-messages');
    const userText = input.value.trim();

    if (!userText || !API_KEY) return;

    // Show user message
    history.innerHTML += `
        <div class="msg-group user">
            <div class="msg-row">
                <div class="message">${userText}</div>
            </div>
        </div>`;
    input.value = "";

    // Show typing indicator
    const loadingId = "loading-" + Date.now();
    history.innerHTML += `
        <div class="msg-group bot" id="${loadingId}">
            <div class="typing-indicator"><span></span><span></span><span></span></div>
        </div>`;
    
    history.scrollTop = history.scrollHeight;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: "You are Amrita, a professional, friendly India Election Assistant. Keep answers concise. Provide neutral, factual info based on the Election Commission of India." }]
                },
                contents: [{
                    parts: [{ text: userText }]
                }]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const aiReply = data.candidates[0].content.parts[0].text;
        document.getElementById(loadingId).remove();
        
        // Convert Markdown to simple HTML (bolding)
        const formattedReply = aiReply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        history.innerHTML += `
            <div class="msg-group bot">
                <div class="msg-row">
                    <div class="msg-avatar">A</div>
                    <div class="message">${formattedReply}</div>
                </div>
            </div>`;
        
        history.scrollTop = history.scrollHeight;
        speakAmrita(aiReply);

    } catch (error) {
        console.error(error);
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.innerHTML = `<div class="message" style="color:red">Error: Ensure your API key is correct. (${error.message})</div>`;
    }
}