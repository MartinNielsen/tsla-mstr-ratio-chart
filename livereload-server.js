const WebSocket = require('ws');
const chokidar = require('chokidar');
const path = require('path');

// Create WebSocket server on port 8083
const wss = new WebSocket.Server({ port: 8083 });

console.log('LiveReload server running on ws://localhost:8083');

// Store connected clients
const clients = new Set();

// Get absolute path of current directory
const currentDir = process.cwd().replace(/\\/g, '/');
console.log('Current directory:', currentDir);

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('Client connected to LiveReload');
    clients.add(ws);

    ws.on('close', () => {
        console.log('Client disconnected from LiveReload');
        clients.delete(ws);
    });
});

// Watch for file changes - simpler approach
const watcher = chokidar.watch('.', {
    ignored: ['**/node_modules/**', '**/.git/**'],
    persistent: true,
    ignoreInitial: false,
    depth: 0,  // Only watch current directory
    awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100
    }
});

console.log('Starting to watch directory...');

// Add debug events
watcher
    .on('add', path => console.log(`File ${path} has been added to watch list`))
    .on('change', path => {
        // Only reload for HTML, JS, and CSS files
        if (path.match(/\.(html|js|css)$/)) {
            console.log(`File ${path} has been changed`);
            console.log(`Number of connected clients: ${clients.size}`);
            
            clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    console.log('Sending reload command to client');
                    client.send('reload');
                } else {
                    console.log('Client connection not open:', client.readyState);
                }
            });
        }
    })
    .on('unlink', path => console.log(`File ${path} has been removed`))
    .on('error', error => console.log(`Watcher error: ${error}`))
    .on('ready', () => {
        console.log('Initial scan complete. Ready for changes.');
        const watched = watcher.getWatched();
        console.log('Watched directories:', Object.keys(watched));
        for (const dir of Object.keys(watched)) {
            console.log(`Files in ${dir}:`, watched[dir]);
        }
    }); 