const pool = require("../config/db");

exports.registrarChamada = async (req, res) => {
    const { alunoId, turmaId, data, presente } = req.body;
    await pool.query(
        "INSERT INTO presencas (alunoId, turmaId, data, presente) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE presente=?",
        [alunoId, turmaId, data, presente, presente]
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
