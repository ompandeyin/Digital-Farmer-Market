import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchStart, fetchSuccess, fetchFailure } from '../redux/slices/productSlice'
import { productService, auctionService } from '../services'
import ProductCard from '../components/ProductCard'
import AuctionCard from '../components/AuctionCard'
import { Leaf, IndianRupee, Truck, ArrowRight, Gavel, Clock } from 'lucide-react'

const Home = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [auctions, setAuctions] = useState([])
  const [isLoadingAuctions, setIsLoadingAuctions] = useState(false)
  const { products, isLoading } = useSelector((state) => state.products)

  useEffect(() => {
    // Fetch featured products
    const fetchFeaturedProducts = async () => {
      try {
        dispatch(fetchStart())
        const response = await productService.getFeaturedProducts()
        dispatch(
          fetchSuccess({
            products: response.data.data,
            pagination: { page: 1, pages: 1, total: response.data.data.length },
          })
        )
      } catch (error) {
        dispatch(fetchFailure(error.message))
      }
    }

    // Fetch live auctions
    const fetchLiveAuctions = async () => {
      try {
        setIsLoadingAuctions(true)
        const response = await auctionService.getAllAuctions({ status: 'live', limit: 4 })
        setAuctions(response.data.data)
      } catch (error) {
        console.error('Error fetching auctions:', error)
      } finally {
        setIsLoadingAuctions(false)
      }
    }

    fetchFeaturedProducts()
    fetchLiveAuctions()
  }, [dispatch])

  return (
    <main className="bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Fresh from <span className="text-green-600">Farm to Home</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Connect directly with local farmers. Buy fresh produce, participate in live auctions.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/products')}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
            >
              Browse Products
            </button>
            <button
              onClick={() => navigate('/auctions')}
              className="border-2 border-green-600 text-green-600 px-8 py-3 rounded-lg hover:bg-green-50 transition font-semibold"
            >
              View Auctions
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-12 border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-green-600">5000+</p>
              <p className="text-gray-600 mt-2">Active Farmers</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-green-600">50k+</p>
              <p className="text-gray-600 mt-2">Happy Customers</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-green-600">100k+</p>
              <p className="text-gray-600 mt-2">Products Sold</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
            <p className="text-gray-500 mt-1">Fresh picks from our farmers</p>
          </div>
          <button
            onClick={() => navigate('/products')}
            className="hidden md:flex items-center gap-2 text-green-600 font-medium hover:text-green-700 transition"
          >
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-6 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <p className="text-gray-500">No products available yet. Check back soon!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {products.slice(0, 4).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
            <div className="text-center md:hidden">
              <button
                onClick={() => navigate('/products')}
                className="border-2 border-green-600 text-green-600 px-8 py-2.5 rounded-xl hover:bg-green-50 transition font-medium"
              >
                View All Products →
              </button>
            </div>
          </>
        )}
      </section>

      {/* Live Auctions */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Live Auctions</h2>
                <p className="text-gray-500">Place your bids before time runs out!</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/auctions')}
              className="hidden md:flex items-center gap-2 text-green-600 font-medium hover:text-green-700 transition"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {isLoadingAuctions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-6 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : auctions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No active auctions at the moment</p>
              <p className="text-gray-400 text-sm mt-1">Check back soon for new listings!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {auctions.slice(0, 4).map((auction) => (
                  <AuctionCard key={auction._id} auction={auction} />
                ))}
              </div>
              <div className="text-center md:hidden">
                <button
                  onClick={() => navigate('/auctions')}
                  className="border-2 border-green-600 text-green-600 px-8 py-2.5 rounded-xl hover:bg-green-50 transition font-medium"
                >
                  View All Auctions →
                </button>
              </div>
            </>
          )}
        </div>
      </section>
      

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Why Farm2Home?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Fresh & Organic</h3>
            <p className="text-gray-600">Direct from farmers to your doorstep. No middlemen, no delays.</p>
          </div>
          <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <IndianRupee className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Best Prices</h3>
            <p className="text-gray-600">Live auctions ensure competitive pricing and fair value.</p>
          </div>
          <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Truck className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Fast Delivery</h3>
            <p className="text-gray-600">Quick and reliable shipping to your location.</p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Home
