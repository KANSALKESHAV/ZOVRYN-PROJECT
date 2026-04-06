//MONGODB SCHEMA FOR FINANCIAL RECORDS

const mongoose = require("mongoose");
const schema = mongoose.Schema;
const objectID = schema.Types.ObjectId;

const financial_record_type = ["INCOME" , "EXPENSE"];
const financial_record_categories = [
    //Income categories
        "salary",
        "freelance",
        "investment",
        "business",
        "rental",
        "other_income",
    // Expense categories
        "rent",
        "utilities",
        "groceries",
        "transport",
        "healthcare",
        "education",
        "entertainment",
        "marketing",
        "operations",
        "other_expense",
    ];

const financialRecordSchema = new schema({

    amount : {
        type : Number,
        required : true,
        min : 1
    },

    financial_record_type : {
        type : String,
        enum : financial_record_type,
        required : true
    },

    financial_record_categories : {
        type : String,
        enum : financial_record_categories,
        required : true
    },

    date : {
        type : date,
        required : true,
        default : Date.now
    },

    description : {
        type : String,
        trim  : true,
        max : 500,
        default : ""
    },

    tags : {
        type : [String],
        default : []
    },

    createdBy : {
        type : objectID,
        refPath : "createdByModel",
        required : true, 
    },

    createdByModel : {
        type : String,
        enum : ["USER" , "ADMIN"],
        required : true
    },

    isDeleted : {
        type : Boolean,
        default : false
    }

},{
    timestamps : true
});


financialRecordSchema.index({ type : 1 , date : -1});
financialRecordSchema.index({ financial_record_categories : 1 });
financialRecordSchema.index({ date : 1 });
financialRecordSchema.index({ createdBy : 1 });

const financialRecordModel = mongoose.model("FINANCIALRECORDS" , financialRecordSchema);

module.exports = {
    financialRecordModel,
    financial_record_categories,
    financial_record_type
};