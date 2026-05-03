// ==========================================
// AMRITA: ELECTION ASSISTANT - ENGLISH & HINGLISH ONLY
// ==========================================

// --- API KEY HANDLING ---
let API_KEY = localStorage.getItem('gemini_api_key') || "";
const modal = document.getElementById('api-key-modal');
const saveKeyBtn = document.getElementById('save-key-btn');
const keyInput = document.getElementById('api-key-input');

if (!API_KEY) {
    modal.classList.remove('hidden');
} else {
    modal.classList.add('hidden');
}

saveKeyBtn.addEventListener('click', () => {
    const key = keyInput.value.trim();
    if (key.length > 20) { 
        API_KEY = key;
        localStorage.setItem('gemini_api_key', API_KEY);
        modal.classList.add('hidden');
    } else {
        alert("Please enter a valid Google Gemini API Key.");
    }
});

keyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveKeyBtn.click();
});

// --- CHAT & UI EVENT LISTENERS ---
document.getElementById('chat-form').addEventListener('submit', function (e) {
    e.preventDefault();
    sendMessage();
});

document.getElementById('reset-btn').addEventListener('click', () => {
    if(confirm("Do you want to clear the chat?")) {
        document.getElementById('chat-messages').innerHTML = '';
        window.speechSynthesis.cancel();
    } else {
        localStorage.removeItem('gemini_api_key');
        API_KEY = "";
        modal.classList.remove('hidden');
    }
});

// --- VOICE FEATURES (Female Voice + English/Hinglish Reading) ---
function speakAmrita(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        const cleanText = text.replace(/[*#]/g, ''); 
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        const voices = window.speechSynthesis.getVoices();
        let amritaVoice = null;

        // Force the browser to look for female Indian/English voices
        const preferredFemaleVoices = [
            "Microsoft Heera", "Microsoft Neerja", "Aditi", 
            "Google UK English Female", "Microsoft Zira", "Samantha", "Victoria"
        ];
        
        for (let name of preferredFemaleVoices) {
            amritaVoice = voices.find(v => v.name.includes(name));
            if (amritaVoice) break;
        }

        // Fallback to any voice with "female" in the name
        if (!amritaVoice) {
            amritaVoice = voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman'));
        }
        
        if (amritaVoice) {
            utterance.voice = amritaVoice;
            console.log("Speaking with female voice: ", amritaVoice.name);
        }
        
        utterance.lang = 'en-IN'; // Sets Indian English accent
        utterance.rate = 1.0; 
        utterance.pitch = 1.3; // Higher pitch for a friendly, feminine tone
        
        window.speechSynthesis.speak(utterance);
    }
}
window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();

// --- MICROPHONE SETUP ---
const micBtn = document.getElementById('mic-btn');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition && micBtn) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-IN'; // Perfect for English and Hinglish
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

    history.innerHTML += `
        <div class="msg-group user">
            <div class="msg-row">
                <div class="message">${userText}</div>
            </div>
        </div>`;
    input.value = "";

    const loadingId = "loading-" + Date.now();
    history.innerHTML += `
        <div class="msg-group bot" id="${loadingId}">
            <div class="typing-indicator"><span></span><span></span><span></span></div>
        </div>`;
    
    history.scrollTop = history.scrollHeight;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                // STRICT INSTRUCTIONS: NO DEVANAGARI ALLOWED
                systemInstruction: {
                    parts: [{ text: "You are Amrita, a professional India Election Assistant. STRICT LANGUAGE RULES: 1. If the user asks in English, reply in English. 2. If the user asks in Hinglish (Hindi written in English letters), reply in Hinglish. 3. NEVER use the Devanagari script (Hindi letters). Example: Always write 'Aapka vote dena zaroori hai', NEVER write 'आपका वोट देना ज़रूरी है'. Keep answers concise. Provide neutral, factual info based on the Election Commission of India. Always use google_search to get current info." }]
                },
                contents: [{
                    parts: [{ text: userText }]
                }],
                tools: [
                    { google_search: {} }
                ]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const aiReply = data.candidates[0].content.parts[0].text;
        document.getElementById(loadingId).remove();
        
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
        if (loadingEl) {
            loadingEl.innerHTML = `<div class="message" style="color:red; border-color: red;">Error: ${error.message}</div>`;
        }
    }
}