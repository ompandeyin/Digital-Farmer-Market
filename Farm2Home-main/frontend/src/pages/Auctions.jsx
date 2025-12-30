import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { auctionService } from '../services'
import AuctionCard from '../components/AuctionCard'
import { socketService } from '../services/socketService'

const Auctions = () => {
  const [auctions, setAuctions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState('live')
  const token = useSelector((state) => state.auth.token)

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setIsLoading(true)
        let response
        if (filter === 'mine') {
          // protected endpoint - user must be authenticated
          // For 'My Auctions' we want all auctions by the farmer regardless of status
          response = await auctionService.getMyAuctions()
        } else {
          response = await auctionService.getAllAuctions({ status: filter })
        }
        setAuctions(response.data.data)
      } catch (error) {
        console.error('Error fetching auctions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAuctions()
  }, [filter])

  useEffect(() => {
    socketService.connect(token)

    const handleAuctionUpdated = (data) => {
      if (!data?.auctionId) return

      setAuctions((prev) =>
        prev.map((auction) =>
          auction._id === data.auctionId
            ? {
                ...auction,
                currentPrice: data.currentPrice,
                totalBids: data.totalBids,
                currentBidder: data.currentBidder,
                currentBidderName: data.currentBidderName,
                minBidIncrement: data.minBidIncrement,
                status: data.status
              }
            : auction
        )
      )
    }

    socketService.onAuctionUpdated(handleAuctionUpdated)

    return () => {
      socketService.off('auction_updated')
    }
  }, [token])

  const filters = [
    { value: 'live', label: 'Live Auctions' },
    { value: 'mine', label: 'My Auctions' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'ended', label: 'Ended' },
  ]

  return (
    <main className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Auctions</h1>
        <p className="text-gray-600">Place your bids and win fresh produce at great prices</p>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-4 mb-8">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              filter === f.value
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Auctions Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading auctions...</p>
        </div>
      ) : auctions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {auctions.map((auction) => (
            <AuctionCard key={auction._id} auction={auction} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No auctions found</p>
        </div>
      )}
    </main>
  )
}

export default Auctions
