//AUTHORISATION VALIDATOR FOR USER [ VIEWER , ANALYST ] AND ADMIN

const {z} = require("zod");

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

const userValidationSchema = z.object({

    email : z
        .email({message : "INVALID EMAIL FORMAT"})
        .min(5 , { message : "THE LENGTH OF EMAIL MUST BE MIN 5 CHARACTERS" })
        .max(50 , { message : "THE LENGTH OF EMAIL MUST BE MAX 50 CHARACTERS" })
        .toLowerCase(),


    password : z
        .string({ message : "THE PASSWORD MUST BE STRING TYPE" })
        .min(8 , { message : "THE LENGTH OF PASSWORD MUST BE MIN 8 CHARACTERS" })
        .max(20 , { message : "THE LENGTH OF PASSWORD MUST BE MAX 20 CHARACTERS" })
        .regex(passwordRegex , { message : "THE PASSWORD MUST CONTAIN A UPPERCASE , A LOWERCASE AND A NUMERIC DIGIT" }),


    firstName : z
        .string({ message : "THE FIRST NAME MUST BE STRING TYPE" })
        .min(3 , { message : "THE LENGTH OF FIRSTNAME MUST BE MIN 3 CHARACTERS" })
        .max(30 , { message : "THE LENGTH OF FIRSTNAME MUST BE MAX 30 CHARACTERS" })
        .trim()
        .toUpperCase(),

    lastName : z
        .string({ message : "THE LAST NAME MUST BE STRING TYPE" })
        .max(20 , { message : "THE LENGTH OF LASTNAME MUST BE MAX 20 CHARACTERS" })
        .toUpperCase()
        .optional()
        .nullable()
        .refine(val => val === "" ||(val && val.length >= 3), {
            message: "THE LENGTH OF LASTNAME MUST BE MIN 3 CHARACTERS",
        }),

    role : z
        .enum([ "VIEWER" , "ANALYST" , "ADMIN"] , { message : "THE ROLE MUST BE EITHER VIEWER OR ANALYST OR ADMIN ONLY"})
        
});

function validateInput(input,givenSchema){

    const parsedData = givenSchema.safeParse(input);

    if(parsedData.success){
        return {
            success : parsedData.success,
            data : parsedData.data,
            error : null
        }
    }else{
        return {       
            success : parsedData.success,
            data : null,
            error : Object.entries(parsedData.error.flatten().fieldErrors).flat(),
        }
    }

};

function validateUser(input){
    input.role = input.role.toUpperCase();
    return validateInput(input,userValidationSchema);

};

function validateSignIn(input){

    const signInSchema = userValidationSchema.omit({
        firstName : true,
        lastName : true,
        role : true
    });

    return validateInput(input,signInSchema);

};

// const obj={
//     email : "keshav@mail.com",
//     firstName : " huhjaj",
//     password : " jbfhrbA12",
//     lastName : "juhjq ",
//     role : "viewer",
//     bjbwc :"mjnfjn",
//     kjrbfkwbn : "2mkn"
// };

// console.log(validateUser(obj))

module.exports = {
    validateSignIn,
    validateUser
};