import { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { setAccounts, selectAccount } from '../../store/slices/accountSlice';
import { getAccounts } from '../../services/account.service';
import { AccountCard } from '../../components/banking/AccountCard';
import './AccountsList.css';

export const AccountsList = () => {
  const dispatch = useAppDispatch();
  const { accounts, selectedAccount, loading, error } = useAppSelector(
    (state) => state.account
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setIsLoading(true);
        const data = await getAccounts();
        dispatch(setAccounts(data.data || data));
      } catch (err) {
        console.error('Failed to load accounts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAccounts();
  }, [dispatch]);

  if (isLoading || loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-3">Loading accounts...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">My Accounts</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      {accounts.length > 0 ? (
        <Row>
          {accounts.map((account) => (
            <Col md={6} lg={4} key={account._id} className="mb-4">
              <AccountCard
                account={account}
                isSelected={selectedAccount?._id === account._id}
                onSelect={() => dispatch(selectAccount(account))}
              />
            </Col>
          ))}
        </Row>
      ) : (
        <Alert variant="info">
          No accounts found. Please create an account to get started.
        </Alert>
      )}
    </Container>
  );
};
