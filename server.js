const express = require('express');
const app = express();

// Increased limit to 10mb to handle massive 10,000+ line code pastes easily
app.use(express.json({ limit: '10mb' }));

// In-memory storage (clears when the server restarts)
const rooms = {};

// --- API ROUTES ---

// Create a room with a 4-digit PIN
app.post('/api/create', (req, res) => {
    let pin;
    do {
        pin = Math.floor(1000 + Math.random() * 9000).toString();
    } while (rooms[pin]); // Ensure no duplicate pins
    
    rooms[pin] = []; 
    res.json({ pin });
});

// Verify if a room exists
app.post('/api/join', (req, res) => {
    const { pin } = req.body;
    if (rooms[pin]) {
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: 'Room not found' });
    }
});

// Paste code into a room
app.post('/api/paste', (req, res) => {
    const { pin, code } = req.body;
    if (!rooms[pin]) return res.status(404).json({ success: false });
    
    const entry = { 
        code, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' - ' + new Date().toLocaleDateString()
    };
    rooms[pin].unshift(entry); // Add newest to the top
    res.json({ success: true });
});

// Get room history
app.get('/api/history/:pin', (req, res) => {
    const { pin } = req.params;
    if (!rooms[pin]) return res.status(404).json([]);
    res.json(rooms[pin]);
});


