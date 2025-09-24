const express = require("express");
const router = express.Router();
const ops = require("../controllers/professorOpsController");
const auth = require("../middleware/auth");
const { permit } = require("../middleware/roles");

router.post("/chamada", auth, permit("professor"), ops.registrarChamada);
router.post("/notas", auth, permit("professor"), ops.lancarNota);
router.delete("/notas/:id", auth, permit("professor"), ops.removeNota);

module.exports = router;