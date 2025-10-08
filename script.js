document.addEventListener('DOMContentLoaded', () => {
    const chatBody = document.getElementById('chat-body');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    
    // --- STATE MANAGEMENT ---
    const backendUrl = "http://127.0.0.1:8000/chat"; 
    const sessionId = `browser_session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const state = {
        followUpContext: null 
    };
    
    console.log(`New Chat Session ID: ${sessionId}`);
    
    // --- Data Objects (UNCHANGED) ---
    const smallTalk = {
        'hi': {
            reply: "Hello! What can I help you with today? 👋",
            quickReplies: ['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel'],
            preventFollowUp: true 
        },
        'bye': {
            reply: "Goodbye! Have a nice day! 😊",
            quickReplies: null,
            preventFollowUp: true 
        },
        'thanks': { 
            reply: "You're welcome! Is there anything else I can assist you with? 😊",
            quickReplies: ['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel'],
            preventFollowUp: true 
        },
        'error': {
            reply: "🚨 **Error connecting to the RAG backend.** Please ensure your server is running and the URL is correct. Check the browser console for details.",
            quickReplies: ['Admission', 'Fees', 'FAQ'],
            askFollowUp: false,
            showFeedback: true, 
            preventFollowUp: true
        }
    };

    // --- Utility Functions ---
    function getVariableDelay() { return Math.random() * (1000 - 400) + 400; }

    function addMessage(msg, sender) {
        const div = document.createElement('div');
        div.classList.add('message', sender);
        div.innerHTML = msg; 
        chatBody.appendChild(div);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function showTypingIndicator() {
        if (!document.getElementById('typing-indicator')) {
            const div = document.createElement('div');
            div.classList.add('message', 'bot', 'typing-indicator');
            div.id = 'typing-indicator';
            div.innerHTML = '<span></span><span></span><span></span>'; 
            chatBody.appendChild(div);
            chatBody.scrollTop = chatBody.scrollHeight;
        }
    }

    function hideTypingIndicator() {
        const ind = document.getElementById('typing-indicator');
        if (ind) ind.remove();
    }
    
    function addQuickReplies(replies) {
        if (!replies || replies.length === 0) return;

        const existing = document.querySelector('.quick-replies');
        if (existing) existing.remove();

        const container = document.createElement('div');
        container.classList.add('quick-replies');
        
        replies.forEach(r => {
            const btn = document.createElement('button');
            btn.innerText = r;
            
            btn.onclick = () => { 
                userInput.value = r; 
                sendMessage(); 
            };
            
            container.appendChild(btn);
        });
        chatBody.appendChild(container);
        chatBody.scrollTop = chatBody.scrollHeight;
    }
    
    function resetChatState() {
        const existingFeedback = document.querySelector('.feedback-buttons');
        if (existingFeedback) existingFeedback.remove();
        const existingQuickReplies = document.querySelector('.quick-replies');
        if (existingQuickReplies) existingQuickReplies.remove();
    }
    window.resetChatState = resetChatState; 

    // ✅ Function to clear history on the backend
    async function clearBackendHistory() {
        const clearUrl = backendUrl.replace('/chat', '/clear_history'); 
        try {
            await fetch(clearUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: "clear", session_id: sessionId })
            });
            console.log("Backend history successfully cleared.");
        } catch (error) {
            console.error("Failed to clear backend history:", error);
        }
    }

    async function showFeedbackReceived(type) {
        const existingFeedback = document.querySelector('.feedback-buttons');
        if (existingFeedback) existingFeedback.remove();

        const message = type === 'helpful' 
            ? '<span style="font-size: 0.75em; font-style: italic; color: #6a6a6a;">✅ Thanks for your feedback!</span>' 
            : '<span style="font-size: 0.75em; font-style: italic; color: #6a6a6a;">🙏 Feedback received. We\'ll use this to improve.</span>';

        addMessage(message, 'bot');
        
        if (state.followUpContext !== 'finished-query') {
            addMessage("Is there anything else I can assist you with? 🤓", 'bot');
            addQuickReplies(['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel']); 
        }
    }
    window.showFeedbackReceived = showFeedbackReceived; 

    function addFeedbackButtons() {
        const existingFeedback = document.querySelector('.feedback-buttons');
        if (existingFeedback) existingFeedback.remove();
        
        const container = document.createElement('div');
        container.classList.add('feedback-buttons');
        
        container.innerHTML = `
            <span class="feedback-text">Was this helpful?</span>
            <button class="helpful-btn" onclick="showFeedbackReceived('helpful')">👍 Helpful</button>
            <button class="not-helpful-btn" onclick="showFeedbackReceived('not-helpful')">👎 Not helpful</button>
        `;
        
        chatBody.appendChild(container);
        chatBody.scrollTop = chatBody.scrollHeight;
    }
    
    async function askForFeedbackAndFollowUp() {
        addFeedbackButtons();

        showTypingIndicator();
        await new Promise(r => setTimeout(r, getVariableDelay())); 
        hideTypingIndicator();

        state.followUpContext = 'finished-query'; 
        console.log("State changed to 'finished-query'. Asking for Yes/No follow-up.");
        addMessage("Do you want me to help with something else? Click on yes for your next query 🤔", 'bot');
        addQuickReplies(['Yes', 'No']);
    }

    function handleSmallTalk(msg) { 
        const lowerMsg = msg.toLowerCase().trim();
        
        if (lowerMsg === 'hi' || lowerMsg === 'hello' || lowerMsg === 'hey' || lowerMsg.includes('how are you')) {
            return { ...smallTalk['hi'], askFollowUp: false, showFeedback: false }; 
        }
        if (lowerMsg.includes('thank') || lowerMsg.includes('thanks') || lowerMsg === 'ty') { 
            return { ...smallTalk['thanks'], askFollowUp: false, showFeedback: false }; 
        }
        if (lowerMsg === 'bye' || lowerMsg.includes('goodbye')) {
            return { ...smallTalk['bye'], askFollowUp: false, showFeedback: false };
        }
        
        return null;
    }
    
    function handleContextFlow(msg, context) {
        const lowerMsg = msg.toLowerCase().trim();

        if (context !== 'finished-query') {
            return null; 
        }
        
        const isExactYes = lowerMsg === 'yes';
        const isExactNo = lowerMsg === 'no';

        let isNlpYes = false;
        let isNlpNo = false;
        
        if (typeof nlp !== 'undefined') {
            const doc = nlp(lowerMsg);
            isNlpYes = doc.match('(yes|yeah|sure|yup|affirmative|i do|i want to)').found;
            isNlpNo = doc.match('(no|nope|negative|nah|i do not)').found;
        }
        
        const isYes = isExactYes || isNlpYes;
        const isNo = isExactNo || isNlpNo;

        if (isYes) {
            state.followUpContext = null; 
            clearBackendHistory(); 
            return { 
                reply: "Great! How can I help you with a new query? 👋", 
                quickReplies: ['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel'], 
                askFollowUp: false, 
                showFeedback: false,
                preventFollowUp: true
            };
        } 
        
        if (isNo) {
            state.followUpContext = null; 
            return { 
                reply: "👍 I'm glad I could help. Thank you for using PAU InfoBot!", 
                quickReplies: null, 
                askFollowUp: false, 
                showFeedback: false,
                preventFollowUp: true
            };
        }
        
        console.log("Context lock bypassed. New query will be sent to RAG backend.");
        state.followUpContext = null; 
        return null; 
    }

    function getBotResponse(message) {
        const raw = message.toLowerCase().trim();
        
        const contextRes = handleContextFlow(raw, state.followUpContext); 
        if (contextRes) {
            return { isFast: true, data: contextRes }; 
        }
        
        const small = handleSmallTalk(raw);
        if (small) {
            state.followUpContext = null; 
            return { isFast: true, data: small };
        }
        
        if (!backendUrl || backendUrl.includes("YOUR_RAG_BACKEND_URL_HERE")) {
             return { isFast: true, data: smallTalk['error'] };
        }
        
        console.log(`Executing RAG query for: ${message.substring(0, 30)}...`);
        
        const ragPromise = (async () => {
             try {
                 const response = await fetch(backendUrl, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ message: message, session_id: sessionId })
                 });

                 if (!response.ok) {
                     const errorText = response.headers.get('content-type')?.includes('application/json') 
                         ? (await response.json()).detail || response.statusText
                         : response.statusText;
                     throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
                 }

                 const data = await response.json();
                 
                 return {
                     reply: data.response,
                     quickReplies: null, 
                     askFollowUp: true, 
                     showFeedback: false,
                     preventFollowUp: false 
                 };

             } catch (error) {
                 console.error("RAG Backend Error:", error);
                 throw smallTalk['error']; 
             }
        })();
        
        return { isFast: false, promise: ragPromise };
    }

    async function sendMessage() {
        const msg = userInput.value.trim();
        if (!msg) {
            userInput.classList.add('error-shake');
            setTimeout(() => userInput.classList.remove('error-shake'), 300);
            return;
        }
        
        const responseObject = getBotResponse(msg);
        
        resetChatState();

        let displayMsg = msg;
        if (typeof nlp !== 'undefined') {
             displayMsg = nlp(msg).toTitleCase().out('text');
        } else {
             displayMsg = msg.charAt(0).toUpperCase() + msg.slice(1);
        }
        addMessage(displayMsg, 'user');
        
        userInput.value = '';
        userInput.focus();

        let finalResponse;

        if (responseObject.isFast) {
            finalResponse = responseObject.data;
        } else {
            showTypingIndicator();
            await new Promise(r => setTimeout(r, getVariableDelay()));
            
            try {
                finalResponse = await responseObject.promise;
            } catch (errorData) {
                finalResponse = errorData; 
            } finally {
                hideTypingIndicator();
            }
        }
        
        // 4. Final Bot Response Display (Unchanged)
        let formattedReply = finalResponse.reply; 
        formattedReply = formattedReply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formattedReply = formattedReply.replace(/^- (.*)/gm, '<ul><li>$1</li></ul>');
        formattedReply = formattedReply.replace(/### (.*)/g, '<h3>$1</h3>');
        
        addMessage(formattedReply, 'bot');
        
        if (finalResponse.quickReplies) {
            addQuickReplies(finalResponse.quickReplies);
        }
        
        if (finalResponse.showFeedback) {
            addFeedbackButtons();
        }
        
        // 5. Trigger the follow-up loop
        if (finalResponse.askFollowUp && !finalResponse.preventFollowUp) { 
            await askForFeedbackAndFollowUp();
        } 
    }

    // ----------------------------------------------------
    // 🌟 FIX: THEME TOGGLE LOGIC
    // ----------------------------------------------------
    // Targets the button with id="theme-toggle" (fixed in HTML)
    const themeToggleBtn = document.getElementById('theme-toggle'); 
    // Targets the main wrapper with id="chatbot-container"
    const chatContainer = document.getElementById('chatbot-container'); 
    
    function applyTheme() {
        const currentTheme = localStorage.getItem('theme') || 'light';
        
        // Apply theme class to the container
        if (currentTheme === 'dark') {
            chatContainer.classList.add('dark-mode');
            if (themeToggleBtn) themeToggleBtn.innerHTML = '☀️'; // Sun icon for light mode
        } else {
            chatContainer.classList.remove('dark-mode');
            if (themeToggleBtn) themeToggleBtn.innerHTML = '🌙'; // Moon icon for dark mode
        }
        
        // Apply a general class to the body if you want the area *outside* the bot to change
        // document.body.classList.toggle('dark-mode-global', currentTheme === 'dark'); 
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isDarkMode = chatContainer.classList.contains('dark-mode');
            const newTheme = isDarkMode ? 'light' : 'dark'; // Toggle the theme
            localStorage.setItem('theme', newTheme);
            applyTheme();
        });
        // Apply theme on initial load
        applyTheme(); 
    }
    // ----------------------------------------------------


    // ----------------------------------------------------
    // 🎤 FIX: MICROPHONE (SPEECH-TO-TEXT) LOGIC
    // ----------------------------------------------------
    // Targets the button with id="mic-btn" (fixed in HTML)
    const micBtn = document.getElementById('mic-btn');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition && micBtn) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false; 
        recognition.interimResults = false; 
        recognition.lang = 'en-US'; 
        let isListening = false;

        recognition.onstart = () => {
            isListening = true;
            micBtn.classList.add('listening'); 
            userInput.placeholder = 'Speak now...';
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInput.value = transcript;
            recognition.stop(); // Manually stop after result to ensure onend fires
            // Note: sendMessage() is called implicitly when recognition.stop() triggers onend,
            // but for robustness, let's call it here if we want instant sending:
            resetChatState(); 
            sendMessage();
        };

        recognition.onend = () => {
            isListening = false;
            micBtn.classList.remove('listening');
            userInput.placeholder = 'Ask your question...';
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            micBtn.classList.remove('listening');
            isListening = false;
            userInput.placeholder = 'Ask your question...';
            if (event.error === 'not-allowed') {
                 addMessage("🚨 Microphone access denied. Please grant permission in your browser settings.", 'bot');
            }
        };
        
        micBtn.addEventListener('click', () => {
            if (isListening) {
                recognition.stop();
            } else {
                userInput.value = ''; 
                recognition.start();
            }
        });

    } else if (micBtn) {
         micBtn.style.display = 'none'; 
         console.warn("Web Speech API not supported or micBtn not found.");
    }
    // ----------------------------------------------------


    // --- Event Listeners and Initial Greeting ---
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // Initial greeting
    showTypingIndicator();
    setTimeout(() => {
        hideTypingIndicator();
        addMessage(getGreeting(), 'bot');
        addQuickReplies(['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel']); 
    }, getVariableDelay() + 500); 

    function getGreeting() {
        const hour = new Date().getHours();
        let greeting;
        
        if (hour < 12) {
            greeting = "Good morning";
        } else if (hour < 17) {
            greeting = "Good afternoon";
        } else {
            greeting = "Good evening";
        }
        return `${greeting}! I'm the PAU InfoBot. How can I help you today? 👋`;
    }
});
