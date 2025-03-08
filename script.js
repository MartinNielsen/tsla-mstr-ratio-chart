// Function to fetch stock data
async function fetchStockData() {
    try {
        console.log("Fetching stock data... (with auto-reload test)");
        
        // Try to use the Yahoo Finance API
        try {
            const response = await fetch('https://api.allorigins.win/raw?url=' + 
                encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/TSLA?interval=5m&range=7d'));
            const tslaData = await response.json();
            
            const response2 = await fetch('https://api.allorigins.win/raw?url=' + 
                encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/MSTR?interval=5m&range=7d'));
            const mstrData = await response2.json();
            
            return { tslaData, mstrData };
        } catch (apiError) {
            console.error('Error fetching from Yahoo Finance API, using mock data instead:', apiError);
            // If API fails, fall back to mock data
            return getMockData();
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

// Function to generate mock data if API fails
function getMockData() {
    console.log("Generating mock data...");
    
    // Create mock data for 5 days
    const now = new Date();
    const mockData = { tslaData: { chart: { result: [{ timestamp: [], indicators: { quote: [{ close: [] }] } }] } },
                      mstrData: { chart: { result: [{ timestamp: [], indicators: { quote: [{ close: [] }] } }] } } };
    
    // Generate data for the past 5 days
    for (let day = 4; day >= 0; day--) {
        const date = new Date(now);
        date.setDate(date.getDate() - day);
        date.setHours(9, 30, 0, 0); // Start at 9:30 AM
        
        // Generate data points for each day (market hours: 9:30 AM - 4:00 PM)
        for (let hour = 0; hour < 6.5; hour += 0.5) {
            const timestamp = Math.floor(new Date(date.getTime() + hour * 60 * 60 * 1000).getTime() / 1000);
            
            // Add some randomness to the prices
            const tslaPrice = 200 + Math.random() * 20;
            const mstrPrice = (200 + Math.random() * 20) * (0.8 + day * 0.1); // Make MSTR price vary by day
            
            mockData.tslaData.chart.result[0].timestamp.push(timestamp);
            mockData.tslaData.chart.result[0].indicators.quote[0].close.push(tslaPrice);
            
            mockData.mstrData.chart.result[0].timestamp.push(timestamp);
            mockData.mstrData.chart.result[0].indicators.quote[0].close.push(mstrPrice);
        }
    }
    
    return mockData;
}

// Function to process data and create ratio
function processData(tslaData, mstrData) {
    if (!tslaData || !mstrData || 
        !tslaData.chart || !mstrData.chart || 
        !tslaData.chart.result || !mstrData.chart.result ||
        tslaData.chart.result.length === 0 || mstrData.chart.result.length === 0) {
        console.error('Invalid data format');
        return null;
    }
    
    const tslaTimestamps = tslaData.chart.result[0].timestamp;
    const tslaCloses = tslaData.chart.result[0].indicators.quote[0].close;
    
    const mstrTimestamps = mstrData.chart.result[0].timestamp;
    const mstrCloses = mstrData.chart.result[0].indicators.quote[0].close;
    
    // Create maps for easy lookup
    const tslaMap = new Map();
    for (let i = 0; i < tslaTimestamps.length; i++) {
        if (tslaCloses[i] !== null) {
            tslaMap.set(tslaTimestamps[i], tslaCloses[i]);
        }
    }
    
    // Calculate ratios for matching timestamps
    const ratioData = [];
    for (let i = 0; i < mstrTimestamps.length; i++) {
        const timestamp = mstrTimestamps[i];
        const mstrClose = mstrCloses[i];
        
        if (mstrClose !== null && tslaMap.has(timestamp)) {
            const tslaClose = tslaMap.get(timestamp);
            // Calculate TSLA/MSTR ratio instead of MSTR/TSLA
            const ratio = tslaClose / mstrClose;
            const date = new Date(timestamp * 1000);
            
            ratioData.push({
                time: date,
                ratio: ratio,
                // Add a day identifier to group by day
                day: date.toISOString().split('T')[0]
            });
        }
    }
    
    console.log(`Processed ${ratioData.length} data points`);
    return ratioData;
}

// Function to group data by day
function groupDataByDay(ratioData) {
    // Create an array of datasets instead of an object
    const dayMap = {};
    
    // First group by day
    ratioData.forEach(dataPoint => {
        if (!dayMap[dataPoint.day]) {
            dayMap[dataPoint.day] = [];
        }
        dayMap[dataPoint.day].push(dataPoint);
    });
    
    console.log(`Found ${Object.keys(dayMap).length} unique days`);
    
    // Then create separate datasets for each day
    const datasets = [];
    const colors = [
        'rgba(54, 162, 235, 1)',  // blue
        'rgba(255, 99, 132, 1)',   // red
        'rgba(75, 192, 192, 1)',   // green
        'rgba(255, 159, 64, 1)',   // orange
        'rgba(153, 102, 255, 1)',  // purple
        'rgba(255, 205, 86, 1)',   // yellow
        'rgba(201, 203, 207, 1)'   // grey
    ];
    
    const days = Object.keys(dayMap).sort();
    console.log("Days found:", days);
    
    days.forEach((day, index) => {
        const color = colors[index % colors.length];
        const date = new Date(day);
        const formattedDate = date.toLocaleDateString(undefined, { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
        
        // Sort data points by time
        const sortedData = dayMap[day].sort((a, b) => a.time - b.time);
        
        console.log(`Day ${day} has ${sortedData.length} data points, using color ${color}`);
        
        // Only add datasets that have data points
        if (sortedData.length > 0) {
            datasets.push({
                label: formattedDate,
                data: sortedData.map(d => ({ x: d.time, y: d.ratio })),
                borderColor: color,
                backgroundColor: color.replace('1)', '0.1)'),
                borderWidth: 2,
                pointRadius: 1,
                pointHoverRadius: 5,
                fill: false,
                tension: 0.1, // Slight curve for better visualization
                showLine: true // Ensure lines are shown
            });
        }
    });
    
    console.log(`Created ${datasets.length} datasets`);
    return datasets;
}

// Function to plot the data
function plotData(ratioData) {
    if (!ratioData || ratioData.length === 0) {
        console.error('No valid ratio data to plot');
        return;
    }
    
    const ctx = document.getElementById('chart').getContext('2d');
    
    // Get array of datasets, one per day
    const datasets = groupDataByDay(ratioData);
    console.log("Datasets for chart:", datasets);
    
    // Destroy any existing chart
    if (window.myChart) {
        window.myChart.destroy();
    }
    
    // Create new chart
    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { 
                    type: 'time',
                    time: { 
                        unit: 'hour',
                        displayFormats: {
                            hour: 'HH:mm'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: { 
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'TSLA/MSTR Ratio'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'TSLA/MSTR Price Ratio By Day',
                    font: {
                        size: 18
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const date = new Date(context.parsed.x);
                            return `${context.dataset.label} ${date.toLocaleTimeString()} - Ratio: ${context.parsed.y.toFixed(4)}`;
                        }
                    }
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 10,
                        padding: 20
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                intersect: false
            }
        }
    });
    
    // Update last updated timestamp
    const lastUpdatedElement = document.getElementById('lastUpdated');
    if (lastUpdatedElement) {
        const now = new Date();
        lastUpdatedElement.textContent = now.toLocaleString();
    }
}

// Main function to fetch data and create chart
async function main() {
    try {
        console.log("Starting main function...");
        // Show loading indicator
        const loadingElement = document.getElementById('loading');
        
        const data = await fetchStockData();
        if (!data) {
            if (loadingElement) loadingElement.textContent = 'Failed to fetch stock data. Please try again later.';
            return;
        }
        
        const ratioData = processData(data.tslaData, data.mstrData);
        if (!ratioData) {
            if (loadingElement) loadingElement.textContent = 'Failed to process stock data. Please try again later.';
            return;
        }
        
        // Hide loading indicator
        if (loadingElement) loadingElement.style.display = 'none';
        
        plotData(ratioData);
    } catch (error) {
        console.error('Error:', error);
        const loadingElement = document.getElementById('loading');
        if (loadingElement) loadingElement.textContent = 'An error occurred. Please try again later.';
    }
}

// Run the main function when the page loads
window.addEventListener('DOMContentLoaded', main); 