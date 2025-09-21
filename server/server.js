require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const turmasRoutes = require("./routes/turmas");
const professoresRoutes = require("./routes/professores");
const alunosRoutes = require("./routes/alunos");
const profOpsRoutes = require("./routes/professorOps");

const app = express();
app.use(cors());
app.use(express.json());

// Rotas
app.use("/auth", authRoutes);
app.use("/turmas", turmasRoutes);
app.use("/professores", professoresRoutes);
app.use("/alunos", alunosRoutes);
app.use("/", profOpsRoutes);

app.get("/", (req, res) => res.json({ ok: true, msg: "Sigeas API (MySQL puro)" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor rodando na porta: http://localhost:${PORT}`));
