// FINANCE RECORD VALIDATOR 

const {z} = require("zod");

const {financial_record_categories , financial_record_type} = require("../databaseModels/financialRecordsDB.model.js")

const financialRecordSchema = z.object({

    amount : z
        .number({ message : "AMOUNT SHOULD BE A NUMBER"})
        .positive({ message : "AMOUNT MUST BE GREATER THAN 0"}),
    
    type : z
        .enum(financial_record_type , { message : `THE TYPE MUST BE OF : ${financial_record_type.join(" , ")}`}),

    category : z
        .enum(financial_record_categories , { message : `THE CATEGORY MUST BE OF : ${financial_record_categories.join(" , ")}`}),

    date : z
        .string()
        .or(z.date())
        .optional(),

    description : z
        .string()
        .max( 200 , { message : "DESCRIPTION MUST BE MAX 200 CHARACTERS"})
        .trim()
        .optional(),
    
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

function validateFinancialRecords(input){

    return validateInput(input,financialRecordSchema);

};


module.exports = {
    validateFinancialRecords
};