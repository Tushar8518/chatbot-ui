document.addEventListener('DOMContentLoaded', () => {
    const chatBody = document.getElementById('chat-body');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    let followUpContext = null;

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

    const smallTalk = {
        hi: "Hello! How can I help you? 👋",
        hello: "Hi there! What can I do for you?",
        bye: "Goodbye! Have a nice day! 😊",
        thanks: "You're welcome! 😊"
    };

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
            <li>**Security:** 24/7 security with separate blocks and timings for girls.</li>
        </ul>
        <small>*The university is actively renovating and upgrading facilities.*</small>
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
            div.innerHTML = '<span>.</span><span>.</span><span>.</span>';
            chatBody.appendChild(div);
            chatBody.scrollTop = chatBody.scrollHeight;
        }
    }

    function hideTypingIndicator() {
        const ind = document.getElementById('typing-indicator');
        if (ind) ind.remove();
    }

    function addQuickReplies(replies) {
        const existing = document.querySelector('.quick-replies');
        if (existing) existing.remove();

        const container = document.createElement('div');
        container.classList.add('quick-replies');
        replies.forEach(r => {
            const btn = document.createElement('button');
            btn.innerText = r;
            btn.onclick = () => {
                handleQuickReply(r);
            };
            container.appendChild(btn);
        });
        chatBody.appendChild(container);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // --- NEW: Function to ask the follow-up question ---
    async function askFollowUpQuestion() {
        showTypingIndicator();
        await new Promise(r => setTimeout(r, 600)); 
        hideTypingIndicator();

        followUpContext = 'finished-query';
        addMessage("Can I help you with anything else? 🤔", 'bot');
        addQuickReplies(['Yes', 'No']);
    }
    // --- END NEW FUNCTION ---

    window.handleQuickReply = function (text) {
        const existing = document.querySelector('.quick-replies');
        if (existing) existing.remove();
        userInput.value = text.toLowerCase();
        sendMessage();
    };

    // --- Core Logic Functions ---

    function normalizeText(str) {
        return str.toLowerCase().replace(/[^a-z0-9\s]/gi, '').trim();
    }

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
        
        // 4. HOSTEL INTENT (Start of the structured flow)
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
            return {
                reply: "📍 PAU is located in **Ludhiana**, Punjab, India.",
                quickReplies: null,
                askFollowUp: true 
            };
        }
        
        // 6. Utility (Time, Date, Weather) - Modified to use askFollowUp
        const now = new Date();
        const timeStr = now.toLocaleTimeString();
        const dateStr = now.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        if (msg.includes('time')) {
             return { 
                reply: `⏰ The current time is **${timeStr}**.`, 
                quickReplies: null,
                askFollowUp: true 
            };
        }
        
        if (msg.includes('date') || msg.includes('today')) {
            return { 
                reply: `📅 Today is **${dateStr}**.`, 
                quickReplies: null,
                askFollowUp: true 
            };
        }
        
        if (msg.includes('weather')) {
             const weatherReply = `☀️ I cannot fetch live weather, but PAU is located in Ludhiana, Punjab. The weather here is typically hot and humid in summer, and cold in winter.`;
             return { reply: weatherReply, quickReplies: null, askFollowUp: true };
        }


        return null;
    }

    function handleContextFlow(msg, context) {
        let newContext = context;
        let reply = null;
        let quickReplies = null;
        let askFollowUp = false; // New flag

        // --- Handle Post-Query Wrap-up ---
        if (context === 'finished-query') {
            if (msg.includes('yes')) {
                newContext = null;
                reply = "Sure, what else would you like to know? 🤔";
                quickReplies = ['Admission', 'FAQ', 'Hostel', 'Location'];
            } else if (msg.includes('no')) {
                newContext = null;
                reply = "👋 Alright, have a great day!";
                quickReplies = null;
            } else {
                newContext = 'finished-query';
                reply = "I didn't quite catch that. Do you need help with something else (Yes/No)?";
                quickReplies = ['Yes', 'No'];
            }
            if (reply) {
                followUpContext = newContext;
                return { reply, quickReplies, askFollowUp: false };
            }
        }
        // --- END Wrap-up ---


        // --- Universal Flow Jumps (Fix for getting stuck) ---
        if (context !== null) {
             if (msg.includes('admission')) {
                 newContext = 'admission-level';
                 return handleContextFlow(msg, 'admission-level'); 
             }
             if (msg.includes('faq')) {
                 newContext = 'faq';
                 return handleContextFlow(msg, 'faq'); 
             }
             if (msg.includes('hostel')) {
                 newContext = 'hostel-type-select';
                 return handleContextFlow(msg, 'hostel-type-select'); 
             }
        }
        // --- END Universal Flow Jumps ---
        

        // A. UG/PG Level Selection
        if (context === 'admission-level') {
            if (msg.includes('ug')) {
                newContext = 'admission-ug';
                reply = "🎓 **UG Programs:** Select a program for details:";
                quickReplies = ['B.Sc.', 'B.Tech.', 'PG'];
            } else if (msg.includes('pg')) {
                newContext = 'admission-pg';
                reply = "🔬 **PG Programs:** Select a program for details:";
                quickReplies = ['M.Sc.', 'M.Tech.', 'UG'];
            } else {
                reply = "I need you to choose **UG** or **PG** to continue.";
                quickReplies = ['UG', 'PG'];
            }
        } 
        
        // B. Program Detail Flow (UG or PG)
        else if (context === 'admission-ug' || context === 'admission-pg') {
            const key = findProgramKey(msg);
            
            if (key) {
                const p = programDetails[key];
                reply = `${p.icon} <strong>${p.title}:</strong><ul><li>${p.details.join('</li><li>')}</li></ul>`;
                quickReplies = null; 
                askFollowUp = true; // Ask follow-up after the reply
            } else if (msg === 'ug' || msg.includes('pg')) { 
                 newContext = 'admission-level';
                 return handleContextFlow(msg, 'admission-level'); 
            } else {
                reply = "I didn't recognize that program. Please select one of the options or type 'UG'/'PG'.";
                quickReplies = (context === 'admission-ug') ? ['B.Sc.', 'B.Tech.', 'PG'] : ['M.Sc.', 'M.Tech.', 'UG'];
            }
        } 
        
        // C. FAQ Flow
        else if (context === 'faq') {
            if (msg.includes('fee')) {
                reply = "💰 Fees: UG courses cost around ₹1.24 - ₹1.73 Lakh.";
                quickReplies = null;
                askFollowUp = true;
            } else if (msg.includes('hostel')) {
                // Handled by the universal jump check above
                newContext = 'hostel-type-select';
                return handleContextFlow(msg, 'hostel-type-select');
            } else if (msg.includes('scholarship')) {
                reply = "🎓 Scholarships are available for eligible students.";
                quickReplies = null;
                askFollowUp = true;
            } else {
                newContext = 'faq';
                reply = "Choose from Fees, Hostel, Scholarship.";
            }
        } 
        
        // D. HOSTEL TYPE SELECTION FLOW
        else if (context === 'hostel-type-select') {
            
            if (msg.includes('dormitory')) {
                reply = getDormitoryDetails();
                quickReplies = null;
                askFollowUp = true;
            } else if (msg.includes('cubicle')) {
                reply = getCubicleDetails();
                quickReplies = null;
                askFollowUp = true;
            } else {
                newContext = 'hostel-type-select';
                reply = "Please choose **Dormitory** or **Cubicle** accommodation details.";
                quickReplies = ['Dormitory', 'Cubicle', 'Admission'];
            }
        }

        // If a final reply was generated, return the result and the new flag
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
        if (small) return { reply: small, quickReplies: null, askFollowUp: false };

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

        // 3. Fallback
        return {
            reply: "🤖 I didn't understand that. Try typing 'Admission' or select an option below.",
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

        // Get the response object which now includes the askFollowUp flag
        const response = await getBotResponse(msg);
        
        // 1. Add the main reply
        addMessage(response.reply, 'bot');
        
        // 2. Add quick replies (if any, e.g., UG/PG buttons)
        if (response.quickReplies) {
            addQuickReplies(response.quickReplies);
        }

        // 3. If askFollowUp flag is true, trigger the new question bubble
        if (response.askFollowUp) {
            await askFollowUpQuestion();
        }
    }

    // --- Event Listeners and Initial Greeting FIX ---
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') sendMessage();
    });

    // Remove the placeholder message from HTML and display the clean greeting
    const initialMessage = chatBody.querySelector('.message.bot');
    if (initialMessage) initialMessage.remove(); 
    
    addMessage("Hello! How can I help you today? 👋", 'bot');
    addQuickReplies(['Admission', 'FAQ', 'Hostel', 'Location']);
});
