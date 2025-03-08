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

// Function to update version.json
function updateVersionJson() {
    const versionData = {
        buildTime: new Date().toISOString()
    };
    fs.writeFileSync('version.json', JSON.stringify(versionData, null, 4));
}

// Create initial version.json if it doesn't exist
if (!fs.existsSync('version.json')) {
    updateVersionJson();
}

// Watch for file changes
let timeoutId;
fs.watch('.', { recursive: true }, (eventType, filename) => {
    // Ignore node_modules, git directories, and version.json itself
    if (filename && 
        !filename.includes('node_modules') && 
        !filename.includes('.git') && 
        filename !== 'version.json') {
        
        // Debounce the reload to prevent multiple rapid reloads
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            // Update version.json
            updateVersionJson();
            
            // Notify WebSocket clients if any are connected
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send('reload');
                }
            });
            console.log(`File changed: ${filename}`);
        }, 100);
    }
}); 