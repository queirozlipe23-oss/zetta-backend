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

async function getStock(symbol) {

  const url = `https://brapi.dev/api/quote/${symbol}`;

  const response = await axios.get(url);

  const data = response.data.results[0];

  return {
    symbol: data.symbol,
    price: data.regularMarketPrice,
    changePercent: data.regularMarketChangePercent,
    volume: data.regularMarketVolume
  };
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

      const stock = await getStock(symbol);

      results.push(stock);

    } catch (error) {

      results.push({
        symbol,
        error: "erro ao buscar dados"
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

      const stock = await getStock(symbol);

      let signal = "HOLD";

      if (stock.changePercent > 1) signal = "BUY";
      if (stock.changePercent < -1) signal = "SELL";

      const stopLoss = Number((stock.price * 0.98).toFixed(2));

      results.push({
        ...stock,
        signal,
        stopLoss
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

app.listen(PORT, () => {

  console.log("Servidor Zetta rodando na porta " + PORT);

});
