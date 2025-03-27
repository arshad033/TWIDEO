import { Tweet } from "../models/tweet.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

//user can add tweet
const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (content?.trim() === "") {
    throw new ApiError(400, "Add some content in order to tweet");
  }
  const tweet = await Tweet.create({
    content: content,
    owner: req.user?._id,
  });
  res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet created successfully"));
});

//user can edit the tweet
const updateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { tweetId } = req.params;
  if (!tweetId) {
    throw new ApiError(404, "Tweet id needed");
  }
  if (content?.trim() === "") {
    throw new ApiError(400, "Add some content");
  }
  const tweetExists = await Tweet.findById(tweetId);
  console.log("Found tweet:", tweetExists);
  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      content: content,
    },
    { new: true }
  );

  res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "tweet updated succesfully"));
});

//user can see their tweet
const getUserTweet = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  console.log(userId);

  if (!userId.trim()) {
    throw new ApiError(404, "provide a valid user id");
  }
  const getTweet = await Tweet.find({ owner: userId });
  console.log(getTweet);
  res
    .status(200)
    .json(new ApiResponse(200, getTweet, "user tweet fetched successfully"));
});
//user can delete tweet
const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId) {
    throw new ApiError(404, "Tweet not found");
  }
  await Tweet.findOneAndDelete(tweetId);
  res.status(200).json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

//user can comment on tweet

export { createTweet, getUserTweet, updateTweet, deleteTweet };
