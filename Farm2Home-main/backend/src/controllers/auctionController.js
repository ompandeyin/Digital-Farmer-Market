import Auction from '../models/Auction.js'
import Bid from '../models/Bid.js'
import User from '../models/User.js'
import Notification from '../models/Notification.js'
import cloudinary from '../config/cloudinary.js'
import { Readable } from 'stream'
import { settleAuctionEnd } from '../services/escrowService.js'

// Create auction with image upload
export const createAuction = async (req, res) => {
  try {
    const {  productName, description, category, quantity, unit, startingPrice, minBidIncrement, startTime, endTime, status, farmerName } = req.body
    
    
    const farmerId = req.user._id

    // Ensure only farmers can create auctions (defense-in-depth)
    if (!req.user || req.user.role !== 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Only farmers can create auctions'
      })
    }

    // Validate required fields
    if (!productName || !description || !category || !quantity || !startingPrice || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      })
    }

    let productImage = null

    // Handle image upload if file is provided
    if (req.file) {
      try {
        // Convert buffer to stream
        const stream = Readable.from(req.file.buffer)

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'farm2home/auctions',
              resource_type: 'auto',
              quality: 'auto',
              fetch_format: 'auto'
            },
            (error, result) => {
              if (error) {
                reject(error)
              } else {
                resolve(result)
              }
            }
          )

          stream.pipe(uploadStream)
        })

        productImage = result.secure_url
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError)
        return res.status(500).json({
          success: false,
          message: 'Image upload failed: ' + uploadError.message
        })
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Product image is required'
      })
    }

    // Create auction document
    const auction = await Auction.create({
      productName,
      description,
      category,
      quantity: parseFloat(quantity),
      unit,
      productImage,
      startingPrice: parseFloat(startingPrice),
      currentPrice: parseFloat(startingPrice),
      minBidIncrement: parseFloat(minBidIncrement) || 10,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: status || 'scheduled',
      farmerName,
      farmer: farmerId
    })

    res.status(201).json({
      success: true,
      message: 'Auction created successfully',
      data: auction
    })
  } catch (error) {
    console.error('Error creating auction:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create auction'
    })
  }
}

// Helper function to update auction statuses based on time
const updateAuctionStatuses = async () => {
  try {
    const now = new Date()

    // Update scheduled auctions to live if start time has passed
    await Auction.updateMany(
      {
        status: 'scheduled',
        startTime: { $lte: now }
      },
      {
        status: 'live',
        isLive: true
      }
    )

    // Update live auctions to ended if end time has passed
    await Auction.updateMany(
      {
        status: 'live',
        endTime: { $lte: now }
      },
      {
        status: 'ended',
        isLive: false
      }
    )
  } catch (error) {
    console.error('Error updating auction statuses:', error)
  }
}

// Get all auctions
export const getAllAuctions = async (req, res) => {
  try {
    // Update statuses before fetching
    await updateAuctionStatuses()

    const { status, page = 1, limit = 10 } = req.query

    const query = {}
    if (status) {
      query.status = status
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const auctions = await Auction.find(query)
      .populate('farmer', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Auction.countDocuments(query)

    res.status(200).json({
      success: true,
      data: auctions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch auctions'
    })
  }
}

// Get live auctions
export const getLiveAuctions = async (req, res) => {
  try {
    // Update statuses before fetching
    await updateAuctionStatuses()

    const { page = 1, limit = 10 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const auctions = await Auction.find({ status: 'live' })
      .populate('farmer', 'fullName')
      .sort({ endTime: 1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Auction.countDocuments({ status: 'live' })

    res.status(200).json({
      success: true,
      data: auctions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch live auctions'
    })
  }
}

// Get auction by ID
export const getAuctionById = async (req, res) => {
  try {
    // Update statuses before fetching
    await updateAuctionStatuses()

    const auction = await Auction.findById(req.params.id)
      .populate('farmer', 'fullName')
      .populate('bids')
      .populate('winner', 'fullName email phone')

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      })
    }

    res.status(200).json({
      success: true,
      data: auction
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch auction'
    })
  }
}

// Update auction
export const updateAuction = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    // Check if auction belongs to farmer
    const auction = await Auction.findById(id)
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      })
    }

    if (auction.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this auction'
      })
    }

    // Handle image update if new file is provided
    if (req.file) {
      try {
        const stream = Readable.from(req.file.buffer)

        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'farm2home/auctions',
              resource_type: 'auto',
              quality: 'auto',
              fetch_format: 'auto'
            },
            (error, result) => {
              if (error) {reject(error)}
              else {resolve(result)}
            }
          )

          stream.pipe(uploadStream)
        })

        updates.productImage = result.secure_url
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError)
        return res.status(500).json({
          success: false,
          message: 'Image upload failed'
        })
      }
    }

    const updatedAuction = await Auction.findByIdAndUpdate(id, updates, { new: true, runValidators: true })

    res.status(200).json({
      success: true,
      message: 'Auction updated successfully',
      data: updatedAuction
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update auction'
    })
  }
}

