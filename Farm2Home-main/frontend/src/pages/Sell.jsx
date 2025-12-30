import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { auctionService } from '../services'
import ImageUpload from '../components/ImageUpload'
import { Camera, Clock, IndianRupee } from 'lucide-react'

const CreateAuction = () => {
  const navigate = useNavigate()
  const { user, token } = useSelector((state) => state.auth)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    category: '',
    quantity: '',
    unit: 'kg',
    productImage: '',
    startingPrice: '',
    minBidIncrement: '10',
    startTime: '',
    endTime: ''
  })

  const categories = ['Vegetables', 'Fruits', 'Grains', 'Greens', 'Dairy', 'Other']
  const units = ['kg', 'liter', 'bunch', 'piece', 'box', 'dozen']

  // Redirect if not authenticated or not a farmer
  if (!user || user.role !== 'farmer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <div className="text-5xl mb-4">🚜</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Farmer Access Required</h1>
          <p className="text-gray-600 mb-6">Only registered farmers can create auctions on Farm2Home.</p>
          <button
            onClick={() => navigate('/signup')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Register as Farmer
          </button>
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
    console.log('Image selected:', imageFile)
    setFormData((prev) => ({
      ...prev,
      productImage: imageFile
    }))
  }

  const validateForm = () => {
    const newErrors = []

    console.log('Form data at validation:', formData)
    console.log('Product image type:', typeof formData.productImage)
    console.log('Is File?:', formData.productImage instanceof File)

    if (!formData.productName.trim()) newErrors.push('Product name is required')
    if (!formData.description.trim()) newErrors.push('Description is required')
    if (!formData.category) newErrors.push('Category is required')
    if (!formData.quantity || parseFloat(formData.quantity) <= 0)
      newErrors.push('Valid quantity is required')
    if (!(formData.productImage instanceof File)) newErrors.push('Product image is required')
    if (!formData.startingPrice || parseFloat(formData.startingPrice) <= 0)
      newErrors.push('Valid starting price is required')
    if (!formData.minBidIncrement || parseFloat(formData.minBidIncrement) <= 0)
      newErrors.push('Valid minimum bid increment is required')
    if (!formData.startTime) newErrors.push('Start time is required')
    if (!formData.endTime) newErrors.push('End time is required')

    const startTime = new Date(formData.startTime)
    const endTime = new Date(formData.endTime)
    const now = new Date()

    if (startTime < now) {
      newErrors.push('Start time must be in the future')
    }

    if (endTime <= startTime) {
      newErrors.push('End time must be after start time')
    }

    const minDuration = 1 * 60 * 60 * 1000
    if (endTime - startTime < minDuration) {
      newErrors.push('Auction must last at least 1 hour')
    }

    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const errors = validateForm()
    if (errors.length > 0) {
      setError(errors.join(', '))
      return
    }

    setIsLoading(true)

    try {
      // Create FormData to handle file upload
      const formDataToSend = new FormData()
      formDataToSend.append('productName', formData.productName)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('category', formData.category)
      formDataToSend.append('quantity', parseFloat(formData.quantity))
      formDataToSend.append('unit', formData.unit)
      formDataToSend.append('startingPrice', parseFloat(formData.startingPrice))
      formDataToSend.append('currentPrice', parseFloat(formData.startingPrice))
      formDataToSend.append('minBidIncrement', parseFloat(formData.minBidIncrement))
      formDataToSend.append('startTime', new Date(formData.startTime))
      formDataToSend.append('endTime', new Date(formData.endTime))
      formDataToSend.append('status', 'scheduled')
      formDataToSend.append('farmerName', user.fullName)
      
      // Append image file
      if (formData.productImage instanceof File) {
        formDataToSend.append('productImage', formData.productImage)
        console.log('File appended to FormData:', formData.productImage.name)
      }

      console.log('Submitting FormData...')
      const response = await auctionService.createAuction(formDataToSend)

      setSuccess('Auction created successfully! Redirecting...')
      setFormData({
        productName: '',
        description: '',
        category: '',
        quantity: '',
        unit: 'kg',
        productImage: '',
        startingPrice: '',
        minBidIncrement: '10',
        startTime: '',
        endTime: ''
      })

      setTimeout(() => {
        navigate('/auctions')
      }, 2000)
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create auction. Please try again.'
      setError(errorMessage)
      console.error('Full error response:', err.response?.data)
      console.error('Error creating auction:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center">
              <span className="text-3xl">🔨</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Live Auction</h1>
              <p className="text-gray-600">List your farm products for live bidding</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          {/* Error will be shown above the submit button for better UX */}
          {/* Error is rendered further down, near the submit button */}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                placeholder="e.g., Fresh Organic Tomatoes"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your product in detail"
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.description.length}/1000 characters</p>
            </div>

            <ImageUpload onImageSelect={handleImageSelect} maxSize={10485760} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Unit *</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Quantity ({formData.unit}) *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                onWheel={(e) => e.target.blur()}
                placeholder="e.g., 100"
                min="1"
                step="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Total quantity you are auctioning</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Starting Price for Total Quantity (₹) *
                </label>
                <input
                  type="number"
                  name="startingPrice"
                  value={formData.startingPrice}
                  onChange={handleChange}
                  onWheel={(e) => e.target.blur()}
                  placeholder="e.g., 5000"
                  min="1"
                  step="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Price for all {formData.quantity || '0'} {formData.unit} (not per {formData.unit})
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Minimum Bid Increment (₹) *
                </label>
                <input
                  type="number"
                  name="minBidIncrement"
                  value={formData.minBidIncrement}
                  onChange={handleChange}
                  onWheel={(e) => e.target.blur()}
                  placeholder="e.g., 10"
                  min="1"
                  step="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Auction Start Time *
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">When should the auction start?</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Auction End Time *
                </label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum auction duration: 1 hour</p>
              </div>
            </div>

            {/* Error block moved here (above submit) */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Auction...' : 'Create Auction'}
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Set competitive starting prices and reasonable bid increments to
                attract more bidders. Auctions with better images get higher engagement!
              </p>
            </div>
          </form>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Camera className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Quality Images</h3>
            <p className="text-sm text-gray-600">Upload clear product images to attract serious bidders.</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Timing Matters</h3>
            <p className="text-sm text-gray-600">Set auction duration strategically for maximum participation.</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <IndianRupee className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Fair Pricing</h3>
            <p className="text-sm text-gray-600">Start with competitive prices for better bidding activity.</p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default CreateAuction
