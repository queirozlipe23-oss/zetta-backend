const express = require("express");
const axios = require("axios");
const NodeCache = require("node-cache");

const app = express();
const PORT = process.env.PORT || 3000;

const cache = new NodeCache({ stdTTL: 300 });

const stocks = [
  "PETR4",
  "VALE3",
  "ITUB4",
  "BBDC4",
  "WEGE3"
];

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
    return {
      symbol,
      price: null,
      history: null,
      status: "indisponível"
    };
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

// 🔹 HOME
app.get("/", (req, res) => {
  res.json({
    status: "Zetta V3 online",
    endpoints: {
      scanner: "/scanner",
      robot: "/robot"
    }
  });
});

// 🔹 SCANNER
app.get("/scanner", async (req, res) => {

  const cached = cache.get("scanner");

  if (cached) {
    return res.json({
      source: "cache",
      data: cached
    });
  }

  const results = [];

  for (const symbol of stocks) {
    const stock = await getStock(symbol);

    results.push({
      symbol: stock.symbol,
      price: stock.price
    });
  }

  cache.set("scanner", results);

  res.json({
    source: "api",
    data: results
  });

});

// 🔥 ROBÔ INTELIGENTE
app.get("/robot", async (req, res) => {

  const results = [];

  for (const symbol of stocks) {

    const stock = await getStock(symbol);

    if (!stock.history) {
      results.push({
        symbol,
        status: "indisponível"
      });
      continue;
    }

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
      movingAverage: Number(ma.toFixed(2)),
      signal,
      stopLoss
    });

  }

  res.json(results);

});

// 🔹 START
app.listen(PORT, () => {
  console.log("Zetta V3 rodando na porta " + PORT);
});
