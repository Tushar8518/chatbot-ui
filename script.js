// NOTE: This code assumes the Compromise library is loaded in your HTML:
// <script src="https://unpkg.com/compromise@latest/builds/compromise.min.js"></script>
// <script type="module" src="script.js"></script>

document.addEventListener('DOMContentLoaded', () => {
    const chatBody = document.getElementById('chat-body');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const modeToggle = document.getElementById('mode-toggle'); 
    const chatbotContainer = document.getElementById('chatbot-container'); 
    const chatFooter = document.querySelector('.chat-footer'); 
    let followUpContext = null; // Used to manage simple Yes/No state after a RAG query

    // --- Data Objects ---
    const smallTalk = {
        'hi': {
            reply: "Hello! What can I help you with today? 👋",
            quickReplies: ['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel'] 
        },
        'bye': {
            reply: "Goodbye! Have a nice day! 😊",
            quickReplies: null
        },
        'thanks': { 
            reply: "You're welcome! 😊",
            quickReplies: null
        }
    };
    // --- END Data Objects ---

    // --- Utility Functions ---
    
    function setMode(isDark) {
        if (isDark) {
            chatbotContainer.classList.add('dark-mode');
            modeToggle.innerText = '🌙'; 
            localStorage.setItem('mode', 'dark');
        } else {
            chatbotContainer.classList.remove('dark-mode');
            modeToggle.innerText = '☀️'; 
            localStorage.setItem('mode', 'light');
        }
    }

    modeToggle.addEventListener('click', () => {
        const isDark = chatbotContainer.classList.contains('dark-mode');
        setMode(!isDark);
    });

    const savedMode = localStorage.getItem('mode');
    if (savedMode === 'dark') {
        setMode(true);
    } else {
        setMode(false); 
    }
    
    function getVariableDelay() {
        return Math.random() * (1000 - 400) + 400; 
    }

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
        if (chatbotContainer.classList.contains('dark-mode')) {
            container.classList.add('dark-mode');
        }

        replies.forEach(r => {
            const btn = document.createElement('button');
            btn.innerText = r;
            btn.onclick = () => {
                window.handleQuickReply(r); 
            };
            container.appendChild(btn);
        });
        chatBody.appendChild(container);
        chatBody.scrollTop = chatBody.scrollHeight;
    }
    
    // Function called by the feedback buttons (Helpful/Not helpful)
    async function showFeedbackReceived(type) {
        const existingFeedback = document.querySelector('.feedback-buttons');
        if (existingFeedback) existingFeedback.remove();

        const message = type === 'helpful' 
            ? '<span style="font-size: 0.75em; font-style: italic; color: #6a6a6a;">✅ Thanks for your feedback!</span>' 
            : '<span style="font-size: 0.75em; font-style: italic; color: #6a6a6a;">🙏 Feedback received. We\'ll use this to improve.</span>';

        addMessage(message, 'bot');
        
        showTypingIndicator();
        await new Promise(r => setTimeout(r, getVariableDelay()));
        hideTypingIndicator();
        
        followUpContext = null; 
        addMessage("Can I help you with anything else? 🤔", 'bot');
        addQuickReplies(['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel']); 
    }
    window.showFeedbackReceived = showFeedbackReceived; 

    function addFeedbackButtons() {
        const existingFeedback = document.querySelector('.feedback-buttons');
        if (existingFeedback) existingFeedback.remove();
        
        const container = document.createElement('div');
        container.classList.add('feedback-buttons');
        
        if (chatbotContainer.classList.contains('dark-mode')) {
            container.classList.add('dark-mode');
        }
        
        container.innerHTML = `
            <button class="helpful-btn" onclick="showFeedbackReceived('helpful')">👍 Helpful</button>
            <button class="not-helpful-btn" onclick="showFeedbackReceived('not-helpful')">👎 Not helpful</button>
        `;
        
        chatBody.appendChild(container);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    window.handleQuickReply = function (text) {
        const existing = document.querySelector('.quick-replies');
        if (existing) existing.remove();
        
        // Ensure only the text of the quick reply is sent
        userInput.value = text;
        sendMessage();
    };

    // Asks the Yes/No follow-up question
    async function askFollowUpQuestion() {
        showTypingIndicator();
        await new Promise(r => setTimeout(r, getVariableDelay())); 
        hideTypingIndicator();

        followUpContext = 'finished-query';
        addMessage("Can I help you with anything else? 🤔", 'bot');
        addQuickReplies(['Yes', 'No']);
    }

    function setupVoiceInput() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn("Web Speech API is not supported in this browser. Voice input disabled.");
            return; 
        }
        
        const micButton = document.createElement('button');
        micButton.innerHTML = '🎤';
        micButton.id = 'mic-btn';
        micButton.style.padding = '10px 12px';
        micButton.style.marginLeft = '8px';
        micButton.style.border = 'none';
        micButton.style.borderRadius = '20px';
        micButton.style.cursor = 'pointer';
        micButton.style.fontSize = '16px';
        micButton.style.transition = 'background 0.2s';
        
        const setMicButtonStyle = () => {
            micButton.style.background = chatbotContainer.classList.contains('dark-mode') ? '#d1b54a' : '#ffe600';
            micButton.style.color = chatbotContainer.classList.contains('dark-mode') ? 'black' : 'initial';
        };
        setMicButtonStyle();

        new MutationObserver(setMicButtonStyle).observe(chatbotContainer, { attributes: true, attributeFilter: ['class'] });

        micButton.addEventListener('click', () => {
            const recognition = new SpeechRecognition();
            
            recognition.lang = 'en-IN';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;
            
            micButton.style.background = 'red';
            micButton.style.color = 'white';
            userInput.placeholder = "Listening...";

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                userInput.value = transcript;
                sendMessage();
            };
            
            recognition.onend = () => {
                setMicButtonStyle();
                userInput.placeholder = "Ask your question...";
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                console.warn("Voice Input Hint: Ensure the page is served over HTTPS or localhost, and that microphone permissions are granted.");
                
                setMicButtonStyle();
                userInput.placeholder = "Ask your question..."; 
                alert('Voice input failed. Please check browser permissions and refresh the page if needed.');
            };

            recognition.start();
        });

        chatFooter.insertBefore(micButton, sendBtn);
    }


    // --- Core Logic Functions (Simplified for RAG Backend) ---
    
    // Minimal small talk handler for immediate UI feedback (like greeting)
    function handleSmallTalk(msg) { 
        if (msg.includes('how are you')) return smallTalk['hi'];
        if (msg.includes('thank') || msg.includes('thanks')) return smallTalk['thanks']; 
        if (msg === 'hi' || msg === 'hello') return smallTalk['hi']; 
        if (msg === 'bye' || msg.includes('goodbye')) return smallTalk['bye'];
        return null;
    }

    // CRITICAL FIX: Context Flow Function (Handles Yes/No follow-up)
    function handleContextFlow(msg, context) {
        let newContext = context;
        let reply = null;
        let quickReplies = null;
        let showFeedback = false; // Flag to show feedback buttons immediately

        if (context === 'finished-query') {
            if (msg.includes('yes')) {
                newContext = null;
                reply = "Sure, what else would you like to know? 🤔";
                quickReplies = ['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel']; 
            } else if (msg.includes('no')) {
                newContext = null;
                reply = "👋 Alright, have a great day! If you need anything, just say 'Hi'.";
                quickReplies = null;
                showFeedback = true; // Show feedback immediately after the 'No' response
            } else {
                // If user enters a new question here, let the RAG take over.
                return null;
            }
            
            followUpContext = newContext;
            return { reply, quickReplies, askFollowUp: false, showFeedback };
        }
        
        return null;
    }


    // --- Main Send Message Loop ---

    async function getBotResponse(message) {
        const raw = message.toLowerCase().trim();
        const backendUrl = "http://localhost:8000/chat";
        
        // 1. Check for context flow (Yes/No after a query)
        const contextRes = handleContextFlow(raw, followUpContext);
        if (contextRes) {
            return contextRes;
        }

        // 2. Check for simple small talk (Hi/Bye)
        const small = handleSmallTalk(raw);
        if (small) {
            followUpContext = null; // Clear context after small talk
            return { reply: small.reply, quickReplies: small.quickReplies, askFollowUp: false, showFeedback: false };
        }
        
        // 3. Send query to the RAG backend
        followUpContext = null; // Clear any pre-existing context
        try {
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ 
                    query: message // Send the original, unnormalized message
                })
            });

            if (!response.ok) {
                // Check if the response is JSON, otherwise use the status text
                const errorText = response.headers.get('content-type')?.includes('application/json') 
                    ? (await response.json()).detail || response.statusText
                    : response.statusText;
                
                throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            
            // RAG response flow
            return {
                reply: data.response,
                quickReplies: null, 
                askFollowUp: true, // This will trigger askFollowUpQuestion()
                showFeedback: false // Feedback is shown *after* follow-up logic
            };

        } catch (error) {
            console.error("RAG Backend Error:", error);
            // Error response flow
            return {
                reply: "🚨 **Error connecting to the RAG backend.** Please ensure your Python server is running on `http://localhost:8000/chat` and try again.",
                quickReplies: ['Admission', 'Fees', 'FAQ'],
                askFollowUp: false,
                showFeedback: true // Show feedback buttons after the error message
            };
        }
    }

    async function sendMessage() {
        // Clear previous quick replies and feedback buttons
        const existingFeedback = document.querySelector('.feedback-buttons');
        if (existingFeedback) existingFeedback.remove();
        const existingQuickReplies = document.querySelector('.quick-replies');
        if (existingQuickReplies) existingQuickReplies.remove();
        
        const msg = userInput.value.trim();
        if (!msg) {
            userInput.classList.add('error-shake');
            setTimeout(() => userInput.classList.remove('error-shake'), 300);
            return;
        }
        
        let displayMsg = msg;
        // Use nlp if available to clean up user input display
        if (typeof nlp !== 'undefined') {
            displayMsg = nlp(msg).toTitleCase().out('text');
        }
        
        addMessage(displayMsg, 'user');
        userInput.value = '';
        userInput.focus();

        showTypingIndicator();
        await new Promise(r => setTimeout(r, getVariableDelay()));
        hideTypingIndicator();

        const response = await getBotResponse(msg);
        
        addMessage(response.reply, 'bot');
        
        // Show quick replies if provided (e.g., after 'Yes' or 'Hi')
        if (response.quickReplies) {
            addQuickReplies(response.quickReplies);
        }
        
        // --- Feedback and Follow-up Logic ---
        
        if (response.askFollowUp) {
            // RAG call was successful, ask the Yes/No follow-up question
            await askFollowUpQuestion();
        } else if (response.showFeedback) {
            // Show feedback immediately if the chat flow ended naturally (e.g., after 'No' or an error)
            addFeedbackButtons();
        }
    }
    
    // --- UPDATED GREETING FUNCTION ---
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

    // --- Event Listeners and Initial Greeting ---
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') sendMessage();
    });

    setupVoiceInput();

    // Start the conversation
    showTypingIndicator();
    setTimeout(() => {
        hideTypingIndicator();
        addMessage(getGreeting(), 'bot');
        addQuickReplies(['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel']); 
    }, getVariableDelay() + 500); 
});
