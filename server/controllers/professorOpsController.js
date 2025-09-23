const pool = require("../config/db");

exports.registrarChamada = async (req, res) => {
    const { alunoId, turmaId, data, presente, bimestre } = req.body;
    await pool.query(
        "INSERT INTO presencas (alunoId, turmaId, data, presente, bimestre) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE presente=?, bimestre=?",
        [alunoId, turmaId, data, presente, bimestre, presente, bimestre]
    );
    res.json({ ok: true });
};

exports.lancarNota = async (req, res) => {
    const { alunoId, turmaId, bimestre, disciplina, valor } = req.body;
    await pool.query(
        "INSERT INTO notas (alunoId, turmaId, bimestre, disciplina, valor) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE disciplina=?, valor=?",
        [alunoId, turmaId, bimestre, disciplina, valor, disciplina, valor]
    );
    res.json({ ok: true });
};