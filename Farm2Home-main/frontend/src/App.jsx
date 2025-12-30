import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './redux/store'

// Components
import Header from './components/Header'
import Footer from './components/Footer'

// Pages
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Auctions from './pages/Auctions'
import AuctionDetail from './pages/AuctionDetail'
import Cart from './pages/Cart'
import Sell from './pages/Sell'
import AddProduct from './pages/AddProduct'
import AdminRequests from './pages/AdminRequests'
import AdminUsers from './pages/AdminUsers'
import AdminEscrow from './pages/AdminEscrow'
import Orders from './pages/Orders'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import Profile from './pages/Profile'

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Header />
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/add-product" element={<AddProduct />} />
              <Route path="/auctions" element={<Auctions />} />
              <Route path="/auctions/:id" element={<AuctionDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/sell" element={<Sell />} />
              <Route path="/admin/requests" element={<AdminRequests />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/settlement" element={<AdminEscrow />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </Provider>
  )
}

export default App
