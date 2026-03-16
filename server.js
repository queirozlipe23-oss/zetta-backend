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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.get("/", (req, res) => {
  res.json({
    status: "Zetta backend online",
    endpoints: {
      scanner: "/scanner",
      robot: "/robot"
    }
  });
});

app.get("/scanner", async (req, res) => {

  const cacheKey = "scanner_data";
  const cached = cache.get(cacheKey);

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

      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const quote = response.data.quoteResponse.result[0];

      const data = {
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume
      };

      results.push(data);

      await sleep(2000); // delay 2 segundos

    } catch (error) {

      results.push({
        symbol,
        error: error.message
      });

    }

  }

  cache.set(cacheKey, results);

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

      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

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

      await sleep(2000);

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
  console.log("Servidor Zetta rodando na porta " + PORT);
});
