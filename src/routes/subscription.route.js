const { Router } = require("express");
const {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
} = require("../controllers/subscription.controller.js");
const { verifyJwt } = require("../middlewares/authMiddleware.js");

const router = Router();

router.route("/toggleSubscription/:channelId").post(verifyJwt, toggleSubscription);
router.route("/getUserChannelSubscribers/:channelId").get(verifyJwt, getUserChannelSubscribers);
router.route("/getSubscribedChannels/:channelId").get(verifyJwt, getSubscribedChannels);

module.exports = router;
