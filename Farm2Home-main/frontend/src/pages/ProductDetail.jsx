import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { productService, cartService } from '../services'
import ProductCard from '../components/ProductCard'
import { ShoppingCart, Minus, Plus, Star } from 'lucide-react'

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  
  const [product, setProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [farmerProducts, setFarmerProducts] = useState([])
  const [loadingFarmerProducts, setLoadingFarmerProducts] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartSuccess, setCartSuccess] = useState('')

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true)
        setError('')
        console.log('Fetching product with ID:', id)
        const response = await productService.getProductById(id)
        console.log('Product response:', response)
        setProduct(response.data.data)
      } catch (err) {
        console.error('Error fetching product:', err)
        setError(err.response?.data?.message || err.message || 'Failed to load product')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchProduct()
    }
  }, [id])

  // Fetch farmer's other products
  useEffect(() => {
    const fetchFarmerProducts = async () => {
      if (!product?.farmer?._id) return

      try {
        setLoadingFarmerProducts(true)
        const response = await productService.getProductsByFarmer(product.farmer._id, { limit: 6 })
        // Filter out current product
        const filtered = response.data.data.filter(p => p._id !== id)
        setFarmerProducts(filtered)
      } catch (err) {
        console.error('Error fetching farmer products:', err)
        setFarmerProducts([])
      } finally {
        setLoadingFarmerProducts(false)
      }
    }

    fetchFarmerProducts()
  }, [product, id])

  const handleAddToCart = async () => {
    if (!user) {
      alert('Please login to add products to cart')
      navigate('/login')
      return
    }

    setAddingToCart(true)
    setCartSuccess('')
    try {
      await cartService.addToCart({
        productId: product._id,
        quantity: quantity
      })
      setCartSuccess(`Added ${quantity} ${product.unit}(s) to cart!`)
      setQuantity(1)
      setTimeout(() => setCartSuccess(''), 3000)
    } catch (err) {
      alert('Failed to add to cart: ' + (err.response?.data?.message || err.message))
    } finally {
      setAddingToCart(false)
    }
  }

  const renderRating = (rating) => {
    if (typeof rating !== 'number' || isNaN(rating)) return 'No rating'
    return '⭐'.repeat(Math.floor(rating)) + (rating % 1 ? '⭐' : '')
  }

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-gray-500">Loading product details...</p>
        </div>
      </main>
    )
  }

  if (error || !product) {
    return (
      <main className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Product not found'}</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Back to Products
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-12">
      {/* Back Button */}
      <button
        onClick={() => navigate('/products')}
        className="mb-6 text-green-600 hover:text-green-700 font-semibold flex items-center gap-2"
      >
        ← Back to Products
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="flex items-center justify-center bg-gray-100 rounded-lg p-8">
          <img
            src={product.image && product.image.startsWith('http') ? product.image : 'https://placehold.co/500x500?text=No+Image'}
            alt={product.name}
            className="w-full h-auto max-h-96 object-contain rounded-lg"
            onError={e => { e.target.onerror = null; e.target.src = 'https://placehold.co/500x500?text=No+Image'; }}
          />
        </div>

        {/* Product Details */}
        <div>
          {/* Category Badge */}
          <div className="inline-block bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold mb-4">
            {product.category}
          </div>

          {/* Product Name */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-2xl">{renderRating(product.ratings?.average)}</span>
            <span className="text-gray-600">({product.ratings?.count ?? 0} reviews)</span>
          </div>

          {/* Price */}
          <div className="mb-6">
            <p className="text-5xl font-bold text-green-600">₹{product.price.toFixed(2)}/ {product.unit}</p>
          </div>

          {/* Stock Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-gray-700">
              <span className="font-semibold">{product.quantity}</span> {product.unit}(s) available
            </p>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Description</h3>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </div>

          {/* Farmer Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Farmer Information</h3>
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-semibold">Farmer:</span> {product.farmerName}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Location:</span> {product.farmerLocation}
              </p>
              {product.harvest_date && (
                <p className="text-gray-700">
                  <span className="font-semibold">Harvest Date:</span> {new Date(product.harvest_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Certifications */}
          {product.certifications && product.certifications.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Certifications</h3>
              <div className="flex flex-wrap gap-3">
                {product.certifications.map((cert) => (
                  <span key={cert} className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                    ✓ {cert}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector and Add to Cart */}
          <div className="border-t pt-6">
            {cartSuccess && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
                {cartSuccess}
              </div>
            )}
            
            {product.quantity <= 0 ? (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg font-medium">
                Out of Stock
              </div>
            ) : (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <label className="font-semibold text-gray-700">Quantity:</label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 hover:bg-gray-100 transition"
                    disabled={addingToCart || quantity <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1
                      setQuantity(Math.min(Math.max(1, val), product.quantity))
                    }}
                    className="w-16 text-center border-l border-r border-gray-300 py-2 focus:outline-none"
                    min="1"
                    max={product.quantity}
                    disabled={addingToCart}
                  />
                  <button
                    onClick={() => setQuantity(Math.min(quantity + 1, product.quantity))}
                    className="px-3 py-2 hover:bg-gray-100 transition"
                    disabled={addingToCart || quantity >= product.quantity}
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-gray-500">(max: {product.quantity})</span>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={addingToCart || !user || product.quantity <= 0}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      <div className="mt-16 pt-12 border-t">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Other Products from {product.farmerName}</h2>
        
        {loadingFarmerProducts ? (
          <p className="text-gray-600">Loading products...</p>
        ) : farmerProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {farmerProducts.map((prod) => (
              <ProductCard key={prod._id} product={prod} />
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No other products from this farmer yet.</p>
        )}
      </div>
    </main>
  )
}

export default ProductDetail
