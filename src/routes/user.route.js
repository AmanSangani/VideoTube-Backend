const { Router } = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getLoggedInUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
} = require("../controllers/user.controller.js");
const { upload } = require("../middlewares/multer.js");
const { verifyJwt } = require("../middlewares/authMiddleware.js");

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 2,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(verifyJwt, logoutUser);

router.route("/refreh-accessToken").post(refreshAccessToken);

router.route("/change-password").post(verifyJwt, changePassword);

router.route("/current-user").get(verifyJwt, getLoggedInUser);

router.route("/update-account-details").patch(verifyJwt, updateAccountDetails);

router
  .route("/update-user-avatar")
  .patch(verifyJwt, upload.single(avatar), updateUserAvatar);

router
  .route("/update-user-coverImage")
  .patch(verifyJwt, upload.single(coverImage), updateUserCoverImage);

router.route("/c/:username").get(verifyJwt, getUserChannelProfile);

router.route("/watchHistory").get(verifyJwt, getWatchHistory);

module.exports = router;
