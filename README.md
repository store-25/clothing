# 🛍️ STORE25 - E-commerce Platform

## 📁 Project Structure

```
store25/
├── frontend/                 # React + Vite Frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── admin/           # Admin panel components
│   │   ├── services/        # API services
│   │   └── App.tsx          # Main App component
│   ├── public/              # Static assets
│   ├── package.json         # Frontend dependencies
│   └── .env                 # Frontend environment variables
├── backend/                  # Node.js + Express Backend
│   ├── server.js            # Main server file
│   ├── config/              # Database configuration
│   ├── controllers/         # Route controllers
│   ├── models/              # MongoDB models
│   ├── routes/              # API routes
│   ├── middleware/          # Custom middleware
│   ├── utils/               # Utility functions
│   ├── package.json         # Backend dependencies
│   └── .env                 # Backend environment variables
└── README.md                # This file
```

## 🚀 Getting Started

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

### Backend (Node.js + Express)
```bash
cd backend
npm install
npm run dev
```

## 🌐 Deployment

- **Frontend**: Deployed on Vercel
- **Backend**: Deployed on Render
- **Database**: MongoDB Atlas

## 📋 Features

- 🛒 Product Management
- 💰 Coupon System
- 🛍️ Shopping Cart
- 📱 Mobile Responsive
- 🔐 Admin Authentication
- 📊 Sales Dashboard
- 📧 WhatsApp Order Integration

## 🔧 Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:5001/api
```

### Backend (.env)
```
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
ADMIN_EMAIL=admin@store25.com
ADMIN_PASSWORD=admin123
```

## 📱 Admin Panel

Access the admin panel at `/admin` with:
- Email: `admin@store25.com`
- Password: `admin123`

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB
- **Authentication**: JWT
- **Deployment**: Vercel (Frontend), Render (Backend)
