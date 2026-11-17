import express from "express";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Todos los endpoints del backend viven bajo /api
const api = express.Router();

api.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", api);

app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`);
});
