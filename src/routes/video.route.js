const { Router } = require("express");
const { upload } = require("../middlewares/multer.js");
const { verifyJwt } = require("../middlewares/authMiddleware.js");
const {
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
} = require("../controllers/video.controller.js");

const router = Router();

router.route("/publishVideo").post(
    verifyJwt,
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
    ]),
    publishVideo,
);

router.route("/getVideo/:videoId").get(verifyJwt, getVideoById);

router
    .route("/updateVideo/:videoId")
    .post(verifyJwt, upload.single("thumbnail"), updateVideo);

router.route("/deleteVideo/:videoId").post(verifyJwt, deleteVideo);

module.exports = router;
