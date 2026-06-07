# Fresh Republic - Setup & Installation Guide

## Prerequisites
- **Node.js** v14+ and npm
- **MongoDB** running locally or MongoDB Atlas connection string
- **Git** (optional)

## Installation Steps

### 1. Install Dependencies
```bash
cd marketplace-api
npm install
```

### 2. Configure Environment Variables
Edit `.env` file in `marketplace-api` directory:

```
MONGO_URI=mongodb://localhost:27017/fresh-republic
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
PORT=4170
ADMIN_EMAIL=admin@freshrepublic.com
ADMIN_PASSWORD=Admin@123
```

### 3. Start MongoDB
```bash
# If MongoDB is installed locally
mongod

# Or use MongoDB Atlas (update MONGO_URI in .env)
```

### 4. Start the Server
```bash
npm start
# or for development with auto-reload
npm run dev
```

You should see:
```
✓ MongoDB connected
🚀 Fresh Republic API Server Running on http://localhost:4170
```

## API Endpoints

### Seller Authentication
- **POST** `/api/sellers/register` - Register seller account
- **POST** `/api/sellers/login` - Login seller

### Seller Features
- **GET** `/api/sellers/dashboard` - Seller dashboard metrics
- **GET** `/api/sellers/profile` - Get seller profile
- **PUT** `/api/sellers/profile` - Update seller profile
- **POST** `/api/products/create` - Create product
- **GET** `/api/products/my-products` - Get seller's products
- **PUT** `/api/products/:productId` - Update product
- **DELETE** `/api/products/:productId` - Delete product
- **GET** `/api/orders/seller-orders` - Get seller's orders
- **PUT** `/api/orders/:orderId/status` - Update order status
- **POST** `/api/payouts/request` - Request payout

### Customer Authentication
- **POST** `/api/customers/register` - Register customer
- **POST** `/api/customers/login` - Login customer

### Customer Features
- **GET** `/api/customers/profile` - Get customer profile
- **GET** `/api/customers/orders` - Get customer's orders
- **POST** `/api/orders/create` - Place order
- **GET** `/api/products` - Get all products

### Admin Features
- **POST** `/api/admin/login` - Admin login
- **GET** `/api/admin/dashboard` - Admin dashboard overview
- **GET** `/api/admin/sellers` - Get all sellers
- **PUT** `/api/admin/sellers/:sellerId/status` - Approve/reject/suspend seller
- **PUT** `/api/admin/sellers/:sellerId/kyc` - Verify seller KYC
- **GET** `/api/admin/products` - Get all products
- **PUT** `/api/admin/products/:productId/status` - Approve/reject product
- **GET** `/api/admin/orders` - Get all orders
- **GET** `/api/admin/customers` - Get all customers

## Database Models

### Seller
- id, name, email, password, storeName, phone, status, kycStatus
- bankDetails, commissionRate, totalRevenue, totalOrders, rating

### Product
- id, sellerId, name, category, brand, price, discountPrice, stock
- images, sizes, colors, status, totalSold, rating

### Customer
- id, name, email, password, phone, addresses, status
- totalOrders, totalSpent, wishlist

### Order
- id, customerId, sellerId, items, totalAmount, status
- paymentStatus, paymentMethod, shippingAddress, trackingNumber

### Payout
- id, sellerId, amount, status, bankDetails, transactionId

## Testing with cURL

### Register Seller
```bash
curl -X POST http://localhost:4170/api/sellers/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "seller@example.com",
    "password": "Password123",
    "storeName": "John's Store",
    "phone": "9876543210"
  }'
```

### Login Seller
```bash
curl -X POST http://localhost:4170/api/sellers/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@example.com",
    "password": "Password123"
  }'
```

### Create Product (requires auth token)
```bash
curl -X POST http://localhost:4170/api/products/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Premium Denim Jeans",
    "category": "Jeans",
    "brand": "Levi's",
    "price": 2500,
    "discountPrice": 1999,
    "stock": 50,
    "description": "Premium quality denim jeans"
  }'
```

### Admin Login
```bash
curl -X POST http://localhost:4170/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@freshrepublic.com",
    "password": "Admin@123"
  }'
```

## Frontend Integration

The dashboards will work with the API endpoints:

### Seller Dashboard (`seller-dashboard.html`)
- Login with seller credentials
- Create/manage products
- View orders and update status
- Request payouts
- View analytics

### Admin Dashboard (`admin-dashboard.html`)
- Login with admin credentials
- Approve sellers and verify KYC
- Review products for approval
- View all orders
- Process payouts
- View analytics

### Customer Website (`index.html`)
- Browse products
- Register and login
- Add to cart and checkout
- View order history
- Track orders

## Production Deployment

1. Update `.env` with production values
2. Set `NODE_ENV=production`
3. Use MongoDB Atlas for database
4. Deploy with PM2, Docker, or cloud platform (Heroku, AWS, etc.)
5. Enable HTTPS
6. Update API URLs in frontend files

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod`
- Check MONGO_URI in .env
- For MongoDB Atlas, whitelist IP address

### Port Already in Use
```bash
# Kill process on port 4170
lsof -ti:4170 | xargs kill -9
```

### Token Expired
- Tokens expire in 7 days (JWT_EXPIRE)
- User needs to login again for new token

## Support
For issues or questions, refer to the API documentation or contact the development team.
