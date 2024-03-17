const { Router } = require("express");
const { addComment } = require("../controllers/comment.controller");
const { verifyJwt } = require("../middlewares/authMiddleware");

const router = Router();

router.route("/addComment/:videoId").post(verifyJwt, addComment);

module.exports = router;
