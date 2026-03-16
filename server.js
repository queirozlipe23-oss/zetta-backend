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

app.get("/scanner", async (req, res) => {

  const results = [];

  for (const symbol of stocks) {

    try {

      const cached = cache.get(symbol);

      if (cached) {
        results.push({
          symbol,
          source: "cache",
          data: cached
        });
        continue;
      }

      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;

      const response = await axios.get(url);

      const quote = response.data.quoteResponse.result[0];

      if (!quote) {
        throw new Error("sem dados");
      }

      const data = {
        price: quote.regularMarketPrice,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume,
        high: quote.regularMarketDayHigh,
        low: quote.regularMarketDayLow
      };

      cache.set(symbol, data);

      results.push({
        symbol,
        source: "api",
        data
      });

    } catch (error) {

      results.push({
        symbol,
        error: error.message
      });

    }

  }

  res.json(results);

});

app.get("/robot", async (req, res) => {

  const results = [];

  for (const symbol of stocks) {

    try {

      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;

      const response = await axios.get(url);

      const quote = response.data.quoteResponse.result[0];

      if (!quote) {
        throw new Error("sem dados");
      }

      const price = quote.regularMarketPrice;

      let signal = "HOLD";

      if (quote.regularMarketChangePercent > 1) signal = "BUY";
      if (quote.regularMarketChangePercent < -1) signal = "SELL";

      const stopLoss = Number((price * 0.98).toFixed(2));

      results.push({
        symbol,
        price,
        changePercent: quote.regularMarketChangePercent,
        signal,
        stopLoss
      });

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
