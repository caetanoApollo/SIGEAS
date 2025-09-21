const pool = require("../config/db");

exports.list = async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM alunos");
    res.json(rows);
};

exports.create = async (req, res) => {
    const { id, nome, email, dataNascimento, endereco, turmaId } = req.body;
    await pool.query(
        "INSERT INTO alunos (id, nome, email, dataNascimento, endereco) VALUES (?, ?, ?, ?, ?)",
        [id, nome, email, dataNascimento, endereco]
    );
    if (turmaId) {
        await pool.query("INSERT INTO matriculas (alunoId, turmaId, data_matricula) VALUES (?, ?, NOW())", [id, turmaId]);
    }
    res.status(201).json({ ok: true });
};

exports.update = async (req, res) => {
    const { id } = req.params;
    const { nome, email, dataNascimento, endereco, turmaId } = req.body;
    await pool.query("UPDATE alunos SET nome=?, email=?, dataNascimento=?, endereco=? WHERE id=?", [
        nome,
        email,
        dataNascimento,
        endereco,
        id
    ]);
    if (turmaId) {
        await pool.query("DELETE FROM matriculas WHERE alunoId=?", [id]);
        await pool.query("INSERT INTO matriculas (alunoId, turmaId, data_matricula) VALUES (?, ?, NOW())", [id, turmaId]);
    }
    res.json({ ok: true });
};

exports.remove = async (req, res) => {
    const { id } = req.params;
    await pool.query("DELETE FROM alunos WHERE id=?", [id]);
    res.json({ ok: true });
};

exports.getTurma = async (req, res) => {
    const { id } = req.params;
    const [rows] = await pool.query(
        "SELECT t.* FROM turmas t INNER JOIN matriculas m ON t.id=m.turmaId WHERE m.alunoId=?",
        [id]
    );
    res.json(rows[0] || {});
};

exports.getPresencas = async (req, res) => {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM presencas WHERE alunoId=?", [id]);
    res.json(rows);
};

exports.getNotas = async (req, res) => {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM notas WHERE alunoId=?", [id]);
    res.json(rows);
};
