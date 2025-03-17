import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import {
  uploadFileOnCloudinary,
  deleteFileOnCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    //save refresh token to the db
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating refresh and access token"
    );
  }
};
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;
  //validate the details -> no empthy fields etc
  if (
    [fullName, email, username, password].some((item) => item?.trim() === "")
  ) {
    throw new ApiError(409, "all fields are required");
  }
  //check user already exists
  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  // console.log(existingUser);

  if (existingUser) {
    throw new ApiError(409, "user with username or email already exists");
  }
  //check for the images and the avtar
  // console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  // console.log("avatar: " + avatarLocalPath);
  // console.log("Cover: " + coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  //upload the images on the cloudinary
  const avatar = await uploadFileOnCloudinary(avatarLocalPath);
  let coverImage;
  coverImage = await uploadFileOnCloudinary(coverImageLocalPath);

  // console.log("coverImage resource type: ", coverImage.resource_type);
  if (!avatar) {
    throw new ApiError(500, "Failed to upload avatar file");
  }
  //create a object -> create entry in the db
  const user = await User.create({
    fullName,
    avatar: {
      url: avatar.url,
      publicId: avatar.public_id,
      resourceType: avatar.resource_type,
    },
    coverImage: {
      url: coverImage?.url || "",
      publicId: coverImage?.public_id || "",
      resourceType: coverImage?.resource_type || "",
    },
    email,
    password,
    username: username.toLowerCase(),
  });
  // console.log(user._id);

  // check for user creation
  // remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // console.log(createdUser);

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  // return res
  res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user created succesfully"));
});
const loginUser = asyncHandler(async (req, res) => {
  //get the details from the frontend
  const { username, email, password } = req.body;

  //validate -> empthy or not
  if (!username && !email) {
    throw new ApiError(400, "Username or Email is required");
  }

  //check the user exits or not
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "user not found");
  }

  //compair the password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "invalid user credentials");
  }

  //generate a access and refresh token
  // console.log("id: ", user._id);

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // console.log(loggedInUser);

  //send refresh token to frontend
  const option = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in Succesfully"
      )
    );
});
const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  // console.log("see: ", token);
  //Remove refresh token form the db
  await User.findOneAndUpdate(
    { _id: userId },
    { $unset: { refreshToken: 1 } },
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
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});
const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unautorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    // console.log("user: ", user);

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Token expired or already used");
    }

    const tokens = await generateAccessAndRefreshToken(user._id);
    const option = {
      httpOnly: true,
      secure: true,
    };
    // console.log("new generated access token:", tokens);

    res
      .cookie("accessToken", tokens.accessToken, option)
      .cookie("refreshToken", tokens.refreshToken, option)
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          },
          "Access Token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Both fields are required");
  }
  if (oldPassword === newPassword) {
    throw new ApiError(400, "You cannot set previous password");
  }
  const user = await User.findById(req.user?._id);
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new ApiError(400, "Old Password is incorrect");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));
});
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "user fetched successfully"));
});
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  const updateFields = {};

  if (!fullName && !email) {
    throw new ApiError(
      400,
      "At least one field (fullName or email) is required."
    );
  }
  if (fullName) {
    updateFields.fullName = fullName;
  }
  if (email && email !== req.user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, "user with this email already exists");
    }
    updateFields.email = email;
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: updateFields,
    },
    { new: true }
  ).select("-password -refreshToken");
  res
    .status(200)
    .json(new ApiResponse(200, user, "User details updated successfully"));
});
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  //Delete old avatar image
  const { publicId, resourceType } = req.user.avatar;

  console.log("publicId: ", publicId);
  console.log("resource type: ", resourceType);

  const isOldAvatarDeleted = await deleteFileOnCloudinary(
    publicId,
    resourceType
  );
  console.log("is old avatar is deleted or not :", isOldAvatarDeleted);

  if (!isOldAvatarDeleted) {
    throw new ApiError(500, "failed to delete the old Avatar");
  }
  //update the avatar
  const newAvatar = await uploadFileOnCloudinary(avatarLocalPath);
  if (!newAvatar.url) {
    throw new ApiError(
      400,
      "Something went wrong while uploading avatar to cloud"
    );
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: {
          url: newAvatar.url,
          publicId: newAvatar.public_id,
          resourceType: newAvatar.resource_type,
        },
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Updated Successfully"));
});
const updateUserCover = asyncHandler(async (req, res) => {
  const coverLocalPath = req.file?.path;
  if (!coverLocalPath) {
    throw new ApiError(400, "Cover file is missing");
  }
  //Delete old cover image
  const { publicId, resourceType } = req.user.coverImage;

  const isOldCoverImageDeleted = await deleteFileOnCloudinary(
    publicId,
    resourceType
  );
  // console.log("is old cover is deleted or not :", isOldCoverImageDeleted);

  if (!isOldCoverImageDeleted) {
    throw new ApiError(500, "failed to delete the old Cover");
  }

  const newCover = await uploadFileOnCloudinary(coverLocalPath);

  if (!newCover.url) {
    throw new ApiError(
      401,
      "something went wrong while uploading cover on cloud"
    );
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: {
          url: newCover.url,
          publicId: newCover.public_id,
          resourceType: newCover.resource_type,
        },
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "username is empthy");
  }
  //select the user document
  //join the subscription model and get subscriber and subscribed to details
  const channel = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        subscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
  ]);
  if (!channel?.length) {
    throw new ApiError(404, "channel does not exits");
  }
  res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel fetched succesfully"));
});
const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
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
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "watch history fetched succesfully"
      )
    );
});
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCover,
  getUserChannelProfile,
  getWatchHistory,
};
