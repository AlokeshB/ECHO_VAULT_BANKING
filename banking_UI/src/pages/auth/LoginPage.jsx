import { useState } from 'react';
import { Container, Form, Button, Card, Tabs, Tab, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { setAuth, setTwoFactorRequired, setMPinSet } from '../../store/slices/authSlice';
import { setLoading, setError } from '../../store/slices/apiStateSlice';
import { loginWithEmail, loginWithUserId, generateMPin, verifyMPin } from '../../services/auth.service';
import { validateInputField, getValidationError } from '../../utils/validator';
import './LoginPage.css';

export const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Login state
  const [userType, setUserType] = useState('customer'); // 'customer' or 'admin'
  const [activeTab, setActiveTab] = useState('email');
  const [emailLogin, setEmailLogin] = useState({ email: '', password: '' });
  const [userIdLogin, setUserIdLogin] = useState({ userId: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // 2FA state
  const [twoFACode, setTwoFACode] = useState('');
  const [mPinCode, setMPinCode] = useState('');
  const [loginStage, setLoginStage] = useState('credentials'); // 'credentials', '2fa', 'mpin'
  const [tempUserId, setTempUserId] = useState(null);

  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailLogin((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setApiError(null);
  };

  const handleUserIdChange = (e) => {
    const { name, value } = e.target;
    setUserIdLogin((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setApiError(null);
  };

  const validateLoginForm = (isEmail) => {
    const newErrors = {};
    const data = isEmail ? emailLogin : userIdLogin;

    if (isEmail) {
      if (!data.email) {
        newErrors.email = 'Email is required';
      } else if (!validateInputField(data.email, 'email')) {
        newErrors.email = 'Invalid email format';
      }
    } else {
      if (!data.userId) {
        newErrors.userId = 'User ID is required';
      } else if (data.userId.length < 6) {
        newErrors.userId = 'User ID must be at least 6 characters';
      }
    }

    if (!data.password) {
      newErrors.password = 'Password is required';
    } else if (data.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const isEmail = activeTab === 'email';

    if (!validateLoginForm(isEmail)) return;

    setIsLoading(true);
    setApiError(null);

    try {
      dispatch(setLoading(true));
      
      let response;
      if (isEmail) {
        response = await loginWithEmail(emailLogin.email, emailLogin.password);
      } else {
        response = await loginWithUserId(userIdLogin.userId, userIdLogin.password);
      }

      if (response.requiresMPin) {
        // Generate mPin
        const mPinResponse = await generateMPin(response.userId || userIdLogin.userId);
        setTempUserId(response.userId || userIdLogin.userId);
        setLoginStage('mpin');
        setMPinSet(true);
      } else if (response.requires2FA) {
        setTempUserId(response.userId);
        setLoginStage('2fa');
        dispatch(setTwoFactorRequired(true));
      } else {
        // Login successful
        dispatch(
          setAuth({
            token: response.token,
            refreshToken: response.refreshToken,
            user: response.user,
            role: response.user.role,
          })
        );
        
        // Redirect based on user role
        if (response.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate(response.user.kycVerified ? '/dashboard' : '/kyc-verify');
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Login failed';
      setApiError(errorMsg);
      dispatch(setError(errorMsg));
    } finally {
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();

    if (!twoFACode || twoFACode.length !== 6) {
      setErrors({ twoFACode: '2FA code must be 6 digits' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyMPin(tempUserId, twoFACode);
      
      dispatch(
        setAuth({
          token: response.token,
          refreshToken: response.refreshToken,
          user: response.user,
          role: response.user.role,
        })
      );
      
      // Redirect based on user role
      if (response.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate(response.user.kycVerified ? '/dashboard' : '/kyc-verify');
      }
    } catch (error) {
      setApiError(error.response?.data?.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMPin = async (e) => {
    e.preventDefault();

    if (!mPinCode || mPinCode.length !== 4) {
      setErrors({ mPinCode: 'mPin must be 4 digits' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyMPin(tempUserId, mPinCode);
      
      dispatch(
        setAuth({
          token: response.token,
          refreshToken: response.refreshToken,
          user: response.user,
          role: response.user.role,
        })
      );
      
      // Redirect based on user role
      if (response.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate(response.user.kycVerified ? '/dashboard' : '/kyc-verify');
      }
    } catch (error) {
      setApiError(error.response?.data?.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (loginStage === '2fa') {
    return (
      <div className="login-page">
        <Container className="d-flex align-items-center justify-content-center min-vh-100">
          <Card className="login-card w-100" style={{ maxWidth: '400px' }}>
            <Card.Body>
              <h3 className="mb-4 text-center">2-Factor Authentication</h3>
              
              {apiError && <Alert variant="danger">{apiError}</Alert>}

              <Form onSubmit={handleVerify2FA}>
                <Form.Group className="mb-3">
                  <Form.Label>Enter 2FA Code</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="000000"
                    value={twoFACode}
                    onChange={(e) => setTwoFACode(e.target.value.slice(0, 6))}
                    maxLength="6"
                    isInvalid={!!errors.twoFACode}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.twoFACode}
                  </Form.Control.Feedback>
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100"
                  disabled={isLoading}
                >
                  {isLoading ? 'Verifying...' : 'Verify'}
                </Button>
              </Form>

              <div className="text-center mt-3">
                <Button
                  variant="link"
                  onClick={() => {
                    setLoginStage('credentials');
                    setTwoFACode('');
                    setApiError(null);
                  }}
                >
                  Back to Login
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

  if (loginStage === 'mpin') {
    return (
      <div className="login-page">
        <Container className="d-flex align-items-center justify-content-center min-vh-100">
          <Card className="login-card w-100" style={{ maxWidth: '400px' }}>
            <Card.Body>
              <h3 className="mb-4 text-center">Set Your mPIN</h3>
              
              {apiError && <Alert variant="danger">{apiError}</Alert>}

              <p className="text-muted text-center mb-4">
                Please set a 4-digit mPIN for secure transactions
              </p>

              <Form onSubmit={handleVerifyMPin}>
                <Form.Group className="mb-3">
                  <Form.Label>Enter 4-Digit mPIN</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="0000"
                    value={mPinCode}
                    onChange={(e) => setMPinCode(e.target.value.slice(0, 4))}
                    maxLength="4"
                    isInvalid={!!errors.mPinCode}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.mPinCode}
                  </Form.Control.Feedback>
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100"
                  disabled={isLoading}
                >
                  {isLoading ? 'Setting mPIN...' : 'Continue'}
                </Button>
              </Form>

              <div className="text-center mt-3">
                <Button
                  variant="link"
                  onClick={() => {
                    setLoginStage('credentials');
                    setMPinCode('');
                    setApiError(null);
                  }}
                >
                  Back to Login
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="login-page" data-login-type={userType}>
      <Container className="d-flex align-items-center justify-content-center min-vh-100">
        <Card className={`login-card login-card-${userType} w-100`} style={{ maxWidth: '450px' }}>
          <Card.Body>
            <div className={`login-header login-header-${userType}`}>
              <div className="login-icon">{userType === 'admin' ? '🔐' : '👤'}</div>
              <h2 className="mb-2 text-center">
                {userType === 'admin' ? 'Admin Portal' : 'Customer Login'}
              </h2>
              <p className="text-center login-subtitle">
                {userType === 'admin' ? 'System Administration' : 'Secure Banking Access'}
              </p>
            </div>

            {/* User Type Toggle */}
            <div className="user-type-toggle mb-4 d-flex gap-2">
              <Button
                variant={userType === 'customer' ? 'primary' : 'outline-primary'}
                className="w-50 toggle-btn toggle-customer"
                onClick={() => setUserType('customer')}
              >
                👤 Customer
              </Button>
              <Button
                variant={userType === 'admin' ? 'primary' : 'outline-primary'}
                className="w-50 toggle-btn toggle-admin"
                onClick={() => setUserType('admin')}
              >
                🔐 Admin
              </Button>
            </div>

            {apiError && <Alert variant="danger">{apiError}</Alert>}

            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
              <Tab eventKey="email" title="Email Login">
                <Form onSubmit={handleLogin} className="mt-3">
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={emailLogin.email}
                      onChange={handleEmailChange}
                      isInvalid={!!errors.email}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="Enter your password"
                      value={emailLogin.password}
                      onChange={handleEmailChange}
                      isInvalid={!!errors.password}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.password}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </Form>
              </Tab>

              <Tab eventKey="userId" title="User ID Login">
                <Form onSubmit={handleLogin} className="mt-3">
                  <Form.Group className="mb-3">
                    <Form.Label>User ID</Form.Label>
                    <Form.Control
                      type="text"
                      name="userId"
                      placeholder="Enter your user ID"
                      value={userIdLogin.userId}
                      onChange={handleUserIdChange}
                      isInvalid={!!errors.userId}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.userId}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="Enter your password"
                      value={userIdLogin.password}
                      onChange={handleUserIdChange}
                      isInvalid={!!errors.password}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.password}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </Form>
              </Tab>
            </Tabs>

            <div className="text-center">
              <p className="mb-2">
                {userType === 'customer' ? (
                  <>
                    Don't have an account?{' '}
                    <a href="/register" className="text-decoration-none">
                      Register here
                    </a>
                  </>
                ) : (
                  <>
                    <span className="text-muted">Contact your administrator for account access</span>
                  </>
                )}
              </p>
              <a href="/forgot-password" className="text-decoration-none text-muted">
                Forgot password?
              </a>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};
