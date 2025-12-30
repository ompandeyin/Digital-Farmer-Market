import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  items: [],
  isLoading: false,
  error: null,
  subtotal: 0,
  tax: 0,
  shipping: 40,
  total: 0,
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const existingItem = state.items.find(
        (item) => item.product._id === action.payload.product._id
      )

      if (existingItem) {
        existingItem.quantity += action.payload.quantity
      } else {
        state.items.push(action.payload)
      }

      state.subtotal = state.items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      )
      state.tax = state.subtotal * 0.05
      state.total = state.subtotal + state.tax + state.shipping
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => item.product._id !== action.payload)
      state.subtotal = state.items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      )
      state.tax = state.subtotal * 0.05
      state.total = state.subtotal + state.tax + state.shipping
    },
    updateQuantity: (state, action) => {
      const item = state.items.find((item) => item.product._id === action.payload.productId)
      if (item) {
        item.quantity = action.payload.quantity
      }
      state.subtotal = state.items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      )
      state.tax = state.subtotal * 0.05
      state.total = state.subtotal + state.tax + state.shipping
    },
    clearCart: (state) => {
      state.items = []
      state.subtotal = 0
      state.tax = 0
      state.total = state.shipping
    },
    setCart: (state, action) => {
      state.items = action.payload
      state.subtotal = state.items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      )
      state.tax = state.subtotal * 0.05
      state.total = state.subtotal + state.tax + state.shipping
    },
  },
})

export const { addToCart, removeFromCart, updateQuantity, clearCart, setCart } =
  cartSlice.actions

export default cartSlice.reducer
