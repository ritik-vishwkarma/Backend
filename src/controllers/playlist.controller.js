import mongoose from "mongoose"
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async(req, res) => {
    const {name, description} = req.body

    if (!name.trim() || !description.trim()) {
        throw new ApiError(400, "PlayList name and description is required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })

    if (!playlist) {
        throw new ApiError(400, "Failed to create playlist")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            201, 
            { 
                playlist
            },
            "Playlist created Successfully"
        )
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    const getPlaylists = await Playlist.find({
        owner: userId
    }) 

    if (!getPlaylists) {
        throw new ApiError(404, "No playlist found")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        { playlists: getPlaylists},
        "User playlist retrived Successfully"
    ))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        { playlist },
        "User playlist retrived Successfully"
    ))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    const video = await Playlist.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const addVideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: videoId,
            }
        },
        {
            new: true
        }
    )

    if (!addVideo) {
        throw new ApiError(400, "Failed to add Video to Playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {playlist: addVideo},
            "Video added to Playlist Successfully"
        )
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
})


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}