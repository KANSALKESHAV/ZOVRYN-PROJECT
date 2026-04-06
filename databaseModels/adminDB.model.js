//MONGODB SCHEMA FOR ADMIN

const mongoose = require("mongoose");
const schema = mongoose.Schema;
const objectID = schema.Types.ObjectId;

const adminSchema = new schema({

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
        enum : ["ADMIN"],
        default : "ADMIN",
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

adminSchema.index({ email : 1 });
const adminModel = mongoose.model("ADMINS" , adminSchema);

module.exports = {
    adminModel
};