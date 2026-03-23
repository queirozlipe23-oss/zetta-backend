const express = require("express");
const axios = require("axios");
const NodeCache = require("node-cache");

const app = express();
const PORT = process.env.PORT || 3000;

const cache = new NodeCache({ stdTTL: 300 });

const stocks = [
  "PETR4","VALE3","ITUB4","BBDC4","ABEV3",
  "WEGE3","BBAS3","RENT3","SUZB3","JBSS3",
  "RADL3","LREN3","MGLU3","GGBR4","CSAN3"
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getStock(symbol) {
  try {
    const url = `https://brapi.dev/api/quote/${symbol}?range=1mo&interval=1d`;
    const response = await axios.get(url);

    const data = response.data.results[0];

    if (!data || !data.historicalDataPrice) {
      throw new Error("sem histórico");
    }

    return {
      symbol: data.symbol,
      price: data.regularMarketPrice,
      history: data.historicalDataPrice
    };

  } catch {
    return null;
  }
}

// RSI
function calculateRSI(prices) {
  let gains = 0;
  let losses = 0;

  for (let i = 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  const avgGain = gains / prices.length;
  const avgLoss = losses / prices.length;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return Number((100 - (100 / (1 + rs))).toFixed(2));
}

// Média móvel
function movingAverage(prices) {
  return prices.reduce((a, b) => a + b, 0) / prices.length;
}

// 🔥 ROMPIMENTO
function detectBreakout(prices) {
  const recent = prices.slice(-5);
  const maxRecent = Math.max(...recent);
  const current = prices[prices.length - 1];

  return current >= maxRecent;
}

// 🔥 VOLUME (simulado com variação de preço)
function detectVolumeStrength(prices) {
  const last = prices[prices.length - 1];
  const prev = prices[prices.length - 2];

  const variation = Math.abs((last - prev) / prev);

  return variation > 0.02; // 2% de movimento
}

// SCORE
function calculateScore(rsi, trend, breakout, volume) {
  let score = 50;

  if (rsi < 30) score += 10;
  if (rsi > 70) score += 10;

  if (trend === "UP") score += 15;
  if (trend === "DOWN") score += 5;

  if (breakout) score += 25;
  if (volume) score += 25;

  return score;
}

// HOME
app.get("/", (req, res) => {
  res.json({
    status: "Zetta V7 online",
    endpoints: {
      robot: "/robot",
      top: "/top"
    }
  });
});

// ROBÔ
app.get("/robot", async (req, res) => {

  const results = [];

  for (const symbol of stocks) {

    await sleep(800);

    const stock = await getStock(symbol);
    if (!stock) continue;

    const prices = stock.history.map(h => h.close);

    const rsi = calculateRSI(prices);
    const ma = movingAverage(prices);
    const breakout = detectBreakout(prices);
    const volume = detectVolumeStrength(prices);

    let trend = "SIDEWAYS";
    if (stock.price > ma) trend = "UP";
    else if (stock.price < ma) trend = "DOWN";

    let signal = "HOLD";

    // 🔥 LÓGICA FINAL
    if (breakout && volume && trend === "UP") signal = "BUY";
    else if (rsi > 75 && trend === "DOWN") signal = "SELL";

    const stopLoss = Number((stock.price * 0.97).toFixed(2));

    results.push({
      symbol: stock.symbol,
      price: stock.price,
      rsi,
      trend,
      breakout,
      volume,
      signal,
      stopLoss
    });

  }

  res.json(results);

});

// TOP
app.get("/top", async (req, res) => {

  const results = [];

  for (const symbol of stocks) {

    await sleep(800);

    const stock = await getStock(symbol);
    if (!stock) continue;

    const prices = stock.history.map(h => h.close);

    const rsi = calculateRSI(prices);
    const ma = movingAverage(prices);
    const breakout = detectBreakout(prices);
    const volume = detectVolumeStrength(prices);

    let trend = "SIDEWAYS";
    if (stock.price > ma) trend = "UP";
    else if (stock.price < ma) trend = "DOWN";

    let signal = "HOLD";

    if (breakout && volume && trend === "UP") signal = "BUY";
    else if (rsi > 75 && trend === "DOWN") signal = "SELL";

    const score = calculateScore(rsi, trend, breakout, volume);

    results.push({
      symbol: stock.symbol,
      price: stock.price,
      rsi,
      trend,
      breakout,
      volume,
      signal,
      score
    });

  }

  const top = results
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  res.json(top);

});

app.listen(PORT, () => {
  console.log("Zetta V7 rodando na porta " + PORT);
});
