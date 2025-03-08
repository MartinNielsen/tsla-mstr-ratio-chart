# TSLA/MSTR Price Ratio Chart

An interactive web visualization that displays the price ratio between Tesla (TSLA) and MicroStrategy (MSTR) stocks over time. The chart helps visualize the relationship between these two companies' stock prices.

## Features

- Real-time data from Yahoo Finance
- Interactive chart using Chart.js
- Responsive design
- One year of historical data
- Progressive Web App (PWA) support for mobile installation
- Live reload functionality for development

## Production Deployment

This project is automatically deployed to GitHub Pages when changes are pushed to the main branch. You can view the live version at:
https://martinnielsen.github.io/tsla-mstr-ratio-chart/

### Manual Deployment
If you want to deploy your own version:

1. Fork this repository
2. Enable GitHub Pages in your repository settings:
   - Go to Settings > Pages
   - Set the source to "GitHub Actions"
3. Push changes to the main branch
4. GitHub Actions will automatically build and deploy your site

## Local Development

⚠️ **Important Note**: The development server (`server.js`) is ONLY for local development and should NEVER be used in production.

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open your browser and navigate to `http://localhost:3021`

The development server provides:
- Live reload functionality for instant preview of changes
- Local static file serving
- Automatic browser refresh on file changes

## Files

- `index.html` - Main HTML file containing the chart interface
- `script.js` - Main JavaScript file with chart logic and data fetching
- `server.js` - Development-only Node.js server (NOT used in production)
- `livereload.js` - Development-only client-side live reload functionality
- `livereload-server.js` - Development-only server-side live reload functionality
- `manifest.json` - PWA configuration for mobile app installation

## Dependencies

### Production Dependencies
- Chart.js - For rendering the interactive chart
- date-fns - For date formatting and manipulation

### Development Dependencies
- Express - For local development server only
- Node.js - For running the development environment only

## PWA Installation

The app can be installed as a Progressive Web App on mobile devices:
1. Open https://martinnielsen.github.io/tsla-mstr-ratio-chart/ in your mobile browser
2. Use your browser's "Add to Home Screen" or "Install" option
3. The app will be installed and can be launched from your device's home screen 