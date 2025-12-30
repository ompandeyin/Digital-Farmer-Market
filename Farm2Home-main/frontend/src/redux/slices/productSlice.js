import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  products: [],
  filteredProducts: [],
  singleProduct: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    pages: 1,
    total: 0,
  },
  filters: {
    category: '',
    minPrice: 0,
    maxPrice: 10000,
    rating: 0,
    search: '',
  },
}

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    fetchStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    fetchSuccess: (state, action) => {
      state.isLoading = false
      state.products = action.payload.products
      state.filteredProducts = action.payload.products
      state.pagination = action.payload.pagination
    },
    fetchFailure: (state, action) => {
      state.isLoading = false
      state.error = action.payload
    },
    setSingleProduct: (state, action) => {
      state.singleProduct = action.payload
    },
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
      // Filter products based on current filters
      state.filteredProducts = state.products.filter((product) => {
        const matchesCategory = !state.filters.category || product.category === state.filters.category
        const matchesPrice = product.price >= state.filters.minPrice && product.price <= state.filters.maxPrice
        const matchesRating = product.ratings.average >= state.filters.rating
        return matchesCategory && matchesPrice && matchesRating
      })
    },
    resetFilters: (state) => {
      state.filters = initialState.filters
      state.filteredProducts = state.products
    },
  },
})

export const {
  fetchStart,
  fetchSuccess,
  fetchFailure,
  setSingleProduct,
  setFilter,
  resetFilters,
} = productSlice.actions

export default productSlice.reducer
