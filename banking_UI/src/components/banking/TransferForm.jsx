import { useState } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import { validateInputField, getValidationError } from '../../utils/validator';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { initiateTransfer, setTransferError } from '../../store/slices/transactionSlice';


export const TransferForm = ({ onSubmit }) => {
  const dispatch = useAppDispatch();
  const { transferStatus } = useAppSelector((state) => state.transaction);
  const [formData, setFormData] = useState({
    fromAccount: '',
    toAccountNumber: '',
    beneficiaryName: '',
    amount: '',
    description: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fromAccount) {
      newErrors.fromAccount = 'Please select an account';
    }

    if (!formData.toAccountNumber) {
      newErrors.toAccountNumber = 'Account number is required';
    } else if (!validateInputField(formData.toAccountNumber, 'accountNumber')) {
      newErrors.toAccountNumber = getValidationError('accountNumber', formData.toAccountNumber);
    }

    if (!formData.beneficiaryName || formData.beneficiaryName.trim().length < 2) {
      newErrors.beneficiaryName = 'Please enter a valid name';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (!validateInputField(formData.amount, 'amount')) {
      newErrors.amount = getValidationError('amount', formData.amount);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    dispatch(initiateTransfer());

    try {
      await onSubmit(formData);
    } catch (error) {
      dispatch(setTransferError(error.message || 'Transfer failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="transfer-form-container py-4">
      <div className="transfer-form-card">
        <h3 className="mb-4">Fund Transfer</h3>

        {transferStatus === 'success' && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            <strong>Success!</strong> Your transfer has been initiated. Please check your email
            for confirmation.
            <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
          </div>
        )}

        {transferStatus === 'failed' && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>Error!</strong> The transfer could not be processed. Please try again.
            <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
          </div>
        )}

        <Form onSubmit={handleSubmit} noValidate>
          <Form.Group className="mb-3">
            <Form.Label>From Account</Form.Label>
            <Form.Select
              name="fromAccount"
              value={formData.fromAccount}
              onChange={handleChange}
              isInvalid={!!errors.fromAccount}
            >
              <option value="">Select account</option>
              {/* Options populated from parent */}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{errors.fromAccount}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>To Account Number</Form.Label>
            <Form.Control
              type="text"
              name="toAccountNumber"
              value={formData.toAccountNumber}
              onChange={handleChange}
              placeholder="Enter 12-16 digit account number"
              isInvalid={!!errors.toAccountNumber}
            />
            <Form.Control.Feedback type="invalid">
              {errors.toAccountNumber}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Beneficiary Name</Form.Label>
            <Form.Control
              type="text"
              name="beneficiaryName"
              value={formData.beneficiaryName}
              onChange={handleChange}
              placeholder="Enter beneficiary name"
              isInvalid={!!errors.beneficiaryName}
            />
            <Form.Control.Feedback type="invalid">
              {errors.beneficiaryName}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Amount</Form.Label>
            <Form.Control
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter amount to transfer"
              isInvalid={!!errors.amount}
              step="0.01"
              min="0"
            />
            <Form.Control.Feedback type="invalid">{errors.amount}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Description (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add reference or description"
              rows={3}
            />
          </Form.Group>

          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting || transferStatus === 'pending'}
            className="w-100"
          >
            {isSubmitting ? 'Processing...' : 'Transfer Funds'}
          </Button>
        </Form>
      </div>
    </Container>
  );
};
