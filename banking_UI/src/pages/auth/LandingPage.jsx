import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppSelector';


export const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (isAuthenticated) {
    navigate('/dashboard');
  }

  return (
    <div className="landing-page">
      <Container fluid className="landing-hero">
        <Row className="align-items-center min-vh-100">
          <Col lg={6} className="mb-4 mb-lg-0">
            <div className="hero-content">
              <h1 className="hero-title">Welcome to ECHOVAULT BANKING</h1>
              <p className="hero-subtitle">
                Secure, Fast, and Reliable Digital Banking for Everyone
              </p>
              <p className="hero-description">
                Experience cutting-edge banking with advanced security features, 2-factor
                authentication, and 24/7 access to your accounts.
              </p>

              <div className="hero-features">
                <div className="feature-item">
                  <span className="feature-icon">🔒</span>
                  <p>Bank-level Security</p>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">⚡</span>
                  <p>Instant Transfers</p>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📱</span>
                  <p>24/7 Access</p>
                </div>
              </div>

              <div className="cta-buttons">
                <Button
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="btn-primary-large"
                >
                  Login
                </Button>
                <Button
                  size="lg"
                  variant="outline-primary"
                  onClick={() => navigate('/register')}
                  className="ms-3"
                >
                  Create Account
                </Button>
              </div>
            </div>
          </Col>

          <Col lg={6} className="text-center">
            <div className="hero-illustration">
              <div className="illustration-card">
                <div className="card-icon">💳</div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      <Container fluid className="py-5 bg-light">
        <Row>
          <Col md={4} className="text-center mb-4">
            <h5>Quick Transactions</h5>
            <p className="text-muted">Transfer funds instantly to any account with just a few clicks</p>
          </Col>
          <Col md={4} className="text-center mb-4">
            <h5>Account Management</h5>
            <p className="text-muted">Manage multiple accounts and view detailed transaction history</p>
          </Col>
          <Col md={4} className="text-center mb-4">
            <h5>Premium Security</h5>
            <p className="text-muted">
              2FA, mPIN verification, and encryption keep your data safe
            </p>
          </Col>
        </Row>
      </Container>
    </div>
  );
};
