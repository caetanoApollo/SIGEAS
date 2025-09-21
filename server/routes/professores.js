const express = require("express");
const router = express.Router();
const professores = require("../controllers/professoresController");
const auth = require("../middleware/auth");
const { permit } = require("../middleware/roles");

router.get("/", auth, professores.list);
router.post("/", auth, permit("admin"), professores.create);
router.put("/:id", auth, permit("admin"), professores.update);
router.delete("/:id", auth, permit("admin"), professores.remove);

module.exports = router;
