const pool = require("../config/db");

exports.list = async (req, res) => {
    const [rows] = await pool.query(
        "SELECT t.*, p.nome AS professor_nome FROM turmas t LEFT JOIN professores p ON t.professorId = p.id"
    );
    res.json(rows);
};

exports.create = async (req, res) => {
    const { id, nome, curso, professorId, vagas, descricao, horario } = req.body;
    await pool.query(
        "INSERT INTO turmas (id, nome, curso, professorId, vagas, descricao, horario) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [id, nome, curso, professorId, vagas, descricao, horario]
    );
    res.status(201).json({ ok: true });
};

exports.update = async (req, res) => {
    const { id } = req.params;
    const { nome, curso, professorId, vagas, descricao, horario } = req.body;
    await pool.query(
        "UPDATE turmas SET nome=?, curso=?, professorId=?, vagas=?, descricao=?, horario=? WHERE id=?",
        [nome, curso, professorId, vagas, descricao, horario, id]
    );
    res.json({ ok: true });
};

exports.remove = async (req, res) => {
    const { id } = req.params;
    await pool.query("DELETE FROM turmas WHERE id=?", [id]);
    res.json({ ok: true });
};
