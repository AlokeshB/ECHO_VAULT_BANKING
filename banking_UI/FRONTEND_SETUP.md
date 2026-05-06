# ECHOVAULT BANKING - Frontend Setup Guide

## Project Structure

```
banking_UI/
├── src/
│   ├── assets/         # Static files (images, logos, etc.)
│   ├── components/
│   │   ├── common/     # Navbar, Sidebar (shared components)
│   │   └── banking/    # AccountCard, TransactionRow, TransferForm
│   ├── context/        # ThemeContext, LocaleContext, LayoutContext
│   ├── hooks/          # useAppDispatch, useAppSelector, useTheme
│   ├── pages/
│   │   ├── auth/       # LandingPage, LoginPage, RegisterPage, KYCVerification
│   │   ├── customer/   # Dashboard, AccountsList, TransactionHistory, TransferFunds
│   │   └── admin/      # AdminDashboard, UserManagement, AuditLogs
│   ├── services/       # API clients and service functions
│   ├── store/          # Redux store, slices
│   ├── utils/          # Formatters, validators, helpers
│   ├── App.jsx         # Main routing component
│   ├── main.jsx        # App entry point
│   ├── index.css       # Global styles with Bootstrap
│   └── App.css         # Layout styles
```

## Installation

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your backend API URL and configuration.

## Key Features Implemented

### 1. **Authentication System**
- Multi-factor authentication (2FA) with OTP/mPin
- Support for email/password and userID/password login
- Token refresh mechanism
- Secure token storage

### 2. **Redux Store**
- **authSlice**: Authentication state, JWT tokens, user role, 2FA/KYC status
- **userSlice**: User personal information and profile data
- **accountSlice**: User accounts and selected account tracking
- **transactionSlice**: Transaction history and transfer status
- **apiStateSlice**: Global loading and error states

### 3. **Context API (UI-Specific)**
- **ThemeContext**: Dark/Light mode toggle
- **LocaleContext**: Language and regional formatting
- **LayoutContext**: Sidebar collapse/expand state

### 4. **API Integration**
- Axios-based API client with request/response interceptors
- Automatic token refresh on 401 responses
- Services for auth, accounts, transactions, and admin operations

### 5. **Pages & Routes**

#### Public Routes
- `/` - Landing page
- `/login` - Login with multiple options
- `/register` - User registration

#### Protected Customer Routes
- `/kyc-verify` - KYC verification (intermediate page)
- `/dashboard` - Customer dashboard
- `/accounts` - View all accounts
- `/transfer` - Transfer funds
- `/transactions` - Transaction history

#### Protected Admin Routes
- `/admin/dashboard` - System metrics and status
- `/admin/users` - User management
- `/admin/audit-logs` - Audit trail

### 6. **2FA & Security Flow**
1. User logs in with email/password or userID/password
2. System checks for 2FA requirement
3. If mPin not set, user sets 4-digit mPin
4. User verifies with 2FA code (6-digit OTP or mPin)
5. Upon successful auth, check KYC status
6. If KYC not verified, redirect to KYC-verify page
7. After KYC, user can access dashboard

### 7. **Reusable Components**
- **AccountCard**: Display account details with balance toggle
- **TransactionRow**: Transaction list item with status badge
- **TransferForm**: Form for initiating fund transfers
- **Navbar**: Navigation with user menu and theme toggle
- **Sidebar**: Navigation menu for desktop and mobile

### 8. **Utility Functions**
- Currency formatting (`formatCurrencyWithSymbol`)
- Date formatting (`formatDate`, `formatDateTime`)
- Input validation (`validateEmail`, `validatePhone`, `validatePAN`, etc.)
- Error message generation

## Development

### Start Development Server
```bash
npm run dev
```

Server will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Lint Code
```bash
npm lint
```

### Preview Production Build
```bash
npm run preview
```

## Bootstrap Integration

The project uses Bootstrap 5 for styling with custom overrides:
- Primary color: #667eea (purple-blue)
- Secondary color: #764ba2 (darker purple)
- All Bootstrap components are available through React Bootstrap
- Dark mode support via `data-bs-theme="dark"` attribute

## State Management Flow

```
User Interaction
    ↓
Component dispatches Redux Action
    ↓
Redux Slice updates state
    ↓
Component re-renders with new state
    ↓
Optional: Service call to backend
    ↓
Update Redux state with response
```

## API Integration Flow

```
Component
    ↓
Service Method (account.service.js, auth.service.js, etc.)
    ↓
apiClient (Axios instance with interceptors)
    ↓
Request Interceptor (adds auth token)
    ↓
Backend API
    ↓
Response Interceptor (handles token refresh)
    ↓
Return to Service
    ↓
Redux action to update state
    ↓
Component re-renders
```

## Environment Variables

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:5000/api

# App Configuration
VITE_APP_NAME=ECHOVAULT BANKING
VITE_APP_VERSION=1.0.0
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimizations

- Code splitting with dynamic imports
- Lazy loading of pages
- Optimized re-renders with Redux selectors
- Image optimization
- Bootstrap CSS is imported once globally

## Security Considerations

- JWT tokens stored in localStorage (consider sessionStorage for added security)
- HTTPS required for production
- CORS properly configured on backend
- Input validation on both client and server
- Sensitive operations require 2FA
- KYC verification before fund transfers

## Troubleshooting

### API Connection Issues
- Verify backend is running on the configured port
- Check CORS settings on backend
- Ensure environment variables are set correctly

### Login Issues
- Check that user credentials are correct
- Verify 2FA code reception
- Check browser console for detailed error messages

### Building Issues
- Clear `node_modules` and reinstall: `npm install`
- Clear build cache: `rm -rf dist`
- Rebuild: `npm run build`

## Contributing

Follow these conventions:
- Use functional components with hooks
- Create Redux slices for new features
- Use proper error handling
- Add PropTypes or TypeScript types
- Follow existing code style

## License

Proprietary - ECHOVAULT BANKING 2026
