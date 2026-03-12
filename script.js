let chart;
let alertPrice = null;
let lastPrice = null;
let currentSymbol = "";
let currentInterval = "1min";
let chartType = "line";
const apiKey = "d082b96785544f2aae33cffad13045a6";

let watchlist = [];

// Set Alert
function setAlert() {
    alertPrice = Number(document.getElementById("alertPrice").value);
    alert("Alert set for $" + alertPrice);
}

// Add to Watchlist
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

// Load Chart
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
    lastPrice = prices[prices.length - 1];
    document.getElementById("livePrice").textContent = lastPrice.toFixed(2);
}

// Draw Chart
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

// Set Chart Type
function setChartType(type) {
    chartType = type;
    if (currentSymbol) loadChart(currentInterval);
}

// Check Price & Alert
async function checkPrice() {
    if (!currentSymbol) return;

    let url = `https://api.twelvedata.com/price?symbol=${currentSymbol}&apikey=${apiKey}`;
    let response = await fetch(url);
    let data = await response.json();
    let price = Number(data.price);

    document.getElementById("livePrice").textContent = price.toFixed(2);

    if (alertPrice && lastPrice < alertPrice && price >= alertPrice) {

    alert(`${currentSymbol} reached $${alertPrice}`);

    let audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
    audio.play();

    // SEND TELEGRAM MESSAGE
    fetch("https://stock-app-hqb2.onrender.com/send-alert", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: `📈 ${currentSymbol} reached $${alertPrice}\nCurrent price: $${price}`
        })
    });
}

    lastPrice = price;
}

// Update every 5 sec
setInterval(checkPrice, 5000);