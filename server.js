const express = require("express");
const axios = require("axios");

const app = express();

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

app.get("/", (req, res) => {
  res.send("Zetta API funcionando 🚀");
});

app.get("/stock/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol;

    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;

    const response = await axios.get(url);

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "Erro ao buscar dados",
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
}); 
