const { default: mongoose } = require("mongoose");
const { Video } = require("../models/video.model");
const { Comment } = require("../models/comment.model");
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

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
  let { page = 1, limit = 10 } = req.query;

  page = isNaN(page) ? 1 : Number(page);
  limit = isNaN(page) ? 10 : Number(limit);

  if (!videoId?.trim() || !isValidObjectId(videoId)) {
    throw new ApiError(400, "video id is required or valid");
  }

  //because skip and limit value in aggearagation must be greater than zero
  if(page <= 0){
    page = 1
  }if(limit<=0){
    limit = 10
  }

  const comments = await Comment.aggregate([
    {
     '$match': {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      '$lookup': {
        'from': 'users', 
        'localField': 'owner', 
        'foreignField': '_id', 
        'as': 'owner', 
        'pipeline': [
          {
            '$project': {
              'username': 1, 
              'fullname': 1, 
              'avatar': 1
            }
          }
        ]
      }
    },
    {
      '$lookup': {
        'from': 'likes', 
        'localField': '_id', 
        'foreignField': 'comment', 
        'as': 'likeCount'
      }
    },
    {
      '$addFields': {
        'likeCount': {
          '$size': '$likeCount'
        }
      }
    }, {
      '$addFields': {
        'owner': {
          '$first': '$owner'
        }
      }
    },
    {
      '$skip': (page-1)*limit
    },
    {
      '$limit': page ,
    },
  ]);

  if (comments.length == 0) {
    throw new ApiError(500, "commets not found!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comments, "comments fetched successfully!"));

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { content } = req.body;
    const { commentId } = req.params;
    if (!content) {
      throw new ApiError(400, "content required!");
    }
    if(!commentId.trim() || !isValidObjectId(commentId)){
      throw new ApiError(400,"comment id is required or invalid!")
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }
    if (comment.owner.toString() != (req.user?._id).toString()) {
      throw new ApiError(401, "Unauthorised user!");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $set: {
          content,
        },
      },
      {
        new: true,
      }
    );

    if (!updatedComment) {
      throw new ApiError(500, "error while updating comments!");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedComment, "comment updated successfully!")
      );
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    if(!commentId.trim() || !isValidObjectId(commentId)){
      throw new ApiError(400,"comment id is required or invalid!")
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }
    if (comment.owner.toString() != (req.user?._id).toString()) {
      throw new ApiError(401, "Unauthorised user!");
    }
    const deletedComment = await Comment.findByIdAndDelete(commentId);

    const likeDelete = await Like.deleteMany({comment: new mongoose.Types.ObjectId(commentId)});

    if (!deletedComment) {
      throw new ApiError(500, "Error while deleting comment!");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "comment deleted successfully!"));
})

module.exports = {
    addComment,
    getVideoComments,
    updateComment,
    deleteComment
};
