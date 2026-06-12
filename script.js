// ==========================================
// AMRITA: ELECTION ASSISTANT - ENGLISH ONLY
// ==========================================

// --- API KEY HANDLING ---
let API_KEY = localStorage.getItem('gemini_api_key') || "";
// Language preference: 'en' or 'en-hinglish'
let LANG_PREF = localStorage.getItem('amrita_lang') || 'en';
const langSelect = document.getElementById('lang-select');

function getSystemInstructionFor(lang) {
    if (lang === 'en-hinglish') {
        return "You are Amrita, a professional India Election Assistant. LANGUAGE RULES: Prefer English but allow Hinglish (Hindi written in Latin letters) when the user uses it. NEVER use Devanagari script. Keep answers concise and neutral, based on Election Commission of India guidance. Always use google_search to get current info.";
    }
    // default: English only
    return "You are Amrita, a professional India Election Assistant. LANGUAGE RULES: Always reply in English regardless of the user's input. NEVER use Hinglish or Devanagari script. Keep answers concise. Provide neutral, factual info based on the Election Commission of India. Always use google_search to get current info.";
}

let SYSTEM_INSTRUCTION_TEXT = getSystemInstructionFor(LANG_PREF);

// Initialize selector UI
if (langSelect) {
    langSelect.value = LANG_PREF;
    langSelect.addEventListener('change', (e) => {
        LANG_PREF = e.target.value;
        localStorage.setItem('amrita_lang', LANG_PREF);
        SYSTEM_INSTRUCTION_TEXT = getSystemInstructionFor(LANG_PREF);
    });
}
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
    if (confirm("Do you want to clear the chat and change the API key?")) {
        document.getElementById('chat-messages').innerHTML = '';
        window.speechSynthesis.cancel();
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

    // Create and append user message element safely
    function createMessageElement(isUser, content, useHTML=false) {
        const group = document.createElement('div');
        group.className = 'msg-group ' + (isUser ? 'user' : 'bot');

        const row = document.createElement('div');
        row.className = 'msg-row';

        if (!isUser) {
            const avatar = document.createElement('div');
            avatar.className = 'msg-avatar';
            avatar.textContent = 'A';
            row.appendChild(avatar);
        } else {
            const avatar = document.createElement('div');
            avatar.className = 'msg-avatar';
            avatar.textContent = 'Y';
            row.appendChild(avatar);
        }

        const msg = document.createElement('div');
        msg.className = 'message';
        if (useHTML) msg.innerHTML = content; else msg.textContent = content;

        row.appendChild(msg);

        const time = document.createElement('div');
        time.className = 'msg-time';
        const now = new Date();
        time.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        row.appendChild(time);

        group.appendChild(row);
        return group;
    }

    const userEl = createMessageElement(true, userText, false);
    history.appendChild(userEl);
    input.value = "";

    const loadingId = "loading-" + Date.now();
    const loadingGroup = document.createElement('div');
    loadingGroup.className = 'msg-group bot';
    loadingGroup.id = loadingId;
    const typingWrap = document.createElement('div');
    typingWrap.className = 'typing-indicator';
    typingWrap.innerHTML = '<span></span><span></span><span></span>';
    loadingGroup.appendChild(typingWrap);
    history.appendChild(loadingGroup);
    history.scrollTop = history.scrollHeight;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                // STRICT INSTRUCTIONS: NO DEVANAGARI ALLOWED
                systemInstruction: {
                    parts: [{ text: SYSTEM_INSTRUCTION_TEXT }]
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
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();

        const formattedReply = aiReply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        const botEl = createMessageElement(false, formattedReply, true);
        history.appendChild(botEl);
        history.scrollTop = history.scrollHeight;

        speakAmrita(aiReply);

    } catch (error) {
        console.error(error);
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) {
            loadingEl.innerHTML = '';
            const err = document.createElement('div');
            err.className = 'message';
            err.style.color = 'red';
            err.style.borderColor = 'red';
            err.textContent = 'Error: ' + error.message;
            loadingEl.appendChild(err);
        }
    }
}