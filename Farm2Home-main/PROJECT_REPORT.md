# Farm2Home - Complete Project Report

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Data Models](#data-models)
5. [Feature List](#feature-list)
6. [Page Descriptions](#page-descriptions)
7. [System Wireframes](#system-wireframes)
8. [API Endpoints](#api-endpoints)
9. [Real-Time Features](#real-time-features)

---

## Project Overview

**Farm2Home** is a full-stack e-commerce platform that connects farmers directly with consumers. The platform enables:
- Direct purchase of fresh agricultural products
- Live auction system for competitive bidding
- Wallet-based payment system
- Order management and tracking
- Admin dashboard for platform management

### Core Value Proposition
- **For Farmers**: A digital marketplace to sell produce directly to consumers, eliminating middlemen
- **For Consumers**: Access to fresh, farm-sourced products at competitive prices
- **For Admins**: Complete platform oversight and user management

---

## Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| Redux Toolkit | State Management |
| React Router | Navigation |
| Tailwind CSS | Styling |
| Vite | Build Tool |
| Lucide React | Icons |
| Socket.io Client | Real-time Communication |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime Environment |
| Express.js | Web Framework |
| MongoDB | Database |
| Mongoose | ODM |
| JWT | Authentication |
| Socket.io | Real-time Events |
| Cloudinary | Image Storage |
| Multer | File Upload |

---

## User Roles & Permissions

### 1. Consumer
| Permission | Access |
|------------|--------|
| Browse Products | ✅ |
| Add Products | ✅ |
| Purchase Products | ✅ |
| Participate in Auctions | ✅ |
| Place Bids | ✅ |
| Create Auctions | ❌ |
| Wallet Access | ✅ |
| Profile Management | ✅ |
| View Orders | ✅ |

### 2. Farmer
| Permission | Access |
|------------|--------|
| All Consumer Permissions | ✅ |
| Create Auctions | ✅ |
| End Own Auctions | ✅ |
| View My Auctions | ✅ |
| Bid on Own Auctions | ❌ |

### 3. Admin
| Permission | Access |
|------------|--------|
| View All Orders | ✅ |
| Manage Users | ✅ |
| Approve Fund Requests | ✅ |
| View Platform Analytics | ✅ |
| Wallet Access | ❌ |
| Profile Editing | ❌ |
| Participate in Auctions | ❌ |

---

## Data Models

### User Model
```
┌─────────────────────────────────────────────────────────────┐
│                          USER                                │
├─────────────────────────────────────────────────────────────┤
│ • fullName (String, required)                               │
│ • email (String, unique, required)                          │
│ • password (String, hashed)                                 │
│ • phone (String, required)                                  │
│ • role (enum: consumer, farmer, admin)                      │
│ • profileImage (String, URL)                                │
│ • bio (String, max 500 chars)                               │
│ • address                                                   │
│   ├── street, city, state, pincode, country                 │
│ • location (GeoJSON Point)                                  │
│ • farmerDetails (only for farmers)                          │
│   ├── farmName, farmSize, cropTypes, certifications         │
│ • ratings (average, count)                                  │
│ • isActive (Boolean)                                        │
│ • totalSales (Number)                                       │
└─────────────────────────────────────────────────────────────┘
```

### Product Model
```
┌─────────────────────────────────────────────────────────────┐
│                         PRODUCT                              │
├─────────────────────────────────────────────────────────────┤
│ • name (String, max 100 chars)                              │
│ • description (String, max 1000 chars)                      │
│ • category (enum: Vegetables, Fruits, Grains, Greens,       │
│            Dairy, Other)                                    │
│ • price (Number, min 0)                                     │
│ • quantity (Number, min 0)                                  │
│ • unit (enum: kg, liter, bunch, piece, box, dozen)          │
│ • image (String, URL)                                       │
│ • images (Array of URLs)                                    │
│ • farmer (ObjectId → User)                                  │
│ • farmerName, farmerLocation                                │
│ • ratings (average 0-5, count)                              │
│ • reviews (Array → Review)                                  │
│ • harvest_date (Date, required)                             │
│ • expiry_date (Date)                                        │
│ • storage_conditions (temperature, humidity, location)      │
│ • certifications (Array)                                    │
│ • tags (Array)                                              │
│ • isFeatured, isAvailable (Boolean)                         │
│ • views, purchases (Number)                                 │
└─────────────────────────────────────────────────────────────┘
```

### Auction Model
```
┌─────────────────────────────────────────────────────────────┐
│                         AUCTION                              │
├─────────────────────────────────────────────────────────────┤
│ • product (ObjectId → Product)                              │
│ • productName, productImage                                 │
│ • farmer (ObjectId → User)                                  │
│ • farmerName                                                │
│ • startingPrice (Number, required)                          │
│ • currentPrice (Number)                                     │
│ • minBidIncrement (Number, default 10)                      │
│ • startTime, endTime (Date)                                 │
│ • status (enum: scheduled, live, ended, cancelled)          │
│ • currentBidder (ObjectId → User)                           │
│ • currentBidderName                                         │
│ • bids (Array → Bid)                                        │
│ • totalBids (Number)                                        │
│ • participants (Array → User)                               │
│ • winner (ObjectId → User)                                  │
│ • winningBidAmount, winningTime                             │
│ • description                                               │
│ • quantity, unit                                            │
│ • socketRoomId, isLive                                      │
└─────────────────────────────────────────────────────────────┘
```

### Order Model
```
┌─────────────────────────────────────────────────────────────┐
│                          ORDER                               │
├─────────────────────────────────────────────────────────────┤
│ • orderNumber (String, unique)                              │
│ • customer (ObjectId → User)                                │
│ • customerName, customerEmail, customerPhone                │
│ • items[]                                                   │
│   ├── product, productName, productImage                    │
│   ├── quantity, price, unit                                 │
│   └── farmer, farmerName                                    │
│ • shippingAddress (street, city, state, pincode, country)   │
│ • subtotal, shippingCost, tax, discount                     │
│ • couponCode                                                │
│ • totalAmount                                               │
│ • paymentMethod (credit_card, debit_card, upi, net_banking, │
│                  wallet, cod)                               │
│ • paymentStatus (pending, completed, failed, refunded)      │
│ • transactionId                                             │
│ • orderStatus (pending, confirmed, processing, shipped,     │
│                delivered, cancelled, returned)              │
│ • trackingNumber                                            │
└─────────────────────────────────────────────────────────────┘
```

### Cart Model
```
┌─────────────────────────────────────────────────────────────┐
│                          CART                                │
├─────────────────────────────────────────────────────────────┤
│ • customer (ObjectId → User, unique)                        │
│ • items[]                                                   │
│   ├── product (ObjectId → Product)                          │
│   ├── productName, productImage                             │
│   ├── quantity, price, unit                                 │
│   ├── farmer, farmerName                                    │
│   └── addedAt                                               │
│ • subtotal, discount, totalPrice                            │
│ • couponCode                                                │
│ • itemCount                                                 │
│ • expiresAt (30 days auto-expiry)                           │
└─────────────────────────────────────────────────────────────┘
```

### Bid Model
```
┌─────────────────────────────────────────────────────────────┐
│                           BID                                │
├─────────────────────────────────────────────────────────────┤
│ • auction (ObjectId → Auction)                              │
│ • bidder (ObjectId → User)                                  │
│ • bidderName                                                │
│ • bidAmount (Number, required)                              │
│ • isWinningBid (Boolean)                                    │
│ • status (enum: active, outbid, won, cancelled)             │
│ • timestamp                                                 │
│ • ipAddress, deviceInfo                                     │
└─────────────────────────────────────────────────────────────┘
```

### Transaction Model
```
┌─────────────────────────────────────────────────────────────┐
│                       TRANSACTION                            │
├─────────────────────────────────────────────────────────────┤
│ • user (ObjectId → User)                                    │
│ • type (enum: credit, debit)                                │
│ • amount (Number)                                           │
│ • source (String)                                           │
│ • meta (Object - additional details)                        │
└─────────────────────────────────────────────────────────────┘
```

### Fund Request Model
```
┌─────────────────────────────────────────────────────────────┐
│                      FUND REQUEST                            │
├─────────────────────────────────────────────────────────────┤
│ • user (ObjectId → User)                                    │
│ • amount (Number, min 1)                                    │
│ • status (enum: pending, approved, rejected)                │
│ • approvedBy (ObjectId → User)                              │
│ • approvedAt (Date)                                         │
│ • note (String)                                             │
└─────────────────────────────────────────────────────────────┘
```

### Review Model
```
┌─────────────────────────────────────────────────────────────┐
│                         REVIEW                               │
├─────────────────────────────────────────────────────────────┤
│ • product (ObjectId → Product)                              │
│ • farmer (ObjectId → User)                                  │
│ • reviewer (ObjectId → User)                                │
│ • reviewerName, reviewerImage                               │
│ • order (ObjectId → Order)                                  │
│ • rating (1-5)                                              │
│ • title (max 100 chars)                                     │
│ • content (10-1000 chars)                                   │
│ • images (Array)                                            │
│ • helpfulCount, unhelpfulCount                              │
└─────────────────────────────────────────────────────────────┘
```

### Notification Model
```
┌─────────────────────────────────────────────────────────────┐
│                      NOTIFICATION                            │
├─────────────────────────────────────────────────────────────┤
│ • recipient (ObjectId → User)                               │
│ • sender (ObjectId → User)                                  │
│ • type (order_placed, order_shipped, order_delivered,       │
│         payment_confirmed, product_reviewed, new_bid,       │
│         auction_won, auction_lost, product_available,       │
│         farmer_verified, message, system)                   │
│ • title, message                                            │
│ • relatedEntity (entityType, entityId)                      │
│ • isRead (Boolean)                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature List

### 🛒 E-Commerce Features

| Feature | Description |
|---------|-------------|
| Product Listing | Browse products with filters (category, price, search, sort) |
| Product Details | View complete product information, images, ratings |
| Shopping Cart | Add/remove products, update quantities |
| Checkout | Wallet-based payment system |
| Order Tracking | View order status and history |
| Product Reviews | Rate and review purchased products |

### 🔨 Auction Features

| Feature | Description |
|---------|-------------|
| Live Auctions | Real-time bidding with Socket.io |
| Scheduled Auctions | View upcoming auctions |
| Create Auction | Farmers can create new auctions |
| Place Bids | Consumers/farmers can bid (wallet balance validation) |
| End Auction | Owners can manually end their auctions |
| Auction Timer | Live countdown display |
| Winner Display | Shows winner after auction ends |
| My Auctions | View all personal auctions (live, scheduled, ended) |

### 💰 Wallet System

| Feature | Description |
|---------|-------------|
| Wallet Balance | View current balance |
| Fund Requests | Request funds from admin |
| Transaction History | View all credits/debits |
| Wallet Checkout | Pay for orders using wallet |
| Balance Validation | Prevents bids/purchases exceeding balance |

### 👤 User Management

| Feature | Description |
|---------|-------------|
| Registration | Sign up as consumer or farmer |
| Login/Logout | JWT-based authentication |
| Profile Editing | Update personal information |
| Role-based Access | Different features per role |

### 👨‍💼 Admin Features

| Feature | Description |
|---------|-------------|
| Dashboard | KPIs, revenue, orders, user stats |
| User Management | View and manage all users |
| Fund Requests | Approve/reject wallet requests |
| All Orders | View orders from all users |
| Platform Analytics | Revenue and performance metrics |

---

## Page Descriptions

### Public Pages

#### 1. Home Page (`/`)
- Hero section with call-to-action buttons
- Platform statistics (farmers, customers, products sold)
- Featured products section (top 4)
- Live auctions ending soon
- Why Farm2Home features section

#### 2. Products Page (`/products`)
- Product grid with cards
- Sidebar filters:
  - Search box
  - Category buttons
  - Price range sliders
  - Sort dropdown (Newest, Price Low-High, Price High-Low, Top Rated)
- Pagination
- "Add Your Product" button (authenticated users)
- "My Orders" button

#### 3. Product Detail Page (`/products/:id`)
- Large product image
- Product information (name, price, description)
- Farmer information
- Add to cart functionality
- Quantity selector
- Reviews section

### Auction Pages

#### 4. Auctions Page (`/auctions`)
- Filter tabs: Live, My Auctions, Scheduled, Ended
- Auction cards grid
- Real-time price updates via Socket.io

#### 5. Auction Detail Page (`/auctions/:id`)
- Product image and details
- Current bid display
- Live countdown timer
- Bid input and placement
- Bid history
- Winner display (when ended)
- End auction button (for owner)
- Real-time updates

#### 6. Create Auction Page (`/sell`)
- **Farmer-only access**
- Form fields:
  - Product name, description
  - Category, quantity, unit
  - Image upload
  - Starting price, min bid increment
  - Start/end time pickers
- Validation and submission

### User Pages

#### 7. Login Page (`/login`)
- Email/password form
- Link to registration

#### 8. Signup Page (`/signup`)
- Registration form
- Role selection (consumer/farmer)
- Address information

#### 9. Dashboard Page (`/dashboard`)
- User account summary
- Wallet balance display
- Recent transactions
- Fund requests list
- Request funds modal

#### 10. Profile Page (`/profile`)
- Edit name and phone
- Save changes
- Admin accounts redirected to admin dashboard

#### 11. Cart Page (`/cart`)
- Cart items list
- Quantity controls
- Remove item buttons
- Clear cart button
- Order summary
- Wallet balance display
- Payment method selection
- Place order button
- Wallet balance validation

#### 12. Orders Page (`/orders`)
- Order history table
- Order status display
- For admins: shows all users' orders with buyer info

### Admin Pages

#### 13. Admin Dashboard (`/admin/dashboard`)
- **Admin-only access**
- Top header with search and notifications
- Stats cards:
  - Total Revenue
  - Total Orders
  - Total Users
  - Active Auctions
- Recent orders table with "View All"
- Quick action buttons

#### 14. Admin Requests (`/admin/requests`)
- Pending fund requests list
- Approve/reject buttons
- Request details

#### 15. Admin Users (`/admin/users`)
- User management table
- User details and roles

---

## System Wireframes

### Application Flow Diagram
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FARM2HOME PLATFORM                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
              ┌──────────┐      ┌──────────┐      ┌──────────┐
              │  GUEST   │      │   USER   │      │  ADMIN   │
              └────┬─────┘      └────┬─────┘      └────┬─────┘
                   │                 │                 │
         ┌─────────┴─────────┐      │           ┌─────┴─────┐
         ▼                   ▼      │           ▼           ▼
    ┌─────────┐        ┌─────────┐  │     ┌─────────┐  ┌─────────┐
    │ Browse  │        │  Login  │  │     │Dashboard│  │ Manage  │
    │Products │        │ Signup  │  │     │   KPIs  │  │  Users  │
    └─────────┘        └────┬────┘  │     └─────────┘  └─────────┘
                            │       │           │
                            └───────┤           │
                                    ▼           │
                    ┌───────────────────────────┴───────────────┐
                    │              AUTHENTICATED USER           │
                    └───────────────────────────────────────────┘
                                        │
            ┌───────────┬───────────┬───┴───┬───────────┬───────────┐
            ▼           ▼           ▼       ▼           ▼           ▼
      ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
      │ Products │ │ Auctions │ │   Cart   │ │  Wallet  │ │  Orders  │
      │ + Add    │ │ + Bid    │ │ Checkout │ │  + Fund  │ │ History  │
      └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
            │           │
            │     ┌─────┴─────┐
            │     ▼           ▼
            │ ┌─────────┐ ┌─────────┐
            │ │ Consumer│ │ Farmer  │
            │ │ Bid     │ │ Create  │
            │ └─────────┘ │ Auction │
            │             └─────────┘
            ▼
      ┌──────────┐
      │ Farmer + │
      │ Consumer │
      │ Add      │
      │ Product  │
      └──────────┘
```

### Page Layout Wireframe: Home
```
┌─────────────────────────────────────────────────────────────────┐
│                          HEADER                                  │
│  [Logo]  [Home] [Products] [Auctions] [Cart] [Login/Profile]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    ┌─────────────────────┐                       │
│                    │    HERO SECTION     │                       │
│                    │ Fresh from Farm     │                       │
│                    │   to Home           │                       │
│                    │                     │                       │
│                    │ [Browse] [Auctions] │                       │
│                    └─────────────────────┘                       │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                      STATS SECTION                               │
│          5000+ Farmers  |  50k+ Customers  |  100k+ Sold        │
├─────────────────────────────────────────────────────────────────┤
│                    FEATURED PRODUCTS                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ Product │  │ Product │  │ Product │  │ Product │            │
│  │  Card   │  │  Card   │  │  Card   │  │  Card   │            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
│                      [View All Products →]                       │
├─────────────────────────────────────────────────────────────────┤
│                    LIVE AUCTIONS                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ Auction │  │ Auction │  │ Auction │  │ Auction │            │
│  │  Card   │  │  Card   │  │  Card   │  │  Card   │            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
│                      [View All Auctions →]                       │
├─────────────────────────────────────────────────────────────────┤
│                         FOOTER                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Page Layout Wireframe: Products
```
┌─────────────────────────────────────────────────────────────────┐
│                          HEADER                                  │
├─────────────────────────────────────────────────────────────────┤
│                      FRESH PRODUCTS                              │
│               Handpicked fresh produce                           │
├───────────────────┬─────────────────────────────────────────────┤
│    SIDEBAR        │              PRODUCTS GRID                   │
│                   │                                              │
│  ┌─────────────┐  │   ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │   Search    │  │   │ Product │ │ Product │ │ Product │       │
│  └─────────────┘  │   │  Card   │ │  Card   │ │  Card   │       │
│                   │   └─────────┘ └─────────┘ └─────────┘       │
│  [+Add Product]   │                                              │
│                   │   ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  CATEGORIES       │   │ Product │ │ Product │ │ Product │       │
│  ○ All            │   │  Card   │ │  Card   │ │  Card   │       │
│  ○ Vegetables     │   └─────────┘ └─────────┘ └─────────┘       │
│  ○ Fruits         │                                              │
│  ○ Grains         │   ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  ○ Greens         │   │ Product │ │ Product │ │ Product │       │
│  ○ Dairy          │   │  Card   │ │  Card   │ │  Card   │       │
│                   │   └─────────┘ └─────────┘ └─────────┘       │
│  PRICE RANGE      │                                              │
│  Min: [====○===]  │               PAGINATION                     │
│  Max: [======○=]  │         [<] 1 2 3 4 5 [>]                   │
│                   │                                              │
│  SORT BY          │                                              │
│  [Newest      ▼]  │                                              │
│                   │                                              │
│  [Clear Filters]  │                                              │
│  [My Orders]      │                                              │
└───────────────────┴─────────────────────────────────────────────┘
```

### Page Layout Wireframe: Auction Detail
```
┌─────────────────────────────────────────────────────────────────┐
│                          HEADER                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐   │
│  │                     │  │  🔴 LIVE AUCTION                 │   │
│  │                     │  │                                  │   │
│  │    PRODUCT IMAGE    │  │  Product Name                   │   │
│  │                     │  │  by Farmer Name                 │   │
│  │                     │  │                                  │   │
│  │                     │  │  ⏱ Time Remaining:              │   │
│  │                     │  │     02:45:32                     │   │
│  │                     │  │                                  │   │
│  └─────────────────────┘  │  ┌─────────────────────────┐    │   │
│                           │  │ Current Bid: ₹1,250     │    │   │
│                           │  │ Total Bids: 15          │    │   │
│                           │  │ Leading: John Doe       │    │   │
│                           │  └─────────────────────────┘    │   │
│                           │                                  │   │
│                           │  Your Wallet: ₹5,000            │   │
│                           │                                  │   │
│                           │  ┌───────────────┐ ┌──────────┐ │   │
│                           │  │ Bid Amount ₹  │ │Place Bid │ │   │
│                           │  └───────────────┘ └──────────┘ │   │
│                           │  Min: ₹1,260                    │   │
│                           │                                  │   │
│                           │  [End Auction] (owner only)     │   │
│                           └─────────────────────────────────┘   │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                        BID HISTORY                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ John Doe       │ ₹1,250 │ 2 min ago                     │    │
│  │ Jane Smith     │ ₹1,200 │ 5 min ago                     │    │
│  │ Mike Brown     │ ₹1,150 │ 8 min ago                     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Page Layout Wireframe: Cart & Checkout
```
┌─────────────────────────────────────────────────────────────────┐
│                          HEADER                                  │
├─────────────────────────────────────────────────────────────────┤
│                       SHOPPING CART                              │
├───────────────────────────────────────────┬─────────────────────┤
│              CART ITEMS                   │   ORDER SUMMARY     │
│                                           │                     │
│  ┌───────────────────────────────────┐    │  Subtotal: ₹1,500  │
│  │ [IMG] Product 1                   │    │  Shipping: ₹50     │
│  │       ₹500 x 2 = ₹1,000          │    │  Tax:      ₹75     │
│  │       [-] 2 [+]     [Remove]     │    │  ─────────────────  │
│  └───────────────────────────────────┘    │  Total:    ₹1,625  │
│                                           │                     │
│  ┌───────────────────────────────────┐    │  ─────────────────  │
│  │ [IMG] Product 2                   │    │                     │
│  │       ₹250 x 2 = ₹500            │    │  Wallet Balance:    │
│  │       [-] 2 [+]     [Remove]     │    │  ₹5,000 ✓          │
│  └───────────────────────────────────┘    │                     │
│                                           │  Payment Method:    │
│  [Clear Cart]                             │  ○ Wallet           │
│                                           │  ○ UPI              │
│                                           │  ○ Card             │
│                                           │                     │
│                                           │  ┌───────────────┐  │
│                                           │  │ Place Order   │  │
│                                           │  └───────────────┘  │
└───────────────────────────────────────────┴─────────────────────┘
```

### Page Layout Wireframe: Admin Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo] AdminPanel      [Search...]      [🔔] [👤 Admin Name]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │ 💰 Revenue  │ │ 📦 Orders   │ │ 👥 Users    │ │ 🔨 Auctions ││
│  │  ₹125,000   │ │    245      │ │    1,250    │ │     32      ││
│  │  ↑ 12.5%    │ │  ↑ 8.2%     │ │  ↑ 5.1%     │ │  ↑ 15.3%    ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                      RECENT ORDERS                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Order #  │ Customer    │ Amount  │ Status   │ Date       │  │
│  ├──────────┼─────────────┼─────────┼──────────┼────────────┤  │
│  │ ORD-001  │ John Doe    │ ₹1,500  │ Pending  │ Dec 21     │  │
│  │ ORD-002  │ Jane Smith  │ ₹2,250  │ Shipped  │ Dec 20     │  │
│  │ ORD-003  │ Mike Brown  │ ₹800    │ Delivered│ Dec 19     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           [View All →]                           │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  QUICK ACTIONS                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│  │ Fund        │ │ Manage      │ │ View        │                │
│  │ Requests    │ │ Users       │ │ Products    │                │
│  └─────────────┘ └─────────────┘ └─────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

### User Dashboard Wireframe
```
┌─────────────────────────────────────────────────────────────────┐
│                          HEADER                                  │
├─────────────────────────────────────────────────────────────────┤
│                       MY PROFILE                                 │
├───────────────────┬─────────────────────────────────────────────┤
│    ACCOUNT        │              WALLET & TRANSACTIONS          │
│                   │                                              │
│  Name: John Doe   │  ┌─────────────────────────────────────┐    │
│  Email: j@e.com   │  │  WALLET BALANCE                     │    │
│  Phone: 999...    │  │  ₹5,000.00            [Shop] [Fund] │    │
│                   │  └─────────────────────────────────────┘    │
│  [Edit Profile]   │                                              │
│                   │  RECENT TRANSACTIONS                         │
│                   │  ┌─────────────────────────────────────┐    │
│                   │  │ Credit • Fund Request  │ +₹1,000    │    │
│                   │  │ Debit  • Order         │ -₹500      │    │
│                   │  │ Credit • Refund        │ +₹250      │    │
│                   │  └─────────────────────────────────────┘    │
│                   │                                              │
│                   │  FUND REQUESTS                               │
│                   │  ┌─────────────────────────────────────┐    │
│                   │  │ ₹1,000 │ Approved │ Dec 20          │    │
│                   │  │ ₹500   │ Pending  │ Dec 21          │    │
│                   │  └─────────────────────────────────────┘    │
└───────────────────┴─────────────────────────────────────────────┘
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | User logout |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products (with filters) |
| GET | `/api/products/featured` | Get featured products |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create product (auth required) |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

### Auctions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auctions` | Get all auctions |
| GET | `/api/auctions/my` | Get user's auctions |
| GET | `/api/auctions/:id` | Get single auction |
| POST | `/api/auctions` | Create auction (farmer only) |
| POST | `/api/auctions/:id/bid` | Place bid |
| POST | `/api/auctions/:id/end` | End auction (owner only) |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get user's cart |
| POST | `/api/cart` | Add item to cart |
| PUT | `/api/cart/:productId` | Update item quantity |
| DELETE | `/api/cart/:productId` | Remove item |
| DELETE | `/api/cart` | Clear cart |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get orders (user's or all for admin) |
| GET | `/api/orders/:id` | Get single order |
| POST | `/api/orders` | Create order |
| PUT | `/api/orders/:id` | Update order status |

### Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wallet` | Get wallet details |
| POST | `/api/wallet/request` | Request funds |
| POST | `/api/wallet/approve/:id` | Approve fund request (admin) |
| POST | `/api/wallet/reject/:id` | Reject fund request (admin) |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get user profile |
| PUT | `/api/users/profile` | Update profile |
| GET | `/api/users` | Get all users (admin) |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Get dashboard KPIs |
| GET | `/api/admin/requests` | Get pending fund requests |

---

## Real-Time Features

### Socket.io Events

#### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join_auction` | `{ auctionId, oderId }` | Join auction room |
| `leave_auction` | `{ auctionId }` | Leave auction room |
| `place_bid` | `{ auctionId, amount }` | Place a bid |

#### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `auction_joined` | `{ auction }` | Confirmation of joining |
| `new_bid` | `{ currentPrice, bidderName, totalBids }` | New bid placed |
| `auction_updated` | `{ auctionId, status, ... }` | Auction state changed |
| `auction_ended` | `{ winner, winningBid }` | Auction concluded |
| `bid_rejected` | `{ message }` | Bid was rejected |

### Real-Time Update Flow
```
┌──────────────────────────────────────────────────────────────────┐
│                    AUCTION BIDDING FLOW                          │
└──────────────────────────────────────────────────────────────────┘

  User A                    Server                    User B
    │                         │                         │
    │   join_auction ───────► │ ◄─────── join_auction   │
    │                         │                         │
    │ ◄──── auction_joined    │    auction_joined ────► │
    │                         │                         │
    │   place_bid (₹100) ───► │                         │
    │                         │                         │
    │                   [Validate Bid]                  │
    │                   [Check Wallet]                  │
    │                   [Update DB]                     │
    │                         │                         │
    │ ◄────── new_bid         │         new_bid ──────► │
    │                         │                         │
    │                         │ ◄─── place_bid (₹150)   │
    │                         │                         │
    │                   [Validate Bid]                  │
    │                   [Check Wallet]                  │
    │                   [Update DB]                     │
    │                         │                         │
    │ ◄────── new_bid         │         new_bid ──────► │
    │                         │                         │
    │                   [Timer Expires]                 │
    │                         │                         │
    │ ◄─── auction_ended      │    auction_ended ─────► │
    │      (Winner: User B)   │      (Winner: User B)   │
    │                         │                         │
```

---

## Security Features

| Feature | Implementation |
|---------|----------------|
| Password Hashing | bcryptjs with salt |
| JWT Authentication | Secure token-based auth |
| Role-based Access | Middleware protection |
| Input Validation | Mongoose schema validation |
| Rate Limiting | Express rate limiter |
| CORS Protection | Configured CORS |
| Error Handling | Centralized error handler |

---

## File Structure Summary

```
firstProject/
├── backend/
│   ├── src/
│   │   ├── server.js          # Express server entry
│   │   ├── socket.js          # Socket.io configuration
│   │   ├── config/            # Cloudinary config
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # Auth, error handling
│   │   ├── models/            # Mongoose schemas
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   └── utils/             # Helpers, email
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx            # Main app + routes
    │   ├── main.jsx           # Entry point
    │   ├── components/        # Reusable components
    │   ├── pages/             # Page components
    │   ├── redux/             # State management
    │   ├── services/          # API clients
    │   └── styles/            # CSS
    ├── index.html
    └── package.json
```

---

*Report Generated: December 21, 2025*
*Farm2Home - Connecting Farmers to Consumers*
