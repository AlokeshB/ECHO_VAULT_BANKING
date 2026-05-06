import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { useAppSelector } from '../../hooks/useAppSelector';
import { getAuditLogs, downloadAuditReport } from '../../services/admin.service';
import { formatDateTime } from '../../utils/dateFormatter';
import './AuditLogs.css';

export const AuditLogs = () => {
  const { role } = useAppSelector((state) => state.auth);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    action: 'all',
    dateRange: 'all',
  });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setIsLoading(true);
        const data = await getAuditLogs(currentPage, 50, {
          action: filters.action === 'all' ? undefined : filters.action,
        });
        setLogs(data.data || data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load audit logs');
      } finally {
        setIsLoading(false);
      }
    };

    if (role === 'admin') {
      loadLogs();
    }
  }, [role, filters, currentPage]);

  const handleDownloadReport = async () => {
    try {
      const blob = await downloadAuditReport(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-report-${new Date().getTime()}.csv`;
      a.click();
    } catch (err) {
      setError('Failed to download report');
    }
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-3">Loading audit logs...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="audit-logs py-4">
      <h1 className="mb-4">Audit Logs</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6} className="mb-2">
              <Form.Group>
                <Form.Label>Action Type</Form.Label>
                <Form.Select
                  value={filters.action}
                  onChange={(e) => {
                    setFilters({ ...filters, action: e.target.value });
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Actions</option>
                  <option value="login">Login</option>
                  <option value="transfer">Transfer</option>
                  <option value="kyc_submission">KYC Submission</option>
                  <option value="profile_update">Profile Update</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6} className="mb-2 d-flex align-items-end">
              <Button variant="primary" onClick={handleDownloadReport} className="w-100">
                Download Report
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Logs Table */}
      <Card>
        <div className="table-responsive">
          <Table hover>
            <thead className="table-light">
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Details</th>
                <th>IP Address</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td>{log.user?.email || 'System'}</td>
                  <td>
                    <span className="badge bg-info">{log.action}</span>
                  </td>
                  <td className="text-truncate" title={log.details}>
                    {log.details}
                  </td>
                  <td>{log.ipAddress}</td>
                  <td>{formatDateTime(log.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>

      {logs.length === 0 && (
        <Alert variant="info" className="mt-4">
          No audit logs found
        </Alert>
      )}
    </Container>
  );
};
