require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const api = require("./src/routes/api");
const { initSchema } = require("./src/lib/db");

const app = express();
const port = Number(process.env.PORT || 3000);

app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 60 * 1000, max: 240 }));
app.use(express.static(path.join(__dirname, "public"), { maxAge: "1h" }));

app.use("/api", api);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "Erreur serveur", detail: process.env.NODE_ENV === "production" ? undefined : error.message });
});

initSchema()
  .catch((error) => {
    console.warn("Schema MySQL non initialise automatiquement:", error.message);
  })
  .finally(() => {
    app.listen(port, () => {
      console.log(`CRP Advisor running on port ${port}`);
    });
  });
