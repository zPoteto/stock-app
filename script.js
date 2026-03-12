let chart;
let currentSymbol = "";
let currentInterval = "1min";
let chartType = "line";
const apiKey = "d082b96785544f2aae33cffad13045a6";
const serverUrl = "https://stock-app-hqb2.onrender.com"; // Your Render URL

let watchlist = [];

// NEW: Set Alert on the Cloud Server
async function setAlert() {
    const symbol = document.getElementById("symbol").value.toUpperCase();
    const alertPrice = Number(document.getElementById("alertPrice").value);

    if (!symbol || !alertPrice) {
        alert("Please enter both a symbol and a price.");
        return;
    }

    try {
        const response = await fetch(`${serverUrl}/register-alert`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ symbol, price: alertPrice })
        });

        if (response.ok) {
            alert(`Cloud alert set for ${symbol} at $${alertPrice}. You can close this tab now!`);
        } else {
            alert("Server error. Check if Render is awake.");
        }
    } catch (err) {
        console.error("Connection failed", err);
        alert("Could not connect to the server.");
    }
}

// UI: Add to Watchlist
function addToWatchlist() {
    const symbol = document.getElementById("addSymbol").value.toUpperCase();
    if (!symbol || watchlist.includes(symbol)) return;
    watchlist.push(symbol);
    renderWatchlist();
    document.getElementById("addSymbol").value = "";
}

function renderWatchlist() {
    const ul = document.getElementById("watchlist");
    ul.innerHTML = "";
    watchlist.forEach(sym => {
        const li = document.createElement("li");
        li.textContent = sym;
        li.onclick = () => {
            document.getElementById("symbol").value = sym;
            loadChart(currentInterval);
        };
        ul.appendChild(li);
    });
}

// UI: Load Chart
async function loadChart(interval) {
    currentInterval = interval;
    currentSymbol = document.getElementById("symbol").value.toUpperCase();
    if (!currentSymbol) {
        alert("Enter a stock symbol");
        return;
    }

    let url = `https://api.twelvedata.com/time_series?symbol=${currentSymbol}&interval=${interval}&outputsize=50&apikey=${apiKey}`;
    let response = await fetch(url);
    let data = await response.json();

    if (!data.values) {
        alert("Invalid symbol or API limit reached");
        return;
    }

    let prices = [];
    let times = [];

    data.values.reverse().forEach(candle => {
        prices.push(Number(candle.close));
        times.push(candle.datetime);
    });

    drawChart(times, prices);
    document.getElementById("livePrice").textContent = prices[prices.length - 1].toFixed(2);
}

// UI: Draw Chart
function drawChart(times, prices) {
    const ctx = document.getElementById("chart");
    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: times,
            datasets: [{
                label: "Stock Price",
                data: prices,
                borderColor: "#60a5fa",
                backgroundColor: "rgba(96,165,250,0.2)",
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });
}

// Initial price checker for the UI only (updates the screen while open)
async function updateUIPrice() {
    if (!currentSymbol) return;
    try {
        let url = `https://api.twelvedata.com/price?symbol=${currentSymbol}&apikey=${apiKey}`;
        let response = await fetch(url);
        let data = await response.json();
        if (data.price) {
            document.getElementById("livePrice").textContent = Number(data.price).toFixed(2);
        }
    } catch (e) { console.log("UI update failed"); }
}
setInterval(updateUIPrice, 10000);
