const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json({ limit: '10mb' }));

// Tell Express where to find our front-end files
app.use(express.static(path.join(__dirname, 'public')));

// --- DATABASE (FILE SYSTEM) ---
const DATA_FILE = './void_data.json';
let rooms = {};

if (fs.existsSync(DATA_FILE)) {
    try {
        rooms = JSON.parse(fs.readFileSync(DATA_FILE));
        console.log('Loaded existing rooms from disk.');
    } catch (e) {
        console.error('Error reading data file.');
    }
}

function saveRoomsToDisk() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(rooms, null, 2));
}

// --- PAGE ROUTES (Multi-Page Setup) ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'public', 'about.html')));
app.get('/room/:roomId', (req, res) => res.sendFile(path.join(__dirname, 'public', 'room.html')));

// --- API ROUTES ---
app.post('/api/create', (req, res) => {
    let { customId } = req.body;
    let roomId = customId ? customId.trim().replace(/[^a-zA-Z0-9-]/g, '') : null;

    if (roomId) {
        if (rooms[roomId]) return res.status(400).json({ success: false, message: 'Room name taken.' });
    } else {
        do { roomId = Math.floor(1000 + Math.random() * 9000).toString(); } while (rooms[roomId]); 
    }
    
    rooms[roomId] = []; 
    saveRoomsToDisk(); 
    res.json({ success: true, roomId });
});

app.post('/api/join', (req, res) => {
    const { roomId } = req.body;
    if (rooms[roomId]) {
        res.json({ success: true, roomId });
    } else {
        res.status(404).json({ success: false, message: 'Room not found.' });
    }
});

app.post('/api/paste', (req, res) => {
    const { roomId, code } = req.body;
    if (!rooms[roomId]) return res.status(404).json({ success: false });
    
    const entry = { 
        code, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString()
    };
    rooms[roomId].unshift(entry); 
    saveRoomsToDisk(); 
    res.json({ success: true });
});

app.get('/api/history/:roomId', (req, res) => {
    const { roomId } = req.params;
    if (!rooms[roomId]) return res.status(404).json([]);
    res.json(rooms[roomId]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Void running on port ${PORT}`));