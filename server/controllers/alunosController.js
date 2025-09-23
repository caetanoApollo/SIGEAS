const pool = require("../config/db");
const bcrypt = require("bcryptjs");

exports.list = async (req, res) => {
    const [rows] = await pool.query("SELECT a.*, m.turmaId FROM alunos a LEFT JOIN matriculas m ON a.id = m.alunoId");
    res.json(rows);
};

exports.listByTurma = async (req, res) => {
    const { turmaId } = req.params;
    const [rows] = await pool.query("SELECT a.* FROM alunos a INNER JOIN matriculas m ON a.id = m.alunoId WHERE m.turmaId=?", [turmaId]);
    res.json(rows);
};

exports.get = async (req, res) => {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT a.*, m.turmaId FROM alunos a LEFT JOIN matriculas m ON a.id=m.alunoId WHERE a.id = ?", [id]);
    res.json(rows[0] || {});
};

exports.create = async (req, res) => {
    const { id, nome, email, dataNascimento, endereco, turmaId } = req.body;
    await pool.query(
        "INSERT INTO alunos (id, nome, email, dataNascimento, endereco) VALUES (?, ?, ?, ?, ?)",
        [id, nome, email, dataNascimento, endereco]
    );

    const defaultPassword = await bcrypt.hash(`${nome}123`, 10);
    await pool.query("INSERT INTO usuarios (username, password, role, name, associated_id) VALUES (?, ?, 'aluno', ?, ?)", [
        email,
        defaultPassword,
        nome,
        id
    ]);

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
    await pool.query("DELETE FROM matriculas WHERE alunoId=?", [id]);
    await pool.query("DELETE FROM notas WHERE alunoId=?", [id]);
    await pool.query("DELETE FROM presencas WHERE alunoId=?", [id]);
    await pool.query("DELETE FROM alunos WHERE id=?", [id]);
    await pool.query("DELETE FROM usuarios WHERE associated_id=?", [id]);
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