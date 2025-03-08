// Constants
const DEFAULT_SYMBOL1 = 'TSLA';
const DEFAULT_SYMBOL2 = 'MSTR';
let chartInstance = null;

// Add interval constants
const INTERVALS = {
    FIVE_MIN: '5m',
    THIRTY_MIN: '30m',
    ONE_HOUR: '1h',
    ONE_DAY: '1d'
};

// Version checking functionality
let currentVersion = null;
let wsReloadEnabled = false;

// Try to establish WebSocket connection for local development
try {
    const socket = new WebSocket('ws://localhost:8080');
    
    socket.addEventListener('open', () => {
        console.log('Live reload WebSocket connected');
        wsReloadEnabled = true;
    });

    socket.addEventListener('message', (event) => {
        if (event.data === 'reload') {
            console.log('Live reload triggered via WebSocket');
            window.location.reload();
        }
    });

    socket.addEventListener('error', () => {
        console.log('WebSocket connection failed, falling back to version polling');
        wsReloadEnabled = false;
    });
} catch (error) {
    console.log('WebSocket not available, using version polling');
    wsReloadEnabled = false;
}

// Version polling fallback (for GitHub Pages)
async function checkVersion() {
    if (wsReloadEnabled) return; // Skip if WebSocket is working
    
    try {
        const response = await fetch('version.json?' + new Date().getTime());
        const data = await response.json();
        
        if (currentVersion === null) {
            currentVersion = data.buildTime;
        } else if (currentVersion !== data.buildTime) {
            console.log('New version detected. Reloading...');
            window.location.reload(true);
        }
    } catch (error) {
        console.error('Error checking version:', error);
    }
}

// Check for new version every 5 seconds if WebSocket is not available
if (!wsReloadEnabled) {
    setInterval(checkVersion, 5000);
    checkVersion(); // Initial version check
}

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

// Function to generate a color for each day's line
function generateLineColor(index) {
    const colors = [
        'rgb(75, 192, 192)',   // teal
        'rgb(255, 99, 132)',   // pink
        'rgb(54, 162, 235)',   // blue
        'rgb(255, 206, 86)',   // yellow
        'rgb(153, 102, 255)',  // purple
        'rgb(255, 159, 64)',   // orange
        'rgb(75, 192, 75)'     // green
    ];
    return colors[index % colors.length];
}

const CHART_CONFIG = {
    type: 'line',
    data: {
        datasets: []
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            title: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#f1f5f9',
                bodyColor: '#f1f5f9',
                borderColor: 'rgba(148, 163, 184, 0.2)',
                borderWidth: 1,
                padding: 12,
                boxPadding: 4,
                usePointStyle: true,
                callbacks: {
                    title: (context) => {
                        return new Date(context[0].parsed.x).toLocaleString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    },
                    label: (context) => {
                        return `Ratio: ${context.parsed.y.toFixed(4)}`;
                    }
                }
            },
            legend: {
                display: false
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'hour',
                    displayFormats: {
                        hour: 'HH:mm',
                        day: 'MMM d'
                    }
                },
                grid: {
                    display: true,
                    color: 'rgba(148, 163, 184, 0.1)',
                    drawBorder: false
                },
                border: {
                    display: false
                },
                ticks: {
                    color: '#94a3b8',
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    }
                }
            },
            y: {
                grid: {
                    display: true,
                    color: 'rgba(148, 163, 184, 0.1)',
                    drawBorder: false
                },
                border: {
                    display: false
                },
                ticks: {
                    color: '#94a3b8',
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    }
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
    
    try {
        const response = await fetch(url);
        console.log(`Response status for ${symbol}:`, response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.chart || !data.chart.result || !data.chart.result[0]) {
            throw new Error(`Invalid data format for ${symbol}`);
        }
        
        // Validate that we have price data
        const result = data.chart.result[0];
        if (!result.indicators?.quote?.[0]?.close || result.indicators.quote[0].close.length === 0) {
            throw new Error(`No price data available for ${symbol}`);
        }
        
        return result;
    } catch (error) {
        console.error(`Error fetching ${symbol} data:`, error);
        document.querySelector('.loading').textContent = `Error loading data for ${symbol}. Please try again later.`;
        throw error;
    }
}

// Function to calculate price ratios split by day
function calculateRatios(stock1Data, stock2Data) {
    console.log('Calculating ratios with data:', {
        stock1Data: {
            timestamps: stock1Data.timestamp?.length,
            prices: stock1Data.indicators?.quote[0]?.close?.length
        },
        stock2Data: {
            timestamps: stock2Data.timestamp?.length,
            prices: stock2Data.indicators?.quote[0]?.close?.length
        }
    });

    const ratiosByDay = new Map();
    const timestamps = stock1Data.timestamp;
    const stock1Prices = stock1Data.indicators.quote[0].close;
    const stock2Prices = stock2Data.indicators.quote[0].close;

    for (let i = 0; i < timestamps.length; i++) {
        if (stock1Prices[i] && stock2Prices[i]) {
            const date = new Date(timestamps[i] * 1000);
            const dayKey = date.toISOString().split('T')[0];
            
            if (!ratiosByDay.has(dayKey)) {
                ratiosByDay.set(dayKey, []);
            }
            
            ratiosByDay.get(dayKey).push({
                x: date,
                y: stock1Prices[i] / stock2Prices[i]
            });
        }
    }

    console.log(`Generated ratios for ${ratiosByDay.size} days`);
    return ratiosByDay;
}

