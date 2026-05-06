import { useState } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { setLoading, setError } from '../../store/slices/apiStateSlice';
import { register } from '../../services/auth.service';
import { validateInputField, getValidationError } from '../../utils/validator';
import './RegisterPage.css';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    userId: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setApiError(null);
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.firstName || formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name is required (min 2 characters)';
    }

    if (!formData.lastName || formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name is required (min 2 characters)';
    }

    if (!formData.email || !validateInputField(formData.email, 'email')) {
      newErrors.email = getValidationError('email', formData.email) || 'Valid email required';
    }

    if (!formData.phone || !validateInputField(formData.phone, 'phone')) {
      newErrors.phone = 'Valid 10-digit phone number required';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.userId || formData.userId.length < 6) {
      newErrors.userId = 'User ID must be at least 6 characters';
    }

    if (!formData.password || !validateInputField(formData.password, 'password')) {
      newErrors.password =
        getValidationError('password', formData.password) ||
        'Password requirements not met';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};

    if (!formData.address || formData.address.trim().length < 5) {
      newErrors.address = 'Valid address required';
    }

    if (!formData.city || formData.city.trim().length < 2) {
      newErrors.city = 'City is required';
    }

    if (!formData.state || formData.state.trim().length < 2) {
      newErrors.state = 'State is required';
    }

    if (!formData.postalCode || !/^\d{6}$/.test(formData.postalCode)) {
      newErrors.postalCode = 'Valid 6-digit postal code required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    let isValid = false;
    if (step === 1) isValid = validateStep1();
    else if (step === 2) isValid = validateStep2();

    if (isValid) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep3()) return;

    setIsLoading(true);
    setApiError(null);

    try {
      dispatch(setLoading(true));
      
      await register(formData);

      setApiError(null);
      navigate('/login', {
        state: { message: 'Registration successful! Please log in.' },
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed';
      setApiError(errorMsg);
      dispatch(setError(errorMsg));
    } finally {
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="register-page">
      <Container className="d-flex align-items-center justify-content-center min-vh-100">
        <Card className="register-card w-100" style={{ maxWidth: '500px' }}>
          <Card.Body>
            <h2 className="mb-1 text-center">Create Account</h2>
            <p className="text-center text-muted mb-4">
              Step {step} of 3
            </p>

            {apiError && <Alert variant="danger">{apiError}</Alert>}

            <div className="progress mb-4">
              <div
                className="progress-bar"
                role="progressbar"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>

            <Form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()}>
              {/* Step 1: Personal Information */}
              {step === 1 && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>First Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Enter first name"
                      isInvalid={!!errors.firstName}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.firstName}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Enter last name"
                      isInvalid={!!errors.lastName}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.lastName}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter email"
                      isInvalid={!!errors.email}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter 10-digit phone number"
                      isInvalid={!!errors.phone}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.phone}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Date of Birth</Form.Label>
                    <Form.Control
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      isInvalid={!!errors.dateOfBirth}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.dateOfBirth}
                    </Form.Control.Feedback>
                  </Form.Group>
                </>
              )}

              {/* Step 2: Credentials */}
              {step === 2 && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>User ID</Form.Label>
                    <Form.Control
                      type="text"
                      name="userId"
                      value={formData.userId}
                      onChange={handleChange}
                      placeholder="Create your user ID (min 6 characters)"
                      isInvalid={!!errors.userId}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.userId}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a strong password"
                      isInvalid={!!errors.password}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.password}
                    </Form.Control.Feedback>
                    <small className="text-muted d-block mt-2">
                      Must contain: 8+ characters, uppercase, lowercase, number, special character
                    </small>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      isInvalid={!!errors.confirmPassword}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.confirmPassword}
                    </Form.Control.Feedback>
                  </Form.Group>
                </>
              )}

              {/* Step 3: Address */}
              {step === 3 && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter street address"
                      isInvalid={!!errors.address}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.address}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>City</Form.Label>
                    <Form.Control
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Enter city"
                      isInvalid={!!errors.city}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.city}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>State</Form.Label>
                    <Form.Control
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Enter state"
                      isInvalid={!!errors.state}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.state}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Postal Code</Form.Label>
                    <Form.Control
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      placeholder="Enter 6-digit postal code"
                      isInvalid={!!errors.postalCode}
                      maxLength="6"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.postalCode}
                    </Form.Control.Feedback>
                  </Form.Group>
                </>
              )}

              <div className="d-flex gap-2 justify-content-between">
                {step > 1 && (
                  <Button
                    variant="outline-secondary"
                    onClick={() => setStep(step - 1)}
                    disabled={isLoading}
                    className="flex-grow-1"
                  >
                    Previous
                  </Button>
                )}

                {step < 3 && (
                  <Button
                    variant="primary"
                    onClick={handleNextStep}
                    disabled={isLoading}
                    className="flex-grow-1"
                  >
                    Next
                  </Button>
                )}

                {step === 3 && (
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={isLoading}
                    className="w-100"
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                )}
              </div>
            </Form>

            <div className="text-center mt-3">
              <p>
                Already have an account?{' '}
                <a href="/login" className="text-decoration-none">
                  Login here
                </a>
              </p>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};
