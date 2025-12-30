import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { cartService, walletService, orderService } from '../services'
import { Lock, ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react'

const Cart = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  
  const [cart, setCart] = useState(null)
  const [wallet, setWallet] = useState({ balance: 0 })
  const [paymentMethod, setPaymentMethod] = useState('wallet')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingItems, setUpdatingItems] = useState({})

  // Fetch cart on mount
  useEffect(() => {
    fetchCart()
    fetchWallet()
  }, [])

  const fetchCart = async () => {
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await cartService.getCart()
      setCart(response.data.data)
      setError('')
    } catch (err) {
      console.error('Error fetching cart:', err)
      setError(err.response?.data?.message || 'Failed to load cart')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWallet = async () => {
    try {
      const res = await walletService.getWallet()
      setWallet(res.data.data.wallet || { balance: 0 })
    } catch (err) {
      console.error('Error fetching wallet:', err)
    }
  }

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return

    // Handle both string and object IDs
    const id = typeof productId === 'string' ? productId : productId._id

    setUpdatingItems((prev) => ({ ...prev, [id]: true }))

    try {
      const response = await cartService.updateCartItem(id, { quantity: newQuantity })
      setCart(response.data.data)
    } catch (err) {
      console.error('Update error:', err)
      alert('Failed to update quantity: ' + (err.response?.data?.message || err.message))
    } finally {
      setUpdatingItems((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleRemoveItem = async (productId) => {
    if (!window.confirm('Are you sure you want to remove this item?')) return

    // Handle both string and object IDs
    const id = typeof productId === 'string' ? productId : productId._id

    try {
      const response = await cartService.removeFromCart(id)
      setCart(response.data.data)
    } catch (err) {
      console.error('Remove error:', err)
      alert('Failed to remove item: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your entire cart?')) return

    try {
      const response = await cartService.clearCart()
      setCart(response.data.data)
    } catch (err) {
      alert('Failed to clear cart: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleRequestFunds = async () => {
    const amountStr = window.prompt('Enter amount to request (e.g., 500)')
    if (!amountStr) return
    const amount = parseFloat(amountStr)
    if (!amount || amount <= 0) return alert('Please enter a valid amount')

    try {
      await walletService.requestFunds({ amount })
      alert('Fund request submitted. Admin will review and approve shortly.')
    } catch (err) {
      console.error('Request funds error:', err)
      alert('Failed to submit fund request: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleCheckout = async () => {
    const shippingAddress = null // TODO: collect shipping address from user (use profile or new form)
    try {
      const response = await orderService.createOrder({ paymentMethod, shippingAddress })
      alert('Order placed successfully')
      // Refresh cart and wallet
      fetchCart()
      fetchWallet()
      navigate('/orders')
    } catch (err) {
      console.error('Checkout error:', err)
      alert('Failed to place order: ' + (err.response?.data?.message || err.message))
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="container mx-auto px-4 py-12">
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Please log in</h1>
          <p className="text-gray-600 mb-8">You need to be logged in to view your cart.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 transition font-medium"
          >
            Go to Login
          </button>
        </div>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-12">
        <div className="text-center py-16">
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-12">
        <div className="text-center py-16">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition"
          >
            Continue Shopping
          </button>
        </div>
      </main>
    )
  }

  // Empty cart
  if (!cart || cart.items.length === 0) {
    return (
      <main className="container mx-auto px-4 py-12">
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Add some fresh products to get started!</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 transition font-medium"
          >
            Continue Shopping
          </button>
        </div>
      </main>
    )
  }

  const shipping = 40
  const tax = cart.subtotal ? (cart.subtotal * 0.05) : 0
  const total = (cart.subtotal || 0) + tax + shipping

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {cart.items.map((item) => {
              // Handle both string and object product IDs
              const productId = typeof item.product === 'string' ? item.product : item.product._id
              
              return (
              <div key={productId} className="bg-white p-4 rounded-lg border border-gray-200 flex gap-4">
                <img
                  src={item.productImage && item.productImage.startsWith('http') ? item.productImage : 'https://via.placeholder.com/100'}
                  alt={item.productName}
                  className="w-24 h-24 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/100'
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{item.productName}</h3>
                  <p className="text-sm text-gray-600">{item.farmerName}</p>
                  <p className="text-green-600 font-semibold mt-2">₹{item.price} per {item.unit}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleUpdateQuantity(productId, item.quantity - 1)}
                    disabled={updatingItems[productId]}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-50 cursor-pointer"
                  >
                    −
                  </button>
                  <span className="font-semibold w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(productId, item.quantity + 1)}
                    disabled={updatingItems[productId]}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-50 cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                  <button
                    onClick={() => handleRemoveItem(productId)}
                    className="text-red-500 hover:text-red-700 font-semibold text-sm mt-2"
                  >
                    Remove
                  </button>
                </div>
              </div>
              )
            })}
          </div>

          <button
            onClick={handleClearCart}
            className="mt-6 text-red-500 hover:text-red-700 font-semibold"
          >
            Clear Cart
          </button>
        </div>

        {/* Order Summary */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 h-fit sticky top-20">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{(cart.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (5%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>₹{shipping.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6 text-lg font-bold">
            <span>Total</span>
            <span className="text-green-600">₹{total.toFixed(2)}</span>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <div className="flex items-center gap-4 mb-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="payment"
                  value="wallet"
                  checked={paymentMethod === 'wallet'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="ml-1">Wallet (₹{(wallet.balance || 0).toFixed(2)})</span>
              </label>
            </div>

            {wallet.balance < total && (
              <div className="text-sm text-red-500">Insufficient wallet balance to place this order.</div>
            )}

            <button
              onClick={() => handleRequestFunds()}
              className="mt-2 text-sm text-blue-600 underline"
            >
              Request Funds
            </button>
          </div>

          <button
            onClick={handleCheckout}
            className={`w-full ${wallet.balance < total ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'} py-3 rounded-lg transition font-semibold mb-3`}
            disabled={wallet.balance < total}
          >
            Proceed to Checkout
          </button>

          <button
            onClick={() => navigate('/products')}
            className="w-full border border-green-600 text-green-600 py-3 rounded-lg hover:bg-green-50 transition font-semibold"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </main>
  )
}

export default Cart
