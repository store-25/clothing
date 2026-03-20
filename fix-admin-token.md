# Fix Admin Token Issue

## Problem
The frontend is using an expired admin token, causing the Admin Orders page to show a 500 error.

## Solution
Clear the expired token and re-authenticate:

### Method 1: Browser Console (Quick Fix)
1. Open your browser's Developer Console (F12)
2. Run this command:
```javascript
localStorage.removeItem('adminToken');
window.location.href = '/admin-login';
```

### Method 2: Clear Browser Storage
1. Open Developer Tools (F12)
2. Go to Application/Storage tab
3. Clear Local Storage for the site
4. Refresh the page and log in again as admin

### Method 3: Manual Login
1. Navigate to `/admin-login`
2. Login with admin credentials:
   - Email: Abhinay@1
   - Password: Thalaiva

## Verification
After logging in with fresh credentials, the Admin Orders page should load correctly without errors.

## Root Cause
JWT tokens expire after 8 hours. The frontend had an expired token stored in localStorage, causing authentication failures when trying to access admin endpoints.
