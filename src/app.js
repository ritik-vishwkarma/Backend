import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// routes import
import userRouter from "./routers/user.routes.js"
import videoRouter from "./routers/video.routes.js"
import playlistRouter from "./routers/playlist.routes.js"
import subscriberRouter from "./routers/subscription.routes.js"
import likeRouter from "./routers/like.routes.js"

// routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/subscriptions", subscriberRouter)
app.use("/api/v1/like", likeRouter)

export { app }