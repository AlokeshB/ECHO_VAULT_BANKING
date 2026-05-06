import { Card } from 'react-bootstrap';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useState } from 'react';
import { formatCurrencyWithSymbol } from '../../utils/currencyFormatter';
import './AccountCard.css';

export const AccountCard = ({ account, isSelected, onSelect }) => {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <Card
      className={`account-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <Card.Title className="account-name">{account.accountName}</Card.Title>
            <Card.Subtitle className="account-number text-muted">
              {`****${account.accountNumber?.slice(-4) || ''}`}
            </Card.Subtitle>
          </div>
          <button
            className="btn btn-link btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowBalance(!showBalance);
            }}
            title="Toggle balance visibility"
          >
            {showBalance ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>

        <div className="account-balance-section">
          <small className="text-muted">Available Balance</small>
          <h5 className="account-balance mt-2">
            {showBalance ? formatCurrencyWithSymbol(account.balance) : '••••••'}
          </h5>
        </div>

        <div className="account-details mt-3">
          <div className="detail-item">
            <small className="text-muted">Account Type</small>
            <p className="detail-value">{account.accountType}</p>
          </div>
          <div className="detail-item">
            <small className="text-muted">Status</small>
            <p className="detail-value">
              <span className={`badge bg-${account.status === 'active' ? 'success' : 'warning'}`}>
                {account.status}
              </span>
            </p>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};
