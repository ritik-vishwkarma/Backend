import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import z from "zod"

const videoSchema = z.object({
    title: z.string().min(1).max(255).trim(),
    description: z.string().min(1).max(255).trim(),
})

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const user = await User.find({
        refreshToken: req.cookies.refreshToken,
    })

    if (!user) {
        throw new ApiError(400, "User is required")
    }
    
    const pageNumber = parseInt(page) || 1;
    const limitOfComments = parseInt(limit) || 10;

    const skip = (pageNumber - 1) * limitOfComments
    const pageSize = limitOfComments

    const queryString = query ? query.toString() : ''

    const videos = await Video.aggregatePaginate(
        Video.aggregate([
            {
                $match: {
                    $or: [
                        { title: { $regex: queryString, $options: 'i' } },
                        { description: { $regex: queryString, $options: 'i' } }
                    ],
                    isPublished: true,
                    owner: user._id
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes",
                }
            },
            {
                $addFields: {
                    likes: { $size: "$likes" }
                }
            },
            {
                $project: {
                    "_id": 1,
                    "videoFile": 1,
                    "thumbnail": 1,
                    "title": 1,
                    "description": 1,
                    "duration": 1,
                    "views": 1,
                    "isPublished": 1,
                    "owner": 1,
                    "createdAt": 1,
                    "updatedAt": 1,
                    "likes": 1
                }
            },
            { $sort: { [sortBy]: sortType === 'asc' ? 1 : -1 } },
            { $skip: skip },
            { $limit: pageSize }
        ])
    )

    if (videos.length === 0) {
        return res
            .status(200)
            .json(new ApiResponse(
                400,
                "No videos available."
            ))
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            videos,
            "Videos fetched Successfully"
        ))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    const { error } = videoSchema.safeParse({ title, description })

    if (error) {
        throw new ApiError(400, error.message)
    }

    try {
        const videoFilePath = req.files.videoFile[0].path
        const thumbnailPath = req.files.thumbnail[0].path
    
        if (!videoFilePath) {
            throw new ApiError(400, "Video file is required")
        }
    
        if (!thumbnailPath) {
            throw new ApiError(400, "Thumbnail is required")
        }
    
        const videoUrl = await uploadOnCloudinary(videoFilePath)
        const thumbnailUrl = await uploadOnCloudinary(thumbnailPath)
    
        if (!videoUrl || !thumbnailUrl) {
            throw new ApiError(500, "Failed to upload video or thumbnail")
        }
        const durationInSeconds = parseFloat(videoUrl.duration);
        console.log(typeof videoUrl.duration)        
        
        const video = await Video.create({
            title,
            description,
            videoFile: videoUrl?.url,
            thumbnail: thumbnailUrl?.url,
            duration: durationInSeconds,
            owner: req.user._id
        })
    
        if (!video) {
            throw new ApiError(500, "Failed to Publish video")
        }
    
        return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                video,
                "Video published Successfully"
            )
        )
    } catch (error) {
        console.error("Error publishing video:", error);
        throw error;
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!videoId) {
        throw new ApiError(400, "Video ID is required")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video retrieved Successfully"
        )
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description

    console.log(req);
    const { title, description } = req.body
    const { _id } = req.user

    if (!videoId) {
        throw new ApiError(400, "Video ID is required")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (!title?.trim() && !description?.trim()) {
        throw new ApiError(400, "Title and Description is required")
    }

    const user = await User.findById(_id)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    console.log(user._id)
    console.log(video.owner)

    if (!video.owner.toString() === user._id.toString()) {
        throw new ApiError(401, "Only owner can update the video")
    }

    const updateVideo = await Video.findByIdAndUpdate(
        videoId, 
        {
            $set: {
                title,
                description
            }
        },
        {
            new: true
        }
    )

    if (!updateVideo) {
        throw new ApiError(500, "Failed to update video description or title")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            updateVideo,
            "Video updated Successfully"
        )
    )
})

const updateVideoThumbnail = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video thumbnail

    const { _id } = req.user

    const video = await Video.findById(videoId)
    const user = await User.findById(_id)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (!video.owner.toString() === user._id.toString()) {
        throw new ApiError(401, "Only owner can update the video")
    }

    const thumbnailFilePath = req.file.path

    if (!thumbnailFilePath) {
        throw new ApiError(400, "Thumbnail file is required")
    }

    const thumbnailUrl = await uploadOnCloudinary(thumbnailFilePath)

    if (!thumbnailUrl) {
        throw new ApiError(500, "No url found for thumbnail")
    }

    const updateThumbnail = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                videoFile: thumbnailUrl.url
            }
        },
        {
            new: true
        }
    )

    if (!updateThumbnail) {
        throw new ApiError(500, "Failed to update the thumbnail")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Thumbnail updated Successfully"
        )
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video  
    const { _id } = req.user  

    if (!videoId) {
        throw new ApiError(400, "Video ID is required")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "Video not found")
    }

    if (!video.owner.toString() === _id.toString()) {
        throw new ApiError(401, "Only owner can delete the video")
    }

    // TODO: delete likes and comments associated with the video

    const deleteVideo = await Video.findByIdAndDelete(videoId)

    if (!deleteVideo) {
        throw new ApiError(400, "Failed to delete video")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            null,
            "Video deleted Successfully"
        )
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "Video ID is required")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublic: !video.isPublic
            }
        },
        {
            new: true
        }
    )

    if (!updatedVideo) {
        throw new ApiError(404, "Video cannot be updated")
    }

    return res
    .status(200)
    .json(
        new ApiError(
            200,
            {},
            "Video status updated"
        )
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    updateVideoThumbnail,
    deleteVideo,
    togglePublishStatus
}