// Function to get date range, either from parameters or default
function getDateRange(startDate = null, endDate = null) {
    if (startDate && endDate) {
        // Add one day to endDate to include the selected day
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
        return { fromDate: startDate, toDate: adjustedEndDate };
    }
    return setDefaultDates();
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

// Function to update dates based on selected range
function updateDatesFromRange(range) {
    const toDate = new Date();
    const fromDate = new Date();
    
    switch (range) {
        case 'today':
            fromDate.setHours(0, 0, 0, 0);
            break;
        case '7days':
            fromDate.setDate(toDate.getDate() - 7);
            break;
        case '1month':
            fromDate.setMonth(toDate.getMonth() - 1);
            break;
        case 'custom':
            // Don't update the dates for custom range
            return;
    }
    
    document.getElementById('toDate').value = toDate.toISOString().split('T')[0];
    document.getElementById('fromDate').value = fromDate.toISOString().split('T')[0];
    
    // If not custom range, trigger chart update
    if (range !== 'custom') {
        initChart(fromDate, toDate);
    }
}

// Function to sync dropdown with date inputs
function syncDropdownWithDates() {
    const fromDate = new Date(document.getElementById('fromDate').value);
    const toDate = new Date(document.getElementById('toDate').value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if dates match any predefined range
    const diffDays = Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24));
    const diffMonths = toDate.getMonth() - fromDate.getMonth() + 
        (12 * (toDate.getFullYear() - fromDate.getFullYear()));
    
    if (fromDate.getTime() === today.getTime() && toDate.getTime() === new Date().getTime()) {
        document.getElementById('dateRange').value = 'today';
    } else if (diffDays === 7) {
        document.getElementById('dateRange').value = '7days';
    } else if (diffMonths === 1) {
        document.getElementById('dateRange').value = '1month';
    } else {
        document.getElementById('dateRange').value = 'custom';
    }
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
    
    // Show loading message
    document.querySelector('.loading').style.display = 'block';
    
    // Get the date range
    const dates = getDateRange(startDate, endDate);
    
    // Get the current symbols
    const symbol1 = document.getElementById('symbol1').value.toUpperCase();
    const symbol2 = document.getElementById('symbol2').value.toUpperCase();
    
    // Save the symbols
    saveSymbols(symbol1, symbol2);
    
    // Initialize chart if not already done
    if (!chartInstance) {
        const ctx = document.getElementById('chart').getContext('2d');
        chartInstance = new Chart(ctx, CHART_CONFIG);
    }
    
    try {
        console.log('Date range:', {
            start: dates.fromDate.toISOString(),
            end: dates.toDate.toISOString()
        });

        const [stock1Data, stock2Data] = await Promise.all([
            fetchStockData(symbol1, dates.fromDate, dates.toDate),
            fetchStockData(symbol2, dates.fromDate, dates.toDate)
        ]);

        console.log('Successfully fetched both stock data');

        const ratiosByDay = calculateRatios(stock1Data, stock2Data);
        
        // Update chart title
        chartInstance.options.plugins.title = {
            display: true,
            text: `${symbol1}/${symbol2} Price Ratio`,
            color: '#f1f5f9',
            font: {
                size: 16,
                family: "'Inter', sans-serif",
                weight: '500'
            },
            padding: {
                bottom: 20
            }
        };
        
        // Create a dataset for each day with the same color
        const datasets = Array.from(ratiosByDay.entries()).map(([day, data]) => ({
            label: '',
            data: data,
            borderColor: '#60a5fa',
            backgroundColor: 'rgba(96, 165, 250, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#60a5fa',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2,
            fill: true
        }));

        chartInstance.data.datasets = datasets;
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

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Load saved symbols
    loadSavedSymbols();
    
    // Set default dates and update dropdown
    setDefaultDates();
    document.getElementById('dateRange').value = '7days';
    
    // Initialize chart with default date range
    initChart();
    
    // Add date range change handler
    document.getElementById('dateRange').addEventListener('change', (e) => {
        updateDatesFromRange(e.target.value);
    });
    
    // Add date input change handlers
    document.getElementById('fromDate').addEventListener('change', () => {
        document.getElementById('dateRange').value = 'custom';
    });
    
    document.getElementById('toDate').addEventListener('change', () => {
        document.getElementById('dateRange').value = 'custom';
    });
    
    // Add form submit handler
    document.getElementById('dateRangeForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const fromDate = new Date(document.getElementById('fromDate').value);
        const toDate = new Date(document.getElementById('toDate').value);
        syncDropdownWithDates(); // Sync dropdown with selected dates
        initChart(fromDate, toDate);
    });
});

// Load saved symbols from localStorage or use defaults
function loadSavedSymbols() {
    const symbol1 = localStorage.getItem('symbol1') || DEFAULT_SYMBOL1;
    const symbol2 = localStorage.getItem('symbol2') || DEFAULT_SYMBOL2;
    
    document.getElementById('symbol1').value = symbol1;
    document.getElementById('symbol2').value = symbol2;
    
    return { symbol1, symbol2 };
}

// Save symbols to localStorage
function saveSymbols(symbol1, symbol2) {
    localStorage.setItem('symbol1', symbol1);
    localStorage.setItem('symbol2', symbol2);
} 