# TSLA/MSTR Price Ratio Chart

An interactive web visualization that displays the price ratio between Tesla (TSLA) and MicroStrategy (MSTR) stocks over time. The chart helps visualize the relationship between these two companies' stock prices.

## Features

- Real-time data from Yahoo Finance
- Interactive chart using Chart.js
- Responsive design
- One year of historical data
- Live reload functionality for development

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open your browser and navigate to `http://localhost:3021`

The development server includes:
- Live reload functionality for instant preview of changes
- Local server for development
- Automatic browser refresh on file changes

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

## Files

- `index.html` - Main HTML file containing the chart interface
- `script.js` - Main JavaScript file with chart logic and data fetching
- `server.js` - Node.js server for local development
- `livereload.js` - Client-side live reload functionality (development only)
- `livereload-server.js` - Server-side live reload functionality (development only)

## Dependencies

- Chart.js - For rendering the interactive chart
- date-fns - For date formatting and manipulation
- Express - For local development server
- Node.js - For running the development environment 