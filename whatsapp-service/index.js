const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const pino = require('pino');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.json());

let sock;
const QRCode = require('qrcode');

let connectionStatus = "DISCONNECTED";
let lastQr = null;

async function connectToWhatsApp() {
    const authDir = path.join(__dirname, 'auth_info_baileys');
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    
    sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            connectionStatus = "PAIRING";
            QRCode.toDataURL(qr, (err, url) => {
                if (!err) {
                    lastQr = url;
                    io.emit('qr', url);
                    io.emit('status', connectionStatus);
                }
            });
        }
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('WhatsApp connection closed. Reconnecting:', shouldReconnect);
            connectionStatus = "DISCONNECTED";
            lastQr = null;
            io.emit('status', connectionStatus);
            io.emit('qr', null);
            if (shouldReconnect) {
                setTimeout(connectToWhatsApp, 3000);
            }
        } else if (connection === 'open') {
            console.log('WhatsApp connection successfully opened!');
            connectionStatus = "CONNECTED";
            lastQr = null;
            io.emit('status', connectionStatus);
            io.emit('qr', null);
        }
    });
}

// WebSocket connection for live status / QR pairing
io.on('connection', (socket) => {
    socket.emit('status', connectionStatus);
    if (lastQr) {
        socket.emit('qr', lastQr);
    }
    
    socket.on('disconnect', () => {});
});

// API endpoint to get status/QR via HTTP (for fallback polling if needed)
app.get('/status', (req, res) => {
    res.json({ status: connectionStatus, qr: lastQr });
});

// API endpoint to log out / disconnect current session
app.post('/logout', async (req, res) => {
    if (sock) {
        try {
            await sock.logout();
        } catch (e) {
            console.error('Error logging out:', e);
        }
    }
    res.json({ success: true });
});

// API endpoint to send a message
app.post('/send-message', async (req, res) => {
    const { to, text } = req.body;
    if (!to || !text) {
        return res.status(400).json({ error: "Missing 'to' or 'text' fields." });
    }
    
    if (connectionStatus !== "CONNECTED") {
        return res.status(400).json({ error: "WhatsApp device is not paired. Status: " + connectionStatus });
    }
    
    try {
        // Remove non-digit characters and append whatsapp domain
        const cleanNumber = to.replace(/\D/g, '');
        // Default to Indian country code (91) if prefix missing and length is 10 digits
        const formattedNumber = (cleanNumber.length === 10) ? `91${cleanNumber}` : cleanNumber;
        const jid = `${formattedNumber}@s.whatsapp.net`;
        
        console.log(`Sending WhatsApp message to ${jid}...`);
        await sock.sendMessage(jid, { text });
        res.json({ success: true });
    } catch (err) {
        console.error('Failed to send WhatsApp message:', err);
        res.status(500).json({ error: err.message || "Failed to send message" });
    }
});

// Start WhatsApp socket client immediately
connectToWhatsApp().catch(err => console.error('Failed to start WhatsApp client:', err));

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`WhatsApp pairing microservice listening on port ${PORT}`);
});
