const express = require("express");
const yahooFinance = require("yahoo-finance2").default;
const NodeCache = require("node-cache");

const app = express();

const PORT = process.env.PORT || 3000;

// cache de 5 minutos
const cache = new NodeCache({ stdTTL: 300 });

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "Zetta backend online",
    scanner: "/scanner"
  });
});

app.get("/scanner", async (req, res) => {

  const stocks = [
    "PETR4.SA",
    "VALE3.SA",
    "ITUB4.SA",
    "BBDC4.SA",
    "ABEV3.SA",
    "WEGE3.SA",
    "BBAS3.SA",
    "SUZB3.SA",
    "RENT3.SA",
    "MGLU3.SA"
  ];

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

      const quote = await yahooFinance.quote(symbol);

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
        error
