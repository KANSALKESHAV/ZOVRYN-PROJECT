//AUTHENTICATION MIDDLEWARE FOR USER

const jwt = require("jsonwebtoken");
const {userModel} = require("../databaseModels/userDB.model.js");
const {ACCESS_JWT_SECRET , REFRESH_JWT_SECRET} = require("../Configrations/config.js");
const {generateAccessToken , generateRefreshToken} = require("./jwtAuthTokenGen.js");

const cookieOptions = {
    httpOnly : true,
    secure : true
};

async function userAuthMiddleware(req , res , next){

    let incomingAccessToken = req.cookies.userAccessToken;
    if(!incomingAccessToken){

        res.status(403).json({
            MESSAGE : "UNATHORIZED USER ACCESS || SESSION TOKEN DOESNOT EXISTS"
        });
        return;

    }

    let verifiedData ;
    try {

        verifiedData = jwt.verify(incomingAccessToken , ACCESS_JWT_SECRET);
        
    } catch (error) {

        res.status(401).json({
            MESSAGE : "INVALID USER ACCESS TOKEN",
            ERROR : error.message
        });
        return;
        
    }

    try {

        if(verifiedData.id){

            let user = await userModel.findById(verifiedData.id).select("-password -refreshToken");
            if(!user || user.isDeleted){
                res.status(403).json({
                    MESSAGE : "USER DOESNOT EXIST IN DATABASE"
                });
                return;
            }
            
            req.authUser = user;
            next();
        }

    } catch (error) {

        console.log(`DB ERROR IN USERAUTHMW \n${error}`);
        res.status(401).json({
            MESSAGE : "DB ERROR IN USERAUTHMW",
            ERROR : error.message
        });
        return;
    }
};


async function refreshUserAccessToken() {

    const incomingRefreshToken = req.cookies.userRefreshToken;
    if(!incomingRefreshToken){

        res.status(403).json({
            MESSAGE : "UNATHORIZED USER ACCESS || SESSION TOKEN DOESNOT EXISTS"
        })
        .clearCookie("userAccessToken" , cookieOptions)
        .clearCookie("userRefreshToken" , cookieOptions);
        return;

    }

    try {

        let verifiedData = jwt.verify(incomingRefreshToken , REFRESH_JWT_SECRET);
        if(verifiedData.id){

            let user = await userModel.findById(verifiedData.id);
            if(!user || user.isDeleted){

                res.status(404).json({
                    MESSAGE :"CANNOT REFRESH TOKEN | USER DOESNOT EXIST"
                });
                return;

            }

            if(incomingRefreshToken !== user.userRefreshToken){

                res.status(401).json({
                    MESSAGE : "REFRESH TOKEN IS USED OR EXPIRED OR INVALID "
                });
                return;

            }

            let newAccessToken = generateAccessToken(user._id , user.email);

            let newRefreshToken = incomingRefreshToken;
            const remainingRTLife = jwt.decode(incomingRefreshToken).exp*1000 - Date.now();
            if(remainingRTLife < 15*60*1000){
                newRefreshToken = generateRefreshToken(user._id);
                user.userRefreshToken = newRefreshToken;
                await user.save();
            }

            return res
                .status(200)
                .cookie("userAccessToken" , newAccessToken , cookieOptions)
                .cookie("userRefreshToken" , newRefreshToken , cookieOptions)
                .json({
                    MESSAGE : "ACCESS TOKEN REFRESHED",
                    newAccessToken,
                    newRefreshToken,
                })

        }

    } catch (error) {

        console.log(`SOME PROBLEM OCCURED IN REFRESHING TOKEN FOR USER\n${error}`);
        res.status(400).json({
            MESSAGE : "SOME PROBLEM OCCURED IN REFRESHING TOKEN FOR USER",
            ERROR : Error
        })
        .clearCookie("userAccessToken" , cookieOptions)
        .clearCookie("userRefreshToken" , cookieOptions);
        return;
    }



};


module.exports = {
    userAuthMiddleware,
    refreshUserAccessToken
};