//AUTHENTIATION MIDDLEWARE FOR ADMINS

const jwt = require("jsonwebtoken");
const {adminModel} = require("../databaseModels/adminDB.model.js");
const {ACCESS_JWT_SECRET , REFRESH_JWT_SECRET} = require("../Configrations/config.js");
const {generateAccessToken , generateRefreshToken} = require("./jwtAuthTokenGen.js");

const cookieOptions = {
    httpOnly : true,
    secure : true
};

async function adminAuthMiddleware(req , res , next){

    let incomingAccessToken = req.cookies.adminAccessToken;
    if(!incomingAccessToken){

        res.status(403).json({
            MESSAGE : "UNATHORIZED ADMIN ACCESS || SESSION TOKEN DOESNOT EXISTS"
        });
        return;

    }

    try {

        let verifiedData = jwt.verify(incomingAccessToken , ACCESS_JWT_SECRET);
        if(verifiedData.id){

            let admin = await adminModel.findById(verifiedData.id).select("-password -refreshToken");
            if(!admin || admin.isDeleted){
                res.status(403).json({
                    MESSAGE : "ADMIN DOESNOT EXIST IN DATABASE"
                });
                return;
            }
            
            req.authAdmin = admin;
            next();
        }

    } catch (error) {

        console.log(`ERROR IN ADMINAUTHMW \n${error}`);
        res.status(401).json({
            MESSAGE : "INVALID ADMIN ACCESS TOKEN",
            ERROR : error
        });
        return;
    }
};


async function refreshAdminAccessToken() {

    const incomingRefreshToken = req.cookies.adminRefreshToken;
    if(!incomingRefreshToken){

        res.status(403).json({
            MESSAGE : "UNATHORIZED ADMIN ACCESS || SESSION TOKEN DOESNOT EXISTS"
        })
        .clearCookie("adminAccessToken" , cookieOptions)
        .clearCookie("adminRefreshToken" , cookieOptions);
        return;

    }

    try {

        let verifiedData = jwt.verify(incomingRefreshToken , REFRESH_JWT_SECRET);
        if(verifiedData.id){

            let admin = await adminModel.findById(verifiedData.id);
            if(!admin || admin.isDeleted){

                res.status(404).json({
                    MESSAGE :"CANNOT REFRESH TOKEN | ADMIN DOESNOT EXIST"
                });
                return;

            }

            if(incomingRefreshToken !== admin.refreshToken){

                res.status(401).json({
                    MESSAGE : "REFRESH TOKEN IS USED OR EXPIRED OR INVALID "
                });
                return;

            }

            let newAccessToken = generateAccessToken(admin._id , admin.email);

            let newRefreshToken = incomingRefreshToken;
            const remainingRTLife = jwt.decode(incomingRefreshToken).exp*1000 - Date.now();
            if(remainingRTLife < 15*60*1000){
                newRefreshToken = generateRefreshToken(admin._id);
                admin.refreshToken = newRefreshToken;
                await admin.save();
            }

            return res
                .status(200)
                .cookie("adminAccessToken" , newAccessToken , cookieOptions)
                .cookie("adminRefreshToken" , newRefreshToken , cookieOptions)
                .json({
                    MESSAGE : "ACCESS TOKEN REFRESHED",
                    newAccessToken,
                    newRefreshToken,
                })

        }

    } catch (error) {

        console.log(`SOME PROBLEM OCCURED IN REFRESHING TOKEN \n${error}`);
        res.status(400).json({
            MESSAGE : "SOME PROBLEM OCCURED IN REFRESHING TOKEN",
            ERROR : Error
        })
        .clearCookie("adminAccessToken" , cookieOptions)
        .clearCookie("adminRefreshToken" , cookieOptions);
        return;
    }



};


module.exports = {
    adminAuthMiddleware,
    refreshAdminAccessToken
};