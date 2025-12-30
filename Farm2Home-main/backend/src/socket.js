import Auction from './models/Auction.js';
import Bid from './models/Bid.js';
import Notification from './models/Notification.js';
import User from './models/User.js';
import jwt from 'jsonwebtoken';

export const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // Join auction room
    socket.on('join_auction', async (data) => {
      try {
        const { auctionId, userId } = data;
        const roomId = `auction_${auctionId}`;

        socket.join(roomId);

        const auction = await Auction.findByIdAndUpdate(
          auctionId,
          { $addToSet: { participants: userId }, isLive: true },
          { new: true }
        );

        socket.emit('auction_joined', {
          success: true,
          auction: auction,
          message: 'Successfully joined auction'
        });

        // Broadcast to room
        io.to(roomId).emit('user_joined', {
          participantCount: auction.participants.length,
          currentPrice: auction.currentPrice
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to join auction' });
      }
    });

    // Place bid
    socket.on('place_bid', async (data) => {
      try {
        const { auctionId, userId, bidAmount } = data;
        const roomId = `auction_${auctionId}`;

        const auction = await Auction.findById(auctionId);

        if (!auction) {
          return socket.emit('error', { message: 'Auction not found' });
        }

        // Ensure auction is live
        if (auction.status !== 'live') {
          return socket.emit('bid_rejected', { message: `Auction is ${auction.status}, cannot place bid` });
        }

        // Prevent auction owner from bidding on their own auction
        if (auction.farmer && auction.farmer.toString() === userId.toString()) {
          return socket.emit('bid_rejected', { message: 'Auction owner cannot place bids on their own auction' });
        }

        // Validate bid amount
        const minimumBid = auction.currentPrice + auction.minBidIncrement;
        if (bidAmount < minimumBid) {
          return socket.emit('bid_rejected', {
            message: `Minimum bid is ₹${minimumBid}`,
            currentPrice: auction.currentPrice,
            minIncrement: auction.minBidIncrement
          });
        }

        // Check user's wallet balance (prevent bidding more than available funds)
        const bidder = await User.findById(userId).select('wallet fullName');
        const balance = (bidder && bidder.wallet && bidder.wallet.balance) || 0;
        if (balance < bidAmount) {
          return socket.emit('bid_rejected', {
            message: `Insufficient wallet balance. Available: ₹${balance}`,
            availableBalance: balance
          });
        }

        // Create bid record
        const bid = await Bid.create({
          auction: auctionId,
          bidder: userId,
          bidAmount: bidAmount,
          isWinningBid: true,
          status: 'active'
        });

        // Update auction
        auction.currentPrice = bidAmount;
        auction.currentBidder = userId;
        auction.totalBids += 1;
        const user = await User.findById(userId);
        auction.currentBidderName = user.fullName;
        await auction.save();

        console.log(`💰 New bid placed: ${bidAmount} by ${user.fullName} on auction ${auctionId}`);

        // Broadcast to all in room (for users already in the auction detail)
        io.to(roomId).emit('new_bid', {
          bidAmount: bidAmount,
          bidderName: user.fullName,
          currentPrice: auction.currentPrice,
          currentBidder: auction.currentBidder,
          currentBidderName: auction.currentBidderName,
          totalBids: auction.totalBids,
          minBidIncrement: auction.minBidIncrement,
          timestamp: new Date()
        });

        // Emit a global auction update (for all other viewers and list pages)
        console.log(`📢 Broadcasting auction_updated globally for auction ${auctionId}`);
        io.emit('auction_updated', {
          auctionId,
          currentPrice: auction.currentPrice,
          totalBids: auction.totalBids,
          currentBidder: auction.currentBidder,
          currentBidderName: auction.currentBidderName,
          minBidIncrement: auction.minBidIncrement,
          status: auction.status,
          timestamp: new Date()
        });

        // Send notification to outbid users (optional)
        socket.emit('bid_placed', {
          success: true,
          message: 'Your bid has been placed',
          bidAmount: bidAmount
        });
      } catch (error) {
        console.error('Bid error:', error);
        socket.emit('error', { message: 'Failed to place bid' });
      }
    });

    // Auction timer update
    socket.on('start_timer', async (data) => {
      try {
        const { auctionId, endTime } = data;
        const roomId = `auction_${auctionId}`;

        const timeRemaining = new Date(endTime) - Date.now();

        io.to(roomId).emit('timer_update', {
          timeRemaining: Math.max(0, timeRemaining),
          endTime: endTime
        });
      } catch (error) {
        socket.emit('error', { message: 'Timer error' });
      }
    });

    // Auction ended (socket) — only auction owner can trigger this
    socket.on('end_auction', async (data) => {
      try {
        const { auctionId } = data;
        const roomId = `auction_${auctionId}`;

        const auction = await Auction.findById(auctionId);

        if (!auction) {
          return socket.emit('error', { message: 'Auction not found' });
        }

        // Verify socket auth token and that the requester is the auction owner
        const token = socket.handshake?.auth?.token || null;
        if (!token) {
          return socket.emit('error', { message: 'Not authenticated to end auction' });
        }

        let decoded;
        try {
          decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
          return socket.emit('error', { message: 'Invalid auth token' });
        }

        if (!decoded || !decoded.id || auction.farmer.toString() !== decoded.id) {
          return socket.emit('error', { message: 'Only the auction owner can end this auction' });
        }

        // Mark auction ended and set winner if any
        auction.status = 'ended';
        if (auction.currentBidder) {
          auction.winner = auction.currentBidder;
          auction.winningBidAmount = auction.currentPrice;
          auction.winningTime = new Date();
        }
        auction.isLive = false;
        await auction.save();

        // Notify winner
        if (auction.currentBidder) {
          const winner = await User.findById(auction.currentBidder);
          await Notification.create({
            recipient: auction.currentBidder,
            type: 'auction_won',
            title: 'Auction Won!',
            message: `You've won the auction for ${auction.productName}`,
            relatedEntity: {
              entityType: 'auction',
              entityId: auctionId
            }
          });

          // Emit to winner
          socket.to(`user_${auction.currentBidder}`).emit('auction_won', {
            auction: auction,
            message: `Congratulations! You won with a bid of ₹${auction.currentPrice}`
          });
        }

        // Broadcast to room
        io.to(roomId).emit('auction_ended', {
          auction: auction,
          winner: auction.currentBidderName,
          finalPrice: auction.currentPrice
        });

        // Also emit global update
        io.emit('auction_updated', {
          auctionId,
          currentPrice: auction.currentPrice,
          totalBids: auction.totalBids,
          currentBidder: auction.currentBidder,
          currentBidderName: auction.currentBidderName,
          minBidIncrement: auction.minBidIncrement,
          status: auction.status,
          timestamp: new Date()
        });

        socket.leave(roomId);
      } catch (error) {
        console.error('Auction end error:', error);
        socket.emit('error', { message: 'Failed to end auction' });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Broadcast notifications
  global.io = io;
};
