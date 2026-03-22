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

// 🔹 FUNÇÃO SEGURA PARA PEGAR DADOS
async function getStock(symbol) {
  try {
    const url = `https://brapi.dev/api/quote/${symbol}`;
    const response = await axios.get(url);

    const data = response.data.results[0];

    if (!data) throw new Error("sem dados");

    return {
      symbol: data.symbol,
      price: data.regularMarketPrice || 0,
      changePercent: data.regularMarketChangePercent || 0,
      volume: data.regularMarketVolume || 0
    };

  } catch (error) {
    return {
      symbol,
      price: null,
      changePercent: null,
      volume: null,
      status: "indisponível"
    };
  }
}

// 🔹 ROTA INICIAL
app.get("/", (req, res) => {
  res.json({
    status: "Zetta backend online",
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
    results.push(stock);
  }

  cache.set("scanner", results);

  res.json({
    source: "api",
    data: results
  });

});

// 🔹 ROBÔ DE TRADE
app.get("/robot", async (req, res) => {

  const results = [];

  for (const symbol of stocks) {

    const stock = await getStock(symbol);

    let signal = "HOLD";

    if (stock.changePercent > 2) signal = "BUY";
    else if (stock.changePercent < -2) signal = "SELL";

    const stopLoss = stock.price
      ? Number((stock.price * 0.98).toFixed(2))
      : null;

    results.push({
      ...stock,
      signal,
      stopLoss
    });

  }

  res.json(results);

});

// 🔹 INICIAR SERVIDOR
app.listen(PORT, () => {
  console.log("Servidor Zetta rodando na porta " + PORT);
});
