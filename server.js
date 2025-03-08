/**
 * DEVELOPMENT SERVER ONLY
 * ----------------------
 * This file is strictly for local development purposes and should NOT be deployed.
 * It provides:
 * 1. Local static file serving
 * 2. Live reload functionality via WebSocket
 * 3. File watching and automatic version updates
 * 
 * For production deployment:
 * - Use GitHub Pages or another static file host
 * - This server is NOT needed and should NOT be included in the production build
 */

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

// ANSI escape codes for colors and cursor control
const ANSI = {
    CLEAR_LINE: '\x1b[2K',
    CURSOR_UP: '\x1b[1A',
    MOVE_START: '\x1b[0G',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    RESET: '\x1b[0m'
};

let lastChangeTime = null;
let updateInterval;

// Function to format the time since last change
function getTimeSinceLastChange() {
    if (!lastChangeTime) return 'No changes detected yet';
    const seconds = Math.floor((Date.now() - lastChangeTime) / 1000);
    return `${seconds} seconds since last change`;
}

// Function to update the status line
function updateStatusLine() {
    process.stdout.write(
        `${ANSI.CLEAR_LINE}${ANSI.MOVE_START}${ANSI.YELLOW}[${new Date().toLocaleTimeString()}] ${getTimeSinceLastChange()}${ANSI.RESET}`
    );
}

// Start the status line update interval
updateInterval = setInterval(updateStatusLine, 1000);

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

            // Clear the current status line
            process.stdout.write(`${ANSI.CLEAR_LINE}${ANSI.MOVE_START}`);
            
            // Log the change with timestamp
            const timestamp = new Date().toLocaleString();
            console.log(`${ANSI.GREEN}[${timestamp}] File changed: ${filename}${ANSI.RESET}`);
            
            // Update last change time
            lastChangeTime = Date.now();
        }, 100);
    }
});

// Clean up interval on process exit
process.on('SIGINT', () => {
    clearInterval(updateInterval);
    process.exit();
}); 