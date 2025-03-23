import Like from "../models/like.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

//user can like the tweet
const likeTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.body;
  if (!tweetId) {
    throw new ApiError(404, "Tweet not found");
  }
  const userId = req.user?._id;
  const like = await Like.create({
    likedBy: userId,
    tweet: tweetId,
  });
  res.status(200).json(new ApiResponse(200, {}, "tweet liked succesfully"));
});
