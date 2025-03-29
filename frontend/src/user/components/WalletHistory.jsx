import { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Container, Spinner, Row, Col, Card } from "react-bootstrap";

const WalletHistory = () => {
  const [walletHistory, setWalletHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWalletHistory();
  }, [page]);
// Define the base URL for API calls
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.mykidzcornor.info'
  : 'http://localhost:5001'; // Use localhost for local development

const fetchWalletHistory = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error('Authentication token not found. Please log in.');
    }

    const response = await axios.get(`${API_URL}/user/wallet/details?page=${page}&limit=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data.success) {
      setWalletHistory(response.data.transactions || []);
      setTotalTransactions(response.data.totalTransactions || 0);
    } else {
      throw new Error(response.data.message || 'Failed to fetch wallet history.');
    }
  } catch (error) {
    console.error("Error fetching wallet history:", error.response?.data || error.message);
    toast.error(error.message || 'Error fetching wallet history. Please try again.');
  } finally {
    setLoading(false);
  }
};
  return (
    <Container className="mt-4">
      <Row className="justify-content-center">
        <Col md={10}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="text-center text-primary fw-bold">Wallet Transaction History</Card.Title>

              {loading ? (
                <div className="text-center">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : walletHistory.length === 0 ? (
                <p className="text-center text-muted">No transactions found.</p>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover className="text-center">
                    <thead className="bg-primary text-white">
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {walletHistory.map((transaction, index) => (
                        <tr key={index}>
                          <td>{new Date(transaction.date).toLocaleString()}</td>
                          <td
                            className={
                              transaction.type === "CREDIT"
                                ? "text-success fw-bold"
                                : "text-danger fw-bold"
                            }
                          >
                            {transaction.type}
                          </td>
                          <td>₹{transaction.amount}</td>
                          <td>{transaction.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}

              {/* Pagination Controls */}
              {totalTransactions > 5 && (
                <div className="d-flex justify-content-center align-items-center mt-3">
                  <Button
                    variant="outline-primary"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="me-2"
                  >
                    Previous
                  </Button>
                  <span className="fw-bold">Page {page}</span>
                  <Button
                    variant="outline-primary"
                    onClick={() => setPage(page + 1)}
                    disabled={page * 5 >= totalTransactions}
                    className="ms-2"
                  >
                    Next
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default WalletHistory;
