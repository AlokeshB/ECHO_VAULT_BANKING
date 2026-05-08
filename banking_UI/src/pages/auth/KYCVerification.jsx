import { useState } from 'react';
import { Container, Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { setKycVerified } from '../../store/slices/authSlice';
import { setLoading, setError } from '../../store/slices/apiStateSlice';
import { submitKYC } from '../../services/auth.service';
import { validateInputField, getValidationError } from '../../utils/validator';


export const KYCVerification = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [step, setStep] = useState(1);

  const [kycData, setKycData] = useState({
    nationality: 'Indian',
    aadharNumber: '',
    panNumber: '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    postalCode: user?.postalCode || '',
    documentType: 'aadhaar', // 'aadhaar' or 'pan'
    documentFile: null,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setKycData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setApiError(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, documentFile: 'File size must be less than 5MB' }));
      } else {
        setKycData((prev) => ({ ...prev, documentFile: file }));
        if (errors.documentFile) {
          setErrors((prev) => ({ ...prev, documentFile: '' }));
        }
      }
    }
    setApiError(null);
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!kycData.aadharNumber || !validateInputField(kycData.aadharNumber, 'aadhaar')) {
      newErrors.aadharNumber = 'Valid 12-digit Aadhaar number required';
    }

    if (!kycData.panNumber || !validateInputField(kycData.panNumber, 'pan')) {
      newErrors.panNumber = 'Valid PAN number required (e.g., AAAAA1234A)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!kycData.address || kycData.address.trim().length < 5) {
      newErrors.address = 'Valid address required';
    }

    if (!kycData.city || kycData.city.trim().length < 2) {
      newErrors.city = 'City is required';
    }

    if (!kycData.state || kycData.state.trim().length < 2) {
      newErrors.state = 'State is required';
    }

    if (!kycData.postalCode || !/^\d{6}$/.test(kycData.postalCode)) {
      newErrors.postalCode = 'Valid 6-digit postal code required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitKYC = async (e) => {
    e.preventDefault();

    if (!validateStep2()) return;

    setIsLoading(true);
    setApiError(null);

    try {
      dispatch(setLoading(true));
      
      const formDataToSend = new FormData();
      formDataToSend.append('aadharNumber', kycData.aadharNumber);
      formDataToSend.append('panNumber', kycData.panNumber);
      formDataToSend.append('nationality', kycData.nationality);
      formDataToSend.append('address', kycData.address);
      formDataToSend.append('city', kycData.city);
      formDataToSend.append('state', kycData.state);
      formDataToSend.append('postalCode', kycData.postalCode);
      
      if (kycData.documentFile) {
        formDataToSend.append('document', kycData.documentFile);
      }

      await submitKYC(formDataToSend);

      dispatch(setKycVerified(true));
      setSuccessMessage(
        'KYC submitted successfully! Your verification will be completed within 24-48 hours.'
      );

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'KYC submission failed';
      setApiError(errorMsg);
      dispatch(setError(errorMsg));
    } finally {
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="kyc-page">
      <Container className="d-flex align-items-center justify-content-center min-vh-100">
        <Card className="kyc-card w-100" style={{ maxWidth: '600px' }}>
          <Card.Body>
            <h2 className="mb-2 text-center">KYC Verification</h2>
            <p className="text-center text-muted mb-4">
              Complete your Know Your Customer verification
            </p>

            {successMessage && (
              <Alert variant="success" dismissible className="mb-3">
                {successMessage}
              </Alert>
            )}

            {apiError && (
              <Alert variant="danger" dismissible className="mb-3" onClose={() => setApiError(null)}>
                {apiError}
              </Alert>
            )}

            <div className="progress mb-4">
              <div
                className="progress-bar"
                role="progressbar"
                style={{ width: `${(step / 2) * 100}%` }}
              ></div>
            </div>

            <Form onSubmit={handleSubmitKYC}>
              {/* Step 1: Document Details */}
              {step === 1 && (
                <>
                  <h5 className="mb-3">Document Information</h5>

                  <Form.Group className="mb-3">
                    <Form.Label>Nationality</Form.Label>
                    <Form.Control
                      as="select"
                      name="nationality"
                      value={kycData.nationality}
                      onChange={handleChange}
                    >
                      <option>Indian</option>
                      <option>Other</option>
                    </Form.Control>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Aadhaar Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="aadharNumber"
                      value={kycData.aadharNumber}
                      onChange={handleChange}
                      placeholder="Enter 12-digit Aadhaar number"
                      isInvalid={!!errors.aadharNumber}
                      maxLength="12"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.aadharNumber}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>PAN Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="panNumber"
                      value={kycData.panNumber}
                      onChange={handleChange}
                      placeholder="Enter PAN (e.g., AAAAA1234A)"
                      isInvalid={!!errors.panNumber}
                      maxLength="10"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.panNumber}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Button
                    variant="primary"
                    onClick={() => {
                      if (validateStep1()) {
                        setStep(2);
                      }
                    }}
                    className="w-100"
                  >
                    Next
                  </Button>
                </>
              )}

              {/* Step 2: Address & Documents */}
              {step === 2 && (
                <>
                  <h5 className="mb-3">Address Information</h5>

                  <Form.Group className="mb-3">
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      value={kycData.address}
                      onChange={handleChange}
                      placeholder="Enter street address"
                      isInvalid={!!errors.address}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.address}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>City</Form.Label>
                        <Form.Control
                          type="text"
                          name="city"
                          value={kycData.city}
                          onChange={handleChange}
                          placeholder="Enter city"
                          isInvalid={!!errors.city}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.city}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>State</Form.Label>
                        <Form.Control
                          type="text"
                          name="state"
                          value={kycData.state}
                          onChange={handleChange}
                          placeholder="Enter state"
                          isInvalid={!!errors.state}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.state}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Postal Code</Form.Label>
                    <Form.Control
                      type="text"
                      name="postalCode"
                      value={kycData.postalCode}
                      onChange={handleChange}
                      placeholder="Enter 6-digit postal code"
                      isInvalid={!!errors.postalCode}
                      maxLength="6"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.postalCode}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Upload Document (Optional)</Form.Label>
                    <Form.Control
                      type="file"
                      name="documentFile"
                      onChange={handleFileChange}
                      accept="image/*,.pdf"
                      isInvalid={!!errors.documentFile}
                    />
                    <Form.Text className="text-muted">
                      Max size: 5MB. Supported formats: JPG, PNG, PDF
                    </Form.Text>
                    <Form.Control.Feedback type="invalid">
                      {errors.documentFile}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-secondary"
                      onClick={() => setStep(1)}
                      disabled={isLoading}
                      className="flex-grow-1"
                    >
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={isLoading}
                      className="flex-grow-1"
                    >
                      {isLoading ? 'Submitting...' : 'Submit KYC'}
                    </Button>
                  </div>
                </>
              )}
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};
