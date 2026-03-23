const express = require("express");
const axios = require("axios");
const NodeCache = require("node-cache");

const app = express();
const PORT = process.env.PORT || 3000;

const cache = new NodeCache({ stdTTL: 300 });

// 🔥 LISTA DE AÇÕES
const stocks = [
  "PETR4","VALE3","ITUB4","BBDC4","ABEV3",
  "WEGE3","BBAS3","RENT3","SUZB3","JBSS3",
  "RADL3","LREN3","MGLU3","GGBR4","CSAN3"
];

// 🔹 FUNÇÃO DE DELAY
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 🔹 PEGAR DADOS
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

  } catch (error) {
    return null;
  }
}

// 🔹 RSI
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

// 🔹 MÉDIA MÓVEL
function movingAverage(prices) {
  const sum = prices.reduce((a, b) => a + b, 0);
  return sum / prices.length;
}

// 🔹 SCORE
function calculateScore(rsi, trend) {
  let score = 50;

  if (rsi < 30) score += 20;
  if (rsi > 70) score += 20;

  if (trend === "UP") score += 20;
  if (trend === "DOWN") score += 10;

  return score;
}

// 🔹 HOME
app.get("/", (req, res) => {
  res.json({
    status: "Zetta V5 online",
    endpoints: {
      robot: "/robot",
      top: "/top"
    }
  });
});

// 🔥 ROBÔ ESTÁVEL
app.get("/robot", async (req, res) => {

  const cached = cache.get("robot");

  if (cached) {
    return res.json({
      source: "cache",
      data: cached
    });
  }

  const results = [];

  for (const symbol of stocks) {
    try {

      await sleep(800);

      const stock = await getStock(symbol);

      if (!stock) continue;

      const prices = stock.history.map(h => h.close);

      const rsi = calculateRSI(prices);
      const ma = movingAverage(prices);

      let trend = "SIDEWAYS";
      if (stock.price > ma) trend = "UP";
      else if (stock.price < ma) trend = "DOWN";

      let signal = "HOLD";

      if (rsi < 30 && trend === "UP") signal = "BUY";
      else if (rsi > 70 && trend === "DOWN") signal = "SELL";

      const stopLoss = Number((stock.price * 0.98).toFixed(2));

      results.push({
        symbol: stock.symbol,
        price: stock.price,
        rsi,
        trend,
        signal,
        stopLoss
      });

    } catch (err) {
      // ignora erro
    }
  }

  cache.set("robot", results);

  res.json({
    source: "api",
    data: results
  });

});

// 🔥 TOP 10
app.get("/top", async (req, res) => {

  const cached = cache.get("top");

  if (cached) {
    return res.json({
      source: "cache",
      data: cached
    });
  }

  const results = [];

  for (const symbol of stocks) {
    try {

      await sleep(800);

      const stock = await getStock(symbol);

      if (!stock) continue;

      const prices = stock.history.map(h => h.close);

      const rsi = calculateRSI(prices);
      const ma = movingAverage(prices);

      let trend = "SIDEWAYS";
      if (stock.price > ma) trend = "UP";
      else if (stock.price < ma) trend = "DOWN";

      let signal = "HOLD";

      if (rsi < 30 && trend === "UP") signal = "BUY";
      else if (rsi > 70 && trend === "DOWN") signal = "SELL";

      const score = calculateScore(rsi, trend);

      results.push({
        symbol: stock.symbol,
        price: stock.price,
        rsi,
        trend,
        signal,
        score
      });

    } catch (err) {
      // ignora erro
    }
  }

  const top = results
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  cache.set("top", top);

  res.json({
    source: "api",
    data: top
  });

});

app.listen(PORT, () => {
  console.log("Zetta V5 rodando na porta " + PORT);
});
