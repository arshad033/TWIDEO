import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//user can write comment
const createComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  if (!videoId) {
    throw new ApiError(400, "videoId required");
  }
  if (!content.trim() === "") {
    throw new ApiError(400, "can not add emphty comment");
  }
  const addComment = await Comment.create({
    content: content,
    video: videoId,
    owner: req.user?._id,
  });
  if (!addComment) {
    throw new ApiError(500, "issue in adding the comment");
  }
  res
    .status(201)
    .json(new ApiResponse(201, addComment, "Comment Added successfully"));
});
//user can edit comment
const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  if (!commentId) {
    throw new ApiError(400, "commentId required");
  }
  if (!content.trim() === "") {
    throw new ApiError(400, "can not add emphty comment");
  }
  const updateComment = await Comment.findByIdAndUpdate(
    commentId,
    { content: content },
    { new: true }
  );
  if (!updateComment) {
    throw new ApiError(404, "comment not found");
  }
  res
    .status(200)
    .json(new ApiResponse(200, updateComment, "Comment updated successfully"));
});
//user can delete comment

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "commentId required");
  }
  const deleteComment = await Comment.findByIdAndDelete(commentId);
  if (!deleteComment) {
    throw new ApiError(404, "comment not found");
  }
  res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});
//get all video comments
const getVideoComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;
  if (!videoId) {
    throw new ApiError(400, "VideoId needed");
  }
  const getComment = await Comment.find({ videoId: videoId })
    .skip(skip)
    .limit(limitNumber)
    .sort({ createdAt: -1 });
  const nbHits = getComment.length;
  if (!getComment) {
    throw new ApiError(404, "Comment Not Found");
  }
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { getComment, nbHits },
        "Comments fetched Successfully"
      )
    );
});

export { createComment, updateComment, deleteComment, getVideoComment };
