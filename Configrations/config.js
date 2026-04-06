//CONFIG FILE FETCHING ALL THE SECRETS FROM ENV AND EXPORTING IT TO OTHER FILES

const path = require("path");
let envPath = path.join(__dirname,'.env');

require("dotenv").config({path : envPath});

const port = process.env.port;
const mongooseUrl = process.env.mongooseUrl;
const saltRounds = Number(process.env.saltRounds);
const ACCESS_JWT_SECRET= process.env.ACCESS_JWT_SECRET ;
const ACCESS_JWT_TIME= process.env.ACCESS_JWT_TIME ;
const REFRESH_JWT_SECRET= process.env.REFRESH_JWT_SECRET ;
const REFRESH_JWT_TIME= process.env.REFRESH_JWT_TIME ;
const ENCRYPTED_ADMIN_PASSWORD = process.env.ENCRYPTED_ADMIN_PASSWORD ;

module.exports ={

    port,
    mongooseUrl,
    saltRounds,
    ACCESS_JWT_SECRET,
    ACCESS_JWT_TIME,
    REFRESH_JWT_SECRET,
    REFRESH_JWT_TIME,
    ENCRYPTED_ADMIN_PASSWORD

}