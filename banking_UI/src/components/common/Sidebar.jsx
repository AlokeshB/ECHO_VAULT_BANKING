import { useState } from 'react';
import { Nav, Offcanvas } from 'react-bootstrap';
import { FiMenu, FiHome, FiDollarSign, FiBarChart, FiSettings, FiUsers } from 'react-icons/fi';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useLayout } from '../../context/LayoutContext';


export const Sidebar = () => {
  const [show, setShow] = useState(false);
  const { role } = useAppSelector((state) => state.auth);
  const { sidebarCollapsed, toggleSidebar } = useLayout();

  const handleClose = () => setShow(false);

  const navItems =
    role === 'admin'
      ? [
          { icon: <FiHome />, label: 'Dashboard', href: '/admin/dashboard' },
          { icon: <FiUsers />, label: 'Users', href: '/admin/users' },
          { icon: <FiBarChart />, label: 'Audit Logs', href: '/admin/audit-logs' },
          { icon: <FiSettings />, label: 'Settings', href: '/admin/settings' },
        ]
      : [
          { icon: <FiHome />, label: 'Dashboard', href: '/dashboard' },
          { icon: <FiDollarSign />, label: 'Accounts', href: '/accounts' },
          { icon: <FiDollarSign />, label: 'Transfer', href: '/transfer' },
          { icon: <FiBarChart />, label: 'History', href: '/transactions' },
          { icon: <FiSettings />, label: 'Settings', href: '/settings' },
        ];

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="btn btn-link sidebar-toggle d-lg-none"
        onClick={() => setShow(true)}
        aria-label="Toggle sidebar"
      >
        <FiMenu size={24} />
      </button>

      {/* Desktop Sidebar */}
      <nav
        className={`sidebar d-none d-lg-flex flex-column ${
          sidebarCollapsed ? 'collapsed' : ''
        }`}
      >
        <button
          className="btn btn-link sidebar-toggle-desktop"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <FiMenu size={20} />
        </button>

        <Nav className="flex-column nav-items">
          {navItems.map((item, idx) => (
            <Nav.Link key={idx} href={item.href} className="nav-item">
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Nav.Link>
          ))}
        </Nav>
      </nav>

      {/* Mobile Offcanvas */}
      <Offcanvas
        show={show}
        onHide={handleClose}
        placement="start"
        className="sidebar-offcanvas"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column nav-items-mobile">
            {navItems.map((item, idx) => (
              <Nav.Link
                key={idx}
                href={item.href}
                className="nav-item-mobile"
                onClick={handleClose}
              >
                <span className="nav-icon-mobile">{item.icon}</span>
                <span className="nav-label-mobile">{item.label}</span>
              </Nav.Link>
            ))}
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};
