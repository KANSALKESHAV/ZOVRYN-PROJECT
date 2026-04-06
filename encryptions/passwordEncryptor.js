//ENCRYPTION - CREATING HASH AND VERIFYING PASSWORD 

const bcrypt = require("bcrypt");
const {saltRounds} = require("../Configrations/config.js");

function createHash(input){

    try {

        let salt = bcrypt.genSaltSync(saltRounds);
        let hashedPassword = bcrypt.hashSync(input , salt);
        return hashedPassword;
        
    }catch (error) {

        console.log(`SOME ERROR WHILE GENERATING THE HASH \n${error}`);
        return null;
    }

};

function verifyPassword(pw,encPw){

    try {

        let passwordMatch = bcrypt.compareSync(pw,encPw);
        console.log(passwordMatch);
        return (passwordMatch ?  true :  false);

    } catch (error) {

        console.log(`SOME ERROR WHILE VERIFYING THE PASSWORD \n${error}`);
        return null;

    }
    
}

module.exports = {
    createHash,
    verifyPassword
}