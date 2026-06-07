// Mock data for testing when MongoDB is unavailable
const mockSellers = [
  {
    id: 'SELLER001',
    name: 'Akshay Kumar',
    email: 'akshay@store.com',
    storeName: 'Akshay Store',
    phone: '9876543210',
    status: 'Pending',
    kycStatus: 'Pending',
    bankDetails: { accountNumber: '123456789', ifscCode: 'HDFC0001' },
    commissionRate: 15,
    totalRevenue: 250000,
    totalEarnings: 212500,
    totalOrders: 45,
    rating: 4.2,
    products: 12,
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'SELLER002',
    name: 'Priya Patel',
    email: 'priya@fashionhub.com',
    storeName: 'Fashion Hub',
    phone: '9876543211',
    status: 'Active',
    kycStatus: 'Verified',
    bankDetails: { accountNumber: '987654321', ifscCode: 'ICIC0002' },
    commissionRate: 12,
    totalRevenue: 450000,
    totalEarnings: 396000,
    totalOrders: 89,
    rating: 4.7,
    products: 34,
    createdAt: new Date('2023-11-20')
  },
  {
    id: 'SELLER003',
    name: 'Raj Singh',
    email: 'raj@premium.com',
    storeName: 'Premium Wear',
    phone: '9876543212',
    status: 'Active',
    kycStatus: 'Verified',
    bankDetails: { accountNumber: '456789123', ifscCode: 'AXIS0003' },
    commissionRate: 10,
    totalRevenue: 680000,
    totalEarnings: 612000,
    totalOrders: 156,
    rating: 4.9,
    products: 67,
    createdAt: new Date('2023-08-10')
  }
];

const mockProducts = [
  {
    id: 'PROD001',
    sellerId: 'SELLER001',
    sellerName: 'Akshay Store',
    name: 'Premium Denim Jeans',
    category: 'Jeans',
    brand: 'Levi\'s',
    price: 2499,
    discountPrice: 1899,
    stock: 45,
    images: ['/img/jeans1.jpg'],
    sizes: ['28', '30', '32', '34', '36'],
    colors: ['Black', 'Blue'],
    status: 'Pending Approval',
    gender: 'Men',
    totalSold: 0,
    rating: 0,
    createdAt: new Date('2024-03-10')
  },
  {
    id: 'PROD002',
    sellerId: 'SELLER002',
    sellerName: 'Fashion Hub',
    name: 'Elegant Summer Dress',
    category: 'Dresses',
    brand: 'Zara',
    price: 3499,
    discountPrice: 2699,
    stock: 28,
    images: ['/img/dress1.jpg'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Red', 'Blue', 'Black'],
    status: 'Active',
    gender: 'Women',
    totalSold: 34,
    rating: 4.6,
    createdAt: new Date('2024-02-15')
  },
  {
    id: 'PROD003',
    sellerId: 'SELLER003',
    sellerName: 'Premium Wear',
    name: 'Classic Cotton T-Shirt',
    category: 'T-Shirts',
    brand: 'Urban Weave',
    price: 799,
    discountPrice: 599,
    stock: 120,
    images: ['/img/tshirt1.jpg'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'White', 'Grey'],
    status: 'Active',
    gender: 'Unisex',
    totalSold: 256,
    rating: 4.8,
    createdAt: new Date('2024-01-20')
  }
];

const mockOrders = [
  {
    id: 'ORD001',
    customerId: 'CUST001',
    customerName: 'John Doe',
    sellerId: 'SELLER001',
    sellerName: 'Akshay Store',
    items: [
      { productId: 'PROD001', name: 'Premium Denim Jeans', price: 1899, quantity: 1, image: '/img/jeans1.jpg' }
    ],
    totalAmount: 1899,
    status: 'Processing',
    paymentStatus: 'Completed',
    paymentMethod: 'Credit Card',
    trackingNumber: 'TRK123456789',
    shippingAddress: { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
    placedAt: new Date('2024-03-05'),
    returnRequest: null
  },
  {
    id: 'ORD002',
    customerId: 'CUST002',
    customerName: 'Sarah Smith',
    sellerId: 'SELLER002',
    sellerName: 'Fashion Hub',
    items: [
      { productId: 'PROD002', name: 'Elegant Summer Dress', price: 2699, quantity: 1, image: '/img/dress1.jpg' }
    ],
    totalAmount: 2699,
    status: 'Shipped',
    paymentStatus: 'Completed',
    paymentMethod: 'UPI',
    trackingNumber: 'TRK987654321',
    shippingAddress: { city: 'Delhi', state: 'Delhi', pincode: '110001' },
    placedAt: new Date('2024-03-02'),
    returnRequest: null
  },
  {
    id: 'ORD003',
    customerId: 'CUST003',
    customerName: 'Mike Johnson',
    sellerId: 'SELLER003',
    sellerName: 'Premium Wear',
    items: [
      { productId: 'PROD003', name: 'Classic Cotton T-Shirt', price: 599, quantity: 2, image: '/img/tshirt1.jpg' }
    ],
    totalAmount: 1198,
    status: 'Delivered',
    paymentStatus: 'Completed',
    paymentMethod: 'Debit Card',
    trackingNumber: 'TRK456789123',
    shippingAddress: { city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
    placedAt: new Date('2024-02-28'),
    returnRequest: null
  }
];

const mockCustomers = [
  {
    id: 'CUST001',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '9111111111',
    addresses: [
      { type: 'home', street: '123 Main St', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' }
    ],
    status: 'Active',
    totalOrders: 5,
    totalSpent: 12450,
    createdAt: new Date('2023-12-01')
  },
  {
    id: 'CUST002',
    name: 'Sarah Smith',
    email: 'sarah@example.com',
    phone: '9222222222',
    addresses: [
      { type: 'home', street: '456 Oak Ave', city: 'Delhi', state: 'Delhi', pincode: '110001' }
    ],
    status: 'Active',
    totalOrders: 12,
    totalSpent: 34560,
    createdAt: new Date('2023-10-15')
  },
  {
    id: 'CUST003',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    phone: '9333333333',
    addresses: [
      { type: 'home', street: '789 Pine Rd', city: 'Bangalore', state: 'Karnataka', pincode: '560001' }
    ],
    status: 'Active',
    totalOrders: 8,
    totalSpent: 25670,
    createdAt: new Date('2023-11-20')
  }
];

const mockPayouts = [
  {
    id: 'PAYOUT001',
    sellerId: 'SELLER001',
    sellerName: 'Akshay Store',
    amount: 50000,
    status: 'Pending',
    bankDetails: { accountNumber: '123456789', ifscCode: 'HDFC0001' },
    requestedAt: new Date('2024-03-01'),
    processedAt: null
  },
  {
    id: 'PAYOUT002',
    sellerId: 'SELLER002',
    sellerName: 'Fashion Hub',
    amount: 85000,
    status: 'Processing',
    bankDetails: { accountNumber: '987654321', ifscCode: 'ICIC0002' },
    requestedAt: new Date('2024-02-25'),
    processedAt: null
  }
];

module.exports = {
  mockSellers,
  mockProducts,
  mockOrders,
  mockCustomers,
  mockPayouts
};
