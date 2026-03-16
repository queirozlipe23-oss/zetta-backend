const express = require("express");
const NodeCache = require("node-cache");
const yahooFinance = require("yahoo-finance2").default;

const app = express();
const PORT = process.env.PORT || 3000;

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
    "WEGE3.SA"
  ];

  const results = [];

  for (const symbol of stocks) {

    try {

      const cached = cache.get(symbol);

      if (cached) {
        results.push({
          symbol: symbol,
          source: "cache",
          data: cached
        });
        continue;
      }

      const quote = await yahooFinance.quote(symbol);

      const data = {
        price: quote.regularMarketPrice || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        volume: quote.regularMarketVolume || 0
      };

      cache.set(symbol, data);

      results.push({
        symbol: symbol,
        source: "api",
        data: data
      });

    } catch (error) {

      results.push({
        symbol: symbol,
        error: error.message
      });

    }

  }

  res.json(results);

});

app.listen(PORT, () => {
  console.log("Servidor Zetta rodando na porta " + PORT);
});
