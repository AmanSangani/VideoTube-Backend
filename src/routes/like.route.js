const { Router } = require("express");
const { toggleVideoLike } = require("../controllers/like.controller");
const { verifyJwt } = require("../middlewares/authMiddleware.js");

const router = Router();

router.route("/likeVideo/:videoId").get(verifyJwt, toggleVideoLike);

module.exports = router;
