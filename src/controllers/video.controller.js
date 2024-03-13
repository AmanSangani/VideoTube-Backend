const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { asyncHandler } = require("../utils/asyncHandler.js");
const {
  uploadOnCloud,
  getDetailsOfCloudImage,
  deleteFileOnCloud,
} = require("../utils/cloudService.js");
const fs = require("fs");
const Video = require("../models/video.model.js");
const Like = require("../models/like.model.js");
const Comment = require("../models/comment.model.js");
const mongoose = require("mongoose");

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
});

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title or description is required!!!");
  }

  const existedVideoTitle = await Video.findOne({ title });
  if (existedVideoTitle) {
    console.log("Existed Video Title : ", existedVideoTitle);
    throw new ApiError(400, "Video title already exists");
  }

  const videoFile = req.files?.videoFile[0]?.path;
  const thumbnail = req.files?.thumbnail[0]?.path;

  console.log(videoFile);
  console.log(thumbnail);

  if (!videoFile) {
    throw new ApiError(400, "Video file Required");
  }
  if (!thumbnail) {
    throw new ApiError(400, "Thumbnail file Required");
  }
  if (videoFile == thumbnail) {
    fs.unlinkSync(videoFile);
    throw new ApiError(400, "Video and Thumbnail cannot be same");
  }

  const videoUploadOnCloud = await uploadOnCloud(videoFile);
  const thumbnailUploadOnCloud = await uploadOnCloud(thumbnail);

  if (!(videoUploadOnCloud || thumbnailUploadOnCloud)) {
    throw new ApiError(500, "Video or thumbnail not uploaded on cloud");
  }

  console.log("Uploaded video", videoUploadOnCloud);
  console.log("Uploaded thumbnail", thumbnailUploadOnCloud);

  const video = await Video.create({
    videoFile: videoUploadOnCloud.url,
    thumbnail: thumbnailUploadOnCloud.url,
    title,
    description,
    duration: videoUploadOnCloud.duration,
    owner: new mongoose.Types.ObjectId(req.user?._id),
  });

  console.log(video);

  const PublishedVideo = await Video.findById(video.id);

  if (!PublishedVideo) {
    throw new ApiError(500, "Something went wrong -> Video not published");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, PublishedVideo, "Video Published"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "video id is invalid or requied");
  }

  let video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullname: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
        likes: {
          $size: "$likes",
        },
      },
    },
    {
      $addFields: {
        views: {
          $add: [1, "$views"],
        },
      },
    },
  ]);

  if (video.length != 0) {
    video = video[0];
  }

  await Video.findByIdAndUpdate(videoId, {
    $set: {
      views: video.views,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video Get Successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const thumbnailLocalPath = req.file?.path;
  const { title, description } = req.body;

  console.log("Video Id : " + videoId);
  console.log("title : " + title);
  console.log("description : " + description);
  console.log("thumbnailLocalPath : " + thumbnailLocalPath);

  if (!(title && description && thumbnailLocalPath)) {
    throw new ApiError(400, "Nothing to update");
  }

  try {
    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(401, "Unauthorized to update this video");
    }

    // if (video.title == title) {
    //   throw new ApiError(400, "Video title already exist");
    // }

    const toBeDeleteThumbnail = video.thumbnail;
    console.log("toBeDeleteThumbnail : ", toBeDeleteThumbnail);

    const thumbnail = await uploadOnCloud(thumbnailLocalPath);
    console.log("new thumbnail : ", thumbnail);

    if (!thumbnail) {
      throw new ApiError(500, "Error while updating thumbnail");
    }

    video.thumbnail = thumbnail.url;
    video.title = title;
    video.description = description;

    const updatedVideo = await video.save();

    if (!updatedVideo) {
      throw new ApiError(500, "Error while updating video");
    }

    await deleteFileOnCloud(toBeDeleteThumbnail);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedVideo,
          "Video thumbnail updated successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error.message || "Error while updating video");
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(404, "Invalid Video Id");
  }

  const video = await Video.findById(videoId);
  console.log("Video : ", video);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() != req.user._id.toString()) {
    throw new ApiError(404, "Unauthorized User");
  }

  videoUrl = video.videoFile;
  thumbnailUrl = video.thumbnail;
  console.log("videoUrl : ", videoUrl);
  console.log("thumbnailUrl : ", thumbnailUrl);

  const deleteVideoResponse = await deleteFileOnCloud(videoUrl);
  const deleteThumbnailResponse = await deleteFileOnCloud(thumbnailUrl);

  if (!(deleteVideoResponse || deleteThumbnailResponse)) {
    throw new ApiError(400, "Error while deleting file on cloud");
  }

  const deleteVideoFromDB = await Video.findByIdAndDelete(videoId);
  console.log("deleteVideoFromDB : ", deleteVideoFromDB);

  const likeDelete = await Like.deleteMany({ video: videoId });

  const commentDelete = await Comment.deleteMany({ video: videoId });

  if (!(deleteVideoFromDB || likeDelete || commentDelete)) {
    throw new ApiError(400, "Error while deleting video");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(201, deleteVideoFromDB, "Video deleted successfully")
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "video id is required or invalid !");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found !");
  }

  if (video.owner.toString() != (req.user?._id).toString()) {
    throw new ApiError(401, "Unauthorised user!");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res.status(200).json(new ApiResponse(200, "toggled state of publish"));
});

module.exports = {
  publishVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
