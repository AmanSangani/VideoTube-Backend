const { Router } = require("express");
const { registerUser } = require("../controllers/user.controller.js");
const { upload } = require("../middlewares/multer.js");

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

module.exports = router;
