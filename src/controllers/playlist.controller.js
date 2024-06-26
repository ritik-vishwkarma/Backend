import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async(req, res) => {
    const { name, description } = req.body

    if (!name || !description || !name.trim() || !description.trim()) {
        throw new ApiError(400, "PlayList name and description is required")
    }

    const playlist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
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
    const { userId } = req.params
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
        { 
            playlist
        },
        "User playlist retrived Successfully"
    ))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    const video = await Video.findById(videoId);

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
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const removeVideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId,
            }
        },
        {
            new: true
        }
    )

    if (!removeVideo) {
        throw new ApiError(400, "Failed to remove Video from Playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {playlist: removeVideo},
            "Video removed from Playlist Successfully"
        )
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist

    const playlist = await Playlist.findByIdAndDelete(playlistId)

    if (!playlist) {
        throw new ApiError(400, "Failed to delete playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Playlist deleted Successfully"
        )
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist

    const updatedName = name.trim()
    const updatedDescription = description.trim()

    if (!updatedName || !updatedDescription) {
        throw new ApiError(400, "Playlist name and description is required")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId, 
        {
            name: updatedName,
            description: updatedDescription
        },
        {
            new: true
        }
    )

    if (!playlist) {
        throw new ApiError(400, "Failed to update playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {playlist},
            "Playlist updated Successfully"
        )
    )
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