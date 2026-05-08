import { useState } from 'react';
import { Navbar, Nav, Container, Dropdown } from 'react-bootstrap';
import { FiLogOut, FiSettings, FiUser } from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { logout } from '../../store/slices/authSlice';
import { useTheme } from '../../hooks/useTheme';


export const NavigationBar = () => {
  const dispatch = useAppDispatch();
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, role } = useAppSelector((state) => state.auth);
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <Navbar
      expanded={expanded}
      onToggle={setExpanded}
      bg={isDarkMode ? 'dark' : 'light'}
      expand="lg"
      sticky="top"
      className="navbar-custom shadow-sm"
    >
      <Container>
        <Navbar.Brand href="/" className="fw-bold fs-5">
          <span className="brand-logo">🏦</span> ECHOVAULT BANKING
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center gap-3">
            <Nav.Link href="/dashboard" onClick={() => setExpanded(false)}>
              Dashboard
            </Nav.Link>

            {role === 'admin' && (
              <>
                <Nav.Link href="/admin/users" onClick={() => setExpanded(false)}>
                  Users
                </Nav.Link>
                <Nav.Link href="/admin/audit-logs" onClick={() => setExpanded(false)}>
                  Audit Logs
                </Nav.Link>
              </>
            )}

            {role === 'customer' && (
              <Nav.Link href="/accounts" onClick={() => setExpanded(false)}>
                Accounts
              </Nav.Link>
            )}

            <Dropdown>
              <Dropdown.Toggle variant="link" className="nav-dropdown-toggle">
                <FiUser size={20} />
              </Dropdown.Toggle>

              <Dropdown.Menu align="end">
                <Dropdown.Header>{user?.email}</Dropdown.Header>
                <Dropdown.Divider />
                <Dropdown.Item href="/profile" onClick={() => setExpanded(false)}>
                  <FiUser className="me-2" />
                  Profile
                </Dropdown.Item>
                <Dropdown.Item href="/settings" onClick={() => setExpanded(false)}>
                  <FiSettings className="me-2" />
                  Settings
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>
                  <FiLogOut className="me-2" />
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <button
              className="btn btn-sm btn-outline-secondary ms-2"
              onClick={toggleTheme}
              title="Toggle theme"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
