import { Router } from 'express'
import { 
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    updatePlaylist
} from '../controllers/playlist.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router();

router.use(verifyJWT);

router.route("/").post(createPlaylist)

router
    .route("/:playlistId")
    .get(getPlaylistById)
    .post(updatePlaylist)
    .delete(deletePlaylist)

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist)

router.route("/user/:userId").get(getUserPlaylists);

export default router