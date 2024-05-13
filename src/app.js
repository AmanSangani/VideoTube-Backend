const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

//-------------midddleware--------------------------------

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    }),
);

app.use(express.json({ limit: "16kb" }));

app.use(
    express.urlencoded({
        extended: true,
        limit: "16kb",
    }),
);

app.use(express.static("public"));

app.use(cookieParser());

//-------------routes--------------------------------

const userRouter = require("./routes/user.route.js");
const videoRouter = require("./routes/video.route.js");
const likeRouter = require("./routes/like.route.js");
const commentRouter = require("./routes/comment.route.js");
const playlistRouter = require("./routes/playlist.route.js");
const subscriptionRouter = require("./routes/subscription.route.js");
const healthCheckRouter = require("./routes/healthcheck.route.js");
const dashboardRouter = require("./routes/dashboard.route.js");

app.use("/api/v1/users", userRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/like", likeRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/healthCheck", healthCheckRouter);
app.use("/api/v1/dashboard", dashboardRouter);

module.exports = app;
