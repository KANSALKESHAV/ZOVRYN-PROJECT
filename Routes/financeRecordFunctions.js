//

const mongoose = require("mongoose");
const {financialRecordModel, financial_record_type, financial_record_categories} = require("../databaseModels/financialRecordsDB.model.js");
const { record } = require("zod");


async function getRecordList(req , res) {
    
    try {
            
        let financialRecordList = await financialRecordModel.find({ isDeleted : false})
            .select("_id amount financial_record_type financial_record_categories date description ")

        newList = financialRecordList.map(recordList => ({
            id : recordList._id,
            amount : recordList.amount,
            financial_record_type : recordList.financial_record_type,
            financial_record_categories : recordList.financial_record_categories,
            date : recordList.date,
            description : recordList.description
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

};

async function getSingleRecord(req , res) {
    
    try {

        const id = req.body.id;

        if (!mongoose.isValidObjectId(id)){

            res.status(400).json({
                MESSAGE : "INVALID FINANCIAL RECORD ID TO FETCH SINGLE FINANCIAL RECORD DATA"
            });
            return;

        };
            
        let record = await financialRecordModel.findById(id)
            .select("_id amount financial_record_type financial_record_categories date description isDeleted")

        if ( !record || record.isDeleted){

             res.status(404).json({
                MESSAGE : "NO RECORD FOUND WHILE FETCHING SINGLE RECORD DATA"
            });
            return;

        };

        res.status(200).json({
            id : record._id,
            amount : record.amount,
            financial_record_type : record.financial_record_type,
            financial_record_categories : record.financial_record_categories,
            date : record.date,
            description : record.description
        })
        return;
        
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