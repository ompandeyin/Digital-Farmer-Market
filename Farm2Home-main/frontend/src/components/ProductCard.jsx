import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Star, Image as ImageIcon } from 'lucide-react'

const ProductCard = ({ product }) => {
  const [imageError, setImageError] = React.useState(false)
  
  const hasValidImage = product.image && product.image.startsWith('http') && !imageError
  
  const renderRating = (rating, count) => {
    if (typeof rating !== 'number' || isNaN(rating) || rating === 0) {
      return (
        <span className="text-xs text-gray-400">No reviews yet</span>
      );
    }
    return (
      <div className="flex items-center gap-1">
        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
        <span className="text-xs text-gray-400">({count})</span>
      </div>
    );
  }

  return (
    <Link to={`/products/${product._id}`}>
      <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-green-200 transition-all duration-300 cursor-pointer">
        {/* Product Image */}
        <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {hasValidImage ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
              <ImageIcon className="w-12 h-12 mb-2" />
              <span className="text-xs text-gray-400">No image</span>
            </div>
          )}
          {product.quantity <= 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm">Out of Stock</span>
            </div>
          )}
          <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm capitalize">
            {product.category}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1 group-hover:text-green-700 transition-colors">
            {product.name}
          </h3>

          <p className="text-xs text-gray-500 mb-2">{product.farmerName || 'Local Farmer'}</p>

          <div className="mb-3">
            {renderRating(product.ratings?.average, product.ratings?.count ?? 0)}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              <span className="text-xl font-bold text-green-600">₹{product.price}</span>
            </div>
            <button className="bg-green-600 text-white p-2 rounded-xl hover:bg-green-700 transition-all shadow-sm hover:shadow-md group-hover:scale-105">
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ProductCard
