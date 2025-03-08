const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Use a different port to avoid conflicts
const PORT = 8082;

// MIME types for different file extensions
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Create the server
const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Parse the URL
    const parsedUrl = url.parse(req.url);
    
    // Extract the path from the URL
    let pathname = `.${parsedUrl.pathname}`;
    
    // If path ends with '/', serve index.html
    if (pathname === './') {
        pathname = './index.html';
    }
    
    // Get the file extension
    const ext = path.parse(pathname).ext;
    
    // Read the file
    fs.readFile(pathname, (err, data) => {
        if (err) {
            // If the file is not found, return 404
            if (err.code === 'ENOENT') {
                console.log(`File ${pathname} not found`);
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('404 Not Found');
                return;
            }
            
            // For other errors, return 500
            console.error(`Error reading file ${pathname}:`, err);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('500 Internal Server Error');
            return;
        }
        
        // If the file is found, set the content type and serve the file
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Press Ctrl+C to stop the server');
    console.log('Watching for file changes...');
}); 