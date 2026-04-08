//USER ENDPOINT ROUTER

const express = require("express");

const {validateUser , validateSignIn} = require("../validations/userValidator.js");
const {userModel} = require("../databaseModels/userDB.model.js");
const {adminModel} = require("../databaseModels/adminDB.model.js");
const {financialRecordModel} = require("../databaseModels/financialRecordsDB.model.js");
const {createHash , verifyPassword} = require("../encryptions/passwordEncryptor.js");
const {generateAccessToken , generateRefreshToken} = require("../authMiddleWares/jwtAuthTokenGen.js");
const {userAuthMiddleware} = require("../authMiddleWares/userAuthMW.js");
const {RbacAnalystOrAdminOnly} = require("../authMiddleWares/RbacMW.js");
const {getRecordList , getSingleRecord} = require("./financeRecordFunctions.js")
const mongoose = require("mongoose");

const userRouter = express.Router();

const cookieOptions = {
    httpOnly : true,
    secure : true
};


userRouter.post("/signup" , async (req,res)=>{

    let verifiedData = validateUser(req.body);

    if(!verifiedData.success){

        res.status(411).json({
            MESSAGE : "INVALID CERDENTIALS",
            ERROR : verifiedData.error
        });
        return;

    }

    let existingAdmin , existingUser;
    try {
        existingAdmin = await adminModel.findOne(
            { email : req.body.email }
        ).select("email")

        existingUser = await userModel.findOne(
            { email : req.body.email }
        ).select("email")

    } catch (error) {

        console.log(`SOME ERROR OCCURED WHILE SIGNING UP NEW USER\N${error}`);
        res.status(500).json({
            MESSAGE : "SOME ERROR OCCURED WHILE SIGNING UP NEW USER"
        });
        return;

    };
    if(existingAdmin){

        res.status(409).json({
            MESSAGE : "AN ADMIN ALREADY EXISTS WITH THE PROVIDED EMAIL"
        });
        return;

    };
    if(existingUser){

        res.status(409).json({
            MESSAGE : "AN USER ALREADY EXISTS WITH THE PROVIDED EMAIL"
        });
        return;

    };

    let hashedPW = createHash(req.body.password);
    if(!hashedPW){

        res.status(400).json({
            MESSAGE : "SOME ERROR OCCURED WHILE HASHING PASSWORD"
        });
        return;

    }

    try {

        const user = await userModel.create({
            email : req.body.email,
            password : hashedPW,
            firstName : req.body.firstName,
            lastName : req.body.lastName,
            role : req.body.role,
            isDeleted : false,
        });


    } catch (error) {
        
        console.log(`SOME ERROR OCCURED WHILE CONNECTING TO THE DB WHILE SIGNING UP USER\n${error}`);
        res.status(500).json({
            MESSAGE : "SOME ERROR OCCURED WHILE CONNECTING TO THE DB WHILE SIGNING UP USER"
        });
        return;
    };

    res.status(200).json({
        MESSAGE : "USER CREATED SUCCESSFULLY"
    });
    return;
    
});

userRouter.post("/signin" , async (req,res)=>{
    
    let { email , password } = req.body;

    let signinVerifiedData = validateSignIn({email,password});
    if (!signinVerifiedData.success){

        res.status(411).json({
            MESSAGE : "INVALID CERDENTIALS",
            ERROR : signinVerifiedData.error
        });
        return;

    };

    let existingUser = await userModel.findOne({email});
    if (!existingUser || existingUser.isDeleted){
         
        res.status(404).json({
            MESSAGE : "USER WITH GIVEN EMAIL DOESNOT EXISTS"
        });
        return;

    }

    let passwordVerification = verifyPassword(password , existingUser.password);
    if(!passwordVerification){
        res.status(401).json({
            MESSAGE : "INCORRECT PASSWORD"
        });
        return;
    }

    if (!existingUser.isActive){
         
        res.status(404).json({
            MESSAGE : "USER WITH GIVEN EMAIL IS DEACTIVATED"
        });
        return;

    }

    let accessToken = generateAccessToken(existingUser._id , email);
    let refreshToken = generateRefreshToken(existingUser._id);
    let lastLoginAt = Date.now();

    try {
        
        let updatedUser = await userModel.updateOne({
            email
        },{
            refreshToken,
            lastLoginAt
        });

    } catch (error) {
         
        res.status(500).json({
            MESSAGE : "SORRY ! SOME ERROR OCCURED IN DB IN USER SIGNUP | PLEASE TRY AGAIN"
        });
        return;

    }


    return res
        .status(200)
        .cookie("userAccessToken" , accessToken , cookieOptions)
        .cookie("userRefreshToken" , refreshToken , cookieOptions)
        .json({
            MESSAGE : "USER LOGGED IN SUCCESSFULLY",
            accessToken,
            refreshToken,
        })

});

