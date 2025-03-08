// Constants
const TSLA_SYMBOL = 'TSLA';
const MSTR_SYMBOL = 'MSTR';
const CHART_CONFIG = {
    type: 'line',
    data: {
        datasets: [{
            label: 'TSLA/MSTR Price Ratio',
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
            pointRadius: 1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'Tesla to MicroStrategy Stock Price Ratio'
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'day'
                },
                title: {
                    display: true,
                    text: 'Date'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Price Ratio (TSLA/MSTR)'
                }
            }
        }
    }
};

// Function to fetch stock data
async function fetchStockData(symbol, startDate, endDate) {
    const period1 = Math.floor(startDate.getTime() / 1000);
    const period2 = Math.floor(endDate.getTime() / 1000);
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`;
    const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`;
    
    console.log(`Fetching data for ${symbol}...`);
    console.log('Yahoo Finance URL:', yahooUrl);
    console.log('Proxy URL:', url);
    
    try {
        const response = await fetch(url);
        console.log(`Response status for ${symbol}:`, response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        console.log(`Raw response for ${symbol}:`, text.substring(0, 200) + '...');
        
        const data = JSON.parse(text);
        console.log(`Parsed data for ${symbol}:`, data);
        
        if (!data.chart || !data.chart.result || !data.chart.result[0]) {
            throw new Error(`Invalid data format for ${symbol}`);
        }
        
        return data.chart.result[0];
    } catch (error) {
        console.error(`Error fetching ${symbol} data:`, error);
        console.error('Error details:', {
            symbol,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            period1,
            period2
        });
        throw error;
    }
}

// Function to calculate price ratios
function calculateRatios(tslaData, mstrData) {
    console.log('Calculating ratios with data:', {
        tslaData: {
            timestamps: tslaData.timestamp?.length,
            prices: tslaData.indicators?.quote[0]?.close?.length
        },
        mstrData: {
            timestamps: mstrData.timestamp?.length,
            prices: mstrData.indicators?.quote[0]?.close?.length
        }
    });

    const ratios = [];
    const timestamps = tslaData.timestamp;
    const tslaPrices = tslaData.indicators.quote[0].close;
    const mstrPrices = mstrData.indicators.quote[0].close;

    for (let i = 0; i < timestamps.length; i++) {
        if (tslaPrices[i] && mstrPrices[i]) {
            ratios.push({
                x: new Date(timestamps[i] * 1000),
                y: tslaPrices[i] / mstrPrices[i]
            });
        }
    }

    console.log(`Generated ${ratios.length} ratio points`);
    console.log('Sample ratios:', ratios.slice(0, 3));
    return ratios;
}

// Main function to initialize the chart
async function initChart() {
    console.log('Initializing chart...');
    const ctx = document.getElementById('chart').getContext('2d');
    const chart = new Chart(ctx, CHART_CONFIG);
    
    try {
        // Fetch one year of data
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1);
        
        console.log('Date range:', {
            start: startDate.toISOString(),
            end: endDate.toISOString()
        });

        const [tslaData, mstrData] = await Promise.all([
            fetchStockData(TSLA_SYMBOL, startDate, endDate),
            fetchStockData(MSTR_SYMBOL, startDate, endDate)
        ]);

        console.log('Successfully fetched both stock data');

        const ratios = calculateRatios(tslaData, mstrData);
        chart.data.datasets[0].data = ratios;
        chart.update();
        console.log('Chart updated with new data');

        // Update last updated timestamp
        const lastUpdatedElement = document.getElementById('lastUpdated');
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = new Date().toLocaleString();
        }

        // Hide loading message
        document.querySelector('.loading').style.display = 'none';
    } catch (error) {
        console.error('Error in initChart:', error);
        document.querySelector('.loading').textContent = 'Error loading data. Please try again later.';
    }
}

// Initialize the chart when the page loads
console.log('Setting up DOMContentLoaded listener...');
document.addEventListener('DOMContentLoaded', initChart); 