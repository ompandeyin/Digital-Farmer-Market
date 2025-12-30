import Order from '../models/Order.js'
import Cart from '../models/Cart.js'
import User from '../models/User.js'
import Transaction from '../models/Transaction.js'
import Product from '../models/Product.js'

// Helper function to reduce stock for all cart items
const reduceProductStock = async (cartItems) => {
  for (const item of cartItems) {
    await Product.findByIdAndUpdate(
      item.product,
      { $inc: { quantity: -item.quantity } }
    )
  }
}

// Helper function to check stock availability for all cart items
const checkStockAvailability = async (cartItems) => {
  const stockIssues = []
  
  for (const item of cartItems) {
    const product = await Product.findById(item.product)
    if (!product) {
      stockIssues.push({ productName: item.productName, issue: 'Product no longer exists' })
    } else if (product.quantity < item.quantity) {
      if (product.quantity === 0) {
        stockIssues.push({ productName: item.productName, issue: 'Out of stock' })
      } else {
        stockIssues.push({ productName: item.productName, issue: `Only ${product.quantity} ${product.unit}(s) available` })
      }
    }
  }
  
  return stockIssues
}

// Create order (supports wallet payment)
export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id
    const { paymentMethod = 'wallet', shippingAddress } = req.body

    // Get cart
    const cart = await Cart.findOne({ customer: userId })
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' })
    }

    // Check stock availability for all items before proceeding
    const stockIssues = await checkStockAvailability(cart.items)
    if (stockIssues.length > 0) {
      const issueMessages = stockIssues.map(i => `${i.productName}: ${i.issue}`).join(', ')
      return res.status(400).json({ 
        success: false, 
        message: `Stock issues: ${issueMessages}`,
        stockIssues 
      })
    }

    // Calculate totals (use cart totals)
    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const totalAmount = cart.totalPrice || subtotal

    // If using wallet, check balance
    if (paymentMethod === 'wallet') {
      const user = await User.findById(userId)
      if (!user) return res.status(404).json({ success: false, message: 'User not found' })

      const balance = (user.wallet && user.wallet.balance) || 0
      if (balance < totalAmount) {
        return res.status(400).json({ success: false, message: 'Insufficient wallet balance' })
      }

      // Deduct wallet
      user.wallet.balance = balance - totalAmount
      await user.save()

      // Create transaction
      const tx = await Transaction.create({ user: userId, type: 'debit', amount: totalAmount, source: 'order_checkout' })

      if (user.wallet.transactions && Array.isArray(user.wallet.transactions)) {
        user.wallet.transactions.push(tx._id)
        await user.save()
      }

      // Create order document
      const order = await Order.create({
        customer: userId,
        customerName: user.fullName,
        customerEmail: user.email,
        customerPhone: user.phone,
        items: cart.items.map((i) => ({
          product: i.product,
          productName: i.productName,
          productImage: i.productImage,
          quantity: i.quantity,
          price: i.price,
          unit: i.unit,
          farmer: i.farmer,
          farmerName: i.farmerName
        })),
        shippingAddress: shippingAddress || {},
        subtotal,
        totalAmount,
        paymentMethod: 'wallet',
        paymentStatus: 'completed',
        transactionId: tx._id
      })

      // Clear the cart
      cart.items = []
      cart.subtotal = 0
      cart.totalPrice = 0
      cart.itemCount = 0
      await cart.save()

      // Reduce stock for all purchased products
      await reduceProductStock(order.items)

      return res.status(201).json({ success: true, message: 'Order placed using wallet', data: { order } })
    }

    // If using a dummy payment gateway (non-wallet), simulate immediate payment
    if (paymentMethod === 'dummy') {
      // Simulate creating a payment record (transaction) and mark order completed
      const tx = await Transaction.create({
        user: userId,
        type: 'debit',
        amount: totalAmount,
        source: 'dummy_gateway',
        meta: { note: 'Dummy payment - auto approved' }
      })

      const order = await Order.create({
        customer: userId,
        customerName: req.user.fullName,
        customerEmail: req.user.email,
        customerPhone: req.user.phone,
        items: cart.items.map((i) => ({
          product: i.product,
          productName: i.productName,
          productImage: i.productImage,
          quantity: i.quantity,
          price: i.price,
          unit: i.unit,
          farmer: i.farmer,
          farmerName: i.farmerName
        })),
        shippingAddress: shippingAddress || {},
        subtotal,
        totalAmount,
        paymentMethod,
        paymentStatus: 'completed',
        transactionId: tx._id
      })

      // Clear the cart
      cart.items = []
      cart.subtotal = 0
      cart.totalPrice = 0
      cart.itemCount = 0
      await cart.save()

      // Reduce stock for all purchased products
      await reduceProductStock(order.items)

      return res.status(201).json({ success: true, message: 'Order placed (dummy payment)', data: { order } })
    }

    // For other payment methods we will just create a pending order (placeholder)
    const order = await Order.create({
      customer: userId,
      customerName: req.user.fullName,
      customerEmail: req.user.email,
      customerPhone: req.user.phone,
      items: cart.items.map((i) => ({
        product: i.product,
        productName: i.productName,
        productImage: i.productImage,
        quantity: i.quantity,
        price: i.price,
        unit: i.unit,
        farmer: i.farmer,
        farmerName: i.farmerName
      })),
      shippingAddress: shippingAddress || {},
      subtotal,
      totalAmount,
      paymentMethod,
      paymentStatus: 'pending'
    })

    res.status(201).json({ success: true, message: 'Order created (payment pending)', data: order })
  } catch (error) {
    console.error('Create order error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getOrdersForUser = async (req, res) => {
  try {
    // Admins can view all orders; regular users only their own
    if (req.user.role === 'admin') {
      const orders = await Order.find().sort({ createdAt: -1 }).lean()
      return res.status(200).json({ success: true, data: orders })
    }

    const userId = req.user._id
    const orders = await Order.find({ customer: userId }).sort({ createdAt: -1 }).lean()
    res.status(200).json({ success: true, data: orders })
  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}
