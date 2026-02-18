## 🚀 Live Demo: https://digital-farmer-market.vercel.app/


# Digital Farmer Market (Farm2Home)

A full-stack MERN application that connects farmers directly with consumers through product listings and live auctions, powered by a secure wallet and escrow-based settlement system.

---

## 🚜 Project Overview

**Farm2Home** is a digital marketplace where:
- Farmers can list products and create live auctions
- Consumers can buy products or participate in auctions
- Payments are handled through a wallet system
- Auction payments are secured using an **escrow mechanism**
- Admins manage users, funds, and platform activity

The platform eliminates middlemen and ensures transparent, secure transactions.

---

## 🧱 Tech Stack

### Frontend
- React 18
- Redux Toolkit
- React Router
- Tailwind CSS
- Vite
- Socket.io Client

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- Socket.io
- Multer & Cloudinary
- MongoDB Transactions

---

## 👥 User Roles

### Consumer
- Browse products
- Add to cart & place orders
- Participate in live auctions
- Wallet payments
- Order tracking

### Farmer
- All consumer features
- Create and manage auctions
- Sell products directly
- Receive auction payments

### Admin
- Platform dashboard
- Manage users
- Approve fund requests
- Monitor orders & auctions
- Control escrow settlements

---

## 🔨 Key Features

- Product listing & filtering
- Live auctions with real-time bidding
- Wallet-based payment system
- Secure escrow-based auction settlement
- Order management
- Admin dashboard
- Role-based access control
- Real-time updates using Socket.io

---

## 💰 Escrow-Based Auction Settlement

Auction payments follow a **secure escrow flow**:

1. Buyer wins the auction  
2. Winning bid amount is deducted from buyer wallet  
3. Amount is held in **admin escrow wallet**  
4. After delivery confirmation:
   - Funds are released to the farmer  
5. In case of failure or dispute:
   - Amount is refunded to the buyer  

This ensures safety for both buyers and farmers.

Detailed explanation available in  
📄 **ESCROW_SYSTEM.md**

---

## 📂 Project Structure

```
Digital-Farmer-Market/
├── Farm2Home-main/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── controllers
│   │   │   ├── models
│   │   │   ├── routes
│   │   │   ├── middleware
│   │   │   ├── services
│   │   │   ├── socket.js
│   │   │   └── server.js
│   │   ├── .env
│   │   ├── package.json
│   │   └── seed.js
│   │
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── pages
│   │   │   ├── components
│   │   │   ├── redux
│   │   │   ├── services
│   │   │   └── App.jsx
│   │   ├── vite.config.js
│   │   └── package.json
│   │
│   ├── ESCROW_SYSTEM.md
│   └── PROJECT_REPORT.md
│
└── README.md
`​``
---

## ⚙️ Environment Variables

Create a `.env` file inside the `backend` folder:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/farm2home
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
```
---

## ▶️ How to Run the Project Locally

### Backend
```
cd Farm2Home-main/backend
npm install
npm run dev
```

### Frontend
```
cd Farm2Home-main/frontend
npm install
npm run dev
```
---

🌐 Application URLs

Frontend: **http://localhost:5173**

Backend:  **http://localhost:5000**

📡 Real-Time Features

Live auction bidding

Real-time bid updates

Auction status notifications

Wallet and order updates

Implemented using Socket.io

📄 Documentation

ESCROW_SYSTEM.md – Detailed escrow and settlement workflow

PROJECT_REPORT.md – Complete system design and feature explanation

🚀 Project Status

Core features implemented

Escrow-based auction settlement completed

Ready for deployment and further enhancements

## 👨‍🎓 Author
**Om Pandey**  
Computer Science Student  
Lovely Professional University, Punjab
