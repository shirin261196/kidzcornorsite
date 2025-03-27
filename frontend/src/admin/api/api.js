import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:4000/api' }); // Replace with your backend URL

export const fetchReport = (filters) => API.post('/reports/generate', filters);
export const downloadPDF = (data) =>
  API.post('/reports/download/pdf', data, { responseType: 'blob' });
export const downloadExcel = (data) =>
  API.post('/reports/download/excel', data, { responseType: 'blob' });
