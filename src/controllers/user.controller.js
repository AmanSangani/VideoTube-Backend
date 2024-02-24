const { ApiError } = require("../utils/ApiError.js");
const { asyncHandler } = require("../utils/asyncHandler.js");
const { User } = require("../models/user.model.js");
const { uploadOnCloud } = require("../utils/cloudService.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const { response } = require("express");

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // console.log("--------------------------------");
    // console.log(accessToken, refreshToken);
    // console.log("--------------------------------");

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // const rr = await User.findById(userId);
    // console.log(rr);

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Access and Refresh Token Error");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;

  console.log(req.body);

  // if(fullname === '' || email === '' || username === '' || password === ''){
  //     throw new ApiError(400, "All Fields are required")
  // }

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  console.log("Existed User : ", existedUser);

  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //   const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloud(avatarLocalPath);
  const coverImage = await uploadOnCloud(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  console.log(createdUser);

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Created Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "Username or Email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User Doesn't Exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid User Credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // console.log("--------------------------------");
  // console.log(accessToken, refreshToken);
  // console.log("--------------------------------");

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // console.log("User logged in", loggedInUser.refreshToken);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged in Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = req.user._id;
  await User.findByIdAndUpdate(
    user,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(404, "UnAuthorised Request -  No Refresh Token");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token Expired");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Old Password Invalid");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});

const getLoggedInUser = asyncHandler(async (req, res) => {
  const user = await req.user;

  return res.status(200).json(new ApiResponse(200, user, "Logged In User"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!(fullname || email)) {
    throw new ApiError(400, "All Fields Are Required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(404, "Avatar not found");
  }

  const avatar = await uploadOnCloud(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(404, "Avatar Cloud URL not found");
  }

  const user = await user
    .findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: avatar.url,
        },
      },
      { new: true }
    )
    .select("-password -refreshToken");

  fs.unlinkSync(avatarLocalPath);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(404, "Cover Image not found");
  }

  const coverImage = await uploadOnCloud(coverImageLocalPath);

  if (!coverImage) {
    throw new ApiError(404, "Cover Image Cloud URL not found");
  }

  const user = await user
    .findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          coverImage: coverImage.url,
        },
      },
      { new: true }
    )
    .select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  // User.findOne({username})

  //Aggregation Syntax
  // const channel = await User.aggregate({}, {}, {});

  const channel = await User.aggregate(
    //find the user by username
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    //find the subscibers based on the channel name
    {
      $lookup: {
        from: "subscriptions", //modelname
        localField: "_id",
        foriegnField: "channel", //based on which we want all documents
        as: "subscribers",
      },
    },
    //find the channel to which user have subscribed based on the subscriber
    {
      lookup: {
        from: "subscriptions",
        localField: "_id",
        foriegnField: "subscriber",
        as: "subscribedTo",
      },
    },
    //addField --> add a new field in the response with all existing fields
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers", //size --> find the count of documents, we use '$' bcoz its a field
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            false: false,
          },
        },
      },
    },
    //pass just req info in response
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    }
  );

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exist");
  }

  console.log("Channel --> ", channel);

  return res
    .ststus(200)
    .json(new ApiResponse(200, channel, "User Channel fetched successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  /*
  req.user._id --> gets a string of id from objrct bcoz mongoose converts 'ObjectId("6r9b98ybc9y238ybr")' into '6r9b98ybc9y238ybr'
  but while using aggregation pipeline mongoose doesnot convert and returns 'ObjectId("6r9b98ybc9y238ybr")' as it is, so we have to 
  manually convert it --> "mongoose.Types.ObjectId(req.user._id)"
  */
  const user = await User.aggregate(
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        form: "videos",
        localField: "watchHistory",
        foriegnField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "user",
              localField: "owner",
              foriegnField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch History fetched successfully"
      )
    );
});

module.exports = {
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
};
