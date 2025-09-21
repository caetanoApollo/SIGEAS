const pool = require("../config/db");

exports.list = async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM professores");
    res.json(rows);
};

exports.create = async (req, res) => {
    const { id, nome, email, telefone, departamento } = req.body;
    await pool.query(
        "INSERT INTO professores (id, nome, email, telefone, departamento) VALUES (?, ?, ?, ?, ?)",
        [id, nome, email, telefone, departamento]
    );
    res.status(201).json({ ok: true });
};

exports.update = async (req, res) => {
    const { id } = req.params;
    const { nome, email, telefone, departamento } = req.body;
    await pool.query(
        "UPDATE professores SET nome=?, email=?, telefone=?, departamento=? WHERE id=?",
        [nome, email, telefone, departamento, id]
    );
    res.json({ ok: true });
};

exports.remove = async (req, res) => {
    const { id } = req.params;
    await pool.query("DELETE FROM professores WHERE id=?", [id]);
    res.json({ ok: true });
};
