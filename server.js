const express = require("express");
const axios = require("axios");
const NodeCache = require("node-cache");

const app = express();
const PORT = process.env.PORT || 3000;

const cache = new NodeCache({ stdTTL: 300 });

const stocks = [
  "PETR4.SA",
  "VALE3.SA",
  "ITUB4.SA",
  "BBDC4.SA",
  "WEGE3.SA"
];

app.get("/", (req, res) => {
  res.json({
    status: "Zetta backend online",
    endpoints: {
      scanner: "/scanner",
      robot: "/robot"
    }
  });
});

// SCANNER
app.get("/scanner", async (req, res) => {

  try {

    const cacheKey = "market_data";

    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const symbols = stocks.join(",");

    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;

    const response = await axios.get(url);

    const quotes = response.data.quoteResponse.result;

    const results = quotes.map(q => ({
      symbol: q.symbol,
      price: q.regularMarketPrice,
      changePercent: q.regularMarketChangePercent,
      volume: q.regularMarketVolume
    }));

    cache.set(cacheKey, results);

    res.json(results);

  } catch (error) {

    res.json({
      error: error.message
    });

  }

});

// ROBÔ
app.get("/robot", async (req, res) => {

  try {

    const symbols = stocks.join(",");

    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;

    const response = await axios.get(url);

    const quotes = response.data.quoteResponse.result;

    const results = quotes.map(q => {

      let signal = "HOLD";

      if (q.regularMarketChangePercent > 1) signal = "BUY";
      if (q.regularMarketChangePercent < -1) signal = "SELL";

      const stopLoss = Number((q.regularMarketPrice * 0.98).toFixed(2));

      return {
        symbol: q.symbol,
        price: q.regularMarketPrice,
        changePercent: q.regularMarketChangePercent,
        signal,
        stopLoss
      };

    });

    res.json(results);

  } catch (error) {

    res.json({
      error: error.message
    });

  }

});

app.listen(PORT, () => {
  console.log("Servidor Zetta rodando na porta " + PORT);
});
