import { createSlice } from '@reduxjs/toolkit'

// Safely parse user from localStorage
const getUserFromStorage = () => {
  try {
    const userStr = localStorage.getItem('user')
    if (userStr && userStr !== 'undefined' && userStr !== 'null') {
      return JSON.parse(userStr)
    }
    return null
  } catch (error) {
    console.error('Error parsing user from localStorage:', error)
    localStorage.removeItem('user') // Clean up invalid data
    return null
  }
}

const initialState = {
  user: getUserFromStorage(),
  token: localStorage.getItem('token') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('token'),
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    registerStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    registerSuccess: (state, action) => {
      state.isLoading = false
      state.user = action.payload.user
      state.token = action.payload.token
      state.refreshToken = action.payload.refreshToken
      state.isAuthenticated = true
      localStorage.setItem('user', JSON.stringify(action.payload.user))
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('refreshToken', action.payload.refreshToken)
    },
    registerFailure: (state, action) => {
      state.isLoading = false
      state.error = action.payload
    },
    loginStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    loginSuccess: (state, action) => {
      state.isLoading = false
      state.user = action.payload.user
      state.token = action.payload.token
      state.refreshToken = action.payload.refreshToken
      state.isAuthenticated = true
      localStorage.setItem('user', JSON.stringify(action.payload.user))
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('refreshToken', action.payload.refreshToken)
    },
    loginFailure: (state, action) => {
      state.isLoading = false
      state.error = action.payload
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.isAuthenticated = false
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    },
    updateUser: (state, action) => {
      state.user = action.payload
      // Persist updated user to localStorage
      try {
        localStorage.setItem('user', JSON.stringify(action.payload))
      } catch (err) {
        // ignore
      }
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

export const {
  registerStart,
  registerSuccess,
  registerFailure,
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  clearError,
} = authSlice.actions

export default authSlice.reducer
