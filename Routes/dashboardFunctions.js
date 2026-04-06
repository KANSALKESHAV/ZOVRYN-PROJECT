//

const { financialRecordModel } = require("../databaseModels/financialRecordsDB.model.js");


function buildDateFilter(startDate, endDate) {
    let date_filter = {};
    if (startDate) date_filter.$gte = new Date(startDate);
    if (endDate) date_filter.$lte = new Date(endDate);
    return date_filter;
}

function mergeTrendData(result_list, key_field) {
    let trend_map = {};
    result_list.forEach(function(item) {
        let period_key = item.period_key;
        if (!trend_map[period_key]) {
            trend_map[period_key] = {
                period: period_key,
                year: item.year,
                [key_field]: item[key_field],
                INCOME: 0,
                EXPENSE: 0,
                INCOME_count: 0,
                EXPENSE_count: 0
            };
        }
        trend_map[period_key][item.financial_record_type] = item.total_amount;
        trend_map[period_key][item.financial_record_type + "_count"] = item.record_count;
    });

    return Object.values(trend_map).map(function(single_trend) {
        single_trend.net = single_trend.INCOME - single_trend.EXPENSE;
        return single_trend;
    });
}


async function getSummary() {
    try {

        let aggregation_result = await financialRecordModel.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: "$financial_record_type",
                    total_amount: { $sum: "$amount" },
                    record_count: { $sum: 1 }
                }
            }
        ]);

        let summary_data = { INCOME: 0, EXPENSE: 0, INCOME_count: 0, EXPENSE_count: 0 };

        aggregation_result.forEach(function(item) {
            if (item._id === "INCOME") {
                summary_data.INCOME = item.total_amount;
                summary_data.INCOME_count = item.record_count;
            } else if (item._id === "EXPENSE") {
                summary_data.EXPENSE = item.total_amount;
                summary_data.EXPENSE_count = item.record_count;
            }
        });

        summary_data.net_balance = summary_data.INCOME - summary_data.EXPENSE;
        summary_data.total_records = summary_data.INCOME_count + summary_data.EXPENSE_count;

        return summary_data;

    } catch (error) {
        console.log(error);
        return null;
    }
}


async function getCategoryTotals(type, startDate, endDate) {
    try {

        let match_filter = { isDeleted: false };

        if (type) match_filter.financial_record_type = type;

        let date_filter = buildDateFilter(startDate, endDate);
        if (Object.keys(date_filter).length > 0) match_filter.date = date_filter;

        let category_result = await financialRecordModel.aggregate([
            { $match: match_filter },
            {
                $group: {
                    _id: { financial_record_categories: "$financial_record_categories", financial_record_type: "$financial_record_type" },
                    total_amount: { $sum: "$amount" },
                    record_count: { $sum: 1 }
                }
            },
            { $sort: { total_amount: -1 } },
            {
                $project: {
                    _id: 0,
                    financial_record_categories: "$_id.financial_record_categories",
                    financial_record_type: "$_id.financial_record_type",
                    total_amount: 1,
                    record_count: 1
                }
            }
        ]);

        return category_result;

    } catch (error) {
        console.log(error);
        return null;
    }
}


async function getMonthlyTrends(month_count) {
    try {

        month_count = Math.min(parseInt(month_count) || 12, 24);

        let start_date = new Date();
        start_date.setMonth(start_date.getMonth() - month_count + 1);
        start_date.setDate(1);
        start_date.setHours(0, 0, 0, 0);

        let monthly_result = await financialRecordModel.aggregate([
            { $match: { isDeleted: false, date: { $gte: start_date } } },
            {
                $group: {
                    _id: { year: { $year: "$date" }, month: { $month: "$date" }, financial_record_type: "$financial_record_type" },
                    total_amount: { $sum: "$amount" },
                    record_count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
            {
                $project: {
                    _id: 0,
                    year: "$_id.year",
                    month: "$_id.month",
                    financial_record_type: "$_id.financial_record_type",
                    total_amount: 1,
                    record_count: 1,
                    period_key: { $concat: [ { $toString: "$_id.year" }, "-", { $toString: "$_id.month" } ] }
                }
            }
        ]);

        return mergeTrendData(monthly_result, "month");

    } catch (error) {
        console.log(error);
        return null;
    }
}


async function getWeeklyTrends(week_count) {
    try {

        week_count = Math.min(parseInt(week_count) || 8, 52);

        let start_date = new Date();
        start_date.setDate(start_date.getDate() - week_count * 7);
        start_date.setHours(0, 0, 0, 0);

        let weekly_result = await financialRecordModel.aggregate([
            { $match: { isDeleted: false, date: { $gte: start_date } } },
            {
                $group: {
                    _id: { year: { $isoWeekYear: "$date" }, week: { $isoWeek: "$date" }, financial_record_type: "$financial_record_type" },
                    total_amount: { $sum: "$amount" },
                    record_count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.week": 1 } },
            {
                $project: {
                    _id: 0,
                    year: "$_id.year",
                    week: "$_id.week",
                    financial_record_type: "$_id.financial_record_type",
                    total_amount: 1,
                    record_count: 1,
                    period_key: { $concat: [ { $toString: "$_id.year" }, "-W", { $toString: "$_id.week" } ] }
                }
            }
        ]);

        return mergeTrendData(weekly_result, "week");

    } catch (error) {
        console.log(error);
        return null;
    }
}


async function getRecentActivity(record_limit) {
    try {

        record_limit = Math.min(parseInt(record_limit) || 10, 50);

        let recent_records = await financialRecordModel.find({ isDeleted: false })
            .sort({ date: -1 })
            .limit(record_limit)
            .populate("createdBy", "name email");

        return recent_records;

    } catch (error) {
        console.log(error);
        return null;
    }
}

module.exports = { getSummary, getCategoryTotals, getMonthlyTrends, getWeeklyTrends, getRecentActivity };