// Delete auction
export const deleteAuction = async (req, res) => {
  try {
    const { id } = req.params

    const auction = await Auction.findById(id)
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      })
    }

    if (auction.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this auction'
      })
    }

    await Auction.findByIdAndDelete(id)

    res.status(200).json({
      success: true,
      message: 'Auction deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete auction'
    })
  }
}

// End auction
export const endAuction = async (req, res) => {
  try {
    const { id } = req.params

    const auction = await Auction.findById(id)
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      })
    }

    // Ensure only the auction owner (farmer) can end it
    if (!req.user || auction.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the auction owner can end this auction'
      })
    }

    if (auction.status === 'ended') {
      return res.status(400).json({
        success: false,
        message: 'Auction is already ended'
      })
    }

    auction.status = 'ended'
    // Set winner fields if there was a current bidder
    if (auction.currentBidder) {
      auction.winner = auction.currentBidder
      auction.winningBidAmount = auction.currentPrice
      auction.winningTime = new Date()
    }
    auction.isLive = false
    await auction.save()

    // ESCROW SETTLEMENT: Deduct from winner, credit escrow, create order
    let settlementResult = null
    if (auction.winner) {
      try {
        settlementResult = await settleAuctionEnd(id)
        console.log('✅ Escrow settlement completed:', settlementResult.message)
      } catch (escrowError) {
        console.error('⚠️ Escrow settlement failed:', escrowError.message)
        // Continue - the auction is ended, but settlement failed
        // This can be retried via admin panel
      }
    }

    // Notify winner and broadcast to sockets
    try {
      if (auction.currentBidder && global.io) {
        const winner = await User.findById(auction.currentBidder)
        if (winner) {
          // Only send auction_won notification if escrow didn't already send one
          if (!settlementResult) {
            await Notification.create({
              recipient: auction.currentBidder,
              type: 'auction_won',
              title: 'Auction Won!',
              message: `You've won the auction for ${auction.productName}`,
              relatedEntity: { entityType: 'auction', entityId: id }
            })
          }

          // Emit to winner's personal room
          if (global.io) {
            global.io.to(`user_${auction.currentBidder}`).emit('auction_won', {
              auction: auction,
              message: `Congratulations! You won with a bid of ₹${auction.currentPrice}`,
              order: settlementResult?.data?.order || null
            })
          }
        }
      }

      // Broadcast to auction room and global listeners
      if (global.io) {
        const roomId = `auction_${id}`
        global.io.to(roomId).emit('auction_ended', {
          auction: auction,
          winner: auction.currentBidderName,
          finalPrice: auction.currentPrice,
          order: settlementResult?.data?.order || null
        })

        global.io.emit('auction_updated', {
          auctionId: id,
          currentPrice: auction.currentPrice,
          totalBids: auction.totalBids,
          currentBidder: auction.currentBidder,
          currentBidderName: auction.currentBidderName,
          minBidIncrement: auction.minBidIncrement,
          status: auction.status,
          settlementStatus: auction.settlementStatus,
          timestamp: new Date()
        })
      }
    } catch (err) {
      console.error('Socket/notification error (endAuction):', err)
    }

    // Reload auction to get updated settlement info
    const updatedAuction = await Auction.findById(id).populate('orderId')

    res.status(200).json({
      success: true,
      message: settlementResult 
        ? 'Auction ended and settled successfully' 
        : 'Auction ended successfully',
      data: updatedAuction,
      settlement: settlementResult?.data || null
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to end auction'
    })
  }
}

