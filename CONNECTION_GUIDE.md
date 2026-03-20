# 🔗 CONNECTION GUIDE - Frontend & Backend Setup

## ✅ Current Status: Both Servers Running!

### 🚀 Server URLs:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5001

---

## 📁 Environment Files Setup

### 🎨 Frontend (.env)
```bash
# Location: v:\store25\frontend\.env
VITE_API_URL=http://localhost:5001/api
```

### 🔧 Backend (.env)
```bash
# Location: v:\store25\backend\.env
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/store25
JWT_SECRET=your-super-secret-jwt-key-here
ADMIN_EMAIL=admin@store25.com
ADMIN_PASSWORD=admin123
```

---

## 🔐 Admin Login Credentials

### **Login Details:**
- **Email**: `admin@store25.com`
- **Password**: `admin123`

### **How to Access Admin Panel:**
1. Go to http://localhost:5173
2. Click on "STORE25" logo **5 times** quickly
3. You'll be redirected to admin login page
4. Enter the credentials above

---

## 🧪 API Endpoints Available

### **Authentication:**
- `POST /api/admin/login` - Admin login

### **Admin Dashboard:**
- `GET /api/admin/stats` - Dashboard statistics

### **Products:**
- `GET /api/products` - Get all products

### **Orders:**
- `GET /api/orders` - Get all orders

### **Coupons:**
- `GET /api/coupons` - Get all coupons

### **Health Check:**
- `GET /api/health` - Server health status
- `GET /api/test` - Basic test endpoint

---

## 🚀 How to Run Both Servers

### **Method 1: Separate Terminals**

#### **Terminal 1 - Backend:**
```bash
cd v:\store25\backend
node server-dev.js
```

#### **Terminal 2 - Frontend:**
```bash
cd v:\store25\frontend
npm run dev
```

### **Method 2: Single Terminal (Background)**

#### **Start Backend:**
```bash
cd v:\store25\backend
node server-dev.js
```
(Ctrl+C to stop when needed)

#### **Start Frontend:**
```bash
cd v:\store25\frontend
npm run dev
```

---

## 🔍 Testing the Connection

### **1. Test Backend Health:**
Open browser: http://localhost:5001/api/health

### **2. Test Admin Login API:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5001/api/admin/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@store25.com","password":"admin123"}'
```

### **3. Test Frontend:**
Open browser: http://localhost:5173

---

## 🐛 Troubleshooting

### **Common Issues:**

#### **1. Admin Login Not Working:**
- ✅ Check if backend is running on port 5001
- ✅ Verify .env files are correctly configured
- ✅ Check browser console for API errors

#### **2. Frontend Not Loading:**
- ✅ Check if frontend is running on port 5173
- ✅ Run `npm install` in frontend folder
- ✅ Check for any compilation errors

#### **3. API Connection Errors:**
- ✅ Verify VITE_API_URL in frontend/.env
- ✅ Check CORS settings in backend
- ✅ Ensure both servers are running

#### **4. Port Already in Use:**
```bash
# Kill all Node processes
taskkill /F /IM node.exe

# Then restart servers
```

---

## 📱 Access Your Application

### **Main Store:**
http://localhost:5173

### **Admin Panel:**
1. Go to http://localhost:5173
2. Click "STORE25" logo 5 times
3. Login with admin credentials

### **API Documentation:**
- Base URL: http://localhost:5001/api
- All endpoints return JSON responses
- Admin endpoints require authentication

---

## 🎯 Next Steps

1. **✅ Test admin login functionality**
2. **✅ Verify dashboard loads correctly**
3. **✅ Test product management**
4. **✅ Test coupon system**
5. **🚀 Ready for deployment**

---

## 📞 Support

If you encounter any issues:

1. **Check server status**: Both terminals should show running messages
2. **Verify URLs**: http://localhost:5173 (frontend) and http://localhost:5001 (backend)
3. **Check environment files**: Ensure .env files are correctly configured
4. **Browser console**: Check for any JavaScript errors

**Both servers are now running and ready to use! 🎉**
