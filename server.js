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
