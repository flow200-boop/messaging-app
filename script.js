// Nexus Messaging Logic
document.addEventListener('DOMContentLoaded', () => {
    const loginModal = document.getElementById('loginModal');
    const usernameInput = document.getElementById('usernameInput');
    const loginBtn = document.getElementById('loginBtn');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userAvatar = document.getElementById('userAvatar');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const messagesContainer = document.getElementById('messagesContainer');

    let currentUser = {
        id: Math.random().toString(36).substr(2, 9),
        name: 'Anonymous',
        avatar: '?'
    };

    // Communication Channel (Simulates real-time backend across tabs)
    const channel = new BroadcastChannel('nexus_chat_global');

    // Load user from storage or show login
    const storedUser = localStorage.getItem('nexus_user');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        updateUserUI();
        loginModal.style.display = 'none';
    }

    loginBtn.addEventListener('click', () => {
        const name = usernameInput.value.trim();
        if (name) {
            currentUser.name = name;
            currentUser.avatar = name.charAt(0).toUpperCase();
            localStorage.setItem('nexus_user', JSON.stringify(currentUser));
            updateUserUI();
            loginModal.style.display = 'none';
            
            // Announce join
            sendSystemMessage(`${currentUser.name} joined the chat`);
        }
    });

    function updateUserUI() {
        userNameDisplay.textContent = currentUser.name;
        userAvatar.textContent = currentUser.avatar;
    }

    // Messaging Logic
    function sendMessage() {
        const text = messageInput.value.trim();
        if (text) {
            const messageObj = {
                id: Date.now(),
                senderId: currentUser.id,
                senderName: currentUser.name,
                content: text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            // Display locally
            displayMessage(messageObj, true);
            
            // Send to other tabs
            channel.postMessage({ type: 'CHAT_MESSAGE', data: messageObj });
            
            messageInput.value = '';
            scrollToBottom();
        }
    }

    function sendSystemMessage(text) {
        const msg = { type: 'SYSTEM', content: text };
        displaySystemMessage(text);
        channel.postMessage(msg);
    }

    function displayMessage(msg, isMine) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(isMine ? 'mine' : 'theirs');

        messageElement.innerHTML = `
            <div class="message-content">
                ${msg.content}
            </div>
            <div class="message-meta">
                <span class="message-author">${isMine ? 'You' : msg.senderName}</span>
                <span class="message-time">${msg.timestamp}</span>
            </div>
        `;

        messagesContainer.appendChild(messageElement);
        scrollToBottom();
    }

    function displaySystemMessage(text) {
        const div = document.createElement('div');
        div.classList.add('system-message');
        div.textContent = text;
        messagesContainer.appendChild(div);
        scrollToBottom();
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Event Listeners
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Listen for messages from other tabs
    channel.onmessage = (event) => {
        const { type, data, content } = event.data;
        
        if (type === 'CHAT_MESSAGE') {
            displayMessage(data, false);
        } else if (type === 'SYSTEM') {
            displaySystemMessage(content);
        }
    };

    // Channel Switching Logic
    const conversationItems = document.querySelectorAll('.conversation-item');
    const currentChatName = document.getElementById('currentChatName');
    const messageInputPlaceholder = document.getElementById('messageInput');

    conversationItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update UI
            conversationItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const name = item.querySelector('.convo-name').textContent;
            currentChatName.textContent = name;
            messageInputPlaceholder.placeholder = `Message ${name}...`;
            
            // Clear messages (or load history in a real app)
            messagesContainer.innerHTML = `<div class="system-message">This is the start of the ${name}. Be kind.</div>`;
            
            // In a real app, you'd switch the BroadcastChannel or filter messages
        });
    });

    // Welcome Message
    setTimeout(() => {
        if (!messagesContainer.querySelector('.message')) {
            displaySystemMessage('Welcome to Nexus! Open this page in another tab to chat with yourself.');
        }
    }, 1000);
});