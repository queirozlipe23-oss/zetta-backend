const express = require("express");
const NodeCache = require("node-cache");
const yahooFinance = require("yahoo-finance2").default;

const app = express();
const PORT = process.env.PORT || 3000;

// cache 5 minutos
const cache = new NodeCache({ stdTTL: 300 });

app.use(express.json());

// rota inicial
app.get("/", (req, res) => {
  res.json({
    status: "Zetta backend online",
    endpoints: {
      scanner: "/scanner",
      robot: "/robot"
    }
  });
});

// lista inicial de ações
const stocks = [
  "PETR4.SA",
  "VALE3.SA",
  "ITUB4.SA",
  "BBDC4.SA",
  "WEGE3.SA"
];

// SCANNER DE MERCADO
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

      const quote = await yahooFinance.quote(symbol);

      const data = {
        price: quote.regularMarketPrice || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        volume: quote.regularMarketVolume || 0,
        high: quote.regularMarketDayHigh || 0,
        low: quote.regularMarketDayLow || 0
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
        error: "erro ao buscar dados"
      });

    }

  }

  res.json(results);

});

// ROBÔ DE TRADE
app.get("/robot", async (req, res) => {

  const results = [];

  for (const symbol of stocks) {

    try {

      const history = await yahooFinance.historical(symbol, {
        period1: "2024-01-01",
        interval: "1d"
      });

      if (!history || history.length < 15) {
        continue;
      }

      const closes = history.slice(-14).map(c => c.close);

      const average =
        closes.reduce((a, b) => a + b, 0) / closes.length;

      const lastPrice = closes[closes.length - 1];

      let signal = "HOLD";

      if (lastPrice > average) signal = "BUY";
      if (lastPrice < average) signal = "SELL";

      const stopLoss = Number((lastPrice * 0.98).toFixed(2));

      results.push({
        symbol,
        price: lastPrice,
        average,
        signal,
        stopLoss
      });

    } catch (error) {

      results.push({
        symbol,
        error: "erro na análise"
      });

    }

  }

  res.json(results);

});

// iniciar servidor
app.listen(PORT, () => {
  console.log("Servidor Zetta rodando na porta " + PORT);
});
