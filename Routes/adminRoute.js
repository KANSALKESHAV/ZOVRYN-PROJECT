//ADMIN ENDPOINT ROUTER

const express = require("express");

const {ENCRYPTED_ADMIN_PASSWORD} = require("../Configrations/config.js");
const {validateUser , validateSignIn} = require("../validations/userValidator.js");
const {adminModel} = require("../databaseModels/adminDB.model.js");
const {userModel} = require("../databaseModels/userDB.model.js");
const {financialRecordModel} = require("../databaseModels/financialRecordsDB.model.js");
const {validateFinancialRecords} = require("../validations/financeRecordValidator.js");
const {createHash , verifyPassword} = require("../encryptions/passwordEncryptor.js");
const {generateAccessToken , generateRefreshToken} = require("../authMiddleWares/jwtAuthTokenGen.js");
const {adminAuthMiddleware} = require("../authMiddleWares/adminAuthMW.js");
const {getRecordList , getSingleRecord} = require("./financeRecordFunctions.js");
const mongoose = require("mongoose");


const adminRouter = express.Router();

const cookieOptions = {
    httpOnly : true,
    secure : true
};


adminRouter.post("/signup" , async (req,res)=>{

    let verifiedData = validateUser(req.body);
    let { adminPassword } = req.body;
    
    if ( !adminPassword || !verifyPassword( adminPassword , ENCRYPTED_ADMIN_PASSWORD ) ){

        res.status(401).json({
            MESSAGE : "PROVIDE VALID ADMIN ACCESS PASSWORD TO CREATE ADMIN"
        });
        return;
        
    };

    if(!verifiedData.success){

        res.status(400).json({
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

        console.log(`SOME ERROR OCCURED WHILE SIGNING UP NEW ADMIN\N${error}`);
        res.status(500).json({
            MESSAGE : "SOME ERROR OCCURED WHILE SIGNING UP NEW ADMIN"
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

        const admin = await adminModel.create({
            email : req.body.email,
            password : hashedPW,
            firstName : req.body.firstName,
            lastName : req.body.lastName,
            role : "ADMIN",
            isDeleted : false,
        });


    } catch (error) {
        
        console.log(`SOME ERROR OCCURED WHILE CONNECTING TO THE DB WHILE SIGNING UP ADMIN\n${error}`);
        res.status(500).json({
            MESSAGE : "SOME ERROR OCCURED WHILE CONNECTING TO THE DB WHILE SIGNING UP ADMIN"
        });
        return;
    };

    res.status(200).json({
        MESSAGE : "ADMIN CREATED SUCCESSFULLY"
    });
    return;
    
});

adminRouter.post("/signin" , async (req,res)=>{
    
    let { email , password } = req.body;

    let signinVerifiedData = validateSignIn({email,password});
    if (!signinVerifiedData.success){

        res.status(400).json({
            MESSAGE : "INVALID CERDENTIALS",
            ERROR : signinVerifiedData.error
        });
        return;

    };

    let existingAdmin = await adminModel.findOne({email});
    if (!existingAdmin || existingAdmin.isDeleted){
         
        res.status(404).json({
            MESSAGE : "ADMIN WITH GIVEN EMAIL DOESNOT EXISTS"
        });
        return;

    }

    let passwordVerification = verifyPassword(password , existingAdmin.password);
    if(!passwordVerification){
        res.status(401).json({
            MESSAGE : "INCORRECT PASSWORD"
        });
        return;
    }

    if (!existingAdmin.isActive){
         
        res.status(404).json({
            MESSAGE : "ADMIN WITH GIVEN EMAIL IS DEACTIVATED"
        });
        return;

    }

    let accessToken = generateAccessToken(existingAdmin._id , email);
    let refreshToken = generateRefreshToken(existingAdmin._id);
    let lastLoginAt = Date.now();

    try {
        
        let updatedAdmin = await adminModel.updateOne({
            email
        },{
            refreshToken,
            lastLoginAt
        });

    } catch (error) {
         
        res.status(500).json({
            MESSAGE : "SORRY ! SOME ERROR OCCURED IN DB IN ADMIN SIGNUP | PLEASE TRY AGAIN"
        });
        return;

    }


    return res
        .status(200)
        .cookie("adminAccessToken" , accessToken , cookieOptions)
        .cookie("adminRefreshToken" , refreshToken , cookieOptions)
        .json({
            MESSAGE : "ADMIN LOGGED IN SUCCESSFULLY",
            accessToken,
            refreshToken,
        })

});

adminRouter.use(adminAuthMiddleware);

adminRouter.get("/me" , async (req,res)=>{

    let authAdmin = req.authAdmin;
    try {
        let existingAdmin = await adminModel.findById(authAdmin._id)
            .select("_id email firstName lastName  isActive isDeleted");

        if(!existingAdmin || existingAdmin.isDeleted){
            res.status(404).json({
                MESSAGE : "ADMIN WITH GIVEN EMAIL DOESNOT EXISTS"
            });
            return;
        }

        if(!existingAdmin.isActive){
            res.status(404).json({
                MESSAGE : "ADMIN WITH GIVEN EMAIL IS DEACTIVATED"
            });
            return;
        }

        return res
            .status(200)
            .json({
                MESSAGE : "ADMIN /ME DATA",
                ID : existingAdmin._id,
                firstName : existingAdmin.firstName,
                lastName : existingAdmin.lastName,
                email : existingAdmin.email,
            })

    } catch (error) {
        console.log(`SOME ERROR OCCURED WHILE FETCHING ADMIN ME DATA \n${error}`);
        res.status(500).json({
            MESSAGE : "SOME ERROR OCCURED WHILE FETCHING ADMIN ME DATA | PLEASE TRY AGAIN",
            ERROR : error
        });
        return;
    }
});

adminRouter.post("/logout" , async (req,res)=>{

    let authAdmin = req.authAdmin;
    try {
        let existingAdmin = await adminModel.findByIdAndUpdate(
            authAdmin._id,
            {
                $set : {refreshToken : null}
            },
            {
                new : true
            }
        );

        return res
            .status(200)
            .clearCookie("adminAccessToken" , cookieOptions)
            .clearCookie("adminRefreshToken" , cookieOptions)
            .json({
                MESSAGE : "ADMIN LOGGED OUT SUCCESSFULLY"
            });
    } catch (error) {
        
        console.log(`SOME ERROR OCCURED WHILE ADMIN LOGOUT \n${error}`);
        res.status(500).json({
            MESSAGE : "SOME ERROR OCCURED WHILE LOGGING OUT ADMIN | PLEASE TRY AGAIN",
            ERROR : error
        });
        return;
    };

})

adminRouter.post("/addUser" , async (req,res)=>{

    let verifiedData = validateUser(req.body);
    if(!verifiedData.success){

        res.status(400).json({
            MESSAGE : "INVALID CERDENTIALS",
            ERROR : verifiedData.error
        });
        return;

    }

    let existingUser;
    try {
        existingUser = await userModel.findOne(
            { email : req.body.email }
        ) 

    } catch (error) {

        console.log(`SOME ERROR OCCURED WHILE ADDING NEW USER\N${error}`);
        res.status(500).json({
            MESSAGE : "SOME ERROR OCCURED WHILE ADDING NEW USER"
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
        
        console.log(`SOME ERROR OCCURED WHILE CONNECTING TO THE DB WHILE ADDING AN USER\n${error}`);
        res.status(500).json({
            MESSAGE : "SOME ERROR OCCURED WHILE CONNECTING TO THE DB WHILE ADDING AN USER"
        });
        return;
    };

    res.status(200).json({
        MESSAGE : "USER CREATED SUCCESSFULLY"
    });

});

adminRouter.get("/getUser" , async(req,res)=>{
    
    try {

        if (!mongoose.isValidObjectId(req.body.id)){

            res.status(400).json({
                MESSAGE : "INVALID USER ID TO FETCH SINGLE USER DATA"
            });
            return;

        };
        
        let user = await userModel.findById(req.body.id)
            .select("_id email firstName lastName role isActive isDeleted");

        if ( !user || user.isDeleted){

             res.status(404).json({
                MESSAGE : "NO USER FOUND WHILE FETCHING SINGLE USER DATA"
            });
            return;

        }

        res.status(200).json({
            ID: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            activeStatus: user.isActive ? "ACTIVE" : "DEACTIVATED"
        });
        return;
        
    } catch (error) {

        console.log(error);
        res.status(500).json({
            MESSAGE : "SOME ERROR OCCURED WHILE FETCHING USER LIST DATA FROM DB",
            ERROR : error
        });
        return;
        
    }

});

adminRouter.get("/userList" , async (req,res)=>{
    
    try {
        
        let userList = await userModel.find({ isDeleted : false})
            .select("_id email firstName lastName role isActive ")

        newList = userList.map(user => ({
            ID: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            activeStatus: user.isActive ? "ACTIVE" : "DEACTIVATED"
        }));

        res.status(200).json(newList);
        return;
        
    } catch (error) {

        console.log(error);
        res.status(500).json({
            MESSAGE : "SOME ERROR OCCURED WHILE FETCHING USER LIST DATA FROM DB",
            ERROR : error
        });
        return;
        
    }

});

adminRouter.put("/updateUSer" , (req,res)=>{

});

adminRouter.delete("/deleteUser" , async (req,res)=>{

    const {id} = req.body;

    try {

        if (!mongoose.isValidObjectId(req.body.id)){

            res.status(400).json({
                MESSAGE : "INVALID USER ID TO FETCH SINGLE USER DATA"
            });
            return;

        };

        let user = await userModel.findById(id).select("email firstName lastName role isDeleted");

        if(!user || user.isDeleted){
            res.status(404).json({
                MESSAGE : "USER NOT FOUND"
            });
            return;
        }
        
        user.isDeleted=true;
        user.refreshToken=null;
        await user.save();

        res.status(200).json({
            MESSAGE : "USER DELETED SUCCESSFULLY",
            NAME : `${user.firstName} ${user.lastName}`,
            OBJECTID : user._id
        });
        return;

    } catch (error) {
        
        console.log(error);
        res.status(500).json({
            MESSAGE : "SOME ERROR WHILE DELETING THE USER",
            ERROR : error
        });
        return;
        
    }
    

});

adminRouter.post("/createRecord" , async (req,res)=>{

    let verifiedFinancialRecords = validateFinancialRecords(req.body);

    if(!verifiedFinancialRecords.success){

        res.status(400).json({
            MESSAGE : "INVALID CERDENTIALS FOR CREATING FINANCIAL RECORD",
            ERROR : verifiedFinancialRecords.error
        });
        return;

    }

    try {

        verifiedData = verifiedFinancialRecords.data;
        const financeRecord = await financialRecordModel.create({
            amount : verifiedData.amount,
            financial_record_type : verifiedData.type,
            financial_record_categories : verifiedData.category,
            date : verifiedData.date ? verifiedData.date : Date.now(),
            description : verifiedData.description ? verifiedData.description : null,
            createdBy : req.authAdmin._id,
            createdByModel : "ADMIN"
        });


    } catch (error) {
        
        console.log(`SOME ERROR OCCURED WHILE CREATING FINANCIAL RECORDS\n${error}`);
        res.status(500).json({
            MESSAGE : "SOME ERROR OCCURED WHILE CONNECTING TO THE DB WHILE FINANCIAL RECORDS"
        });
        return;
    };

    res.status(200).json({
        MESSAGE : "FINANCIAL RECORD CREATED SUCCESSFULLY"
    });
    return;

});

adminRouter.delete("/deleteFinancialRecord" , async (req,res)=>{

    const {id} = req.body;

    try {

        if (!mongoose.isValidObjectId(id)){

            res.status(400).json({
                MESSAGE : "INVALID FINANCIAL RECORD ID TO DELETE RECORD"
            });
            return;

        };

        let financeRecord = await financialRecordModel.findById(id).select("isDeleted");

        if(!financeRecord || financeRecord.isDeleted){
            res.status(404).json({
                MESSAGE : "FINANCE RECORD NOT FOUND"
            });
            return;
        }
        
        financeRecord.isDeleted=true;
        await financeRecord.save();

        res.status(200).json({
            MESSAGE : "FINANCE RECORD DELETED SUCCESSFULLY",
            OBJECTID : financeRecord._id
        });
        return;

    } catch (error) {
        
        console.log(error);
        res.status(500).json({
            MESSAGE : "SOME ERROR WHILE DELETING THE FINANCE RECORD",
            ERROR : error
        });
        return;
        
    }
    

});

adminRouter.get("/getRecordList" , getRecordList);

adminRouter.get("/getSingle" , getSingleRecord);

// ALL THE FUNCTIONS OF DASHBOARD ARE CALLED HERE INSIDE SPECIFIC ROUTES
// ALL THE DASHBOARD ROUTERS WILL BE ACCESSED ONLY BY AUTHORISED ADMINS
// THUS THEY DONT REQUIRE ANY RBAC HERE BECAUSE THESE ROUTES ARE ACCESSIBLE TO ADMIN ONLY
// NOT IMPLEMENTING DASHBOARD ROUTES DUE TO TIME CONSTRAINTS

module.exports = {
    adminRouter
};