// --- FRONTEND (HTML/CSS/JS) ---
const HTML_UI = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Void | Ephemeral Code</title>
    <style>
        :root {
            --bg: #0a0a0a;
            --surface: #171717;
            --border: #262626;
            --text: #f5f5f5;
            --text-dim: #a3a3a3;
            --accent: #ffffff;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        body {
            background-color: var(--bg);
            color: var(--text);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        .container {
            width: 100%;
            max-width: 800px;
            padding: 2rem;
        }

        h1 {
            font-weight: 300;
            letter-spacing: 2px;
            margin-bottom: 2rem;
            text-align: center;
        }

        .view {
            display: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .view.active {
            display: block;
            opacity: 1;
        }

        .card {
            background: var(--surface);
            padding: 3rem;
            border-radius: 12px;
            border: 1px solid var(--border);
            text-align: center;
        }

        input {
            background: var(--bg);
            border: 1px solid var(--border);
            color: var(--text);
            padding: 1rem;
            border-radius: 6px;
            width: 100%;
            max-width: 250px;
            text-align: center;
            font-size: 1.2rem;
            letter-spacing: 4px;
            margin-bottom: 1rem;
            outline: none;
            transition: border-color 0.2s;
        }

        input:focus {
            border-color: var(--text-dim);
        }

        button {
            background: var(--accent);
            color: var(--bg);
            border: none;
            padding: 1rem 2rem;
            border-radius: 6px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: opacity 0.2s;
            width: 100%;
            max-width: 250px;
            margin: 0.5rem 0;
        }

        button:hover { opacity: 0.9; }

        button.secondary {
            background: transparent;
            color: var(--text);
            border: 1px solid var(--border);
        }

        button.secondary:hover { background: var(--surface); }

        .divider {
            margin: 2rem 0;
            color: var(--text-dim);
            font-size: 0.9rem;
        }

        .room-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            border-bottom: 1px solid var(--border);
            padding-bottom: 1rem;
        }

        .room-id {
            font-family: monospace;
            font-size: 1.5rem;
            color: var(--text-dim);
        }

        .tabs { display: flex; gap: 1rem; }

        .tab {
            color: var(--text-dim);
            cursor: pointer;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
        }

        .tab.active {
            color: var(--text);
            border-bottom: 2px solid var(--accent);
        }

        textarea {
            width: 100%;
            height: 500px;
            background: var(--surface);
            border: 1px solid var(--border);
            color: var(--text);
            padding: 1.5rem;
            border-radius: 8px;
            font-family: 'Courier New', Courier, monospace;
            resize: vertical;
            outline: none;
            margin-bottom: 1rem;
        }

        .history-item {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            margin-bottom: 1rem;
            overflow: hidden;
        }

        .history-meta {
            background: var(--bg);
            padding: 0.8rem 1rem;
            font-size: 0.85rem;
            color: var(--text-dim);
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
        }

        .history-code {
            padding: 1.5rem;
            overflow-x: auto;
            max-height: 400px;
            white-space: pre;
            font-family: 'Courier New', Courier, monospace;
            font-size: 0.9rem;
        }

        .copy-btn {
            background: none;
            border: none;
            color: var(--text-dim);
            cursor: pointer;
            font-size: 0.85rem;
            padding: 0;
            width: auto;
        }
        .copy-btn:hover { color: var(--text); }
    </style>
</head>
<body>

<div class="container">
    <div id="homeView" class="view active">
        <h1>VOID.</h1>
        <div class="card">
            <button onclick="createRoom()">Create a New Room</button>
            <div class="divider">or enter an existing room</div>
            <input type="text" id="pinInput" maxlength="4" placeholder="0000" autocomplete="off">
            <button class="secondary" onclick="joinRoom()">Enter</button>
            <p id="errorMsg" style="color: #ff5555; margin-top: 1rem; display: none;">Room not found.</p>
        </div>
    </div>

    <div id="roomView" class="view">
        <div class="room-header">
            <div class="room-id">ROOM: <span id="displayPin"></span></div>
            <div class="tabs">
                <div class="tab active" onclick="switchTab('paste')">Paste Code</div>
                <div class="tab" onclick="switchTab('history')">History</div>
            </div>
        </div>

        <div id="pasteTab">
            <textarea id="codeInput" placeholder="Paste your code here..."></textarea>
            <button onclick="submitCode()" style="max-width: 100%;">Push to Room</button>
        </div>

        <div id="historyTab" style="display: none;">
            <div id="historyList"></div>
        </div>
    </div>
</div>

<script>
    let currentPin = '';

    function showView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
    }

    function switchTab(tab) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
        
        if (tab === 'paste') {
            document.getElementById('pasteTab').style.display = 'block';
            document.getElementById('historyTab').style.display = 'none';
        } else {
            document.getElementById('pasteTab').style.display = 'none';
            document.getElementById('historyTab').style.display = 'block';
            loadHistory();
        }
    }

    async function createRoom() {
        const res = await fetch('/api/create', { method: 'POST' });
        const data = await res.json();
        enterRoomEnv(data.pin);
    }

    async function joinRoom() {
        const pin = document.getElementById('pinInput').value;
        const res = await fetch('/api/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin })
        });
        const data = await res.json();
        
        if (data.success) {
            enterRoomEnv(pin);
        } else {
            document.getElementById('errorMsg').style.display = 'block';
            setTimeout(() => document.getElementById('errorMsg').style.display = 'none', 3000);
        }
    }

    function enterRoomEnv(pin) {
        currentPin = pin;
        document.getElementById('displayPin').innerText = pin;
        showView('roomView');
    }

    async function submitCode() {
        const code = document.getElementById('codeInput').value;
        if (!code.trim()) return;

        await fetch('/api/paste', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: currentPin, code })
        });

        document.getElementById('codeInput').value = '';
        document.querySelectorAll('.tab')[1].click(); 
    }

    async function loadHistory() {
        const list = document.getElementById('historyList');
        list.innerHTML = '<p style="color: var(--text-dim); text-align:center;">Loading...</p>';
        
        const res = await fetch('/api/history/' + currentPin);
        const history = await res.json();

        if (history.length === 0) {
            list.innerHTML = '<p style="color: var(--text-dim); text-align:center;">Room is empty.</p>';
            return;
        }

        list.innerHTML = history.map((item, index) => \`
            <div class="history-item">
                <div class="history-meta">
                    <span>\${item.time}</span>
                    <button class="copy-btn" onclick="copyText(\${index})">Copy</button>
                </div>
                <div class="history-code" id="code-\${index}">\${escapeHTML(item.code)}</div>
            </div>
        \`).join('');
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    function copyText(index) {
        const text = document.getElementById('code-' + index).innerText;
        navigator.clipboard.writeText(text);
        event.target.innerText = "Copied!";
        setTimeout(() => event.target.innerText = "Copy", 2000);
    }
</script>
</body>
</html>
`;

// Serve the HTML on the main route
app.get('/', (req, res) => {
    res.send(HTML_UI);
});

// Start Server
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Void is running!`);
    console.log(`Local Access: http://localhost:${PORT}`);
    console.log(`Share on your network via your local IP address.`);
});
