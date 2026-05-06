import { formatCurrencyWithSymbol } from '../../utils/currencyFormatter';
import { formatDateTime } from '../../utils/dateFormatter';
import { Badge } from 'react-bootstrap';
import { FiArrowDown, FiArrowUp, FiArrowRight } from 'react-icons/fi';
import './TransactionRow.css';

export const TransactionRow = ({ transaction }) => {
  const isDebit = transaction.type === 'debit' || transaction.type === 'transfer_out';
  const isIncome = transaction.type === 'credit' || transaction.type === 'transfer_in';

  const icon = isIncome ? (
    <FiArrowDown className="text-success" />
  ) : isDebit ? (
    <FiArrowUp className="text-danger" />
  ) : (
    <FiArrowRight className="text-warning" />
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
      case 'rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <tr className="transaction-row">
      <td className="transaction-icon">{icon}</td>
      <td>
        <div className="transaction-details">
          <p className="transaction-description mb-1">{transaction.description}</p>
          <small className="text-muted">
            {transaction.beneficiary || transaction.accountNumber}
          </small>
        </div>
      </td>
      <td className="transaction-date">
        <small className="text-muted">{formatDateTime(transaction.date)}</small>
      </td>
      <td className="transaction-amount text-end">
        <p className={`mb-1 ${isDebit ? 'text-danger' : 'text-success'}`}>
          {isDebit ? '-' : '+'}
          {formatCurrencyWithSymbol(transaction.amount)}
        </p>
      </td>
      <td className="text-center">
        <Badge bg={getStatusColor(transaction.status)}>{transaction.status}</Badge>
      </td>
    </tr>
  );
};
