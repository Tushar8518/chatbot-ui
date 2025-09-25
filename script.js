document.addEventListener('DOMContentLoaded', () => {
    const chatBody = document.getElementById('chat-body');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const modeToggle = document.getElementById('mode-toggle'); 
    const chatbotContainer = document.getElementById('chatbot-container'); 
    let followUpContext = null;

    // --- Dark/Light Mode Logic (Unchanged) ---
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

    // Check saved preference on load
    const savedMode = localStorage.getItem('mode');
    if (savedMode === 'dark') {
        setMode(true);
    } else {
        setMode(false); 
    }
    // --- END Dark/Light Mode Logic ---


    // --- Data Objects (Unchanged) ---
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

    // MODIFIED: Small Talk replies now structured for easy quick reply attachment
const smallTalk = {
        hi: {
            reply: "Hello! How can I help you? 👋",
            quickReplies: ['Admission', 'FAQ', 'Hostel', 'Location']
        },
        hello: {
            reply: "Hi there! What can I do for you?",
            quickReplies: ['Admission', 'FAQ', 'Hostel', 'Location']
        },
        // ADDED: Response for 'how are you'
        'how are you': {
            reply: "I'm a bot, so I'm always running optimally! Thanks for asking. How can I assist you with PAU information? 🤖",
            quickReplies: ['Admission', 'FAQ', 'Hostel', 'Location']
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
    // --- END Small Talk Data ---


    // --- HOSTEL FUNCTIONS (Unchanged) ---
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


    // --- UX / DOM Manipulation Functions (Unchanged) ---
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
        // Apply dark-mode class to quick replies container if bot is in dark mode
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

    // Making this global for button clicks
    window.handleQuickReply = function (text) {
        const existing = document.querySelector('.quick-replies');
        if (existing) existing.remove();
        
        userInput.value = text.toLowerCase();
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


    // --- Core Logic Functions ---

    function normalizeText(str) {
        return str.toLowerCase().replace(/[^a-z0-9\s]/gi, '').trim();
    }

    // MODIFIED: Returns the structured smallTalk object
    function handleSmallTalk(msg) {
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
        // Use current time and date in the bot's known location (Ludhiana)
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' };
        const dateStr = now.toLocaleDateString('en-IN', options);
        const timeOptions = {hour: '2-digit', minute:'2-digit', timeZone: 'Asia/Kolkata'};
        const timeStr = now.toLocaleTimeString('en-IN', timeOptions);

        // Utility Intents (Time, Date, Weather)
        if (msg.includes('date') || msg.includes('today')) {
            followUpContext = null; 
            return { 
                reply: `📅 Today is **${dateStr}**.`, 
                quickReplies: null,
                askFollowUp: true 
            };
        }
        if (msg.includes('time')) {
             followUpContext = null;
             return { 
                reply: `⏰ The current time in Ludhiana is **${timeStr}**.`, 
                quickReplies: null,
                askFollowUp: true 
            };
        }
        if (msg.includes('weather')) {
             // Hardcoded weather details for context: Ludhiana, Punjab, India (As of Sept 25, 2025)
             const weatherData = {
                current: '94°F (34°C)',
                conditions: 'Sunny',
                humidity: '50%',
                wind: '5 mph Northwest'
             }
             
             followUpContext = null;
             return { 
                reply: `☀️ The current weather in Ludhiana, Punjab is **${weatherData.current}** and **${weatherData.conditions}**. (Humidity: ${weatherData.humidity}, Wind: ${weatherData.wind})`, 
                quickReplies: null,
                askFollowUp: true 
            };
        }
        // End Utility Intents

        // 1. Admission Intent
        if (msg.includes('admission') || msg.includes('eligibility') || msg.includes('courses')) {
            followUpContext = 'admission-level';
            return {
                reply: "Do you want to know about **UG** (undergraduate) or **PG** (postgraduate) programs?",
                quickReplies: ['UG', 'PG'],
                askFollowUp: false 
            };
        }

        // 2. Direct Program Search
        const key = findProgramKey(msg);
        if (key) {
            const p = programDetails[key];
            followUpContext = null; 
            return {
                reply: `${p.icon} <strong>${p.title}:</strong><ul><li>${p.details.join('</li><li>')}</li></ul>`,
                quickReplies: null,
                askFollowUp: true 
            };
        }

        // 3. FAQ Intent
        if (msg.includes('faq')) {
            followUpContext = 'faq';
            return {
                reply: "🙋‍♂️ **Frequently Asked Questions (FAQs):**<p>Please select a topic:</p>",
                quickReplies: ['Fees', 'Hostel', 'Scholarship'],
                askFollowUp: false 
            };
        }
        
        // 4. HOSTEL INTENT
        if (msg.includes('hostel')) {
            followUpContext = 'hostel-type-select'; 
            return {
                reply: getHostelFacilities(), 
                quickReplies: ['Dormitory', 'Cubicle', 'Admission'],
                askFollowUp: false 
            };
        }

        // 5. Location Intent
        if (msg.includes('location')) {
            followUpContext = null;
            return {
                reply: "📍 PAU is located in **Ludhiana**, Punjab, India.",
            // MODIFIED: Added quick replies here to guide the user after location
                quickReplies: ['Admission', 'FAQ', 'Hostel'],
                askFollowUp: false 
            };
        }
        
        return null;
    }

    function handleContextFlow(msg, context) {
        let newContext = context;
        let reply = null;
        let quickReplies = null;
        let askFollowUp = false; 

        // --- Handle Universal Jumps (Priority) ---
        // If user interrupts a flow with a new main intent, handle it
        if (context !== null && (msg.includes('admission') || msg.includes('faq') || msg.includes('hostel') || msg.includes('date') || msg.includes('time') || msg.includes('weather'))) {
            followUpContext = null;
            return handleIntent(msg);
        }

        // --- Handle Post-Query Wrap-up (Reset Context) ---
        if (context === 'finished-query') {
            if (msg.includes('yes')) {
                newContext = null;
                reply = "Sure, what else would you like to know? 🤔";
                quickReplies = ['Admission', 'FAQ', 'Hostel', 'Location'];
            } else if (msg.includes('no')) {
                newContext = null;
                reply = "👋 Alright, have a great day! If you need anything, just say 'Hi'.";
                quickReplies = null;
            } else {
                newContext = 'finished-query';
                reply = "I didn't quite catch that. Do you need help with something else (Yes/No)?";
                quickReplies = ['Yes', 'No'];
            }
        }
        
        // A. UG/PG Level Selection
        else if (context === 'admission-level') {
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
                reply = `🤔 Sorry, I couldn't understand. Please choose a topic to begin.`;
                quickReplies = ['Admission', 'FAQ', 'Hostel', 'Location'];
            }
        } 
        
        // B. Program Detail Flow (UG or PG)
        else if (context === 'admission-ug' || context === 'admission-pg') {
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
                reply = `🤔 Sorry, I couldn't understand. Please choose a topic to begin.`;
                quickReplies = ['Admission', 'FAQ', 'Hostel', 'Location'];
            }
        } 
        
        // C. FAQ Flow
        else if (context === 'faq') {
            if (msg.includes('fee')) {
                reply = "💰 **Fees:** UG courses cost around ₹1.24 - ₹1.73 Lakh. PG fees vary by specialization.";
                quickReplies = null;
                askFollowUp = true;
                newContext = null; 
            } else if (msg.includes('scholarship')) {
                reply = "🎓 **Scholarships:** PAU offers various merit-based and need-based scholarships for eligible students.";
                quickReplies = null;
                askFollowUp = true;
                newContext = null; 
            } else {
                newContext = null; 
                reply = `🤔 Sorry, I couldn't understand. Please choose a topic to begin.`;
                quickReplies = ['Admission', 'FAQ', 'Hostel', 'Location'];
            }
        } 
        
        // D. HOSTEL TYPE SELECTION FLOW
        else if (context === 'hostel-type-select') {
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
                reply = `🤔 Sorry, I couldn't understand. Please choose a topic to begin.`;
                quickReplies = ['Admission', 'FAQ', 'Hostel', 'Location'];
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
        
        // MODIFIED: Small talk now returns object
        const small = handleSmallTalk(raw);
        if (small) return { 
            reply: small.reply, 
            quickReplies: small.quickReplies, 
            askFollowUp: false 
        };

        // 1. Handle Contextual Flow (Priority when context is set)
        const contextRes = handleContextFlow(raw, followUpContext);
        if (contextRes && contextRes.reply) {
            return contextRes;
        }

        // 2. Handle General Intents (Only if no context was active or matched)
        const intentRes = handleIntent(raw);
        if (intentRes) {
            return intentRes;
        }

        // 3. Fallback: Reset context and show main options
        followUpContext = null;
        return {
            reply: `🤔 Sorry, I couldn't understand. Please choose a topic to begin.`,
            quickReplies: ['Admission', 'FAQ', 'Hostel', 'Location'],
            askFollowUp: false
        };
    }

    async function sendMessage() {
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

    // Start the conversation
    showTypingIndicator();
    setTimeout(() => {
        hideTypingIndicator();
        addMessage("Hello! I'm the PAU InfoBot. How can I help you today? 👋", 'bot');
        addQuickReplies(['Admission', 'FAQ', 'Hostel', 'Location']);
    }, 1000); 
});
