import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required'],
      unique: true
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        productName: String,
        productImage: String,
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity must be at least 1']
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
        farmerName: String,
        addedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    subtotal: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    couponCode: String,
    totalPrice: {
      type: Number,
      default: 0
    },
    itemCount: {
      type: Number,
      default: 0
    },
    expiresAt: {
      type: Date,
      default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    },
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
cartSchema.index({ customer: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Calculate totals
cartSchema.methods.calculateTotals = function () {
  this.subtotal = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  this.totalPrice = this.subtotal - this.discount;
  this.itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
  return this.save();
};

export default mongoose.model('Cart', cartSchema);
