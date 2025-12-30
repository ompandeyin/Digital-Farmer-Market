import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { auctionService, walletService } from '../services'
import { socketService } from '../services/socketService'
import { useSelector } from 'react-redux'
import { Radio, Clock, Trophy, Star } from 'lucide-react'

const AuctionDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [auction, setAuction] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [bidAmount, setBidAmount] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPlacingBid, setIsPlacingBid] = useState(false)
  const [displayTime, setDisplayTime] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const user = useSelector((state) => state.auth.user)
  const token = useSelector((state) => state.auth.token)
  const [wallet, setWallet] = useState({ balance: 0 })

  // Whether the current signed-in user is the auction creator
  const isOwner = React.useMemo(() => {
    if (!user || !auction) return false
    const farmerId = auction.farmer && (auction.farmer._id ? auction.farmer._id : auction.farmer)
    return farmerId && user._id && farmerId.toString() === user._id.toString()
  }, [user, auction])

  // Socket setup effect
  useEffect(() => {
    console.log('🔌 Ensuring socket connection and listeners for auction:', id);

    // Connect to socket for both authenticated users and guests
    const socket = socketService.connect(token)

    // Wait for socket to connect, then join auction with a fallback guest id
    const setupSocket = async () => {
      return new Promise((resolve) => {
        if (socket && socket.connected) {
          resolve();
        } else {
          socket?.once('connect', resolve);
        }
      });
    };

    setupSocket().then(() => {
      const joinId = user?._id || socket.id || `guest_${Date.now()}`
      console.log(`✅ Socket connected (id=${socket.id}), joining as`, joinId)
      socketService.joinAuction(id, joinId)
    });

    // Listener handlers
    const handleAuctionJoined = (data) => {
      console.log('✅ Joined auction:', data)
      if (data.auction) {
        setAuction((prev) => ({
          ...prev,
          currentPrice: data.auction.currentPrice,
          currentBidderName: data.auction.currentBidderName,
          totalBids: data.auction.totalBids,
          currentBidder: data.auction.currentBidder,
          minBidIncrement: data.auction.minBidIncrement,
          status: data.auction.status,
          startTime: data.auction.startTime,
          endTime: data.auction.endTime,
          participants: data.auction.participants
        }))
      }
    }
    const handleNewBid = (data) => {
      console.log('💰 New bid received in room:', data)
      setAuction((prev) => ({
        ...prev,
        currentPrice: data.currentPrice,
        currentBidder: data.currentBidder,
        currentBidderName: data.currentBidderName || data.bidderName,
        totalBids: data.totalBids,
        minBidIncrement: data.minBidIncrement || prev.minBidIncrement
      }))
    }
    const handleAuctionUpdated = (data) => {
      console.log('🔥 Global auction update received:', data)
      if (data?.auctionId === id) {
        setAuction((prev) => ({
          ...prev,
          currentPrice: data.currentPrice,
          currentBidder: data.currentBidder,
          currentBidderName: data.currentBidderName,
          totalBids: data.totalBids,
          minBidIncrement: data.minBidIncrement,
          status: data.status
        }))
      }
    }
    const handleBidRejected = (data) => {
      console.log('❌ Bid rejected:', data)
      setError(data.message || 'Bid was rejected')
    }

    const handleAuctionEnded = async (data) => {
      console.log('🏁 Auction ended:', data)
      // fetch fresh auction data (includes populated winner details)
      try {
        const res = await auctionService.getAuctionById(id)
        setAuction(res.data.data)
      } catch (err) {
        console.error('Failed to refresh auction after end:', err)
      }
    }

    socket?.on('auction_joined', handleAuctionJoined)
    socket?.on('new_bid', handleNewBid)
    socket?.on('auction_updated', handleAuctionUpdated)
    socket?.on('bid_rejected', handleBidRejected)
    socket?.on('auction_ended', handleAuctionEnded)

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up socket listeners')
      socket?.off('auction_joined', handleAuctionJoined)
      socket?.off('new_bid', handleNewBid)
      socket?.off('auction_updated', handleAuctionUpdated)
      socket?.off('bid_rejected', handleBidRejected)
      socket?.off('auction_ended', handleAuctionEnded)
    }
  }, [id, token, user?._id]);

  // Fetch auction data effect
  useEffect(() => {
    const fetchAuction = async () => {
      try {
        setIsLoading(true)
        const response = await auctionService.getAuctionById(id)
        setAuction(response.data.data)
      } catch (err) {
        setError('Failed to fetch auction details')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAuction()
    if (user) fetchWallet()
  }, [id, user])

  // Auto-clear error messages after 10s for better UX
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(''), 10000)
    return () => clearTimeout(t)
  }, [error])

  const fetchWallet = async () => {
    try {
      const res = await walletService.getWallet()
      setWallet(res.data.data.wallet || { balance: 0 })
    } catch (err) {
      console.error('Error fetching wallet (auction):', err)
    }
  }

  // Timer effect - update every second
  useEffect(() => {
    if (!auction) return

    const updateTimer = () => {
      const timeRemaining = new Date(auction.endTime) - new Date()
      
      if (timeRemaining <= 0) {
        setDisplayTime({ hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const hours = Math.floor(timeRemaining / (1000 * 60 * 60))
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000)

      setDisplayTime({ hours, minutes, seconds })
    }

    updateTimer() // Initial call
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [auction?.endTime])

  const handleBid = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!bidAmount || isNaN(bidAmount)) {
      setError('Please enter a valid bid amount')
      return
    }

    const minBid = auction.currentPrice + (auction.minBidIncrement || 10)
    if (parseFloat(bidAmount) < minBid) {
      setError('Please enter a higher bid amount')
      return
    }

    // Check wallet balance before placing bid
    const balance = wallet.balance || 0
    if (balance < parseFloat(bidAmount)) {
      setError(`Insufficient wallet balance. Available: ₹${balance}`)
      return
    }

    try {
      setError('')
      setSuccess('')
      setIsPlacingBid(true)

      // Place bid via API
      const response = await auctionService.placeBid(id, parseFloat(bidAmount))
      
      if (response.data.success) {
        setSuccess('Bid placed successfully!')
        setBidAmount('')
        
        // Clear success message after 10 seconds
        setTimeout(() => setSuccess(''), 10000)
        
        // Update local state with API response
        setAuction((prev) => ({
          ...prev,
          currentPrice: response.data.data.auction.currentPrice,
          currentBidderName: response.data.data.auction.currentBidderName,
          totalBids: response.data.data.auction.totalBids,
          currentBidder: response.data.data.auction.currentBidder,
          minBidIncrement: response.data.data.auction.minBidIncrement
        }))

        // After 500ms, fetch fresh data from server to ensure sync (server broadcasts updates)
        setTimeout(async () => {
          try {
            const freshResponse = await auctionService.getAuctionById(id)
            setAuction(freshResponse.data.data)
          } catch (err) {
            console.error('Failed to refresh auction data:', err)
          }
        }, 500)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place bid')
    } finally {
      setIsPlacingBid(false)
    }
  }

  const getStatusColor = () => {
    if (auction?.status === 'live') return 'bg-red-100 text-red-700'
    if (auction?.status === 'ended') return 'bg-gray-100 text-gray-700'
    return 'bg-green-100 text-green-700'
  }

  const handleEndAuction = async () => {
    if (!user) {
      setError('Please login as the auction owner to end this auction')
      return
    }

    if (!isOwner) {
      setError('Only auction owner can end this auction')
      return
    }

    if (!confirm('End this auction now? The current highest bidder (if any) will be declared the winner.')) return

    try {
      setIsPlacingBid(true)
      const res = await auctionService.endAuction(id)
      if (res.data.success) {
        setSuccess('Auction ended successfully')
        // update UI with returned auction
        setAuction(res.data.data)
        // clear success after a while
        setTimeout(() => setSuccess(''), 8000)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to end auction')
    } finally {
      setIsPlacingBid(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 text-lg">Loading auction details...</p>
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 text-lg">Auction not found</p>
      </div>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/auctions')}
        className="mb-6 text-green-600 hover:text-green-700 font-semibold flex items-center gap-2"
      >
        ← Back to Auctions
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Image */}
        <div className="lg:col-span-1">
          <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4">
            <img
              src={auction.productImage || 'https://via.placeholder.com/400'}
              alt={auction.productName}
              className="w-full h-96 object-cover"
            />
            <div className={`absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1.5 ${getStatusColor()}`}>
              {auction.status === 'live' && <Radio className="w-4 h-4 animate-pulse" />}
              {auction.status === 'live' ? 'LIVE' : auction.status.toUpperCase()}
            </div>
          </div>

          {/* Farmer Info Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-2">Seller Information</h3>
            <p className="text-gray-700 font-semibold">{auction.farmerName || 'Farmer'}</p>
            {auction.farmer && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                Rating: <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {auction.farmer.ratings?.average || 'N/A'} ({auction.farmer.ratings?.count || 0} reviews)
              </p>
            )}
          </div>
        </div>

        {/* Right: Details & Bidding */}
        <div className="lg:col-span-2">
          {/* Product Info */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{auction.productName}</h1>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-gray-600 mb-2"><strong>Category:</strong> {auction.category || 'N/A'}</p>
              <p className="text-gray-600 mb-2"><strong>Total Quantity:</strong> {auction.quantity} {auction.unit || 'units'}</p>
              <p className="text-gray-600"><strong>Description:</strong> {auction.description}</p>
              <p className="text-green-700 text-sm mt-2 font-medium">Bid is for the entire quantity ({auction.quantity} {auction.unit}), not per unit.</p>
            </div>
          </div>

          {/* Auction Info */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Starting Price (Total)</p>
              <p className="text-3xl font-bold text-gray-900">₹{auction.startingPrice}</p>
              <p className="text-xs text-gray-400">for {auction.quantity} {auction.unit}</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Current Highest Bid (Total)</p>
              <p className="text-3xl font-bold text-green-600">₹{auction.currentPrice}</p>
              <p className="text-xs text-gray-400">for {auction.quantity} {auction.unit}</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Total Bids</p>
              <p className="text-3xl font-bold text-purple-600">{auction.totalBids || 0}</p>
            </div>

           
          </div>

          {/* Timer */}
          <div className={`rounded-lg p-6 mb-8 text-white font-bold text-center ${
            auction.status === 'live' ? 'bg-red-600' : 'bg-gray-400'
          }`}>
            <p className="text-sm mb-2">Time Remaining</p>
            {auction.status === 'live' ? (
              <p className="text-4xl">
                {displayTime.hours}h {displayTime.minutes}m {displayTime.seconds}s
              </p>
            ) : (
              <p className="text-2xl">Auction {auction.status}</p>
            )}

            {/* End Auction (owner only) */}
            {isOwner && auction.status === 'live' && (
              <div className="mt-4">
                <button
                  onClick={handleEndAuction}
                  disabled={isPlacingBid}
                  className={`px-4 py-2 rounded-lg font-semibold text-white ${isPlacingBid ? 'bg-gray-400' : 'bg-red-700 hover:bg-red-800'}`}
                >
                  {isPlacingBid ? 'Processing...' : 'End Auction Now'}
                </button>
              </div>
            )}
          </div>

          {/* Bidding Section */}
          {auction.status === 'live' && (
            <div className="bg-white border-2 border-green-600 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Place Your Bid</h2>
              
              {/* Error Alert */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                  {error}
                </div>
              )}

              {/* Success Alert */}
              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                  {success}
                </div>
              )}

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Bid for Total Quantity (Min: ₹{auction.currentPrice + (auction.minBidIncrement || 10)})
                  </label>
                  <div className="text-sm text-gray-600">Wallet: <span className="font-semibold">₹{(wallet.balance || 0).toFixed(2)}</span></div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`Enter bid for all ${auction.quantity} ${auction.unit}`}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  />
                  <button
                    onClick={handleBid}
                    disabled={!user || isPlacingBid || isOwner || (wallet.balance || 0) < (auction.currentPrice + (auction.minBidIncrement || 10))}
                    className={`px-6 py-3 rounded-lg font-bold text-white transition ${
                      user && !isPlacingBid && !isOwner && (wallet.balance || 0) >= (auction.currentPrice + (auction.minBidIncrement || 10))
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isPlacingBid ? 'Placing Bid...' : !user ? 'Login to Bid' : isOwner ? 'Owner (cannot bid)' : 'Place Bid'}
                  </button>
                </div>

                {(wallet.balance || 0) < (auction.currentPrice + (auction.minBidIncrement || 10)) && (
                  <p className="text-sm text-red-500 mt-2">Insufficient wallet balance to place minimum bid. <a href="/dashboard" className="text-blue-600 underline">Request more funds</a></p>
                )}

                {isOwner && (
                  <p className="text-sm text-red-600 mt-2">You are the seller — you cannot place bids on your own auction.</p>
                )}
              </div>

              {!user && (
                <p className="text-sm text-gray-600">
                  Please <a href="/login" className="text-green-600 font-semibold hover:underline">login</a> to place a bid
                </p>
              )}
            </div>
          )}

          {auction.status !== 'live' && (
            <div className="bg-gray-100 rounded-lg p-6 mb-8 text-center">
              <p className="text-xl font-bold text-gray-700">
                This auction has {auction.status === 'ended' ? 'ended' : 'not started yet'}
              </p>
            </div>
          )}

          {/* Current Bidder / Winner Info */}
          {auction.status === 'ended' && auction.winner ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 font-semibold">🏆 <strong>Winner:</strong> {auction.winner.fullName || auction.currentBidderName || 'Anonymous'}</p>
              {/* Show winner contact details to auction creator */}
              {user && auction.farmer && ((auction.farmer._id || auction.farmer) === user._id) && auction.winner && (
                <div className="mt-2 text-sm text-gray-700">
                  <p><strong>Winner contact:</strong></p>
                  {auction.winner.email && <p>Email: <a href={`mailto:${auction.winner.email}`} className="text-blue-600 underline">{auction.winner.email}</a></p>}
                  {auction.winner.phone && <p>Phone: <a href={`tel:${auction.winner.phone}`} className="text-blue-600 underline">{auction.winner.phone}</a></p>}
                </div>
              )}
            </div>
          ) : (
            auction.currentBidder && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <strong>Current Highest Bidder:</strong> {auction.currentBidderName || 'Anonymous'}
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </main>
  )
}

export default AuctionDetail
