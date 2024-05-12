const { Router } = require("express");
const {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
} = require("../controllers/playlist.controller.js");
const { verifyJwt } = require("../middlewares/authMiddleware.js");

const router = Router();

router.route("/createPlaylist").post(verifyJwt, createPlaylist);
router.route("/getUserPlaylist").get(verifyJwt, getUserPlaylists);
router.route("/getPlaylistById/:playlistId").get(verifyJwt, getPlaylistById);
router.route("/addVideoToPlaylist/:playlistId/:videoId").post(verifyJwt, addVideoToPlaylist);
router.route("/removeVideoFromPlaylist/:playlistId/:videoId").post(verifyJwt, removeVideoFromPlaylist);
router.route("/deletePlaylist/:playlistId").get(verifyJwt, deletePlaylist);
router.route("/updatePlaylist/:playlistId").post(verifyJwt, updatePlaylist);

module.exports = router;
