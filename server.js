const express = require("express");
const axios = require("axios");
const NodeCache = require("node-cache");

const app = express();

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const cache = new NodeCache({ stdTTL: 300 });

app.get("/", (req, res) => {
  res.send("Zetta API funcionando 🚀");
});

app.get("/stock/:symbol", async (req, res) => {
  const symbol = req.params.symbol;

  const cached = cache.get(symbol);
  if (cached) {
    return res.json({
      source: "cache",
      data: cached
    });
  }

  try {
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
    );

    cache.set(symbol, response.data);

    res.json({
      source: "api",
      data: response.data
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar ação" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
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

      const response = await axios.get(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
      );

      cache.set(symbol, response.data);

      results.push({
        symbol,
        source: "api",
        data: response.data
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
