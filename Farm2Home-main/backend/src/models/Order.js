import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: [true, 'Order number is required']
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required']
    },
    customerName: String,
    customerEmail: String,
    customerPhone: String,
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product'
        },
        productName: String,
        productImage: String,
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        price: {
          type: Number,
          required: true
        },
        unit: String,
        farmer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        farmerName: String
      }
    ],
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: [Number]
      }
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    couponCode: String,
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet', 'cod'],
      required: [true, 'Payment method is required']
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'pending_delivery', 'completed'],
      default: 'pending'
    },
    trackingNumber: String,
    // Auction/Escrow-specific fields
    auctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Auction'
    },
    isAuctionOrder: {
      type: Boolean,
      default: false
    },
    escrowStatus: {
      type: String,
      enum: ['none', 'held', 'released', 'refunded'],
      default: 'none'
    },
    escrowAmount: {
      type: Number,
      default: 0
    },
    autoConfirmDate: Date,
    deliveryConfirmedAt: Date,
    deliveryConfirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    paymentReleasedAt: Date,
    refundedAt: Date,
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    refundReason: String,
    statusUpdates: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now
        },
        notes: String
      }
    ],
    deliveryDate: Date,
    estimatedDelivery: Date,
    returnDeadline: Date,
    notes: String,
    isReturned: {
      type: Boolean,
      default: false
    },
    returnReason: String,
    createdAt: {
      type: Date,
      default: Date.now
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

// Indexes
orderSchema.index({ customer: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

// Auto-generate order number before validation so 'required' passes
orderSchema.pre('validate', async function (next) {
  if (!this.isNew) return next();

  const count = await mongoose.model('Order').countDocuments();
  this.orderNumber = `ORD-${Date.now()}-${count + 1}`;
  next();
});

export default mongoose.model('Order', orderSchema);
