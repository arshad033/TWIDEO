import { Like } from "../models/like.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

//user can like the tweet
const likeTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId) {
    throw new ApiError(404, "Tweet id not found");
  }
  const tweet = await Tweet.findById(tweetId);
  console.log("Tweet founded: ", tweet);
  if (!tweet) {
    throw new ApiError(400, "Tweet not found");
  }

  const userId = req.user?._id;
  const like = await Like.create({
    likedBy: userId,
    tweet: tweetId,
  });
  res.status(200).json(new ApiResponse(200, {}, "tweet liked succesfully"));
});
//user can like the video
const likevideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video id not found");
  }
  const video = await Video.findById(videoId);
  // console.log("Tweet founded: ", video);
  if (!video) {
    throw new ApiError(400, "video not found");
  }

  const userId = req.user?._id;
  const like = await Like.create({
    likedBy: userId,
    video: videoId,
  });
  res.status(200).json(new ApiResponse(200, {}, "video liked succesfully"));
});
//user can like the tweet
const likecomment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Tweet id not found");
  }
  const comment = await Comment.findById(commentId);
  // console.log("Tweet founded: ", comment);
  if (!comment) {
    throw new ApiError(404, "comment not found");
  }

  const userId = req.user?._id;
  const like = await Like.create({
    likedBy: userId,
    comment: commentId,
  });
  res.status(200).json(new ApiResponse(200, {}, "Comment liked succesfully"));
});

export default {
  likeTweet,
  likevideo,
  likecomment,
};
