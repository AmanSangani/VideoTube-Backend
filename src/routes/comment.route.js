const { Router } = require("express");
const {
    addComment,
    getVideoComments,
    updateComment,
    deleteComment,
} = require("../controllers/comment.controller");
const { verifyJwt } = require("../middlewares/authMiddleware");

const router = Router();

router.route("/addComment/:videoId").post(verifyJwt, addComment);
router.route("/getVideoComments/:videoId").get(verifyJwt, getVideoComments);
router.route("/updateComment/:commentId").post(verifyJwt, updateComment);
router.route("/deleteComment/:commentId").post(verifyJwt, deleteComment);

module.exports = router;
