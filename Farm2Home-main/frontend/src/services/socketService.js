import io from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

let socket = null
let currentToken = null

export const socketService = {
  // Initialize socket connection
  connect: (token) => {
    const normalizedToken = token || null

    if (socket && socket.connected) {
      if (normalizedToken !== currentToken) {
        socket.disconnect()
        socket = null
      } else {
        return socket
      }
    }

    currentToken = normalizedToken

    socket = io(SOCKET_URL, {
      ...(normalizedToken ? { auth: { token: normalizedToken } } : {}),
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    })

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
    })

    socket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    return socket
  },

  // Disconnect socket
  disconnect: () => {
    if (socket) {
      socket.disconnect()
      socket = null
      currentToken = null
    }
  },

  // Join auction room
  joinAuction: (auctionId, userId) => {
    if (socket) {
      socket.emit('join_auction', { auctionId, userId })
    }
  },

  // Leave auction room
  leaveAuction: (auctionId) => {
    if (socket) {
      const roomId = `auction_${auctionId}`
      socket.leave(roomId)
    }
  },

  // Listen to new bids
  onNewBid: (callback) => {
    if (socket) {
      socket.on('new_bid', callback)
    }
  },

  // Listen to auction joined
  onAuctionJoined: (callback) => {
    if (socket) {
      socket.on('auction_joined', callback)
    }
  },

  // Listen to user joined
  onUserJoined: (callback) => {
    if (socket) {
      socket.on('user_joined', callback)
    }
  },

  // Listen to bid placed confirmation
  onBidPlaced: (callback) => {
    if (socket) {
      socket.on('bid_placed', callback)
    }
  },

  // Listen to bid rejected
  onBidRejected: (callback) => {
    if (socket) {
      socket.on('bid_rejected', callback)
    }
  },

  // Listen to timer updates
  onTimerUpdate: (callback) => {
    if (socket) {
      socket.on('timer_update', callback)
    }
  },

  // Listen to auction ended
  onAuctionEnded: (callback) => {
    if (socket) {
      socket.on('auction_ended', callback)
    }
  },

  // Listen to auction won
  onAuctionWon: (callback) => {
    if (socket) {
      socket.on('auction_won', callback)
    }
  },

  // Listen to auction updates (global)
  onAuctionUpdated: (callback) => {
    if (!socket) {
      console.warn('⚠️ Socket not initialized');
      return;
    }
    
    if (!socket.connected) {
      console.warn('⚠️ Socket not connected, waiting...');
      socket.once('connect', () => {
        console.log('✅ Socket connected, setting up auction_updated listener');
        socket.on('auction_updated', (data) => {
          console.log('🔥 Received auction_updated:', data);
          callback(data);
        });
      });
    } else {
      console.log('✅ Socket already connected, setting up auction_updated listener');
      socket.on('auction_updated', (data) => {
        console.log('🔥 Received auction_updated:', data);
        callback(data);
      });
    }
  },

  // Listen to socket errors
  onError: (callback) => {
    if (socket) {
      socket.on('error', callback)
    }
  },

  // Emit place bid event
  placeBid: (auctionId, userId, bidAmount) => {
    if (socket) {
      socket.emit('place_bid', { auctionId, userId, bidAmount })
    }
  },

  // Get socket instance
  getSocket: () => socket,

  // Remove listener
  off: (event) => {
    if (socket) {
      socket.off(event)
    }
  }
}

export default socketService
