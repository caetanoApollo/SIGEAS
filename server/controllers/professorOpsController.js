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
    const { alunoId, turmaId, bimestre, disciplina, valor, avaliacaoId, peso } = req.body;
    if (avaliacaoId) {
        await pool.query(
            "UPDATE notas SET alunoId=?, turmaId=?, bimestre=?, disciplina=?, valor=?, peso=? WHERE avaliacaoId=?",
            [alunoId, turmaId, bimestre, disciplina, valor, peso, avaliacaoId]
        );
    } else {
        await pool.query(
            "INSERT INTO notas (alunoId, turmaId, bimestre, disciplina, valor, peso) VALUES (?, ?, ?, ?, ?, ?)",
            [alunoId, turmaId, bimestre, disciplina, valor, peso]
        );
    }
    res.json({ ok: true });
};

exports.removeNota = async (req, res) => {
    const { id } = req.params;
    await pool.query("DELETE FROM notas WHERE avaliacaoId=?", [id]);
    res.json({ ok: true });
};