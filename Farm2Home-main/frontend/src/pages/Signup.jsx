import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loginSuccess, loginStart, loginFailure } from '../redux/slices/authSlice'
import { authService } from '../services'
import { Sprout } from 'lucide-react'

const Signup = () => {
  const [role, setRole] = useState('consumer')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    state: '',
    city: '',
    street: '',
    zipCode: ''
  })
  const [errors, setErrors] = useState({})
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading, error } = useSelector((state) => state.auth)

  const states = ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Uttar Pradesh', 'Punjab', 'Haryana']
  const cities = {
    Delhi: ['New Delhi', 'Noida', 'Gurgaon'],
    Maharashtra: ['Mumbai', 'Pune', 'Nagpur'],
    Karnataka: ['Bangalore', 'Mangalore', 'Mysore'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
    'West Bengal': ['Kolkata', 'Howrah', 'Darjeeling'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi'],
    Punjab: ['Chandigarh', 'Amritsar', 'Ludhiana'],
    Haryana: ['Gurgaon', 'Faridabad', 'Hisar']
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.state) {
      newErrors.state = 'State is required'
    }

    if (!formData.city) {
      newErrors.city = 'City is required'
    }

    if (!formData.street.trim()) {
      newErrors.street = 'Street address is required'
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required'
    }

    return newErrors
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleStateChange = (e) => {
    const newState = e.target.value
    setFormData((prev) => ({
      ...prev,
      state: newState,
      city: '' // Reset city when state changes
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateForm()

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      dispatch(loginStart())
      const response = await authService.register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: role,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pincode: formData.zipCode
        }
      })

      dispatch(
        loginSuccess({
          user: response.data.data.user,
          token: response.data.data.token,
          refreshToken: response.data.data.refreshToken
        })
      )
      navigate('/')
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed'
      dispatch(loginFailure(errorMessage))
      setErrors({ submit: errorMessage })
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join Farm2Home</h1>
          <p className="text-gray-500 text-sm mt-2">Create your account and start your journey</p>
        </div>

        {/* Role Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setRole('consumer')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              role === 'consumer'
                ? 'bg-green-100 text-green-700 border-2 border-green-500'
                : 'bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Consumer
          </button>
          <button
            onClick={() => setRole('farmer')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              role === 'farmer'
                ? 'bg-green-100 text-green-700 border-2 border-green-500'
                : 'bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Farmer
          </button>
        </div>

        {/* Error Alert */}
        {/* Error Alert moved below fields and above submit for better UX */}
        {/* Error rendered near submit */}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
          </div>

          {/* Email and Phone - Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 9876543210"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* Password and Confirm - Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>

          {/* State and City - Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleStateChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.state ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select state</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                disabled={!formData.state}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.city ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select city</option>
                {formData.state && cities[formData.state]?.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>
          </div>

          {/* Street Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <input
              type="text"
              name="street"
              value={formData.street}
              onChange={handleChange}
              placeholder="123 Farm Road"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.street ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
          </div>

          {/* ZIP Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              placeholder="110001"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.zipCode ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>}
          </div>

          {/* Error Alert (shown above submit for better UX) */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {errors.submit}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-gray-600 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-green-600 font-semibold hover:text-green-700">
            Login
          </Link>
        </p>
      </div>
    </main>
  )
}

export default Signup
