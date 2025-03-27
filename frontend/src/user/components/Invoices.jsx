import React from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Define the base URL for API calls
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.mykidzcornor.info'
  : 'http://localhost:4000'; // Use localhost for local development

const DownloadInvoice = ({ orderId }) => {
  const handleDownload = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error('Authentication token not found. Please log in.');
      }

      // Fetch the invoice PDF as a blob
      const response = await axios.get(`${API_URL}/api/invoice/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob', // Important for handling binary data (PDF)
      });

      // Create a blob URL for the PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link to trigger the download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      console.error("Error downloading invoice:", error.response?.data || error.message);
      toast.error(error.message || 'Error downloading invoice. Please try again.');
    }
  };

  return (
    <button onClick={handleDownload} className="btn btn-primary btn-sm">
      Download Invoice
    </button>
  );
};

export default DownloadInvoice;