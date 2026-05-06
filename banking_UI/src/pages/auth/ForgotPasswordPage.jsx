import { useState } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { requestPasswordReset } from '../../services/auth.service';
import { validateInputField } from '../../utils/validator';
import './ForgotPasswordPage.css';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { value } = e.target;
    setEmail(value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: '' }));
    }
    setApiError(null);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateInputField(email, 'email')) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setApiError(null);

    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to request password reset';
      setApiError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="forgot-password-page">
        <Container className="d-flex align-items-center justify-content-center min-vh-100">
          <Card className="forgot-password-card w-100" style={{ maxWidth: '450px' }}>
            <Card.Body>
              <div className="text-center">
                <h2 className="mb-3">Check Your Email</h2>
                <div className="success-icon mb-3">✓</div>
                
                <p className="text-muted mb-4">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>

                <Alert variant="info" className="mb-4">
                  <p className="mb-0">
                    Please check your email (including spam folder) and click the reset link to proceed with resetting your password.
                  </p>
                </Alert>

                <p className="text-muted small mb-4">
                  The link will expire in 30 minutes.
                </p>

                <Button
                  variant="primary"
                  className="w-100"
                  onClick={() => navigate('/login')}
                >
                  Back to Login
                </Button>

                <div className="text-center mt-3">
                  <Button
                    variant="link"
                    onClick={() => setSubmitted(false)}
                  >
                    Try with another email
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="forgot-password-page">
      <Container className="d-flex align-items-center justify-content-center min-vh-100">
        <Card className="forgot-password-card w-100" style={{ maxWidth: '450px' }}>
          <Card.Body>
            <h2 className="mb-4 text-center">Forgot Password?</h2>

            {apiError && <Alert variant="danger">{apiError}</Alert>}

            <p className="text-muted text-center mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-4">
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={handleChange}
                  isInvalid={!!errors.email}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.email}
                </Form.Control.Feedback>
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                className="w-100"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </Form>

            <div className="text-center mt-4">
              <p className="mb-0">
                Remember your password?{' '}
                <a href="/login" className="text-decoration-none">
                  Back to Login
                </a>
              </p>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};
