const pool = require("../config/db");
const bcrypt = require("bcryptjs");

exports.list = async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM professores");
    res.json(rows);
};

exports.create = async (req, res) => {
    const { id, nome, email, telefone, materia } = req.body;
    await pool.query(
        "INSERT INTO professores (id, nome, email, telefone, materia) VALUES (?, ?, ?, ?, ?)",
        [id, nome, email, telefone, materia]
    );
    const defaultPassword = await bcrypt.hash(`${nome}123`, 10);
    await pool.query("INSERT INTO usuarios (username, password, role, name, associated_id) VALUES (?, ?, 'professor', ?, ?)", [
        email,
        defaultPassword,
        nome,
        id
    ]);
    res.status(201).json({ ok: true });
};

exports.update = async (req, res) => {
    const { id } = req.params;
    const { nome, email, telefone, materia } = req.body;
    await pool.query(
        "UPDATE professores SET nome=?, email=?, telefone=?, materia=? WHERE id=?",
        [nome, email, telefone, materia, id]
    );
    res.json({ ok: true });
};

exports.remove = async (req, res) => {
    const { id } = req.params;
    await pool.query("DELETE FROM turmas WHERE professorId=?", [id]);
    await pool.query("DELETE FROM professores WHERE id=?", [id]);
    await pool.query("DELETE FROM usuarios WHERE associated_id=?", [id]);
    res.json({ ok: true });
};