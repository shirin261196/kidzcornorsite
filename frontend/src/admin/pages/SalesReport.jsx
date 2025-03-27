import React, { useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { currency } from '../../App';
import { Card } from 'react-bootstrap';
import { Pagination } from "react-bootstrap";
// Register Chart.js components
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const SalesReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totals, setTotals] = useState({ totalSales: 0, totalOrders: 0, totalDiscount: 0 });
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate total pages
  const totalPages = Math.ceil(data.length / itemsPerPage);

  // Get current page data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = data.slice(indexOfFirstItem, indexOfLastItem);
  // Fetch Sales Report
  const fetchSalesReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:4000/api/reports/generate', {
        params: {
          filter,
          startDate: startDate ? moment(startDate).format('YYYY-MM-DD') : undefined,
          endDate: endDate ? moment(endDate).format('YYYY-MM-DD') : undefined,
        },
      });

      // Sort orders by createdAt (newest to oldest)
      const sortedOrders = response.data.data.orders.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setData(sortedOrders);
      setTotals({
        totalSales: response.data.data.totalSales,
        totalOrders: response.data.data.totalOrders,
        totalDiscount: response.data.data.totalDiscount,
      });

      const groupedData = response.data.data.orders.reduce((acc, order) => {
        let dateKey;
        if (filter === 'yearly') {
          dateKey = moment(order.createdAt).format('YYYY'); // Yearly grouping
        } else if (filter === 'monthly') {
          dateKey = moment(order.createdAt).format('YYYY-MM'); // Monthly grouping (e.g., "2025-03")
        } else {
          dateKey = moment(order.createdAt).format('MMM YYYY'); // Default grouping (monthly/yearly mix)
        }
  
        if (!acc[dateKey]) {
          acc[dateKey] = { date: dateKey, totalSales: 0, totalOrders: 0, totalDiscount: 0 };
        }
    
        acc[dateKey].totalSales += order.finalPrice;
        acc[dateKey].totalOrders += 1;
        acc[dateKey].totalDiscount += order.discountAmount;
    
        return acc;
      }, {});

      const labels = Object.keys(groupedData);
      const totalSales = labels.map((label) => groupedData[label].totalSales);
      const totalOrders = labels.map((label) => groupedData[label].totalOrders);
      const totalDiscounts = labels.map((label) => groupedData[label].totalDiscount);

      setChartData({
        labels,
        datasets: [
          {
            label: 'Total Sales',
            data: totalSales,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
          {
            label: 'Total Orders',
            data: totalOrders,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
          {
            label: 'Total Discount',
            data: totalDiscounts,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          },
        ],
      });

      toast.success('Sales report generated successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch sales report.');
    } finally {
      setLoading(false);
    }
  };



  // Download Report
  const downloadReport = async (type) => {
    try {
      const response = await axios.get(`http://localhost:4000/api/reports/download/${type}`, {
        responseType: 'blob',
        params: {
          startDate: startDate ? moment(startDate).format('YYYY-MM-DD') : undefined,
          endDate: endDate ? moment(endDate).format('YYYY-MM-DD') : undefined,
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales-report.${type === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${type.toUpperCase()} report downloaded successfully!`);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to download ${type.toUpperCase()} report.`);
    }
  };

  return (
    <div>
      <h1 className="text-center mb-4">Sales Report</h1>

      {/* Toast Notifications */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      {/* Filter Options */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <label className="form-label">Filter By</label>
          <select
            className="form-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        {filter === 'custom' && (
          <>
            <div className="col-md-3">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </>
        )}
        <div className="col-md-3 d-flex align-items-end">
          <button className="btn btn-primary w-100" onClick={fetchSalesReport} disabled={loading}>
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="p-3 bg-light border rounded">
            <h5>Total Sales</h5>
            <p>{currency}{totals.totalSales}</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="p-3 bg-light border rounded">
            <h5>Total Orders</h5>
            <p>{totals.totalOrders}</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="p-3 bg-light border rounded">
            <h5>Total Discount</h5>
            <p>{currency}{totals.totalDiscount}</p>
          </div>
        </div>
      </div>

      {/* Report Table */}
      <table className="table table-bordered">
        <thead className="table-dark">
          <tr>
            <th>Order ID</th>
            <th>Total Price</th>
            <th>Final Price</th>
            <th>Discount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {currentData.map((order) => (
            <tr key={order._id}>
              <td>{order._id}</td>
              <td>{currency}{order.totalPrice}</td>
              <td>{currency}{order.finalPrice}</td>
              <td>{currency}{order.discountAmount}</td>
              <td>{order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

            {/* Pagination */}
            <div className="d-flex justify-content-center mt-3">
        <Pagination>
          <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
          <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />
          {[...Array(totalPages)].map((_, index) => (
            <Pagination.Item key={index + 1} active={index + 1 === currentPage} onClick={() => setCurrentPage(index + 1)}>
              {index + 1}
            </Pagination.Item>
          ))}
          <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
          <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
        </Pagination>
      </div>
      {/* Sales Chart */}
      <div className="container mt-4">
  <h3 className="text-center mb-4">📊 Sales Summary</h3>
  
  <div className="row justify-content-center">
    <div className="col-md-10 col-lg-8">
      <Card className="shadow-lg p-4">
        <Card.Body>
          <div className="chart-container" style={{ width: "100%", height: "400px" }}>
            <Bar 
              data={chartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top", // Move legend to the top
                  },
                  tooltip: {
                    enabled: true, // Enable tooltips on hover
                  },
                },
                scales: {
                  x: {
                    grid: { display: false }, // Hide grid lines on X-axis
                  },
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => ` ₹${value.toLocaleString()}`, // Format Y-axis values as currency
                    },
                  },
                },
              }} 
            />
          </div>
        </Card.Body>
      </Card>
    </div>
  </div>
</div>
      {/* Download Buttons */}
      <div className="d-flex justify-content-end mt-4">
        <button className="btn btn-success me-2" onClick={() => downloadReport('pdf')}>
          Download PDF
        </button>
        <button className="btn btn-success" onClick={() => downloadReport('excel')}>
          Download Excel
        </button>
      </div>
    </div>
  );
};

export default SalesReport;
