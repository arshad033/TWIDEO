import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

export const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    //Get token from the client
    const token =
      req.cookies?.accessToken ||
      req.header("authorization").replace("bearer ");
    // console.log("this is from auth: ", token);

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }
    //verify the token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    //Find the user
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid access token");
  }
});
