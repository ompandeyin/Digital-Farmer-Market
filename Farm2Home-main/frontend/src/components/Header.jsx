import React from 'react'
import { Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../redux/slices/authSlice'
import { Leaf, ShoppingCart, LogOut, User } from 'lucide-react'

const Header = () => {
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const cartItems = useSelector((state) => state.cart.items)

  const handleLogout = () => {
    dispatch(logout())
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-gray-900">Farm<span className="text-green-600">2</span>Home</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-gray-700 hover:text-green-600 transition">
            Home
          </Link>
          <Link to="/products" className="text-gray-700 hover:text-green-600 transition">
            Products
          </Link>
          <Link to="/auctions" className="text-gray-700 hover:text-green-600 transition">
            Live Auctions
          </Link>

          {isAuthenticated && user?.role === 'farmer' && (
            <Link to="/sell" className="text-gray-700 hover:text-green-600 transition">
              Create Auction
            </Link>
          )}
          {isAuthenticated && user?.role === 'admin' && (
            <>
              <Link to="/admin/dashboard" className="text-gray-700 hover:text-green-600 transition">
                Admin Dashboard
              </Link>
              <Link to="/admin/settlement" className="text-gray-700 hover:text-green-600 transition">
                Auction Settlement
              </Link>
              <Link to="/admin/requests" className="text-gray-700 hover:text-green-600 transition">
                Fund Requests
              </Link>
              <Link to="/admin/users" className="text-gray-700 hover:text-green-600 transition">
                Users
              </Link>
            </>
          )}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Cart Icon */}
          <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-lg transition">
            <ShoppingCart className="w-6 h-6 text-gray-700" />
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {cartItems.length}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {user?.role === 'admin' ? (
                <span className="text-gray-700">{user?.fullName?.split(' ')[0]}</span>
              ) : (
                <Link to="/dashboard" className="text-gray-700 hover:text-green-600">
                  {user?.fullName?.split(' ')[0]}
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link
                to="/login"
                className="text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
