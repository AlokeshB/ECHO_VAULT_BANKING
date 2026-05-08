import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Spinner, Alert, Modal } from 'react-bootstrap';
import { useAppSelector } from '../../hooks/useAppSelector';
import { getAllUsers, toggleUserStatus } from '../../services/admin.service';
import { formatDateTime } from '../../utils/dateFormatter';


export const UserManagement = () => {
  const { role } = useAppSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        const data = await getAllUsers(1, 100);
        setUsers(data.data || data);
        setFilteredUsers(data.data || data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    if (role === 'admin') {
      loadUsers();
    }
  }, [role]);

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'disabled' : 'active';
      await toggleUserStatus(user._id, newStatus);

      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u._id === user._id ? { ...u, status: newStatus } : u
        )
      );

      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status');
    }
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-3">Loading users...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="user-management py-4">
      <h1 className="mb-4">User Management</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Search */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Control
            placeholder="Search by email, name, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col md={6} className="text-end">
          <span className="text-muted">Total Users: {filteredUsers.length}</span>
        </Col>
      </Row>

      {/* Users Table */}
      <Card>
        <div className="table-responsive">
          <Table hover>
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>KYC</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>{`${user.firstName} ${user.lastName}`}</td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td>
                    <span
                      className={`badge bg-${
                        user.status === 'active' ? 'success' : 'danger'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge bg-${
                        user.kycVerified ? 'success' : 'warning'
                      }`}
                    >
                      {user.kycVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td>{formatDateTime(user.createdAt)}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowModal(true);
                      }}
                    >
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* User Detail Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>User Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <p>
                    <strong>Name:</strong> {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedUser.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedUser.phone}
                  </p>
                </Col>
                <Col md={6}>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span
                      className={`badge bg-${
                        selectedUser.status === 'active' ? 'success' : 'danger'
                      }`}
                    >
                      {selectedUser.status}
                    </span>
                  </p>
                  <p>
                    <strong>KYC:</strong>{' '}
                    <span
                      className={`badge bg-${
                        selectedUser.kycVerified ? 'success' : 'warning'
                      }`}
                    >
                      {selectedUser.kycVerified ? 'Verified' : 'Pending'}
                    </span>
                  </p>
                  <p>
                    <strong>Created:</strong> {formatDateTime(selectedUser.createdAt)}
                  </p>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {selectedUser && (
            <>
              <Button
                variant={selectedUser.status === 'active' ? 'danger' : 'success'}
                onClick={() => handleToggleStatus(selectedUser)}
              >
                {selectedUser.status === 'active' ? 'Disable User' : 'Enable User'}
              </Button>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Close
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};
