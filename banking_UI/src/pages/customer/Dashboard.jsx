import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { setAccounts, selectAccount } from '../../store/slices/accountSlice';
import { setTransactions } from '../../store/slices/transactionSlice';
import { getAccounts } from '../../services/account.service';
import { getTransactions } from '../../services/transaction.service';
import { AccountCard } from '../../components/banking/AccountCard';
import { TransactionRow } from '../../components/banking/TransactionRow';
import { formatCurrencyWithSymbol } from '../../utils/currencyFormatter';
import './Dashboard.css';

export const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { accounts, selectedAccount } = useAppSelector((state) => state.account);
  const { transactions } = useAppSelector((state) => state.transaction);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const accountsData = await getAccounts();
        dispatch(setAccounts(accountsData.data || accountsData));

        if (accountsData.data?.[0] || accountsData[0]) {
          const primaryAccount = accountsData.data?.[0] || accountsData[0];
          dispatch(selectAccount(primaryAccount));

          const transactionsData = await getTransactions(primaryAccount._id);
          dispatch(setTransactions(transactionsData.data || transactionsData));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [dispatch]);

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const recentTransactions = transactions.slice(0, 5);

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-3">Loading dashboard...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="dashboard-container py-4">
      {error && <Alert variant="danger">{error}</Alert>}

      <h1 className="mb-4">Dashboard</h1>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={4} sm={6} className="mb-3">
          <Card className="summary-card">
            <Card.Body>
              <h6 className="text-muted">Total Balance</h6>
              <h3 className="mt-2">{formatCurrencyWithSymbol(totalBalance)}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} sm={6} className="mb-3">
          <Card className="summary-card">
            <Card.Body>
              <h6 className="text-muted">Active Accounts</h6>
              <h3 className="mt-2">{accounts.length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} sm={6} className="mb-3">
          <Card className="summary-card">
            <Card.Body>
              <h6 className="text-muted">Recent Transactions</h6>
              <h3 className="mt-2">{transactions.length}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Accounts Section */}
      <Row className="mb-4">
        <Col>
          <h4 className="mb-3">Your Accounts</h4>
        </Col>
      </Row>

      {accounts.length > 0 ? (
        <Row className="mb-4">
          {accounts.map((account) => (
            <Col md={6} lg={4} key={account._id} className="mb-3">
              <AccountCard
                account={account}
                isSelected={selectedAccount?._id === account._id}
                onSelect={() => {
                  dispatch(selectAccount(account));
                  getTransactions(account._id).then((data) =>
                    dispatch(setTransactions(data.data || data))
                  );
                }}
              />
            </Col>
          ))}
        </Row>
      ) : (
        <Row className="mb-4">
          <Col>
            <Alert variant="info">No accounts found. Create one to get started!</Alert>
          </Col>
        </Row>
      )}

      {/* Quick Actions */}
      <Row className="mb-4">
        <Col>
          <h4 className="mb-3">Quick Actions</h4>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-2">
          <Button
            variant="primary"
            className="w-100"
            onClick={() => navigate('/transfer')}
          >
            Transfer Funds
          </Button>
        </Col>
        <Col md={3} sm={6} className="mb-2">
          <Button
            variant="outline-primary"
            className="w-100"
            onClick={() => navigate('/accounts')}
          >
            View Accounts
          </Button>
        </Col>
        <Col md={3} sm={6} className="mb-2">
          <Button
            variant="outline-primary"
            className="w-100"
            onClick={() => navigate('/transactions')}
          >
            Transaction History
          </Button>
        </Col>
        <Col md={3} sm={6} className="mb-2">
          <Button
            variant="outline-primary"
            className="w-100"
            onClick={() => navigate('/settings')}
          >
            Settings
          </Button>
        </Col>
      </Row>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <Row>
          <Col>
            <h4 className="mb-3">Recent Transactions</h4>
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
                    {recentTransactions.map((transaction) => (
                      <TransactionRow key={transaction._id} transaction={transaction} />
                    ))}
                  </tbody>
                </table>
              </div>
              <Card.Footer className="text-center">
                <Button
                  variant="link"
                  onClick={() => navigate('/transactions')}
                >
                  View All Transactions
                </Button>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};
