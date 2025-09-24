const chatBody = document.getElementById('chat-body');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    userInput.value = '';

    // Simulate bot response
    setTimeout(() => {
        addMessage(getBotResponse(message), 'bot');
    }, 500);
}

function addMessage(message, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    msgDiv.textContent = message;
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function getBotResponse(message) {
    // Simple responses (you can integrate AI later)
    const responses = {
        hi: "Hello! How can I help you?",
        hello: "Hi there! What can I do for you?",
        bye: "Goodbye! Have a nice day!"
    };
    return responses[message.toLowerCase()] || "I am still learning. Try saying hi!";
}
