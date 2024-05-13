const { Router } = require("express");
const { healthCheck } = require("../controllers/healthCheck.controller.js");
const { verifyJwt } = require("../middlewares/authMiddleware");

const router = Router();

router.route("/healthCheck").get(verifyJwt, healthCheck);

module.exports = router;
