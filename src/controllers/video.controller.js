const { ApiError } = require("../utils/ApiError.js");
const { asyncHandler } = require("../utils/asyncHandler.js");
const { uploadOnCloud } = require("../utils/cloudService.js");
const fs = require("fs");

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  //   const { videoFile, thumbnail } = req.file;
  const videoFile = req.files?.videoFile[0]?.path;
  const thumbnail = req.files?.thumbnail[0]?.path;

  console.log(videoFile);
  console.log(thumbnail);

  if(!videoFile){
    throw new ApiError(400,"No video file")
  }
  if(!thumbnail){
    throw new ApiError(400,"No thumbnail file")
  }
  if(videoFile==thumbnail){
    fs.unlinkSync(videoFile);
    throw new ApiError(400,"Video and Thumbnail cannot be same")
  }

  const videoUploadOnCloud = await uploadOnCloud(videoFile);
  const thumbnailUploadOnCloud = await uploadOnCloud(thumbnail);

  if (!(videoUploadOnCloud || thumbnailUploadOnCloud)) {
    throw new ApiError(400, "Video or thumnal not uploaded oon cloud");
  }

  console.log("Uploaded video", videoUploadOnCloud.url);
  console.log("Uploaded thumbnail", thumbnailUploadOnCloud.url);
});

module.exports = {
  publishVideo,
};