// Get auctions created by current user (optionally filter by status)
export const getMyAuctions = async (req, res) => {
  try {
    await updateAuctionStatuses()

    const { status } = req.query
    const query = { farmer: req.user._id }
    if (status) { query.status = status }

    const auctions = await Auction.find(query)
      .populate('farmer', 'fullName')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      data: auctions
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user auctions'
    })
  }
}

// Place bid on auction
export const placeBid = async (req, res) => {
  try {
    const { auctionId, bidAmount } = req.body
    const userId = req.user._id

    // Validate input
    if (!auctionId || !bidAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: auctionId and bidAmount'
      })
    }

    // Fetch auction
    const auction = await Auction.findById(auctionId)
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      })
    }

    // Check if auction is live
    if (auction.status !== 'live') {
      return res.status(400).json({
        success: false,
        message: `Auction is ${auction.status}, cannot place bid`
      })
    }

    // Validate bid amount
    const minimumBid = auction.currentPrice + (auction.minBidIncrement || 10)
    if (bidAmount < minimumBid) {
      return res.status(400).json({
        success: false,
        message: `Minimum bid must be at least ₹${minimumBid}`,
        currentPrice: auction.currentPrice,
        minIncrement: auction.minBidIncrement
      })
    }

    // Prevent auction owner from bidding on their own auction
    if (auction.farmer && auction.farmer.toString() === userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Auction owner cannot place bids on their own auction'
      })
    }

    // Check user's wallet balance - user cannot bid more than balance
    const user = await User.findById(userId).select('wallet fullName')
    const balance = (user.wallet && user.wallet.balance) || 0
    if (balance < bidAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Available: ₹${balance}`
      })
    }

    // Create bid record
    const bid = await Bid.create({
      auction: auctionId,
      bidder: userId,
      bidAmount: bidAmount,
      isWinningBid: true,
      status: 'active'
    })

    // Update auction
    auction.currentPrice = bidAmount
    auction.currentBidder = userId
    auction.currentBidderName = user.fullName
    auction.totalBids = (auction.totalBids || 0) + 1

    if (!auction.bids) {
      auction.bids = []
    }
    auction.bids.push(bid._id)

    if (!auction.participants) {
      auction.participants = []
    }
    if (!auction.participants.includes(userId)) {
      auction.participants.push(userId)
    }

    await auction.save()

    // Broadcast bid and auction update via sockets so all connected viewers receive realtime updates
    try {
      if (global.io) {
        const roomId = `auction_${auctionId}`
        global.io.to(roomId).emit('new_bid', {
          bidAmount: bidAmount,
          bidderName: user.fullName,
          currentPrice: auction.currentPrice,
          currentBidder: auction.currentBidder,
          currentBidderName: auction.currentBidderName,
          totalBids: auction.totalBids,
          minBidIncrement: auction.minBidIncrement,
          timestamp: new Date()
        })

        global.io.emit('auction_updated', {
          auctionId,
          currentPrice: auction.currentPrice,
          totalBids: auction.totalBids,
          currentBidder: auction.currentBidder,
          currentBidderName: auction.currentBidderName,
          minBidIncrement: auction.minBidIncrement,
          status: auction.status,
          timestamp: new Date()
        })

      }
    } catch (err) {
      console.error('Socket broadcast error (API):', err)
    }

    res.status(201).json({
      success: true,
      message: 'Bid placed successfully',
      data: {
        bid: bid,
        auction: {
          _id: auction._id,
          currentPrice: auction.currentPrice,
          currentBidder: auction.currentBidder,
          currentBidderName: auction.currentBidderName,
          totalBids: auction.totalBids,
          status: auction.status
        }
      }
    })
  } catch (error) {
    console.error('Error placing bid:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to place bid'
    })
  }
}
