import { Parser } from "json2csv";
import Ledger from "../models/ledgerModal.js";
import moment from 'moment';


export const getLedgerReport = async (req, res,next) => {
    try {
        const { startDate, endDate, page = 1, limit = 10 } = req.query;
        const query = {};

        if (startDate) query.createdAt = { $gte: new Date(startDate) };
        if (endDate) query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };

        // Total Count of Documents
        const totalCount = await Ledger.countDocuments(query);

        // Fetch Paginated Ledger Data
        const ledgerData = await Ledger.find(query)
            .populate('user', 'name') 
            .sort({ createdAt: -1 }) 
            .skip((page - 1) * limit)
            .limit(Number(limit));

        // ✅ Aggregate to calculate total credit and debit across all data (not just the page)
        const totalSums = await Ledger.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalCredit: {
                        $sum: {
                            $cond: [
                                { $or: [{ $eq: ["$type", "REFUND"] }, { $eq: ["$type", "WALLET_TOPUP"] }] },
                                "$amount",
                                0
                            ]
                        }
                    },
                    totalDebit: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "ORDER_PAYMENT"] }, "$amount", 0]
                        }
                    }
                }
            }
        ]);

        // If no transactions exist, set totals to 0
        const { totalCredit = 0, totalDebit = 0 } = totalSums.length > 0 ? totalSums[0] : {};

        res.json({
            data: ledgerData,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: Number(page),
            totalCredit, // ✅ Send totalCredit for all pages
            totalDebit  // ✅ Send totalDebit for all pages
        });
    } catch (error) {
       next(error)
    }
  };


  export const exportLedgerCSV = async (req, res,next) => {
    try {
        const ledgerData = await Ledger.find().populate('user', 'name');
        const csvFields = ['Date', 'User', 'Type', 'Amount', 'Description', 'BalanceAfterTransaction'];
        const csvData = ledgerData.map(entry => ({
            Date: moment(entry.createdAt).format('YYYY-MM-DD'),
            User: entry.user?.name || 'N/A',
            Type: entry.type,
            Amount: entry.amount,
            Description: entry.description,
            BalanceAfterTransaction: entry.balanceAfterTransaction
        }));

        const parser = new Parser({ fields: csvFields });
        const csv = parser.parse(csvData);

        res.header('Content-Type', 'text/csv');
        res.attachment('ledger_report.csv');
        res.send(csv);
    } catch (error) {
       next(error)
    }
  };