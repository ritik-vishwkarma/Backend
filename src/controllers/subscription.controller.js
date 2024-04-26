import mongoose, { isValidObjectId } from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { asyncHandler } from '../utils/asyncHandler.js'

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    if (req.user._id === channelId) {
        throw new ApiError(400, "You cannot subscribe to your own channel")
    }

    const subscription = await Subscription.findOne(
        {
            subscriber: req.user._id, 
            channel: channelId
        }
    )

    if (subscription) {
        await Subscription.findByIdAndDelete(subscription._id)
        return res
        .status(200)
        .json(
            new ApiResponse(200, "Unsubscribed successfully")
        )
    }

    const subscribed = await Subscription.create({
        subscriber: req.user._id,
        channel: channelId
    })

    if (!subscribed) {
        throw new ApiError(500, "Failed to subscribe")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Subscribed successfully")
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber"
            }
        },
        {
            // $unwind: "$subscriber"
            $addFields: {
                subscriber: {
                    $arrayElemAt: ["$subscriber", 0]
                }
            }
        },
        {
            $project: {
                subscriber: {
                    _id: 1,
                    username: 1,
                    email: 1,
                    avatar: 1
                }
            }
        }
    ])

    if (!subscribers) {
        throw new ApiError(404, "No Subscribers found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            subscribers,
            "Subscribers fetched successfully"
        )
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.user

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber id")
    }

    const channels = await Subscription.aggregate([
        {
            $match: {
                subscriber: mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel"
            }
        },
        {
            $addFields: {
                channel: {
                    $arrayElemAt: ["$channel", 0]
                }
            }
        },
        {
            $project: {
                channel: {
                    _id: 1,
                    username: 1,
                    email: 1,
                    avatar: 1
                }
            }
        
        }
    ])

    if (!channels) {
        throw new ApiError(404, "No channels found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channels,
            "Subscribed channels fetched successfully"
        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}