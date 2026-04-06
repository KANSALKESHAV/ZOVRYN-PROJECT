//MONGODB SCHEMA FOR USERS

const mongoose = require("mongoose");
const schema = mongoose.Schema;
const objectID = schema.Types.ObjectId;

const userRoles = ["VIEWER" , "ANALYST"];

const userSchema = new schema({

    email : {
        type : String,
        required : true,
        unique : true,
        minLength : 5,
        maxLength : 50,
        lowercase : true,
    },

    password : {
        type : String,
        required : true,
    },

    firstName : {
        type : String,
        required : true,
        minLength : 3,
        maxLength : 30,
        trim : true,
        uppercase : true,
    },

    lastName : {
        type : String,
        trim : true,
        maxLength : 20,
        uppercase : true,
    },

    role : {
        type : String,
        enum : userRoles,
        default : "VIEWER",
    },

    isActive : {
        type : Boolean,
        default : true
    },

    refreshToken : {
        type : String,
        default : null
    },

    lastLoginAt : {
        type : Date,
        default : null
    },

    isDeleted : {
        type : Boolean,
        default : false
    },


},{
    timestamps : true
});

userSchema.index({ email : 1 });
userSchema.index({ role : 1 });
userSchema.index({ isActive : 1 });

const userModel = mongoose.model("USERS" , userSchema);

module.exports = {
    userModel
};