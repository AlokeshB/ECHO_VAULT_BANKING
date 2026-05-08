import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { useAppSelector } from '../../hooks/useAppSelector';
import { getDashboardMetrics } from '../../services/admin.service';


export const AdminDashboard = () => {
  const { role } = useAppSelector((state) => state.auth);
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setIsLoading(true);
        const data = await getDashboardMetrics();
        setMetrics(data.data || data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load metrics');
      } finally {
        setIsLoading(false);
      }
    };

    if (role === 'admin') {
      loadMetrics();
    }
  }, [role]);

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-3">Loading admin dashboard...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="admin-dashboard py-4">
      <h1 className="mb-4">Admin Dashboard</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      {metrics && (
        <>
          {/* Key Metrics */}
          <Row className="mb-4">
            <Col md={3} sm={6} className="mb-3">
              <Card className="metric-card">
                <Card.Body>
                  <h6 className="text-muted">Total Users</h6>
                  <h3 className="mt-2">{metrics.totalUsers || 0}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6} className="mb-3">
              <Card className="metric-card">
                <Card.Body>
                  <h6 className="text-muted">Total Accounts</h6>
                  <h3 className="mt-2">{metrics.totalAccounts || 0}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6} className="mb-3">
              <Card className="metric-card">
                <Card.Body>
                  <h6 className="text-muted">Pending KYC</h6>
                  <h3 className="mt-2 text-warning">{metrics.pendingKYC || 0}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6} className="mb-3">
              <Card className="metric-card">
                <Card.Body>
                  <h6 className="text-muted">Today's Transactions</h6>
                  <h3 className="mt-2">{metrics.transactionsToday || 0}</h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* System Status */}
          <Row>
            <Col md={6} className="mb-3">
              <Card>
                <Card.Header>System Status</Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span>Database</span>
                    <span className="badge bg-success">Connected</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span>Email Service</span>
                    <span className="badge bg-success">Active</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>API</span>
                    <span className="badge bg-success">Running</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} className="mb-3">
              <Card>
                <Card.Header>Recent Activity</Card.Header>
                <Card.Body>
                  <p className="text-muted mb-2">Last backup: {metrics.lastBackup || 'N/A'}</p>
                  <p className="text-muted mb-2">
                    Active sessions: {metrics.activeSessions || 0}
                  </p>
                  <p className="text-muted">Failed logins: {metrics.failedLogins || 0}</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};
