const express = require("express");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Zetta API está funcionando 🚀");
});

app.get("/status", (req, res) => {
  res.json({
    app: "Zetta",
    status: "online",
    version: "1.0"
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
