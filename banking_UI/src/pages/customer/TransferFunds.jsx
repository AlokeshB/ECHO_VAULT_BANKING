import { useState, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { completeTransfer, failTransfer } from '../../store/slices/transactionSlice';
import { TransferForm } from '../../components/banking/TransferForm';
import { initiateTransfer as initiateTransferAPI } from '../../services/transaction.service';


export const TransferFunds = () => {
  const dispatch = useAppDispatch();
  const { selectedAccount, accounts } = useAppSelector((state) => state.account);
  const { transferStatus, transferError } = useAppSelector((state) => state.transaction);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTransfer = async (formData) => {
    if (!selectedAccount) {
      alert('Please select an account first');
      return;
    }

    setIsProcessing(true);

    try {
      const transferPayload = {
        fromAccountId: formData.fromAccount || selectedAccount._id,
        toAccountNumber: formData.toAccountNumber,
        beneficiaryName: formData.beneficiaryName,
        amount: parseFloat(formData.amount),
        description: formData.description,
      };

      const response = await initiateTransferAPI(transferPayload);
      dispatch(completeTransfer(response.data || response));
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Transfer failed';
      dispatch(failTransfer(errorMsg));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!selectedAccount) {
    return (
      <Container className="py-4">
        <Alert variant="warning" role="alert">
          Please select an account first to proceed with transfer
        </Alert>
      </Container>
    );
  }

  return (
    <div className="transfer-funds-page">
      <Container className="py-4">
        <Row>
          <Col lg={8} className="mx-auto">
            <TransferForm onSubmit={handleTransfer} />

            {transferError && (
              <Alert variant="danger" className="mt-4">
                {transferError}
              </Alert>
            )}

            {transferStatus === 'success' && (
              <Alert variant="success" className="mt-4">
                Transfer initiated successfully! You will receive a confirmation email shortly.
              </Alert>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};
