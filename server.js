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

const axiosInstance = axios.create({
  timeout: 10000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "Connection": "keep-alive"
  }
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.get("/", (req, res) => {
  res.json({
    status: "Zetta backend online"
  });
});

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

    try {

      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;

      const response = await axiosInstance.get(url);

      const quote = response.data.quoteResponse.result[0];

      results.push({
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume
      });

      await sleep(1500);

    } catch (error) {

      results.push({
        symbol,
        error: error.message
      });

    }

  }

  cache.set("scanner", results);

  res.json({
    source: "api",
    data: results
  });

});

app.get("/robot", async (req, res) => {

  const results = [];

  for (const symbol of stocks) {

    try {

      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;

      const response = await axiosInstance.get(url);

      const quote = response.data.quoteResponse.result[0];

      let signal = "HOLD";

      if (quote.regularMarketChangePercent > 1) signal = "BUY";
      if (quote.regularMarketChangePercent < -1) signal = "SELL";

      const stopLoss = Number((quote.regularMarketPrice * 0.98).toFixed(2));

      results.push({
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        changePercent: quote.regularMarketChangePercent,
        signal,
        stopLoss
      });

      await sleep(1500);

    } catch (error) {

      results.push({
        symbol,
        error: error.message
      });

    }

  }

  res.json(results);

});

app.listen(PORT, () => {
  console.log("Zetta backend rodando na porta " + PORT);
});
