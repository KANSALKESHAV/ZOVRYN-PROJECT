//ROOT ROUTER THAT REROUTES ALL THE REQUESTS ACCORDING TO THE PATH

const express = require("express");
const rootRouter = express.Router();

const { adminRouter } = require("./adminRoute.js");
const { userRouter } = require("./userRoute.js");

rootRouter.use("/admin" , adminRouter);
rootRouter.use("/user" , userRouter);

module.exports = {
    rootRouter
};