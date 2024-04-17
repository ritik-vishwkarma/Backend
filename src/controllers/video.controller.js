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

    const videos = await Video.aggregatePaginate(
        Video.aggregate([
            {
                $match: {
                    $or: [
                        { title: { $regex: query, $options: 'i' } },
                        { description: { $regex: query, $options: 'i' } }
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
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    // TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}