const express = require("express");
const router = express.Router();
const turmas = require("../controllers/turmasController");
const auth = require("../middleware/auth");
const { permit } = require("../middleware/roles");

router.get("/", auth, turmas.list);
router.post("/", auth, permit("admin"), turmas.create);
router.put("/:id", auth, permit("admin"), turmas.update);
router.delete("/:id", auth, permit("admin"), turmas.remove);

module.exports = router;
