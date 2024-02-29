const { Router } = require("express");
const { upload } = require("../middlewares/multer.js");
const { verifyJwt } = require("../middlewares/authMiddleware.js");
const {
  publishVideo,
  getVideoById,
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
  publishVideo
);

router.route("/getVideo/:videoId").get(verifyJwt, getVideoById);

module.exports = router;
