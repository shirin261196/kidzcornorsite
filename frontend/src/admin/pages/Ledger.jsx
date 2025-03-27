import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Ledger = () => {
  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totals, setTotals] = useState({ totalCredit: 0, totalDebit: 0 });

  // Get token from local storage or any auth mechanism
  const token = localStorage.getItem('adminToken');

  // Axios instance with auth header
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:4000/admin',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // Fetch Ledger Report
// Fetch Ledger Report
const fetchLedgerReport = async (newPage = 1) => {
    setLoading(true);
    try {
        const response = await axiosInstance.get('/ledgerreport', {
            params: { startDate, endDate, page: newPage, limit: 10 },
        });

        console.log("Ledger API Response:", response.data);

        // ✅ Set ledger data, total pages, and current page
        setLedgerData(response.data.data);
        setTotalPages(response.data.totalPages);
        setPage(response.data.currentPage);

        // ✅ Set global totals (fetched from backend)
        setTotals({
            totalCredit: response.data.totalCredit,
            totalDebit: response.data.totalDebit
        });

        toast.success('Ledger report generated successfully!');
    } catch (error) {
        console.error(error);
        toast.error('Failed to fetch ledger report.');
    } finally {
        setLoading(false);
    }
};

  

  // Calculate Total Credit & Debit
  const calculateTotals = (entries) => {
    let totalCredit = 0, totalDebit = 0;
  
    entries.forEach((entry) => {
      if (entry.type === 'REFUND' || entry.type === 'WALLET_TOPUP') {
        totalCredit += entry.amount;  // Credit transactions
      } else if (entry.type === 'ORDER_PAYMENT') {
        totalDebit += entry.amount;   // Debit transactions
      }
    });
  
    setTotals({ totalCredit, totalDebit });
  };
  
  
  

  // Export CSV
  const exportCSV = async () => {
    try {
      const response = await axiosInstance.get('/export-ledger-csv', {
        responseType: 'blob', // Important for downloading files
      });

      // Create a link element and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ledger_report.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('CSV downloaded successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to export CSV.');
    }
  };

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Ledger Report</h1>

      {/* Toast Notifications */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      {/* Filter Options */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <label className="form-label">Start Date</label>
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">End Date</label>
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="col-md-4 d-flex align-items-end">
          <button className="btn btn-primary w-100" onClick={fetchLedgerReport} disabled={loading}>
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="p-3 bg-light border rounded text-center">
            <h5>Total Credit</h5>
            <p className="fw-bold text-success">{totals.totalCredit}</p>
          </div>
        </div>
        <div className="col-md-6">
          <div className="p-3 bg-light border rounded text-center">
            <h5>Total Debit</h5>
            <p className="fw-bold text-danger">{totals.totalDebit}</p>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="table-responsive">
        <table className="table table-bordered">
          <thead className="table-dark">
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Balance After Transaction</th>
            </tr>
          </thead>
          <tbody>
            {ledgerData.map((entry, index) => (
              <tr key={index}>
                <td>{moment(entry.createdAt).format('DD-MM-YYYY')}</td>
                <td>{entry.user?.name || 'N/A'}</td>
                <td className={entry.type === 'credit' ? 'text-success' : 'text-danger'}>
                  {entry.type}
                </td>
                <td>{entry.amount}</td>
                <td>{entry.description}</td>
                <td>{entry.balanceAfterTransaction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
{/* Pagination Buttons */}
<div className="d-flex justify-content-between mt-4">
  <button 
    className="btn btn-secondary" 
    disabled={page <= 1} 
    onClick={() => fetchLedgerReport(page - 1)}
  >
    Previous
  </button>

  <span className="mx-3">Page {page} of {totalPages}</span>

  <button 
    className="btn btn-secondary" 
    disabled={page >= totalPages || totalPages === 0} 
    onClick={() => fetchLedgerReport(page + 1)}
  >
    Next
  </button>
</div>

      {/* Download CSV Button */}
      <div className="d-flex justify-content-end mt-4">

        <button className="btn btn-success" onClick={exportCSV}>
          Download CSV
        </button>
      </div>
    </div>


  );
};

export default Ledger;
