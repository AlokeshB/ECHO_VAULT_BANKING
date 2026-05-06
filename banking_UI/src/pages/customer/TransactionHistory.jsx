import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Form, Spinner, Alert, Pagination } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { setTransactions } from '../../store/slices/transactionSlice';
import { getTransactionHistory } from '../../services/transaction.service';
import { TransactionRow } from '../../components/banking/TransactionRow';
import './TransactionHistory.css';

export const TransactionHistory = () => {
  const dispatch = useAppDispatch();
  const { transactions, loading } = useAppSelector((state) => state.transaction);
  const { selectedAccount } = useAppSelector((state) => state.account);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    type: 'all',
    dateRange: 'all',
  });

  const itemsPerPage = 10;

  useEffect(() => {
    const loadTransactions = async () => {
      if (!selectedAccount) return;

      try {
        setIsLoading(true);
        setError(null);

        const data = await getTransactionHistory(selectedAccount._id, currentPage, itemsPerPage, {
          type: filters.type === 'all' ? undefined : filters.type,
        });

        dispatch(setTransactions(data.data || data));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load transactions');
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, [dispatch, selectedAccount, currentPage, filters]);

  if (!selectedAccount) {
    return (
      <Container className="py-4">
        <Alert variant="warning">Please select an account first</Alert>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-3">Loading transactions...</p>
      </Container>
    );
  }

  const totalPages = Math.ceil((transactions.length || 0) / itemsPerPage);
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Container className="py-4">
      <h2 className="mb-4">Transaction History</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6} className="mb-2">
              <Form.Group>
                <Form.Label>Transaction Type</Form.Label>
                <Form.Select
                  value={filters.type}
                  onChange={(e) => {
                    setFilters({ ...filters, type: e.target.value });
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Types</option>
                  <option value="transfer">Transfer</option>
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6} className="mb-2">
              <Form.Group>
                <Form.Label>Date Range</Form.Label>
                <Form.Select
                  value={filters.dateRange}
                  onChange={(e) => {
                    setFilters({ ...filters, dateRange: e.target.value });
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Time</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Transactions Table */}
      {paginatedTransactions.length > 0 ? (
        <>
          <Card>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((transaction) => (
                    <TransactionRow key={transaction._id} transaction={transaction} />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.First
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                />
                <Pagination.Prev
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                />

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Pagination.Item
                    key={page}
                    active={page === currentPage}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Pagination.Item>
                ))}

                <Pagination.Next
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </nav>
          )}
        </>
      ) : (
        <Alert variant="info">No transactions found</Alert>
      )}
    </Container>
  );
};
