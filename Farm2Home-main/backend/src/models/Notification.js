import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient ID is required']
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: [
        'order_placed',
        'order_shipped',
        'order_delivered',
        'payment_confirmed',
        'product_reviewed',
        'new_bid',
        'auction_won',
        'auction_lost',
        'product_available',
        'farmer_verified',
        'message',
        'system'
      ],
      required: [true, 'Notification type is required']
    },
    title: {
      type: String,
      required: [true, 'Title is required']
    },
    message: {
      type: String,
      required: [true, 'Message is required']
    },
    relatedEntity: {
      entityType: {
        type: String,
        enum: ['product', 'order', 'auction', 'bid', 'user']
      },
      entityId: mongoose.Schema.Types.ObjectId
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: Date,
    actionUrl: String,
    imageUrl: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    index: true
  }
);

// Indexes for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

// TTL index - auto delete after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export default mongoose.model('Notification', notificationSchema);
