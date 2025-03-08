// Live reload functionality
(function() {
    const socket = new WebSocket('ws://localhost:8080');

    socket.addEventListener('message', function (event) {
        if (event.data === 'reload') {
            console.log('Reloading page...');
            window.location.reload();
        }
    });

    socket.addEventListener('close', function() {
        console.log('Live reload connection closed. Attempting to reconnect...');
        // Try to reconnect every 3 seconds
        setTimeout(() => {
            window.location.reload();
        }, 3000);
    });

    socket.addEventListener('error', function(error) {
        console.log('Live reload connection error:', error);
    });
})(); 