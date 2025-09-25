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
    let followUpContext = null;

    // --- Data Objects ---
    const programDetails = {
        'b.sc': {
            icon: '🎓',
            title: 'B.Sc. (Hons) Agriculture',
            keywords: ['bachelor of science', 'agriculture', 'bsc', 'agri'],
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
            keywords: ['btech', 'engineering', 'engg'],
            details: [
                '<strong>Eligibility:</strong> 10+2 with PCM, ≥50% marks.', 
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
        quickReplies: ['Hostel', 'Location', 'Fees', 'Contact'], 
        askFollowUp: false
    };

    const smallTalk = {
        hi: {
            reply: "Hello! How can I help you? 👋",
            quickReplies: ['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel', 'Location', 'Contact'] 
        },
        hello: {
            reply: "Hi there! What can I do for you?",
            quickReplies: ['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel', 'Location', 'Contact'] 
        },
        'how are you': {
            reply: "I'm a bot, so I'm always running optimally! Thanks for asking. How can I assist you with PAU information? 🤖",
            quickReplies: ['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel', 'Location', 'Contact'] 
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
        addQuickReplies(['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel', 'Location', 'Contact']); 
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
        await new Promise(r => setTimeout(r, getVariableDelay())); 
        hideTypingIndicator();

        followUpContext = 'finished-query';
        addMessage("Can I help you with anything else? 🤔", 'bot');
        addQuickReplies(['Yes', 'No']);
    }

    function getContactDetails() { 
        return {
            reply: `
            📞 **PAU Contact Information**
            <ul>
                <li><strong>General Enquiry:</strong> <a href="tel:+911612401960">+91-161-2401960</a></li>
                <li><strong>Registrar Office:</strong> <a href="tel:+911612400827">+91-161-2400827</a></li>
                <li><strong>Email (Admissions):</strong> <a href="mailto:registrar@pau.edu">registrar@pau.edu</a></li>
                <li><strong>Official Website:</strong> <a href="http://pau.edu" target="_blank">www.pau.edu</a></li>
            </ul>
            <p>For specific department contacts, please check the official PAU directory on the website.</p>
            `,
            quickReplies: null, 
            askFollowUp: true
        };
    }
    
    function getLocationDetails() { 
        return {
            reply: `
            📍 **PAU Location Details**
            <p><strong>Address:</strong> Punjab Agricultural University, Ferozepur Road, Ludhiana - 141004, Punjab, India.</p>
            <p>The campus is located centrally in Ludhiana, right on the Ferozepur Road.</p>
            <a href="https://maps.app.goo.gl/uX3L5q6f6w9YgG1F6" target="_blank" style="display: inline-block; padding: 8px 12px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 5px;">🗺️ View Map Location</a>
            `,
            quickReplies: null, 
            askFollowUp: true
        };
    }
    
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


    // --- Core Logic Functions ---
    function processText(str) { 
        if (typeof nlp === 'undefined') {
            return {
                raw: str.toLowerCase().replace(/[^a-z0-9\s]/gi, '', ).trim(),
                doc: null
            };
        }
        let doc = nlp(str).toLowerCase().trim();
        let raw = doc.text();
        return { raw, doc };
    }

    function handleSmallTalk(msg) { 
        if (msg.includes('how are you')) return smallTalk['how are you'];
        if (msg.includes('thanks') || msg.includes('thank you') || msg.includes('thankful')) return smallTalk['thanks'];

        for (const key in smallTalk) {
            if (msg.includes(key)) return smallTalk[key];
        }
        return null;
    }

    function findProgramKey(doc, msg) { 
        for (const k in programDetails) {
            if (msg === k || programDetails[k].keywords.some(kw => msg.includes(kw))) {
                return k;
            }
        }
        if (doc) {
            const terms = doc.match('(bachelor|master) of (science|technology|engineering|agriculture)').text();
            if (terms) {
                if (terms.includes('bachelor of science') || terms.includes('bachelor of agriculture')) return 'b.sc';
                if (terms.includes('bachelor of technology')) return 'b.tech';
                if (terms.includes('master of science')) return 'm.sc';
                if (terms.includes('master of technology')) return 'm.tech';
            }
        }
        return null;
    }
    
    function getUgProgramsList() {
        return {
            reply: "🎓 **UG Programs:** Select a program for details:",
            quickReplies: ['B.Sc.', 'B.Tech.', 'PG'],
            askFollowUp: false
        }
    }

    function getPgProgramsList() {
         return {
            reply: "🔬 **PG Programs:** Select a program for details:",
            quickReplies: ['M.Sc.', 'M.Tech.', 'UG'],
            askFollowUp: false
        }
    }

    function handleIntent(msg, doc) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' };
        const dateStr = now.toLocaleDateString('en-IN', options);
        const timeOptions = {hour: '2-digit', minute:'2-digit', timeZone: 'Asia/Kolkata'};
        const timeStr = now.toLocaleTimeString('en-IN', timeOptions);
        
        // --- PRIORITY 1: SPECIFIC PROGRAM (MUST BE FIRST) ---
        const key = findProgramKey(doc, msg);
        if (key) {
            const p = programDetails[key];
            followUpContext = null; 
            return { reply: `${p.icon} <strong>${p.title}:</strong><ul><li>${p.details.join('</li><li>')}</li></ul>`, quickReplies: null, askFollowUp: true };
        }

        // --- PRIORITY 2: DIRECT LEVEL INQUIRY (New Fix) ---
        if (msg.includes('bachelor') || msg.includes('ug') || msg.includes('undergraduate')) {
            followUpContext = 'admission-ug';
            return getUgProgramsList();
        }
        if (msg.includes('master') || msg.includes('pg') || msg.includes('postgraduate')) {
            followUpContext = 'admission-pg';
            return getPgProgramsList();
        }

        // --- PRIORITY 3: GENERAL INTENTS ---
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
        if (/(fees?|cost|charge|tuition)/.test(msg)) {
            followUpContext = null;
            return feesDetails;
        }
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
        if (msg.includes('hostel') || msg === 'hostel' || msg.includes('dormitory') || msg.includes('cubicle')) {
            followUpContext = 'hostel-type-select'; 
            return { reply: getHostelFacilities(), quickReplies: ['Dormitory', 'Cubicle', 'Admission'], askFollowUp: false };
        }
        if (msg.includes('location') || msg === 'location' || msg.includes('address') || msg.includes('directions')) {
            followUpContext = null;
            return getLocationDetails();
        }
        if (msg.includes('contact') || msg.includes('phone') || msg.includes('email') || msg === 'contact') {
            followUpContext = null;
            return getContactDetails(); 
        }
        if (msg.includes('faq') || msg === 'faq') {
            followUpContext = 'faq-select'; 
            return faqDetails;
        }
        
        // --- PRIORITY 4: GENERAL ADMISSION/ELIGIBILITY (Fallback) ---
        if (msg.includes('admission') || msg.includes('eligibility') || msg.includes('courses') || msg === 'admission') {
            followUpContext = 'admission-level';
            return { reply: "Do you want to know about **UG** (undergraduate) or **PG** (postgraduate) programs?", quickReplies: ['UG', 'PG'], askFollowUp: false };
        }
        
        return null;
    }

    // --- CRITICAL FIX: Context Flow Function ---
    function handleContextFlow(msg, context, doc) {
        let newContext = context;
        let reply = null;
        let quickReplies = null;
        let askFollowUp = false; 

        // --- STEP 1: If Context is 'finished-query', check for Yes/No or New Intent ---
        if (context === 'finished-query') {
            const smallTalkResponse = handleSmallTalk(msg);
            
            // 1A. Check for a completely new, valid MAJOR Intent or Small Talk
            const isNewIntent = /(admission|faq|hostel|ranking|fees?|contact|location|date|time|weather|bachelor|master|ug|pg)/.test(msg) || findProgramKey(doc, msg);
            
            if (isNewIntent || smallTalkResponse) {
                followUpContext = null; // Clear context
                
                const newResponse = handleIntent(msg, doc) || smallTalkResponse;
                if (newResponse) return newResponse;
            }

            // 1B. If not a new intent, check if it's a Yes/No response to the follow-up question
            if (msg.includes('yes')) {
                newContext = null;
                reply = "Sure, what else would you like to know? 🤔";
                quickReplies = ['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel', 'Location', 'Contact']; 
            } else if (msg.includes('no')) {
                newContext = null;
                reply = "👋 Alright, have a great day! If you need anything, just say 'Hi'.";
                quickReplies = null;
            } else {
                // User input was not "Yes", "No", or a new Intent (handled in 1A)
                newContext = 'finished-query';
                reply = "I'm still waiting for a Yes/No to see if you have another question. Do you need help with something else (Yes/No)?";
                quickReplies = ['Yes', 'No'];
            }

        // --- STEP 2: Handle active level-specific contexts (admission-ug / admission-pg) ---
        } else if (context === 'admission-ug') { 
            // Handle UG program selection or attempt to switch to PG
            const key = findProgramKey(doc, msg);
            if (key) {
                const p = programDetails[key];
                reply = `${p.icon} <strong>${p.title}:</strong><ul><li>${p.details.join('</li><li>')}</li></ul>`;
                quickReplies = null; 
                askFollowUp = true;
                newContext = null; 
            } else if (msg.includes('pg') || msg.includes('master')) {
                 newContext = 'admission-pg';
                 return getPgProgramsList();
            } else {
                // Repeat UG list if input is unclear
                reply = "Please select a UG program (B.Sc., B.Tech.) or type 'PG' to see postgraduate courses.";
                quickReplies = ['B.Sc.', 'B.Tech.', 'PG']; 
                newContext = 'admission-ug';
            }
        } else if (context === 'admission-pg') { 
            // Handle PG program selection or attempt to switch to UG
             const key = findProgramKey(doc, msg);
            if (key) {
                const p = programDetails[key];
                reply = `${p.icon} <strong>${p.title}:</strong><ul><li>${p.details.join('</li><li>')}</li></ul>`;
                quickReplies = null; 
                askFollowUp = true;
                newContext = null; 
            } else if (msg.includes('ug') || msg.includes('bachelor')) {
                 newContext = 'admission-ug';
                 return getUgProgramsList();
            } else {
                // Repeat PG list if input is unclear
                reply = "Please select a PG program (M.Sc., M.Tech.) or type 'UG' to see undergraduate courses.";
                quickReplies = ['M.Sc.', 'M.Tech.', 'UG'];
                newContext = 'admission-pg';
            }

        // --- STEP 3: Handle generic admission-level (only hit from the fallback in handleIntent) ---
        } else if (context === 'admission-level') {
            if (msg.includes('ug') || msg.includes('bachelor')) { 
                newContext = 'admission-ug';
                return getUgProgramsList();
            } else if (msg.includes('pg') || msg.includes('master')) {
                newContext = 'admission-pg';
                return getPgProgramsList();
            } else {
                newContext = null;
                reply = `🤔 Sorry, I couldn't understand. Please choose a topic to begin.`;
                quickReplies = ['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel', 'Location', 'Contact']; 
            }
        } else if (context === 'faq-select') {
            if (msg.includes('hostel')) {
                newContext = 'hostel-type-select';
                return handleIntent(msg, doc); 
            }
            if (msg.includes('location')) {
                newContext = null;
                return handleIntent(msg, doc); 
            }
            if (msg.includes('fees') || msg.includes('fee')) {
                newContext = null;
                return handleIntent(msg, doc); 
            }
            if (msg.includes('contact')) {
                newContext = null;
                return handleIntent(msg, doc); 
            }
            else {
                newContext = null; 
                reply = `🤔 Sorry, I couldn't find a direct answer in the FAQ. Please try a main category.`;
                quickReplies = ['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel', 'Location', 'Contact']; 
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
                reply = `🤔 Sorry, I couldn't understand. Please choose a topic to begin.`;
                quickReplies = ['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel', 'Location', 'Contact']; 
            }
        }
        
        // --- STEP 4: Return Result ---
        if (reply) {
            followUpContext = newContext;
            return { reply, quickReplies, askFollowUp };
        }
        
        return null;
    }


    // --- Main Send Message Loop ---

    async function getBotResponse(message) {
        const processed = processText(message);
        const raw = processed.raw;
        const doc = processed.doc;
        
        // 1. Try to handle the message based on the current context first
        const contextRes = handleContextFlow(raw, followUpContext, doc);
        if (contextRes && contextRes.reply) {
            return contextRes;
        }

        // 2. If no context was active or no context match was found, try small talk
        const small = handleSmallTalk(raw);
        if (small) return { reply: small.reply, quickReplies: small.quickReplies, askFollowUp: false };

        // 3. Finally, try to handle it as a brand new intent
        const intentRes = handleIntent(raw, doc);
        if (intentRes) {
            return intentRes;
        }

        followUpContext = null;
        return {
            reply: `🤔 Sorry, I couldn't understand your request. Please try asking about a main topic.`,
            quickReplies: ['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel', 'Location', 'Contact'],
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
        
        let displayMsg = msg;
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
    
    // --- UPDATED GREETING FUNCTION (Removed Time) ---
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
        addQuickReplies(['Admission', 'Fees', 'FAQ', 'Ranking', 'Hostel', 'Location', 'Contact']); 
    }, getVariableDelay() + 500); 
});
