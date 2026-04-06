const jwt = require("jsonwebtoken");

const {
    ACCESS_JWT_SECRET ,
    ACCESS_JWT_TIME ,
    REFRESH_JWT_SECRET ,
    REFRESH_JWT_TIME } = require("../Configrations/config.js");


function generateAccessToken(id , email){

    let accessToken = jwt.sign({
        id , 
        email
    },ACCESS_JWT_SECRET,{
        expiresIn : ACCESS_JWT_TIME
    });
    return accessToken;

};

function generateRefreshToken(id){

    let refeshToken = jwt.sign({
        id 
    },REFRESH_JWT_SECRET,{
        expiresIn : REFRESH_JWT_TIME
    });
    return refeshToken;

};

module.exports = {
    generateAccessToken,
    generateRefreshToken
};
