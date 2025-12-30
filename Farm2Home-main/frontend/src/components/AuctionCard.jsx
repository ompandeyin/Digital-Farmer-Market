import React from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Clock, CheckCircle, Radio } from 'lucide-react'

const AuctionCard = ({ auction }) => {
  const user = useSelector((state) => state.auth.user)
  const farmerId = auction.farmer && (auction.farmer._id ? auction.farmer._id : auction.farmer)
  const isOwner = user && farmerId && user._id && farmerId.toString() === user._id.toString()

  const timeRemaining = new Date(auction.endTime) - new Date()
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60))
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))

  const getStatusColor = () => {
    if (auction.status === 'live') return 'bg-red-100 text-red-700'
    if (auction.status === 'ended') return 'bg-gray-100 text-gray-700'
    return 'bg-green-100 text-green-700'
  }

  return (
    <Link to={`/auctions/${auction._id}`}>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        {/* Image */}
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          <img
            src={auction.productImage || 'https://via.placeholder.com/400'}
            alt={auction.productName}
            className="w-full h-full object-cover"
          />
          <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${getStatusColor()}`}>
            {auction.status === 'live' && <Radio className="w-3 h-3 animate-pulse" />}
            {auction.status === 'live' ? 'LIVE' : auction.status.toUpperCase()}
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-bold text-gray-800 line-clamp-2 mb-2">{auction.productName}</h3>

          <div className="flex items-center gap-3 mb-3">
            <p className="text-xs text-gray-500">{auction.farmerName}</p>
            {isOwner && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">My Auction</span>
            )}
          </div>

          {/* Pricing */}
          <div className="mb-3">
            <p className="text-xs text-gray-500">Current Bid (for {auction.quantity} {auction.unit})</p>
            <p className="text-2xl font-bold text-green-600">₹{auction.currentPrice}</p>
          </div>

          {/* Time */}
          <div className="mb-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
            {auction.status === 'ended' ? (
              <p className="text-xs text-gray-600 font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-600" /> Auction Ended
              </p>
            ) : auction.status === 'scheduled' ? (
              <p className="text-xs text-gray-600 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Starts in {hoursRemaining > 0 ? `${hoursRemaining}h ${minutesRemaining}m` : `${minutesRemaining}m`}
              </p>
            ) : (
              <p className="text-xs text-gray-600 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-red-500" />
                Ends in {hoursRemaining > 0 ? `${hoursRemaining}h ${minutesRemaining}m` : minutesRemaining > 0 ? `${minutesRemaining}m` : 'Less than 1m'}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-between text-xs text-gray-600">
            <span>Bids: {auction.totalBids}</span>
            <span>Qty: {auction.quantity} {auction.unit}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default AuctionCard
