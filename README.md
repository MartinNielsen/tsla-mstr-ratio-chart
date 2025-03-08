# TSLA/MSTR Price Ratio Chart

An interactive web visualization that displays the price ratio between Tesla (TSLA) and MicroStrategy (MSTR) stocks over time. The chart helps visualize the relationship between these two companies' stock prices.

## Features

- Real-time data from Yahoo Finance
- Interactive chart using Chart.js
- Responsive design
- Live reload functionality for development

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## Development

The project includes live reload functionality for a smoother development experience. Any changes to the source files will automatically refresh the browser.

## Files

- `index.html` - Main HTML file containing the chart interface
- `script.js` - Main JavaScript file with chart logic and data fetching
- `server.js` - Node.js server for serving the application
- `livereload.js` - Client-side live reload functionality
- `livereload-server.js` - Server-side live reload functionality

## Dependencies

- Chart.js
- date-fns
- Express
- Node.js 