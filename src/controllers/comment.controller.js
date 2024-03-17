const { default: mongoose } = require("mongoose");
const { Video } = require("../models/video.model");
const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiResponse } = require("../utils/ApiResponse");

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!videoId) {
        throw new ApiError(400, "Invalid videoId");
    }

    if (!content) {
        throw new ApiError(400, "No Comment to add");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video not found");
    }

    console.log("Video ID : " + video.id);

    const comment = await Comment.create({
        content: content,
        video: new mongoose.Types.ObjectId(videoId),
        owner: req.user?._id,
    });

    if (!comment) {
        throw new ApiError(500, "Comment not created | Internal server error");
    }

    console.log("Comment : " + comment);

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment created"));
});

module.exports = {
    addComment,
};
