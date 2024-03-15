const { default: mongoose } = require("mongoose");
const { Like } = require("../models/like.model.js");
const { Video } = require("../models/video.model.js");
const { ApiError } = require("../utils/ApiError.js");
const { asyncHandler } = require("../utils/asyncHandler.js");
const { ApiResponse } = require("../utils/ApiResponse.js");

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        return new ApiError(400, "VideoId Not Found");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const alreadyLiked = await Like.find({
        video: videoId,
        likedBy: req.user?._id,
    });
    console.log("Already liked : " + alreadyLiked);

    if (alreadyLiked.length == 0) {
        const like = await Like.create({
            video: new mongoose.Types.ObjectId(videoId),
            likedBy: new mongoose.Types.ObjectId(req.user?._id),
        });

        if (!like) {
            throw new ApiError(500, "Like Not Done | Internal Server Error");
        }

        return res.status(200).json(new ApiResponse(200, like, "Like Done"));
    }

    const deleteLike = await Like.findByIdAndDelete(alreadyLiked[0]._id);
    if (!deleteLike) {
        return new ApiError(500, "Like Not Deleted | Internal Serever Error");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, deleteLike, "Like Deleted"));
});

module.exports = {
    toggleVideoLike,
};
