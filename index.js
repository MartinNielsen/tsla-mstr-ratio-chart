// Import required modules
const fetch = require('node-fetch');
const yahooFinance = require('yahoo-finance2').default;

// Function to fetch historical intraday prices
async function fetchStockData(symbol) {
    try {
        const data = await yahooFinance.historical(symbol, {
            period1: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            interval: '5m' // 5-minute interval
        });
        return data;
    } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        return [];
    }
}

// Function to compute MSTR/TSLA ratio
async function fetchAndPlot() {
    const tslaData = await fetchStockData('TSLA');
    const mstrData = await fetchStockData('MSTR');
    
    if (tslaData.length === 0 || mstrData.length === 0) {
        console.error('Failed to fetch stock data');
        return;
    }

    // Align timestamps and compute ratio
    const tslaMap = new Map(tslaData.map(d => [d.date, d.close]));
    const ratioData = mstrData
        .map(d => ({ time: d.date, ratio: d.close / (tslaMap.get(d.date) || NaN) }))
        .filter(d => !isNaN(d.ratio));

    // Prepare data for Chart.js
    const labels = ratioData.map(d => d.time);
    const dataPoints = ratioData.map(d => d.ratio);

    // Plot the data using Chart.js
    const ctx = document.getElementById('chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'MSTR/TSLA Price Ratio',
                data: dataPoints,
                borderColor: 'blue',
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { type: 'time', time: { unit: 'hour' } },
                y: { beginAtZero: false }
            }
        }
    });
}

fetchAndPlot();
