const { default: mongoose } = require("mongoose");
const { Like } = require("../models/like.model.js");
const { Comment } = require("../models/comment.model.js");
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

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!commentId) {
        throw new ApiError(400, "comment id is invalid or required!");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found!");
    }

    const isLikedAllReady = await Like.find({
        comment: commentId,
        likedBy: req.user?._id,
    });

    if (isLikedAllReady.length == 0) {
        const likeDoc = await Like.create({
            comment: commentId,
            likedBy: req.user?._id,
        });
        return res.status(200).json(new ApiResponse(200, {}, "liked comment!"));
    } else {
        const deleteDoc = await Like.findByIdAndDelete(isLikedAllReady[0]._id);
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "remove liked from comment!"));
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!tweetId) {
        throw new ApiError(400, "tweet id is required or invalid");
    }

    const tweet = await Comment.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "tweet not found!");
    }

    const isLikedAllReady = await Like.find({
        tweet: tweetId,
        likedBy: req.user?._id,
    });

    if (isLikedAllReady.length == 0) {
        const likeDoc = await Like.create({
            tweet: tweetId,
            likedBy: req.user?._id,
        });
        return res.status(200).json(new ApiResponse(200, {}, "liked tweet!"));
    } else {
        const deleteDoc = await Like.findByIdAndDelete(isLikedAllReady[0]._id);
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "remove liked from tweet!"));
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user?._id);
    [
        {
            $match: {
                video: {
                    $exists: true,
                },
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            views: 1,
                            duration: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                video: {
                    $first: "$video",
                },
            },
        },
    ];
    const pipline = [
        {
            $match: {
                video: {
                    $exists: true,
                },
                likedBy: userId,
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            views: 1,
                            duration: 1,
                            title: 1,
                            description: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                video: {
                    $first: "$video",
                },
            },
        },
        {
            $project: {
                video: 1,
            },
        },
    ];

    const videoes = await Like.aggregate(pipline);

    if (videoes.length == 0) {
        throw new ApiError(404, "No Liked videos !");
    }
    res.status(200).json(
        new ApiResponse(
            200,
            { videoes, videosCount: videoes.length },
            "liked videoes!",
        ),
    );
});

module.exports = {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos,
};
