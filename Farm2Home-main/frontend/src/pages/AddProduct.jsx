import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { productService } from '../services'
import ImageUpload from '../components/ImageUpload'
import { Lock, CheckCircle, Package } from 'lucide-react'

const AddProduct = () => {
  const navigate = useNavigate()
  const { user, token } = useSelector((state) => state.auth)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    quantity: '',
    unit: 'kg',
    image: '',
    harvest_date: ''
  })

  const categories = ['Vegetables', 'Fruits', 'Grains', 'Greens', 'Dairy', 'Other']
  const units = ['kg', 'liter', 'bunch', 'piece', 'box', 'dozen']

  // Require authentication; allow any authenticated user to add products
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Please sign in</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to add a product.</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition font-medium"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="text-gray-700 px-6 py-2 rounded-xl border hover:bg-gray-50 transition font-medium"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))

    if (error) setError('')
  }

  const handleImageSelect = (imageFile) => {
    setFormData((prev) => ({
      ...prev,
      image: imageFile
    }))
  }

  const validateForm = () => {
    const newErrors = []

    if (!formData.name.trim()) newErrors.push('Product name is required')
    if (!formData.description.trim()) newErrors.push('Description is required')
    if (!formData.category) newErrors.push('Category is required')
    if (!formData.price || parseFloat(formData.price) <= 0)
      newErrors.push('Valid price is required')
    if (!formData.quantity || parseFloat(formData.quantity) <= 0)
      newErrors.push('Valid quantity is required')
    if (!(formData.image instanceof File)) newErrors.push('Product image is required')
    if (!formData.harvest_date) newErrors.push('Harvest date is required')

    const harvestDate = new Date(formData.harvest_date)
    harvestDate.setHours(0, 0, 0, 0)
    const now = new Date()
    now.setHours(23, 59, 59, 999)

    if (harvestDate > now) {
      newErrors.push('Harvest date cannot be in the future')
    }

    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateForm()

    if (newErrors.length > 0) {
      setError(newErrors.join(', '))
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('category', formData.category)
      formDataToSend.append('price', parseFloat(formData.price))
      formDataToSend.append('quantity', parseFloat(formData.quantity))
      formDataToSend.append('unit', formData.unit)
      formDataToSend.append('harvest_date', formData.harvest_date)
      formDataToSend.append('image', formData.image)

      const response = await productService.createProduct(formDataToSend)

      setSuccess('Product added successfully!')
      setTimeout(() => {
        navigate('/products')
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to add product. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Add Product for Sale</h1>
          <p className="text-gray-600">Share your fresh produce with customers</p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Fresh Tomatoes"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your product - quality, taste, special features, etc."
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Price and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  onWheel={(e) => e.target.blur()}
                  placeholder="0"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Unit *
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  required
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantity Available *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                onWheel={(e) => e.target.blur()}
                placeholder="0"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                required
              />
            </div>

            {/* Harvest Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Harvest Date *
              </label>
              <input
                type="date"
                name="harvest_date"
                value={formData.harvest_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                required
              />
            </div>

            {/* Image Upload */}
            <div>
              
              <ImageUpload onImageSelect={handleImageSelect} />
              {formData.image instanceof File && (
                <p className="mt-2 text-sm text-green-600"> Image selected: {formData.image.name}</p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Adding Product...' : 'Add Product'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}

export default AddProduct
