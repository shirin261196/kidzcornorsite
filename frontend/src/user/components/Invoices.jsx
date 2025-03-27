import React from "react";

const DownloadInvoice = ({ orderId }) => {
  const handleDownload = () => {
    const url = `http://localhost:4000/api/invoice/${orderId}`; // Adjust API URL
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `invoice-${orderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return <button onClick={handleDownload}>Download Invoice</button>;
};

export default DownloadInvoice;
