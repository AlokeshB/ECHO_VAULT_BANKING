export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

export const validateAccountNumber = (accountNumber) => {
  // Simple validation - 12-16 digits
  return /^\d{12,16}$/.test(accountNumber.replace(/\s/g, ''));
};

export const validateIFSCCode = (ifsc) => {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
};

export const validateAadhaar = (aadhaar) => {
  return /^\d{12}$/.test(aadhaar);
};

export const validatePAN = (pan) => {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
};

export const validateAmount = (amount) => {
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount > 0;
};

export const validateMPin = (mpin) => {
  return /^\d{4}$/.test(mpin);
};

export const validateOTP = (otp) => {
  return /^\d{6}$/.test(otp);
};

export const validateUserId = (userId) => {
  // Simple alphanumeric validation
  return /^[a-zA-Z0-9]{6,}$/.test(userId);
};

export const validateInputField = (value, fieldType) => {
  switch (fieldType) {
    case 'email':
      return validateEmail(value);
    case 'password':
      return validatePassword(value);
    case 'phone':
      return validatePhone(value);
    case 'accountNumber':
      return validateAccountNumber(value);
    case 'ifsc':
      return validateIFSCCode(value);
    case 'aadhaar':
      return validateAadhaar(value);
    case 'pan':
      return validatePAN(value);
    case 'amount':
      return validateAmount(value);
    case 'mpin':
      return validateMPin(value);
    case 'otp':
      return validateOTP(value);
    default:
      return true;
  }
};

export const getValidationError = (fieldType, value) => {
  const errors = {
    email: 'Please enter a valid email address',
    password: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
    phone: 'Please enter a valid 10-digit phone number',
    accountNumber: 'Account number must be 12-16 digits',
    ifsc: 'Invalid IFSC code format',
    aadhaar: 'Aadhaar number must be 12 digits',
    pan: 'Invalid PAN format',
    amount: 'Please enter a valid amount',
    mpin: 'mPIN must be 4 digits',
    otp: 'OTP must be 6 digits',
  };

  if (!validateInputField(value, fieldType)) {
    return errors[fieldType] || 'Invalid input';
  }

  return null;
};
