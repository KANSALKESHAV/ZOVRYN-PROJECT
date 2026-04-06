//

const mongoose = require("mongoose");
const {financialRecordModel, financial_record_type, financial_record_categories} = require("../databaseModels/financialRecordsDB.model.js");


async function getRecordList() {
    
    try {
            
        let recordList = await financialRecordModel.find({ isDeleted : false})
            .select("_id amount financial_record_type financial_record_categories date description ")

        newList = recordList.map(user => ({
            id : recordList._id,
            amount : recordList.amount,
            financial_record_type : recordList.financial_record_type,
            financial_record_categories : recordList.financial_record_categories,
            date : recordList.date,
            description : recordList.description
        }));

        
        return(newList);
        
    } catch (error) {

        console.log(error);
        res.status(500).json({
            MESSAGE : "SOME ERROR OCCURED WHILE FETCHING USER LIST DATA FROM DB",
            ERROR : error
        });
        return;
        
    }

};

async function getSingleRecord(id) {
    
    try {
        if (!mongoose.isValidObjectId(id)){

            res.status(400).json({
                MESSAGE : "INVALID FINANCIAL RECORD ID TO FETCH SINGLE FINANCIAL RECORD DATA"
            });
            return;

        };
            
        let record = await financialRecordModel.findById(id)
            .select("_id amount financial_record_type financial_record_categories date description ")

        if ( !record || record.isDeleted){

             res.status(404).json({
                MESSAGE : "NO RECORD FOUND WHILE FETCHING SINGLE RECORD DATA"
            });
            return;

        }

        newList = recordList.map(user => ({
            id : recordList._id,
            amount : recordList.amount,
            financial_record_type : recordList.financial_record_type,
            financial_record_categories : recordList.financial_record_categories,
            date : recordList.date,
            description : recordList.description
        }));

        return(newList);
        
    } catch (error) {

        console.log(error);
        res.status(500).json({
            MESSAGE : "SOME ERROR OCCURED WHILE FETCHING USER LIST DATA FROM DB",
            ERROR : error
        });
        return;
        
    }

};

module.exports = {
    getRecordList,
    getSingleRecord
};