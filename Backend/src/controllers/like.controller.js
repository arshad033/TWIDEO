import { Like } from "../models/like.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

//user can like the tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId) {
    throw new ApiError(400, "Tweet id needed");
  }
  const tweet = await Tweet.findById(tweetId);
  // console.log("Tweet founded: ", tweet);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  const userId = req.user?._id;
  const alreadyLiked = await Like.findOne({ tweet: tweetId, likedBy: userId });
  if (!alreadyLiked) {
    const like = await Like.create({
      likedBy: userId,
      tweet: tweetId,
    });
    if (!like) {
      throw new ApiError(500, "issue in liking the tweet");
    }
    res
      .status(201)
      .json(new ApiResponse(201, like, "tweet liked successfully"));
  } else {
    const deleteLike = await Like.findOneAndDelete({
      tweet: tweetId,
      likedBy: userId,
    });
    if (!deleteLike) {
      throw new ApiError(500, "Issue in unliking the tweet");
    }
    res
      .status(200)
      .json(new ApiResponse(200, {}, "tweet unliked successfully"));
  }
});
//user can like the video
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "video id needed");
  }
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "video not found");
  }

  const userId = req.user?._id;
  const alreadyLiked = await Like.findOne({ video: videoId, likedBy: userId });
  if (!alreadyLiked) {
    const like = await Like.create({
      likedBy: userId,
      video: videoId,
    });
    if (!like) {
      throw new ApiError(500, "issue in liking the video");
    }
    res
      .status(201)
      .json(new ApiResponse(201, like, "video liked successfully"));
  } else {
    const deleteLike = await Like.findOneAndDelete({
      video: videoId,
      likedBy: userId,
    });
    if (!deleteLike) {
      throw new ApiError(500, "issue in unliking the video");
    }
    res
      .status(200)
      .json(new ApiResponse(200, {}, "video unliked successfully"));
  }
});
//user can like the tweet
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(404, "Tweet id not found");
  }
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, "comment not found");
  }

  const userId = req.user?._id;
  const alreadyLiked = await Like.findOne({
    comment: commentId,
    likedBy: userId,
  });
  if (!alreadyLiked) {
    const like = await Like.create({
      likedBy: userId,
      comment: commentId,
    });
    if (!like) {
      throw new ApiError(500, "issue in liking the comment");
    }
    res
      .status(201)
      .json(new ApiResponse(201, like, "comment liked successfully"));
  } else {
    const deleteLike = await Like.findOneAndDelete({
      comment: commentId,
      likedBy: userId,
    });
    if (!deleteLike) {
      throw new ApiError(500, "issue in unliking the comment");
    }
    res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment unlike successfully"));
  }
});

//write the pipeline to get the liked videos
const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const likedVideos = await Like.find({ likedBy: userId });
  res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "liked videos fetched successfully")
    );
});
export { getLikedVideos, toggleTweetLike, toggleVideoLike, toggleCommentLike };
