import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  // console.log(avatarLocalPath);
  // console.log(coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  //upload the images on the cloudinary
  const avatar = await uploadFileOnCloudinary(avatarLocalPath);
  const coverImage = await uploadFileOnCloudinary(coverImageLocalPath);
  // console.log(avatar);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
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

export { registerUser };
