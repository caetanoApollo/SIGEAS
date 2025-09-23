const express = require("express");
const router = express.Router();
const alunos = require("../controllers/alunosController");
const auth = require("../middleware/auth");
const { permit } = require("../middleware/roles");

router.get("/", auth, alunos.list);
router.post("/", auth, permit("admin"), alunos.create);
router.put("/:id", auth, permit("admin"), alunos.update);
router.delete("/:id", auth, permit("admin"), alunos.remove);

router.get("/:id/turma", auth, alunos.getTurma);
router.get("/:id/presencas", auth, alunos.getPresencas);
router.get("/:id/notas", auth, alunos.getNotas);
router.get("/turma/:turmaId", auth, alunos.listByTurma);
router.get("/:id", auth, alunos.get);

module.exports = router;