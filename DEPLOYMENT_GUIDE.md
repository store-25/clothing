# 🚀 Complete Deployment Guide: Vercel + Render + MongoDB

## 📋 Overview
- **Frontend**: Vercel (React + Vite)
- **Backend**: Render (Node.js + Express)
- **Database**: MongoDB (already connected)

## 🗂️ Step 1: Restructure Project

### Current Structure:
```
store25/
├── src/ (React frontend)
├── server-isolated.js (Backend)
├── package.json
└── ...other files
```

### New Structure Needed:
```
store25/
├── frontend/ (React + Vite)
├── backend/ (Node.js + Express)
└── README.md
```

## 🔧 Step 2: Create Frontend Folder

1. Create `frontend/` folder
2. Move these files to `frontend/`:
   - `src/` folder
   - `index.html`
   - `vite.config.ts`
   - `tsconfig.json`
   - `tsconfig.node.json`
   - `tailwind.config.ts`
   - `postcss.config.mjs`
   - `components.json`
   - `components/` folder
   - `hooks/` folder
   - `lib/` folder
   - `services/` folder
   - `app/` folder
   - `public/` folder
   - `styles/` folder

## 🔧 Step 3: Create Backend Folder

1. Create `backend/` folder
2. Move these files to `backend/`:
   - `server-isolated.js` → rename to `server.js`
   - `config/` folder
   - `controllers/` folder
   - `middleware/` folder
   - `models/` folder
   - `routes/` folder
   - `utils/` folder
   - `data/` folder

## 🔧 Step 4: Update Package.json Files

### Frontend package.json:
```json
{
  "name": "store25-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24",
    "tailwindcss": "^3.3.0",
    "typescript": "^5.0.2",
    "vite": "^4.4.5"
  }
}
```

### Backend package.json:
```json
{
  "name": "store25-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
```

## 🔧 Step 5: Update API URLs in Frontend

In `frontend/src/services/api.ts`, update base URL:
```typescript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-app.onrender.com' 
  : 'http://localhost:5001';
```

## 🌐 Step 6: Deploy to Vercel (Frontend)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Set **Root Directory** to `frontend`
6. **Build Command**: `npm run build`
7. **Output Directory**: `dist`
8. **Install Command**: `npm install`
9. Add Environment Variables:
   - `VITE_API_URL=https://your-backend-app.onrender.com`
10. Click "Deploy"

## 🌐 Step 7: Deploy to Render (Backend)

1. Go to [render.com](https://render.com)
2. Click "New +"
3. Select "Web Service"
4. Connect your GitHub repository
5. Set **Root Directory** to `backend`
6. **Runtime**: Node
7. **Build Command**: `npm install`
8. **Start Command**: `node server.js`
9. Add Environment Variables:
   - `NODE_ENV=production`
   - `MONGODB_URI=mongodb+srv://...` (your MongoDB connection string)
   - `JWT_SECRET=your-jwt-secret`
   - `ADMIN_EMAIL=your-admin-email`
   - `ADMIN_PASSWORD=your-admin-password`
10. Click "Create Web Service"

## 🔧 Step 8: Update Frontend API Calls

In `frontend/src/services/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
```

## ✅ Step 9: Test Everything

1. Frontend: Visit your Vercel URL
2. Backend: Visit your Render URL + `/api/test`
3. Check admin login functionality
4. Test product management
5. Test coupon system

## 🔧 Troubleshooting

### Common Issues:
1. **CORS Errors**: Add CORS middleware to backend
2. **Environment Variables**: Make sure all are set correctly
3. **Build Failures**: Check package.json dependencies
4. **MongoDB Connection**: Verify connection string

### CORS Setup in Backend:
```javascript
import cors from 'cors';
app.use(cors({
  origin: ['https://your-vercel-app.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
```

## 📝 Final Checklist

- [ ] Project structure reorganized
- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Render
- [ ] MongoDB connected
- [ ] Environment variables set
- [ ] CORS configured
- [ ] All features tested

## 🎉 You're Live!

Your app is now live at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.onrender.com`
- **Database**: MongoDB Atlas
