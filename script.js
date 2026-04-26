// 1. Try to get the key from config.js OR local storage
let API_KEY = window.CONFIG?.GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || "";

// 2. If no key is found (like on GitHub Pages), ask the user/judge
if (!API_KEY) {
    API_KEY = prompt("Please enter your Gemini API Key to use the Election Assistant:");
    if (API_KEY){
        localStorage.setItem('gemini_api_key', API_KEY);
    }
}

// 3. Listen for the button click
document.getElementById('send-btn').addEventListener('click', sendMessage);

// 4. Handle Enter key correctly
document.getElementById('chat-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault(); // Prevents page reload
        sendMessage();
    }
});

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const history = document.getElementById('chat-messages'); // Match your index.html ID
    const userText = input.value.trim();

    if (!userText || !API_KEY) return;

    // Show user message (using your CSS classes)
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
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: "You are Amrita, a professional India Election Assistant. Provide neutral, factual info. If unrelated, politely redirect. User says: " + userText
                    }]
                }]
            })
        });

        const data = await response.json();
        
        if (data.error) throw new Error(data.error.message);

        const aiReply = data.candidates[0].content.parts[0].text;

        document.getElementById(loadingId).remove();
        
        // Show AI reply with your "Amrita" styling
        history.innerHTML += `
            <div class="msg-group bot">
                <div class="msg-row">
                    <div class="msg-avatar">A</div>
                    <div class="message">${aiReply}</div>
                </div>
            </div>`;
        
        history.scrollTop = history.scrollHeight;

    } catch (error) {
        console.error(error);
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.innerHTML =`<div class="message" style="color:red">Error: ${error.message}</div>`;
    }// adding new line for better readability  
    
}