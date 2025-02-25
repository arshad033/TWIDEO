import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

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
  //Get Details from the frontend
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

  // console.log(avatar);
  if (!avatar) {
    throw new ApiError(500, "Failed to upload avatar file");
  }
  //create a object -> create entry in the db
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
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
const fetchUser = asyncHandler(async (req, res) => {
  return res.status(200, req.user, "user fetched successfully");
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
  const path = req.file?.path;
});
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
  changeCurrentPassword,
  fetchUser,
  updateAccountDetails,
};
