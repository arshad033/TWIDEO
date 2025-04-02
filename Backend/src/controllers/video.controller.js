import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import {
  uploadFileOnCloudinary,
  deleteFileOnCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished } = req.body;
  if (title.trim() === "") {
    throw new ApiError(400, "title is required");
  }
  if (!isPublished) {
    throw new ApiError(400, "published status is required");
  }
  const videoPath = req.file?.video[0]?.path;
  const thumbnailPath = req.file?.thumbnail[0]?.path;

  if (!videoPath) {
    throw new ApiError(400, "video file is required");
  }

  if (!thumbnailPath) {
    throw new ApiError(400, "thumbnail file is required");
  }
  //uploading on cloudinary
  const videoFile = uploadFileOnCloudinary(videoPath);
  const thumbnailFile = uploadFileOnCloudinary(thumbnailPath);
  if (!videoUrl) {
    throw new ApiError(500, "error while uploading the video on cloudinary");
  }
  if (!thumbnailUrl) {
    throw new ApiError(
      500,
      "error while uploading the thumbnail on cloudinary"
    );
  }
  //creating video
  const video = await Video.create({
    videoFile: {
      url: videoFile.url,
      publicId: videoFile.public_id,
      resourceType: videoFile.resource_type,
    },
    thumbnail: {
      url: thumbnailFile.url,
      publicId: thumbnailFile.public_id,
      resourceType: thumbnailFile.resource_type,
    },
    title: title,
    description: description,
    owner: req.user?._id,
    isPublished: isPublished,
  });
  if (!video) {
    throw new ApiError(500, "error in creating the video");
  }
  res
    .status(201)
    .json(new ApiResponse(201, video, "video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "videoId is required");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }
  res
    .status(200)
    .json(new ApiResponse(200, video, "video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnailPath = req?.file?.thumbnail[0]?.path;
  const updatedFeilds = {};
  if (!videoId) {
    throw new ApiError(400, "videoId is required");
  }
  if (!title && !description && !thumbnailPath) {
    throw new ApiError(
      400,
      "atleast one field(title, description, thumbnail) is required"
    );
  }
  if (thumbnailPath) {
    //delete the old thumbnail from cloudinary
    const thumbnail = await Video.findById(videoId, { thumbnail: 1 });
    const deleteThumbnail = await deleteFileOnCloudinary(
      thumbnail.publicId,
      thumbnail.resourceType
    );
    if (!deleteThumbnail) {
      throw new ApiError(500, "issue in deleting old thumbnail on cloudinary");
    }
    // update the thumbnail
    const updateThumbnail = await uploadFileOnCloudinary(thumbnailPath);
    updatedFeilds.thumbnail = {
      url: updateThumbnail.url,
      publicId: updateThumbnail.public_id,
      resourceType: updateThumbnail.resource_type,
    };
  }
  if (title) {
    updatedFeilds.title = title;
  }
  if (description) {
    updatedFeilds.description = description;
  }
  //update the document
  const video = await Video.findByIdAndUpdate(
    videoId,
    { $set: updatedFeilds },
    { new: true }
  );
  res
    .status(200)
    .json(new ApiResponse(200, video, "video details updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiResponse(400, "videoId is required");
  }
  //delete from cloudinary
  const videoDetails = await Video.findById(videoId, { videoFile: 1 });
  const deleteVideoOnCloudinary = await deleteFileOnCloudinary(
    videoDetails.public_id,
    videoDetails.resource_type
  );
  if (!deleteVideoOnCloudinary) {
    throw new ApiError(500, "issue in deleting video on cloudinary");
  }
  const deleteVideo = await Video.findByIdAndDelete(videoId);
  if (!deleteVideo) {
    throw new ApiError(500, "issue in deleting the video");
  }
  res.status(200).json(new ApiResponse(200, {}, "video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "VideoId is required");
  }
  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: { isPublished: !video.isPublished },
    },
    { new: true }
  );
  if (!video) {
    throw new ApiError(500, "failed to update the publish status");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, video, "published status toggeled successfully")
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
