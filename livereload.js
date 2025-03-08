// LiveReload Client Script
(() => {
    const socket = new WebSocket('ws://localhost:8083');

    socket.onopen = () => {
        console.log('LiveReload: Connected to server');
    };

    socket.onmessage = (event) => {
        if (event.data === 'reload') {
            console.log('LiveReload: Reloading page...');
            window.location.reload();
        }
    };

    socket.onerror = (error) => {
        console.log('LiveReload: WebSocket error:', error);
    };

    socket.onclose = () => {
        console.log('LiveReload: Connection closed, attempting to reconnect in 5s...');
        setTimeout(() => {
            window.location.reload();
        }, 5000);
    };
})(); 