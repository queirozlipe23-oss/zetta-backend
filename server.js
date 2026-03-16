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

async function getStock(symbol) {

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;

  const response = await axios.get(url);

  const result = response.data.chart.result[0];

  const price = result.meta.regularMarketPrice;
  const previous = result.meta.previousClose;

  const changePercent = ((price - previous) / previous) * 100;

  return {
    symbol,
    price,
    changePercent
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

      const data = await getStock(symbol);

      results.push(data);

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

      const data = await getStock(symbol);

      let signal = "HOLD";

      if (data.changePercent > 1) signal = "BUY";
      if (data.changePercent < -1) signal = "SELL";

      const stopLoss = Number((data.price * 0.98).toFixed(2));

      results.push({
        ...data,
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
