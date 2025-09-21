const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
require("dotenv").config();

exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await pool.query("SELECT * FROM usuarios WHERE username = ?", [username]);
        if (rows.length === 0) return res.status(401).json({ error: "Credenciais inválidas" });

        const user = rows[0];
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: "Credenciais inválidas" });

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, associated_id: user.associated_id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXP }
        );

        res.json({ token, role: user.role, name: user.name, associated_id: user.associated_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
