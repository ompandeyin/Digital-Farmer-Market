import Cart from '../models/Cart.js'
import Product from '../models/Product.js'

// Get cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user._id

    let cart = await Cart.findOne({ customer: userId }).populate({
      path: 'items.product',
      select: 'name price unit category image'
    })

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: {
          customer: userId,
          items: [],
          subtotal: 0,
          discount: 0,
          totalPrice: 0,
          itemCount: 0
        }
      })
    }

    res.status(200).json({
      success: true,
      data: cart
    })
  } catch (error) {
    console.error('Get cart error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// Add to cart
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body
    const userId = req.user._id

    // Validate input
    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and valid quantity are required'
      })
    }

    // Get product details
    const product = await Product.findById(productId).populate('farmer', 'fullName')

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    // Check if product is in stock
    if (product.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Product is out of stock'
      })
    }

    // Find or create cart
    let cart = await Cart.findOne({ customer: userId })

    if (!cart) {
      cart = new Cart({
        customer: userId,
        items: [],
        subtotal: 0,
        totalPrice: 0,
        itemCount: 0
      })
    }

    // Check if product already in cart
    const existingItem = cart.items.find((item) => item.product.toString() === productId)

    if (existingItem) {
      // Check if new total quantity exceeds available stock
      const newQuantity = existingItem.quantity + quantity
      if (newQuantity > product.quantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot add ${quantity} more. Only ${product.quantity - existingItem.quantity} more available (you have ${existingItem.quantity} in cart)`
        })
      }
      // Update quantity if already in cart
      existingItem.quantity = newQuantity
    } else {
      // Check if requested quantity exceeds stock
      if (quantity > product.quantity) {
        return res.status(400).json({
          success: false,
          message: `Requested quantity exceeds available stock. Only ${product.quantity} available`
        })
      }
      // Add new item to cart
      cart.items.push({
        product: productId,
        productName: product.name,
        productImage: product.image,
        quantity,
        price: product.price,
        unit: product.unit,
        farmer: product.farmer._id,
        farmerName: product.farmer.fullName
      })
    }

    // Calculate totals
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    cart.totalPrice = cart.subtotal - cart.discount
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)
    cart.updatedAt = new Date()

    await cart.save()

    res.status(200).json({
      success: true,
      message: 'Product added to cart',
      data: cart
    })
  } catch (error) {
    console.error('Add to cart error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// Update cart item
export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params
    const { quantity } = req.body
    const userId = req.user._id

    if (!quantity || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      })
    }

    const cart = await Cart.findOne({ customer: userId })

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      })
    }

    const item = cart.items.find((item) => item.product.toString() === productId)

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in cart'
      })
    }

    if (quantity === 0) {
      cart.items = cart.items.filter((item) => item.product.toString() !== productId)
    } else {
      // Check if quantity exceeds available stock
      const product = await Product.findById(productId)
      if (product && quantity > product.quantity) {
        return res.status(400).json({
          success: false,
          message: `Requested quantity exceeds available stock. Only ${product.quantity} available`
        })
      }
      item.quantity = quantity
    }

    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    cart.totalPrice = cart.subtotal - cart.discount
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)
    cart.updatedAt = new Date()

    await cart.save()

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: cart
    })
  } catch (error) {
    console.error('Update cart error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// Remove from cart
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params
    const userId = req.user._id

    const cart = await Cart.findOne({ customer: userId })

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      })
    }

    cart.items = cart.items.filter((item) => item.product.toString() !== productId)

    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    cart.totalPrice = cart.subtotal - cart.discount
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)
    cart.updatedAt = new Date()

    await cart.save()

    res.status(200).json({
      success: true,
      message: 'Product removed from cart',
      data: cart
    })
  } catch (error) {
    console.error('Remove from cart error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id

    const cart = await Cart.findOne({ customer: userId })

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      })
    }

    cart.items = []
    cart.subtotal = 0
    cart.totalPrice = 0
    cart.itemCount = 0
    cart.updatedAt = new Date()

    await cart.save()

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: cart
    })
  } catch (error) {
    console.error('Clear cart error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
