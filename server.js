app.get("/robot", async (req, res) => {

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

      const history = await yahooFinance.historical(symbol, {
        period1: "2024-01-01",
        interval: "1d"
      });

      if (!history || history.length < 15) {
        continue;
      }

      const closes = history.slice(-14).map(c => c.close);

      const avg = closes.reduce((a,b)=>a+b,0) / closes.length;

      const lastPrice = closes[closes.length - 1];

      let signal = "HOLD";

      if (lastPrice > avg) {
        signal = "BUY";
      }

      if (lastPrice < avg) {
        signal = "SELL";
      }

      const stopLoss = lastPrice * 0.98;

      results.push({
        symbol,
        price: lastPrice,
        average: avg,
        signal,
        stopLoss
      });

    } catch (error) {

      results.push({
        symbol,
        error: "erro análise"
      });

    }

  }

  res.json(results);

});
