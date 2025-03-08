// Constants
const TSLA_SYMBOL = 'TSLA';
const MSTR_SYMBOL = 'MSTR';
let chartInstance = null; // Add chart instance tracking

// Add interval constants
const INTERVALS = {
    FIVE_MIN: '5m',
    THIRTY_MIN: '30m',
    ONE_HOUR: '1h',
    ONE_DAY: '1d'
};

// Function to determine appropriate interval based on date range
function getIntervalForDateRange(fromDate, toDate) {
    const daysDifference = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));
    
    if (daysDifference <= 7) {
        return INTERVALS.FIVE_MIN;
    } else if (daysDifference <= 30) {
        return INTERVALS.THIRTY_MIN;
    } else if (daysDifference <= 90) {
        return INTERVALS.ONE_HOUR;
    } else {
        return INTERVALS.ONE_DAY;
    }
}

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
    const interval = getIntervalForDateRange(startDate, endDate);
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=${interval}`;
    const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`;
    
    console.log(`Fetching data for ${symbol}...`);
    console.log('Date range:', {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        interval: interval
    });
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

// Function to set default dates (last 7 days)
function setDefaultDates() {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - 7);
    
    document.getElementById('toDate').value = toDate.toISOString().split('T')[0];
    document.getElementById('fromDate').value = fromDate.toISOString().split('T')[0];
    
    return { fromDate, toDate };
}

// Function to get appropriate time unit for chart display
function getChartTimeUnit(interval) {
    switch (interval) {
        case INTERVALS.FIVE_MIN:
        case INTERVALS.THIRTY_MIN:
            return 'hour';
        case INTERVALS.ONE_HOUR:
            return 'day';
        case INTERVALS.ONE_DAY:
        default:
            return 'day';
    }
}

// Function to initialize the chart
async function initChart(startDate = null, endDate = null) {
    console.log('Initializing chart...');
    const ctx = document.getElementById('chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    // Get dates before creating chart config
    const dates = startDate && endDate ? { fromDate: startDate, toDate: endDate } : setDefaultDates();
    const interval = getIntervalForDateRange(dates.fromDate, dates.toDate);
    
    // Update chart config with appropriate time unit
    const chartConfig = {
        ...CHART_CONFIG,
        options: {
            ...CHART_CONFIG.options,
            scales: {
                ...CHART_CONFIG.options.scales,
                x: {
                    ...CHART_CONFIG.options.scales.x,
                    time: {
                        unit: getChartTimeUnit(interval),
                        displayFormats: {
                            hour: 'MMM d, HH:mm',
                            day: 'MMM d'
                        }
                    }
                }
            }
        }
    };
    
    // Create new chart instance with updated config
    chartInstance = new Chart(ctx, chartConfig);
    
    try {
        console.log('Date range:', {
            start: dates.fromDate.toISOString(),
            end: dates.toDate.toISOString()
        });

        const [tslaData, mstrData] = await Promise.all([
            fetchStockData(TSLA_SYMBOL, dates.fromDate, dates.toDate),
            fetchStockData(MSTR_SYMBOL, dates.fromDate, dates.toDate)
        ]);

        console.log('Successfully fetched both stock data');

        const ratios = calculateRatios(tslaData, mstrData);
        chartInstance.data.datasets[0].data = ratios;
        chartInstance.update();
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

// Initialize the chart and set up event listeners when the page loads
console.log('Setting up DOMContentLoaded listener...');
document.addEventListener('DOMContentLoaded', () => {
    // Set default dates and initialize chart
    setDefaultDates();
    initChart();
    
    // Add form submit handler
    document.getElementById('dateRangeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fromDate = new Date(document.getElementById('fromDate').value);
        const toDate = new Date(document.getElementById('toDate').value);
        
        // Add one day to toDate to include the selected day
        toDate.setDate(toDate.getDate() + 1);
        
        // Show loading message
        document.querySelector('.loading').style.display = 'block';
        
        // Reinitialize chart with new date range
        await initChart(fromDate, toDate);
    });
}); 