const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3021;

// Serve static files
app.use(express.static(__dirname));

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start HTTP server
const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// WebSocket server for live reload
const wss = new WebSocket.Server({ port: 8080 });
console.log('WebSocket server running on port 8080');

// Watch for file changes
let timeoutId;
fs.watch('.', { recursive: true }, (eventType, filename) => {
    // Ignore node_modules and git directories
    if (filename && !filename.includes('node_modules') && !filename.includes('.git')) {
        // Debounce the reload to prevent multiple rapid reloads
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send('reload');
                }
            });
            console.log(`File changed: ${filename}`);
        }, 100);
    }
}); 