# Fresh Republic - E-Commerce Marketplace Platform

A full-featured e-commerce marketplace platform built with Node.js, Express, MongoDB, and vanilla JavaScript. Complete with admin dashboard, seller management, and customer storefront.

![Status](https://img.shields.io/badge/Status-Active-brightgreen)
![License](https://img.shields.io/badge/License-ISC-blue)
![Node](https://img.shields.io/badge/Node-v14+-green)

## 📋 Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Directory Structure](#directory-structure)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Admin Dashboard
- 📊 Real-time analytics and metrics dashboard
- 👥 Seller management and approval workflow
- 📦 Product review and approval system
- 📋 Order management and tracking
- 👤 Customer management
- 💰 Payout management for sellers
- 📈 Sales analytics and reporting

### Seller Dashboard
- 🏪 Seller account management
- 📦 Product listing and management
- 📊 Sales analytics
- 📋 Order fulfillment
- 💰 Payout tracking

### Customer Features
- 🛍️ Browse products by category and brand
- 🔍 Search and filter products
- 🛒 Shopping cart management
- 💳 Secure checkout and payment
- 📦 Order tracking
- 👤 Account management
- ⭐ Product reviews and ratings

### Store Sections
- **Best Sellers** - Featured top-selling products
- **Local Boutiques** - Indian ethnic wear collection
- **Daily Essentials** - Everyday clothing and accessories
- **Categories** - Organized product categories
- **Brands** - Featured brand collections

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing
- **Validation**: express-validator
- **File Upload**: Multer
- **CORS**: Cross-Origin Resource Sharing

### Frontend
- **Markup**: HTML5
- **Styling**: CSS3, Bootstrap (in some sections)
- **Scripting**: Vanilla JavaScript
- **Charting**: Chart.js
- **HTTP Client**: Axios

### Tools & Utilities
- **Development**: Nodemon
- **UUID Generation**: uuid package
- **HTTP Client**: Axios
- **Environment Variables**: dotenv

## 📦 Prerequisites

Before you begin, ensure you have installed:
- **Node.js** v14 or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **MongoDB** v4.4+ (local or MongoDB Atlas cloud)
- **Git** (for version control)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/fresh-republic.git
cd fresh-republic
```

### 2. Install Backend Dependencies
```bash
cd marketplace-api
npm install
cd ..
```

### 3. Configure Environment Variables
Create a `.env` file in the `marketplace-api` directory (use `.env.example` as reference):
```bash
cp marketplace-api/.env.example marketplace-api/.env
```

Then edit `marketplace-api/.env` with your configuration:
```env
MONGO_URI=mongodb://localhost:27017/fresh-republic
JWT_SECRET=your_secure_random_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
PORT=4170
ADMIN_EMAIL=admin@freshrepublic.com
ADMIN_PASSWORD=Admin@123
```

### 4. Start MongoDB
**Option A: Local MongoDB**
```bash
mongod
```

**Option B: MongoDB Atlas (Cloud)**
- Create a cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Update `MONGO_URI` in `.env` with your Atlas connection string

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/fresh-republic` |
| `JWT_SECRET` | Secret key for JWT signing | Any random string (min 32 chars recommended) |
| `JWT_EXPIRE` | Token expiration time | `7d`, `24h`, `30d` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | API server port | `4170` |
| `ADMIN_EMAIL` | Initial admin email | `admin@freshrepublic.com` |
| `ADMIN_PASSWORD` | Initial admin password | `Admin@123` |

## 📂 Directory Structure

```
fresh-republic/
├── marketplace-api/              # Backend API
│   ├── routes/                   # API route handlers
│   │   ├── admin.js
│   │   ├── customers.js
│   │   ├── orders.js
│   │   ├── payouts.js
│   │   ├── products.js
│   │   └── sellers.js
│   ├── models/                   # MongoDB Mongoose models
│   │   ├── Customer.js
│   │   ├── Order.js
│   │   ├── Payout.js
│   │   ├── Product.js
│   │   └── Seller.js
│   ├── middleware/               # Express middleware
│   │   └── auth.js              # JWT authentication
│   ├── utils/                    # Utility functions
│   │   └── mockData.js
│   ├── data/                     # Mock data
│   │   └── store.json
│   ├── package.json
│   ├── server.js                 # Main server file
│   └── .env                      # Environment variables (don't commit)
├── shared/                       # Shared utilities
│   ├── api-client.js
│   ├── header-men-center.js
│   └── marketplace-api.js
├── bestseller/                   # Best sellers section
├── brands/                       # Brand collections
├── categories/                   # Product categories
├── dailyessentials/             # Daily essentials section
├── localboutiques/              # Local boutiques section
├── index.html                    # Homepage
├── cart.html                     # Shopping cart
├── checkout.html                 # Checkout page
├── signin.html                   # Customer sign-in
├── account.html                  # Customer account
├── admin-dashboard.html          # Admin dashboard
├── seller-dashboard.html         # Seller dashboard
├── .gitignore
├── README.md
└── SETUP_GUIDE.md
```

## ▶️ Running the Application

### Start the API Server
```bash
cd marketplace-api
npm start
```

Or with auto-reload during development:
```bash
npm run dev
```

Expected output:
```
✓ MongoDB connected
🚀 Fresh Republic API Server Running on http://localhost:4170
```

### Access the Application

- **Customer Storefront**: `http://localhost:5000` (if using live server)
- **Admin Dashboard**: `http://localhost:5000/admin-dashboard.html`
- **Seller Dashboard**: `http://localhost:5000/seller-dashboard.html`
- **API Base**: `http://localhost:4170/api`

## 📡 API Documentation

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Key Endpoints

#### Admin Routes (`/api/admin`)
- `POST /login` - Admin login
- `GET /dashboard` - Dashboard metrics
- `GET /sellers` - List all sellers
- `PUT /sellers/:id/approve` - Approve seller
- `GET /products` - List all products
- `PUT /products/:id/approve` - Approve product
- `GET /orders` - List all orders
- `GET /payouts` - List pending payouts

#### Seller Routes (`/api/sellers`)
- `POST /register` - Register new seller
- `POST /login` - Seller login
- `POST /products` - List seller's products
- `GET /dashboard` - Seller dashboard metrics
- `GET /orders` - Seller's orders

#### Customer Routes (`/api/customers`)
- `POST /register` - Register new customer
- `POST /login` - Customer login
- `GET /products` - Browse products
- `POST /cart` - Add to cart
- `POST /orders` - Create order

#### Product Routes (`/api/products`)
- `GET /` - List all products
- `GET /:id` - Get product details
- `GET /category/:category` - Get products by category
- `GET /brand/:brand` - Get products by brand

For detailed API documentation, refer to [SETUP_GUIDE.md](./SETUP_GUIDE.md)

## 🗂️ Key Files

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed setup and API documentation
- [ADMIN_DASHBOARD_README.md](./ADMIN_DASHBOARD_README.md) - Admin dashboard features
- [TODO.md](./TODO.md) - Planned features and improvements
- [package.json](./marketplace-api/package.json) - Node.js dependencies

## 🔐 Security Considerations

1. **Environment Variables**: Never commit `.env` files. Use `.env.example` as template.
2. **JWT Secret**: Use a strong, random secret key in production.
3. **Passwords**: Always hash passwords using bcryptjs before storing.
4. **CORS**: Configure CORS for production use.
5. **HTTPS**: Use HTTPS in production environments.
6. **Rate Limiting**: Consider implementing rate limiting for APIs.
7. **Input Validation**: All inputs are validated using express-validator.

## 📝 Database Schema

The application uses MongoDB with the following main collections:

- **Sellers** - Seller accounts and profiles
- **Customers** - Customer accounts and profiles
- **Products** - Product listings
- **Orders** - Customer orders
- **Payouts** - Seller payouts

Detailed schemas are defined in `marketplace-api/models/`

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate comments.

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For issues and questions:
- Create an [Issue](https://github.com/yourusername/fresh-republic/issues)
- Check existing documentation in SETUP_GUIDE.md
- Review the TODO.md for known issues

## 🚧 Roadmap

See [TODO.md](./TODO.md) for planned features and improvements.

## 👥 Team

Fresh Republic Team

---

**Last Updated**: May 2026

