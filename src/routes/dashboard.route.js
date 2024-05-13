const { Router } = require("express");

const {
    getChannelStats,
    getChannelVideos
} = require("../controllers/dashboard.controller");
const { verifyJwt } = require("../middlewares/authMiddleware");

const router = Router();

router.route("/getChannelStats").get(verifyJwt, getChannelStats);
router.route("/getChannelVideos").get(verifyJwt, getChannelVideos);

module.exports = router;