userRouter.use(userAuthMiddleware);

userRouter.get("/me" , async (req,res)=>{

    let authUser = req.authUser;
    try {
        let existingUser = await userModel.findById(authUser._id)
            .select("_id email firstName lastName  isActive isDeleted");

        if(!existingUser || existingUser.isDeleted){
            res.status(404).json({
                MESSAGE : "USER WITH GIVEN EMAIL DOESNOT EXISTS"
            });
            return;
        }

        if(!existingUser.isActive){
            res.status(404).json({
                MESSAGE : "USER WITH GIVEN EMAIL IS DEACTIVATED"
            });
            return;
        }

        return res
            .status(200)
            .json({
                MESSAGE : "USER /ME DATA",
                ID : existingUser._id,
                firstName : existingUser.firstName,
                lastName : existingUser.lastName,
                email : existingUser.email,
            })

    } catch (error) {
        console.log(`SOME ERROR OCCURED WHILE FETCHING USER ME DATA \n${error}`);
        res.status(500).json({
            MESSAGE : "SOME ERROR OCCURED WHILE FETCHING USER ME DATA | PLEASE TRY AGAIN",
            ERROR : error
        });
        return;
    }
});

userRouter.post("/logout" , async (req,res)=>{

    let authUser = req.authUser;
    try {
        let existingUser = await userModel.findByIdAndUpdate(
            authUser._id,
            {
                $set : {refreshToken : null}
            },
            {
                new : true
            }
        );

        return res
            .status(200)
            .clearCookie("userAccessToken" , cookieOptions)
            .clearCookie("userRefreshToken" , cookieOptions)
            .json({
                MESSAGE : "USER LOGGED OUT SUCCESSFULLY"
            });
    } catch (error) {
        
        console.log(`SOME ERROR OCCURED WHILE USER LOGOUT \n${error}`);
        res.status(500).json({
            MESSAGE : "SOME ERROR OCCURED WHILE LOGGING OUT USER | PLEASE TRY AGAIN",
            ERROR : error
        });
        return;
    };

})


// ALL THE FUNCTIONS OF DASHBOARD ARE CALLED HERE INSIDE SPECIFIC ROUTES
// ALL THE DASHBOARD ROUTERS WILL BE ACCESSED ONLY BY AUTHORISED VIEWERS AND ANALYST 
// THUS THEY DONT REQUIRE ANY RBAC HERE
//NOT IMPLEMENTING DASHBOARD ROUTES DUE TO TIME CONSTRAINTS

userRouter.use(RbacAnalystOrAdminOnly);

userRouter.get("/getRecordList" , async (req,res)=>{
    
    try {
        
        let newList = getRecordList();

        res.status(200).json(newList);
        return;
        
    } catch (error) {

        console.log(error);
        res.status(500).json({
            MESSAGE : "SOME ERROR OCCURED WHILE FETCHING RECORD LIST DATA FROM DB",
            ERROR : error
        });
        return;
        
    }

});

userRouter.get("/getSingleList" , async (req,res)=>{
    
    try {
        
        let newList = getSingleRecord(req.body.id);

        res.status(200).json(newList);
        return;
        
    } catch (error) {

        console.log(error);
        res.status(500).json({
            MESSAGE : "SOME ERROR OCCURED WHILE FETCHING RECORD DATA FROM DB",
            ERROR : error
        });
        return;
        
    }

});

module.exports = {
    userRouter
};