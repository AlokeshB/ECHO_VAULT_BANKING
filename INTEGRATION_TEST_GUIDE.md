# 🧪 INTEGRATION TEST GUIDE

## Quick Test Steps

### 1. Start Backend Server
```bash
cd "c:\Users\2463365\OneDrive - Cognizant\Desktop\ECHOVAULT_BANKING\banking_server"
npm start
```
Expected: Server running on `http://localhost:5200`

### 2. Start Frontend Dev Server  
```bash
cd "c:\Users\2463365\OneDrive - Cognizant\Desktop\ECHOVAULT_BANKING\banking_UI"
npm run dev
```
Expected: Frontend running on `http://localhost:5173`

### 3. Test Customer Login
1. Go to `http://localhost:5173/login`
2. Login tab should show Customer/Admin toggle
3. Select "Customer" (default)
4. Enter test customer email/password
5. Expected: No `.role` error in console
6. If 2FA enabled: Enter 6-digit PIN
7. Expected redirect: `/dashboard` or `/kyc-verify`

### 4. Test Admin Login
1. Go to `http://localhost:5173/login`
2. Click "Admin" toggle button
3. Enter admin credentials:
   - Email: `admin@echovault.com`
   - Password: `SecurePassword123`
4. Expected: Admin theme (dark blue) displays
5. Expected: No `.role` error in console
6. If 2FA enabled: Enter 6-digit PIN
7. Expected redirect: `/admin/dashboard`

### 5. Verify Console
- Open DevTools (F12)
- Console tab should show NO errors
- Specifically check for: "Cannot read properties of undefined"

---

## Expected API Response Flow

```
POST /api/v1/auth/login-email
Response: {
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJ...",
    "user": {
      "id": "...",
      "email": "...",
      "role": "admin|customer",
      "twoFactorEnabled": true/false,
      "kycVerified": true/false
    },
    "twoFactorRequired": true/false
  }
}

Frontend receives (after interceptor):
{
  "token": "eyJ...",
  "user": { ... },
  "twoFactorRequired": true/false
}
```

---

## What Should NOT Happen

❌ "Cannot read properties of undefined (reading 'role')"
❌ Redirect to landing page
❌ API 404 errors on verify-mpin
❌ Invalid response structure errors
❌ Token not saving to localStorage

---

## What SHOULD Happen

✅ Proper login flow without errors
✅ 2FA PIN verification if enabled
✅ Correct redirect based on user role
✅ Token saved to localStorage
✅ User object in Redux state with role
✅ Responsive design (mobile/tablet/desktop)

---

## Debug Mode

To debug API responses:
1. Open DevTools Network tab
2. Perform login
3. Click on login request
4. Go to Response tab
5. Verify structure matches expected format
6. Check that data is nested under "data" key

