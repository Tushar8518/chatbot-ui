document.addEventListener('DOMContentLoaded', () => {
    const chatBody = document.getElementById('chat-body');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const modeToggle = document.getElementById('mode-toggle'); 
    const chatbotContainer = document.getElementById('chatbot-container'); 
    const chatFooter = document.querySelector('.chat-footer'); 
    let followUpContext = null;

    // --- Dark/Light Mode Logic ---
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
    // --- END Dark/Light Mode Logic ---

    // --- Data Objects ---
    const programDetails = {
        'b.sc': {
            icon: '🎓',
            title: 'B.Sc. (Hons) Agriculture',
            keywords: ['bachelor of science', 'agriculture', 'bsc'],
            details: [
                '<strong>Eligibility:</strong> 10+2 with Physics, Chemistry, and Math/Bio/Agriculture with at least 50% marks.',
                '<strong>Accepted Exams:</strong> PAU CET.',
                '<strong>Approx. Fees:</strong> ₹1.24 Lakh.',
                '<strong>Curriculum:</strong> ICAR aligned.'
            ]
        },
        'b.tech': {
            icon: '⚙️',
            title: 'B.Tech. Agricultural Engineering',
            keywords: ['btech', 'engineering'],
            details: [
                '<strong>Eligibility:</strong> 10+2 with PCM, ≥50%.',
                '<strong>Accepted Exams:</strong> JEE Main, PAU CET.',
                '<strong>Approx. Fees:</strong> ₹1.73 Lakh.'
            ]
        },
        'm.sc': {
            icon: '🔬',
            title: 'M.Sc. (Master of Science)',
            keywords: ['master of science', 'msc'],
            details: [
                '<strong>Eligibility:</strong> Bachelor\'s degree in a relevant field with an OCPA of 6.0/10.0 or 60% marks.',
                '<strong>Accepted Exams:</strong> PAU Master\'s Entrance Test (MET).',
                '<strong>Approx. Fees:</strong> ₹76,880 - ₹1.9 Lakh per year.'
            ]
        },
        'm.tech': {
            icon: '🔬',
            title: 'M.Tech. (Master of Technology)',
            keywords: ['master of technology', 'mtech'],
            details: [
                '<strong>Eligibility:</strong> B.Tech. degree in a relevant field with a minimum CGPA of 6.0/10.0 or 60% marks.',
                '<strong>Accepted Exams:</strong> PAU Master\'s Entrance Test (MET), ICAR AIEEA.',
                '<strong>Approx. Fees:</strong> ₹76,880 (per year).'
            ]
        }
    };
    
    const rankingInfo = {
        title: '🏆 PAU Ranking Highlights (NIRF 2024)',
        details: [
            '**NIRF Agriculture & Allied Sector:** Ranked **#4** in India.',
            '**NIRF Overall University Rank:** Top 100 in India.',
            '**QS World Ranking:** Globally recognized for Agricultural Research Impact.'
        ]
    };

    const feesDetails = {
        reply: "💰 **Approximate Fees:** UG courses cost around **₹1.24 - ₹1.73 Lakh** (total). PG fees vary by specialization. (Please check the official prospectus for exact charges)",
        quickReplies: null,
        askFollowUp: true
    };

    const faqDetails = {
        reply: "🙋‍♂️ **Frequently Asked Questions (FAQs):**<p>Please select a topic or type your question (e.g., 'hostel rules'):</p>",
        quickReplies: ['Hostel', 'Location'],
        askFollowUp: false
    };

    const smallTalk = {
        hi: {
            reply: "Hello! How can I help you? 👋",
            // Both FAQ and Fees added
            quickReplies: ['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel', 'Location'] 
        },
        hello: {
            reply: "Hi there! What can I do for you?",
            // Both FAQ and Fees added
            quickReplies: ['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel', 'Location'] 
        },
        'how are you': {
            reply: "I'm a bot, so I'm always running optimally! Thanks for asking. How can I assist you with PAU information? 🤖",
            // Both FAQ and Fees added
            quickReplies: ['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel', 'Location'] 
        },
        bye: {
            reply: "Goodbye! Have a nice day! 😊",
            quickReplies: null
        },
        thanks: {
            reply: "You're welcome! 😊",
            quickReplies: null
        }
    };
    // --- END Data Objects ---

    // --- LOCATION FUNCTION ---
    function getLocationDetails() {
        // Detailed address and map link added
        return {
            reply: `
            📍 **PAU Location Details**
            <p><strong>Address:</strong> Punjab Agricultural University, Ferozepur Road, Ludhiana - 141004, Punjab, India.</p>
            <p>The campus is located centrally in Ludhiana, right on the Ferozepur Road.</p>
            <a href="https://maps.app.goo.gl/tH5qH6rM9d6jH6SCA" target="_blank" style="display: inline-block; padding: 8px 12px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 5px;">🗺️ View Map Location</a>
            `,
            quickReplies: null, 
            askFollowUp: true
        };
    }
    // --- END LOCATION FUNCTION ---


    // --- HOSTEL FUNCTIONS ---
    function getHostelFacilities() {
        return `
        🏠 **PAU Hostel Facilities & Amenities**
        <p>The university has 14 separate, guarded hostels (UG/PG, Male/Female).</p>
        
        <strong>Key Facilities:</strong>
        <ul>
            <li>**Room Furnishings:** Bed, table, chair, and personal locker.</li>
            <li>**Internet:** Wi-Fi connectivity (often concentrated in common areas).</li>
            <li>**Mess:** Functional mess (charges separate) with varied menu options.</li>
            <li>**Health:** Access to the on-campus 20-bedded university hospital.</li>
        </ul>
        <p>Which type of accommodation would you like details for?</p>
        `;
    }

    function getDormitoryDetails() {
        return `
        🛏️ **Dormitory Hostel Details**
        <ul>
            <li>**Occupancy:** Double, Triple, or **Quadruple (4-seater)** sharing.</li>
            <li>**Eligibility:** Primarily allotted to **first-year students**.</li>
            <li>**Approx. Annual Fees:** **₹17,270** (Excluding Mess & other funds).</li>
        </ul>
        `;
    }

    function getCubicleDetails() {
        return `
        🚪 **Cubicle Hostel Details**
        <ul>
            <li>**Occupancy:** **Single-seater** (private) rooms.</li>
            <li>**Eligibility:** Generally reserved for **higher-year students** or those with a high OCPA (academic performance).</li>
            <li>**Approx. Annual Fees:** **₹26,650** (Excluding Mess & other funds).</li>
        </ul>
        `;
    }
    // --- END HOSTEL FUNCTIONS ---


    // --- UX / DOM Manipulation Functions ---
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
    
    async function showFeedbackReceived(type) {
        const existingFeedback = document.querySelector('.feedback-buttons');
        if (existingFeedback) existingFeedback.remove();

        const message = type === 'helpful' 
            ? '<span style="font-size: 0.75em; font-style: italic; color: #6a6a6a;">✅ Thanks for your feedback!</span>' 
            : '<span style="font-size: 0.75em; font-style: italic; color: #6a6a6a;">🙏 Feedback received. We\'ll use this to improve.</span>';

        addMessage(message, 'bot');
        
        showTypingIndicator();
        await new Promise(r => setTimeout(r, 600));
        hideTypingIndicator();
        
        followUpContext = null; 
        addMessage("Can I help you with anything else? 🤔", 'bot');
        // Both FAQ and Fees added
        addQuickReplies(['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel', 'Location']); 
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
        
        let normalizedText = text.toLowerCase();
        
        userInput.value = normalizedText;
        sendMessage();
    };

    async function askFollowUpQuestion() {
        showTypingIndicator();
        await new Promise(r => setTimeout(r, 600)); 
        hideTypingIndicator();

        followUpContext = 'finished-query';
        addMessage("Can I help you with anything else? 🤔", 'bot');
        addQuickReplies(['Yes', 'No']);
    }
    // --- END UX / DOM Manipulation Functions ---

    // --- Voice Input Implementation ---
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
                userInput.placeholder = "";
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                console.warn("Voice Input Hint: Ensure the page is served over HTTPS or localhost, and that microphone permissions are granted.");
                
                setMicButtonStyle();
                userInput.placeholder = ""; 
                alert('Voice input failed. Please check browser permissions and refresh the page if needed.');
            };

            recognition.start();
        });

        chatFooter.insertBefore(micButton, sendBtn);
    }
    // --- END Voice Input Implementation ---


    // --- Core Logic Functions (Intent & Context Handling) ---

    function normalizeText(str) {
        return str.toLowerCase().replace(/[^a-z0-9\s]/gi, '').trim();
    }

    function handleSmallTalk(msg) {
        if (msg.includes('how are you')) return smallTalk['how are you'];

        for (const key in smallTalk) {
            if (msg.includes(key)) return smallTalk[key];
        }
        return null;
    }

    function findProgramKey(msg) {
        for (const k in programDetails) {
            if (msg === k) return k;
        }
        for (const k in programDetails) {
            if (programDetails[k].keywords.some(kw => msg.includes(kw))) {
                return k;
            }
        }
        return null;
    }

    function handleIntent(msg) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' };
        const dateStr = now.toLocaleDateString('en-IN', options);
        const timeOptions = {hour: '2-digit', minute:'2-digit', timeZone: 'Asia/Kolkata'};
        const timeStr = now.toLocaleTimeString('en-IN', timeOptions);

        if (msg.includes('date') || msg.includes('today')) {
            followUpContext = null; 
            return { reply: `📅 Today is **${dateStr}**.`, quickReplies: null, askFollowUp: true };
        }
        if (msg.includes('time')) {
             followUpContext = null;
             return { reply: `⏰ The current time in Ludhiana is **${timeStr}**.`, quickReplies: null, askFollowUp: true };
        }
        if (msg.includes('weather')) {
             const weatherData = { current: '94°F (34°C)', conditions: 'Sunny', humidity: '50%', wind: '5 mph Northwest' }
             followUpContext = null;
             return { reply: `☀️ The current weather in Ludhiana, Punjab is **${weatherData.current}** and **${weatherData.conditions}**. (Humidity: ${weatherData.humidity}, Wind: ${weatherData.wind})`, quickReplies: null, askFollowUp: true };
        }
        
        // INTENT: Ranking 
        if (msg.includes('ranking') || msg.includes('rank') || msg.includes('rating') || msg === 'ranking') {
             followUpContext = null;
             const rankingList = rankingInfo.details.length > 0 
                ? `<ul><li>${rankingInfo.details.join('</li><li>')}</li></ul>` 
                : '<p>Details currently unavailable.</p>';

             return { 
                reply: `${rankingInfo.title}${rankingList}`, 
                quickReplies: null, 
                askFollowUp: true 
            };
        }
        
        // INTENT: Fees (Separated from FAQ)
        if (msg.includes('fees') || msg.includes('fee') || msg === 'fees') {
            followUpContext = null;
            return feesDetails; // Direct reply, then ask follow-up
        }

        // INTENT: Admission
        if (msg.includes('admission') || msg.includes('eligibility') || msg.includes('courses') || msg === 'admission') {
            followUpContext = 'admission-level';
            return { reply: "Do you want to know about **UG** (undergraduate) or **PG** (postgraduate) programs?", quickReplies: ['UG', 'PG'], askFollowUp: false };
        }

        const key = findProgramKey(msg);
        if (key) {
            const p = programDetails[key];
            followUpContext = null; 
            return { reply: `${p.icon} <strong>${p.title}:</strong><ul><li>${p.details.join('</li><li>')}</li></ul>`, quickReplies: null, askFollowUp: true };
        }

        // INTENT: FAQ 
        if (msg.includes('faq') || msg === 'faq') {
            followUpContext = 'faq-select'; // New context for FAQ specific flow
            return faqDetails; // Sends generic FAQ prompt
        }
        
        // INTENT: Hostel
        if (msg.includes('hostel') || msg === 'hostel') {
            followUpContext = 'hostel-type-select'; 
            return { reply: getHostelFacilities(), quickReplies: ['Dormitory', 'Cubicle', 'Admission'], askFollowUp: false };
        }

        // INTENT: Location
        if (msg.includes('location') || msg === 'location') {
            followUpContext = null;
            return getLocationDetails(); // Calls new detailed location function
        }
        
        return null;
    }

    function handleContextFlow(msg, context) {
        let newContext = context;
        let reply = null;
        let quickReplies = null;
        let askFollowUp = false; 

        // If user enters a new main intent, reset context and jump to handleIntent
        if (context !== null && (msg.includes('admission') || msg.includes('faq') || msg.includes('hostel') || msg.includes('ranking') || msg.includes('fees') || msg.includes('fee') || msg.includes('date') || msg.includes('time') || msg.includes('weather') || msg === 'ranking' || msg === 'admission' || msg === 'hostel' || msg === 'location' || msg === 'fees' || msg === 'faq')) {
            followUpContext = null;
            return handleIntent(msg);
        }

        if (context === 'finished-query') {
            if (msg.includes('yes')) {
                newContext = null;
                reply = "Sure, what else would you like to know? 🤔";
                // Both FAQ and Fees added
                quickReplies = ['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel', 'Location']; 
            } else if (msg.includes('no')) {
                newContext = null;
                reply = "👋 Alright, have a great day! If you need anything, just say 'Hi'.";
                quickReplies = null;
            } else {
                newContext = 'finished-query';
                reply = "I didn't quite catch that. Do you need help with something else (Yes/No)?";
                quickReplies = ['Yes', 'No'];
            }
        } else if (context === 'admission-level') {
            if (msg.includes('ug')) {
                newContext = 'admission-ug';
                reply = "🎓 **UG Programs:** Select a program for details:";
                quickReplies = ['B.Sc.', 'B.Tech.', 'PG'];
            } else if (msg.includes('pg')) {
                newContext = 'admission-pg';
                reply = "🔬 **PG Programs:** Select a program for details:";
                quickReplies = ['M.Sc.', 'M.Tech.', 'UG'];
            } else {
                newContext = null;
                // Both FAQ and Fees added
                reply = `🤔 Sorry, I couldn't understand. Please choose a topic to begin.`;
                quickReplies = ['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel', 'Location']; 
            }
        } else if (context === 'admission-ug' || context === 'admission-pg') {
            const key = findProgramKey(msg);
            
            if (key) {
                const p = programDetails[key];
                reply = `${p.icon} <strong>${p.title}:</strong><ul><li>${p.details.join('</li><li>')}</li></ul>`;
                quickReplies = null; 
                askFollowUp = true;
                newContext = null; 
            } else if (msg.includes('ug') || msg.includes('pg')) { 
                 newContext = 'admission-level';
                 return handleContextFlow(msg, 'admission-level'); 
            } else {
                newContext = null; 
                // Both FAQ and Fees added
                reply = `🤔 Sorry, I couldn't understand. Please choose a topic to begin.`;
                quickReplies = ['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel', 'Location']; 
            }
        } else if (context === 'faq-select') {
            // FAQ-specific context can handle sub-questions
            if (msg.includes('hostel')) {
                newContext = 'hostel-type-select';
                return handleIntent(msg); // Jump to hostel intent
            }
            if (msg.includes('location')) {
                newContext = null;
                return handleIntent(msg); // Jump to location intent
            }
            if (msg.includes('fees') || msg.includes('fee')) {
                newContext = null;
                return handleIntent(msg); // Jump to fees intent
            }
            else {
                // If sub-question is not recognized, return to the main flow.
                newContext = null; 
                reply = `🤔 Sorry, I couldn't find a direct answer in the FAQ. Please try a main category.`;
                quickReplies = ['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel', 'Location']; 
            }
        } else if (context === 'hostel-type-select') {
            if (msg.includes('dormitory')) {
                reply = getDormitoryDetails();
                quickReplies = null;
                askFollowUp = true;
                newContext = null; 
            } else if (msg.includes('cubicle')) {
                reply = getCubicleDetails();
                quickReplies = null;
                askFollowUp = true;
                newContext = null; 
            } else {
                newContext = null; 
                // Both FAQ and Fees added
                reply = `🤔 Sorry, I couldn't understand. Please choose a topic to begin.`;
                quickReplies = ['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel', 'Location']; 
            }
        }
        
        if (reply) {
            followUpContext = newContext;
            return { reply, quickReplies, askFollowUp };
        }
        
        return null;
    }

    // --- Main Send Message Loop ---

    async function getBotResponse(message) {
        const raw = normalizeText(message);
        
        const small = handleSmallTalk(raw);
        if (small) return { reply: small.reply, quickReplies: small.quickReplies, askFollowUp: false };

        const contextRes = handleContextFlow(raw, followUpContext);
        if (contextRes && contextRes.reply) {
            return contextRes;
        }

        const intentRes = handleIntent(raw);
        if (intentRes) {
            return intentRes;
        }

        followUpContext = null;
        // Both FAQ and Fees added
        return {
            reply: `🤔 Sorry, I couldn't understand your request. Please try asking about a main topic.`,
            quickReplies: ['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel', 'Location'],
            askFollowUp: false
        };
    }

    async function sendMessage() {
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
        
        addMessage(msg, 'user');
        userInput.value = '';
        userInput.focus();

        showTypingIndicator();
        await new Promise(r => setTimeout(r, 600));
        hideTypingIndicator();

        const response = await getBotResponse(msg);
        
        addMessage(response.reply, 'bot');
        
        if (!response.askFollowUp) {
             addFeedbackButtons();
        }

        if (response.quickReplies) {
            addQuickReplies(response.quickReplies);
        }
        
        if (response.askFollowUp) {
            await askFollowUpQuestion();
        }
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
        // Both FAQ and Fees added
        addMessage("Hello! I'm the PAU InfoBot. How can I help you today? 👋", 'bot');
        addQuickReplies(['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel', 'Location']); 
    }, 1000); 
});
