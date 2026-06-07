const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 4170);
const ROOT_DIR = path.resolve(__dirname, "..");
const STORE_PATH = path.join(__dirname, "data", "store.json");
const SELLER_DIST_DIR = path.join(ROOT_DIR, "seller-dashboard", "dist");
const ADMIN_DIST_DIR = path.join(ROOT_DIR, "super-admin-dashboard", "dist");

const SELLER_PORTAL_PRODUCT_STATUSES = ["Active", "Pending Approval", "Rejected", "Draft", "Out of Stock"];
const SELLER_PRODUCT_CATEGORIES = [
  "Jeans",
  "Sneakers",
  "Dresses",
  "T-Shirts",
  "Shirts",
  "Hoodie",
  "Jackets",
  "Caps",
  "Bags",
  "Underwear",
  "Boxers",
  "Slippers",
  "Pajamas",
  "Everyday T-Shirts",
  "Bras",
  "Panties",
  "Nightwear",
  "Designer Suits",
  "Pants",
  "Designer Kurtis",
  "Kurta Sets",
  "Designer Sarees",
  "Lehengas",
  "Boutique Dresses"
];
const SELLER_PRODUCT_BRANDS = [
  "Nike",
  "Adidas",
  "Puma",
  "Levi's",
  "Zara",
  "H&M",
  "Uniqlo",
  "Tommy Hilfiger"
];
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "7", "8", "9", "10", "Free Size", "30", "32", "34", "36"];
const COLOR_OPTIONS = [
  { name: "Black", swatch: "#111827" },
  { name: "White", swatch: "#ffffff" },
  { name: "Blue", swatch: "#2563eb" },
  { name: "Grey", swatch: "#6b7280" },
  { name: "Brown", swatch: "#7c4a21" },
  { name: "Gold", swatch: "#d4af37" },
  { name: "Red", swatch: "#dc2626" },
  { name: "Pink", swatch: "#ec4899" },
  { name: "Yellow", swatch: "#facc15" },
  { name: "Maroon", swatch: "#7f1d1d" }
];

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".htm": "text/html; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp"
};

function readStore() {
  return JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
}

function writeStore(store) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(response, statusCode, payload) {
  setCorsHeaders(response);
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, message) {
  setCorsHeaders(response);
  response.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(message);
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large."));
      }
    });
    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON body."));
      }
    });
    request.on("error", reject);
  });
}

function safeNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function roundCurrency(value) {
  return Math.round(safeNumber(value, 0));
}

function formatMaskedPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  return digits.startsWith("91") || digits.length > 10
    ? `+${digits}`
    : `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

function toCurrencyText(value) {
  return `Rs. ${roundCurrency(value).toLocaleString("en-IN")}`;
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalize(text) {
  return String(text || "").trim().toLowerCase();
}

function normalizePhone(text) {
  return String(text || "").replace(/\D/g, "");
}

function normalizeCategory(value) {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const aliases = {
    jeans: "jeans",
    jean: "jeans",
    sneakers: "sneakers",
    sneaker: "sneakers",
    tshirts: "tshirt",
    tshirt: "tshirt",
    shirts: "shirt",
    shirt: "shirt",
    dresses: "dress",
    dress: "dress",
    hoodie: "hoodie",
    hoodies: "hoodie",
    jackets: "jacket",
    jacket: "jacket",
    bags: "bag",
    bag: "bag",
    cap: "cap",
    caps: "cap",
    underwear: "underwear",
    underwears: "underwear",
    boxer: "boxer",
    boxers: "boxer",
    slipper: "slipper",
    slippers: "slipper",
    pajama: "pajama",
    pajamas: "pajama",
    everydaytee: "everydaytshirt",
    everydaytshirt: "everydaytshirt",
    everydaytshirts: "everydaytshirt",
    bra: "bra",
    bras: "bra",
    pantie: "pantie",
    panties: "pantie",
    nightwear: "nightwear",
    nightwears: "nightwear",
    designersuit: "designersuit",
    designersuits: "designersuit",
    pant: "pant",
    pants: "pant",
    designerkurtis: "designerkurti",
    designerkurti: "designerkurti",
    kurtasets: "kurtaset",
    kurtaset: "kurtaset",
    designersarees: "designersaree",
    designersaree: "designersaree",
    designersare: "designersaree",
    lehengas: "lehenga",
    lehenga: "lehenga",
    boutiquedresse: "boutiquedresse",
    boutiquedress: "boutiquedresse",
    boutiquedresses: "boutiquedresse"
  };
  return aliases[normalized] || normalized;
}

function categoryLabelToStorefrontKey(categoryLabel) {
  const mapped = normalizeCategory(categoryLabel);
  return mapped === "tshirt" ? "tshirts" : mapped;
}

function categoryLabelToTitle(categoryLabel) {
  return String(categoryLabel || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getDefaultProductImage(categoryLabel) {
  const imageByCategory = {
    bag: "/Bag.jpg",
    cap: "/Cap.jpg",
    boxer: "/Boxers.png",
    bra: "/Bras.jpg",
    boutiquedresse: "/Boutique Dresses.jpg",
    designersaree: "/Designer Sarees.jpg",
    designerkurti: "/Designer Kurtis.jpg",
    designersuit: "/Designer Suits.jpg",
    dress: "/Dress.jpg",
    everydaytshirt: "/Everyday T-Shirts.jpg",
    hoodie: "/Hoodie.jpg",
    jacket: "/Jacket.jpg",
    jeans: "/jeans.jpg",
    kurtaset: "/Kurta Sets.jpg",
    lehenga: "/Lehengas.jpg",
    nightwear: "/Nightwear.jpg",
    pajama: "/Pajamas.jpg",
    pant: "/Pants.png",
    pantie: "/Panties.jpg",
    shirt: "/Shirt.jpg",
    slipper: "/Slippers.jpg",
    sneakers: "/Sneakers.jpg",
    tshirt: "/Tshirt.jpg",
    tshirts: "/Tshirt.jpg",
    underwear: "/Underwear.jpg"
  };
  return imageByCategory[categoryLabelToStorefrontKey(categoryLabel)] || "/Logo.png";
}

const PRODUCT_IMAGE_MIN_COUNT = 4;
const PRODUCT_IMAGE_MAX_COUNT = 6;

function normalizeProductImageList(payload, options = {}) {
  const images = [];
  if (Array.isArray(payload.images)) {
    payload.images.forEach((imagePath) => {
      const normalized = String(imagePath || "").trim();
      if (normalized) {
        images.push(normalized);
      }
    });
  }

  const primaryImage = String(payload.image || "").trim();
  if (primaryImage) {
    images.unshift(primaryImage);
  }

  const dedupedImages = [];
  const seen = new Set();
  images.forEach((imagePath) => {
    if (!seen.has(imagePath)) {
      seen.add(imagePath);
      dedupedImages.push(imagePath);
    }
  });

  if (options.required && dedupedImages.length < PRODUCT_IMAGE_MIN_COUNT) {
    throw new Error(`Upload at least ${PRODUCT_IMAGE_MIN_COUNT} product images.`);
  }

  if (dedupedImages.length > PRODUCT_IMAGE_MAX_COUNT) {
    throw new Error(`Upload no more than ${PRODUCT_IMAGE_MAX_COUNT} product images.`);
  }

  return dedupedImages;
}

function buildProductDisplayStatus(product) {
  if (safeNumber(product.stock, 0) <= 0) {
    return "Out of Stock";
  }
  return product.status || "Draft";
}

function buildSellerProduct(product, sellerName) {
  return {
    ...product,
    sellerName: sellerName || "",
    status: buildProductDisplayStatus(product),
    priceText: toCurrencyText(product.price),
    discountPriceText: toCurrencyText(product.discountPrice || product.price),
    categoryKey: categoryLabelToStorefrontKey(product.category)
  };
}

function buildStorefrontProduct(store, product) {
  const seller = store.sellers.find((item) => item.id === product.sellerId);
  return {
    id: product.id,
    vendorProductId: product.id,
    sellerId: product.sellerId,
    sellerName: seller ? seller.storeName : "",
    sellerStatus: seller ? seller.status : "Active",
    name: product.name,
    image: product.image,
    images: Array.isArray(product.images) ? product.images.slice() : [product.image],
    price: product.discountPrice || product.price,
    mrp: product.price,
    priceText: toCurrencyText(product.discountPrice || product.price),
    mrpText: toCurrencyText(product.price),
    priceValue: roundCurrency(product.discountPrice || product.price),
    mrpValue: roundCurrency(product.price),
    category: product.category,
    categoryKey: categoryLabelToStorefrontKey(product.category),
    brand: product.brand,
    sizes: Array.isArray(product.sizes) ? product.sizes.slice() : [],
    colors: Array.isArray(product.colors) ? product.colors.slice() : [],
    description: product.description,
    stock: safeNumber(product.stock, 0),
    status: buildProductDisplayStatus(product),
    gender: product.gender || "",
    fabric: product.fabric || "",
    fit: product.fit || "",
    occasion: product.occasion || "",
    styleHighlights: product.styleHighlights || "",
    sleeveType: product.sleeveType || "",
    neckType: product.neckType || "",
    prettyPath: `products/${slugify(product.category)}/${slugify(product.name)}`
  };
}

function buildOrderRecord(store, order) {
  const customer = store.customers.find((item) => item.id === order.customerId);
  const seller = store.sellers.find((item) => item.id === order.sellerId);
  const product = store.products.find((item) => item.id === order.productId);
  return {
    ...order,
    customerName: customer ? customer.name : "",
    customer: customer ? customer.name : "",
    customerPhone: customer ? formatMaskedPhone(customer.phone) : "",
    sellerName: seller ? seller.storeName : "",
    seller: seller ? seller.storeName : "",
    productName: product ? product.name : (order.items[0] ? order.items[0].name : ""),
    product: product ? product.name : (order.items[0] ? order.items[0].name : ""),
    address: order.shippingAddress
  };
}

function getSellerOrders(store, sellerId) {
  return store.orders
    .filter((order) => order.sellerId === sellerId)
    .map((order) => buildOrderRecord(store, order))
    .sort((left, right) => new Date(right.placedAt) - new Date(left.placedAt));
}

function getSellerProducts(store, sellerId) {
  const seller = store.sellers.find((item) => item.id === sellerId);
  return store.products
    .filter((product) => product.sellerId === sellerId)
    .map((product) => buildSellerProduct(product, seller ? seller.storeName : ""))
    .sort((left, right) => new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt));
}

function getActiveStorefrontProducts(store) {
  return store.products
    .filter((product) => product.status === "Active" && safeNumber(product.stock, 0) > 0)
    .filter((product) => {
      const seller = store.sellers.find((item) => item.id === product.sellerId);
      return !seller || seller.status === "Active";
    })
    .map((product) => buildStorefrontProduct(store, product));
}

function groupSalesByDay(orders, daysBack) {
  const now = new Date("2026-04-27T12:00:00+05:30");
  const labels = [];
  for (let index = daysBack - 1; index >= 0; index -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - index);
    labels.push(day);
  }

  return labels.map((day) => {
    const key = day.toISOString().slice(0, 10);
    const dayOrders = orders.filter((order) => String(order.placedAt).slice(0, 10) === key);
    return {
      day: day.toLocaleDateString("en-US", { weekday: "short" }),
      label: day.toLocaleDateString("en-US", { month: "short" }),
      sales: dayOrders.reduce((sum, order) => sum + roundCurrency(order.amount), 0),
      orders: dayOrders.length,
      customers: new Set(dayOrders.map((order) => order.customerId)).size
    };
  });
}

function buildSellerPortal(store, sellerId) {
  const seller = store.sellers.find((item) => item.id === sellerId);
  if (!seller) {
    return null;
  }

  const products = getSellerProducts(store, sellerId);
  const orders = getSellerOrders(store, sellerId);
  const activeProducts = products.filter((product) => product.status === "Active").length;
  const draftProducts = products.filter((product) => ["Draft", "Pending Approval", "Rejected"].includes(product.status)).length;
  const lowStockProducts = products.filter((product) => safeNumber(product.stock, 0) > 0 && safeNumber(product.stock, 0) <= 12).length;
  const totalSales = orders.reduce((sum, order) => sum + roundCurrency(order.amount), 0);
  const pendingPayout = store.payoutRequests
    .filter((item) => item.sellerId === sellerId && item.status === "Pending")
    .reduce((sum, item) => sum + roundCurrency(item.payableAmount), 0);
  const completedPayouts = store.payoutRequests.filter(
    (item) => item.sellerId === sellerId && item.status === "Completed",
  );
  const completedAmount = completedPayouts.reduce((sum, item) => sum + roundCurrency(item.payableAmount), 0);
  const recentOrders = orders.slice(0, 7);
  const salesTrend = groupSalesByDay(orders, 7);
  const weeklyGross = salesTrend.reduce((sum, item) => sum + item.sales, 0);
  const todaySales = salesTrend[salesTrend.length - 1] ? salesTrend[salesTrend.length - 1].sales : 0;
  const thisWeekOrders = recentOrders.length;
  const thisMonthSales = orders
    .filter((order) => String(order.placedAt).startsWith("2026-04"))
    .reduce((sum, order) => sum + roundCurrency(order.amount), 0);

  return {
    sellerId: seller.id,
    sellerProfile: {
      storeName: seller.storeName,
      sellerName: seller.sellerName,
      businessEmail: seller.businessEmail,
      phoneNumber: seller.phone,
      businessAddress: seller.businessAddress,
      gstNumber: seller.gstNumber || "",
      panNumber: seller.panNumber || "",
      logo: seller.logo || "/Logo.png",
      tagline: seller.tagline || ""
    },
    storeSnapshot: {
      rating: seller.rating || 4.5,
      onTimeDispatch: seller.onTimeDispatch || "96.0%",
      responseRate: seller.responseRate || "98.0%"
    },
    bankDetails: seller.bankDetails || {},
    deliverySettings: seller.deliverySettings || {},
    notifications: (store.sellerNotifications || [])
      .filter((item) => item.sellerId === sellerId)
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
    products,
    orders,
    dashboardStats: {
      totalSales,
      totalOrders: orders.length,
      pendingOrders: orders.filter((order) => order.orderStatus !== "Delivered").length,
      activeProducts,
      lowStockProducts,
      totalEarnings: completedAmount + pendingPayout
    },
    salesSummaryCards: [
      {
        label: "Today",
        amount: todaySales,
        note: `${salesTrend[salesTrend.length - 1] ? salesTrend[salesTrend.length - 1].orders : 0} orders placed today`
      },
      {
        label: "This Week",
        amount: weeklyGross,
        note: `${thisWeekOrders} recent orders are influencing weekly momentum`
      },
      {
        label: "This Month",
        amount: thisMonthSales,
        note: `${activeProducts} active listings are contributing this month`
      }
    ],
    salesTrend,
    salesChannels: [
      { label: "Marketplace search", share: 46, amount: Math.round(totalSales * 0.46) },
      { label: "Repeat customers", share: 27, amount: Math.round(totalSales * 0.27) },
      { label: "Campaign traffic", share: 18, amount: Math.round(totalSales * 0.18) },
      { label: "Social referrals", share: 9, amount: Math.round(totalSales * 0.09) }
    ],
    payoutSummary: {
      totalEarnings: completedAmount + pendingPayout,
      availableBalance: Math.max(0, completedAmount - 24000),
      pendingPayout,
      completedPayoutsAmount: completedAmount,
      completedPayoutsCount: completedPayouts.length,
      nextSettlementDate: "2026-04-29T10:00:00+05:30"
    },
    payoutHistory: store.payoutRequests
      .filter((item) => item.sellerId === sellerId)
      .map((item) => ({
        id: item.id,
        date: item.requestDate,
        bank: `${seller.bankDetails.bankName} • ${seller.bankDetails.accountNumber.slice(-4)}`,
        amount: item.payableAmount,
        status: item.status === "Pending" ? "In Progress" : item.status,
        reference: `UTR${String(item.id).replace(/\D/g, "")}482`
      }))
      .sort((left, right) => new Date(right.date) - new Date(left.date)),
    productCategories: SELLER_PRODUCT_CATEGORIES,
    productBrands: SELLER_PRODUCT_BRANDS,
    sizeOptions: SIZE_OPTIONS,
    colorOptions: COLOR_OPTIONS,
    metrics: {
      draftProducts
    }
  };
}

function buildAdminPortal(store) {
  const orders = store.orders
    .map((order) => buildOrderRecord(store, order))
    .sort((left, right) => new Date(right.placedAt) - new Date(left.placedAt));

  const sellers = store.sellers.map((seller) => {
    const sellerProducts = store.products.filter((product) => product.sellerId === seller.id);
    const sellerOrders = orders.filter((order) => order.sellerId === seller.id);
    return {
      id: seller.id,
      sellerName: seller.sellerName,
      storeName: seller.storeName,
      email: seller.businessEmail,
      phone: seller.phone,
      status: seller.status,
      totalProducts: sellerProducts.length,
      totalSales: sellerOrders.reduce((sum, order) => sum + roundCurrency(order.amount), 0),
      location: seller.location,
      joinedAt: seller.joinedAt,
      commission: seller.commission
    };
  });

  const customers = store.customers.map((customer) => {
    const customerOrders = orders.filter((order) => order.customerId === customer.id);
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: formatMaskedPhone(customer.phone),
      totalOrders: customerOrders.length,
      totalSpent: customerOrders.reduce((sum, order) => sum + roundCurrency(order.amount), 0),
      accountStatus: customer.accountStatus,
      location: customer.location,
      joinedAt: customer.joinedAt
    };
  });

  const products = store.products
    .map((product) => {
      const seller = store.sellers.find((item) => item.id === product.sellerId);
      return {
        id: product.id,
        sellerId: product.sellerId,
        sellerName: seller ? seller.storeName : "",
        name: product.name,
        category: product.category,
        price: product.discountPrice || product.price,
        stock: product.stock,
        status: buildProductDisplayStatus(product),
        image: product.image,
        commissionRate: seller ? seller.commission : store.commissionSettings.platformCommission,
        createdAt: product.createdAt || "",
        updatedAt: product.updatedAt || ""
      };
    })
    .sort((left, right) => new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0));

  const revenueTrend = [
    { label: "Jan", revenue: 5700000, customers: 3120 },
    { label: "Feb", revenue: 6120000, customers: 3580 },
    { label: "Mar", revenue: 6950000, customers: 4020 },
    { label: "Apr", revenue: orders.reduce((sum, order) => sum + roundCurrency(order.amount), 0), customers: customers.length },
    { label: "May", revenue: 7540000, customers: 4310 },
    { label: "Jun", revenue: 8930000, customers: 4890 }
  ];

  const totalRevenue = orders.reduce((sum, order) => sum + roundCurrency(order.amount), 0);
  const pendingPayouts = store.payoutRequests.filter((item) => item.status === "Pending");
  const pendingSellerApprovals = sellers.filter((seller) => seller.status === "Pending");

  const bestSellingProducts = products
    .map((product) => {
      const productOrders = orders.filter((order) => order.productId === product.id);
      return {
        name: product.name,
        seller: product.sellerName,
        units: productOrders.reduce((sum, order) => sum + safeNumber(order.quantity, 0), 0),
        revenue: productOrders.reduce((sum, order) => sum + roundCurrency(order.amount), 0)
      };
    })
    .sort((left, right) => right.units - left.units)
    .slice(0, 4);

  return {
    adminProfile: store.adminProfile,
    overviewStats: {
      totalRevenue,
      totalOrders: orders.length,
      totalSellers: sellers.length,
      totalCustomers: customers.length,
      pendingSellerApprovals: pendingSellerApprovals.length,
      pendingPayouts: pendingPayouts.length
    },
    salesSummaryCards: [
      { label: "Today", amount: totalRevenue * 0.14, note: "Marketplace performance updated from live orders" },
      { label: "This Week", amount: totalRevenue * 0.61, note: "Weekly marketplace capture across all sellers" },
      { label: "This Month", amount: totalRevenue, note: "Current month realized GMV in the shared dataset" }
    ],
    revenueTrend,
    sellers,
    customers,
    products,
    orders,
    payoutRequests: store.payoutRequests.map((item) => {
      const seller = store.sellers.find((entry) => entry.id === item.sellerId);
      return {
        ...item,
        sellerName: seller ? seller.storeName : item.sellerId
      };
    }),
    paymentHistory: store.paymentHistory,
    categories: store.categories,
    commissionSettings: store.commissionSettings,
    reportHighlights: {
      grossSales: totalRevenue,
      sellerPerformanceScore: 92,
      customerGrowth: 18.4,
      bestSellerUnits: bestSellingProducts[0] ? bestSellingProducts[0].units : 0
    },
    bestSellingProducts,
    sellerPerformance: sellers
      .map((seller) => {
        const sellerOrders = orders.filter((order) => order.sellerId === seller.id);
        return {
          sellerName: seller.storeName,
          orders: sellerOrders.length,
          revenue: seller.totalSales,
          score: Math.max(82, Math.min(99, Math.round((safeNumber(seller.commission, 14) + safeNumber(seller.totalProducts, 0) / 10) + 74)))
        };
      })
      .sort((left, right) => right.revenue - left.revenue),
    customerGrowth: [
      { month: "Jan", total: 31800 },
      { month: "Feb", total: 34640 },
      { month: "Mar", total: 39120 },
      { month: "Apr", total: 43890 },
      { month: "May", total: 46110 },
      { month: "Jun", total: customers.length * 80 }
    ],
    adminNotifications: store.adminNotifications,
    platformSettings: store.platformSettings
  };
}

function findCustomerByIdentifier(store, identifier) {
  const normalizedIdentifier = normalize(identifier);
  const normalizedPhone = normalizePhone(identifier);

  return store.customers.find((customer) => {
    return normalize(customer.identifier) === normalizedIdentifier ||
      normalize(customer.email) === normalizedIdentifier ||
      normalizePhone(customer.phone) === normalizedPhone;
  }) || null;
}

function createAdminNotification(store, type, title, body) {
  store.adminNotifications.unshift({
    id: `NTF-${Date.now()}`,
    type,
    title,
    body,
    createdAt: new Date().toISOString(),
    read: false
  });
  store.adminNotifications = store.adminNotifications.slice(0, 20);
}

function createSellerNotification(store, sellerId, type, title, body) {
  if (!Array.isArray(store.sellerNotifications)) {
    store.sellerNotifications = [];
  }
  store.sellerNotifications.unshift({
    id: `SNTF-${sellerId}-${Date.now()}`,
    sellerId,
    type,
    title,
    body,
    createdAt: new Date().toISOString(),
    read: false
  });
  store.sellerNotifications = store.sellerNotifications.slice(0, 40);
}

function createCustomer(store, payload) {
  const nextId = `CUS-${store.meta.nextCustomerId}`;
  store.meta.nextCustomerId += 1;
  const customer = {
    id: nextId,
    identifier: normalize(payload.identifier || payload.email || payload.phone),
    name: payload.name || "",
    email: payload.email || "",
    phone: normalizePhone(payload.phone || ""),
    password: payload.password || "",
    accountStatus: payload.accountStatus || "Active",
    joinedAt: new Date().toISOString(),
    location: payload.location || "",
    gender: payload.gender || "",
    dateOfBirth: payload.dateOfBirth || ""
  };
  store.customers.push(customer);
  return customer;
}

function createSeller(store, payload) {
  const nextId = `SEL-${store.meta.nextSellerId}`;
  store.meta.nextSellerId += 1;
  const autoApprove = Boolean(store.platformSettings.autoApproveSellers);
  const status = autoApprove ? "Active" : "Pending";
  const seller = {
    id: nextId,
    sellerName: payload.fullName,
    storeName: payload.storeName,
    businessName: payload.businessName,
    businessEmail: payload.emailAddress,
    emailAddress: payload.emailAddress,
    phoneNumber: normalizePhone(payload.phoneNumber),
    phone: formatMaskedPhone(payload.phoneNumber),
    password: payload.password,
    status,
    location: `${payload.city}, ${payload.state}`,
    joinedAt: new Date().toISOString(),
    businessAddress: [payload.addressLine1, payload.addressLine2, payload.city, payload.state, payload.pincode]
      .filter(Boolean)
      .join(", "),
    gstNumber: payload.gstNumber || "",
    panNumber: payload.panNumber || "",
    category: payload.productCategory || "",
    storeDescription: payload.storeDescription || "",
    logo: "/Logo.png",
    tagline: "New marketplace seller application",
    rating: 0,
    onTimeDispatch: "0%",
    responseRate: "0%",
    commission: store.commissionSettings.platformCommission,
    bankDetails: {
      accountHolder: payload.accountHolderName || "",
      accountNumber: payload.accountNumber ? `XXXXXX${String(payload.accountNumber).slice(-4)}` : "",
      ifsc: payload.ifscCode || "",
      bankName: payload.bankName || "",
      upiId: payload.upiId || ""
    },
    deliverySettings: {
      selfShipEnabled: false,
      expressDelivery: false,
      freeShippingThreshold: 1499,
      processingTime: "48 hours",
      returnWindow: "7 days"
    }
  };
  store.sellers.push(seller);
  createAdminNotification(
    store,
    "seller",
    `${seller.storeName} submitted a seller application`,
    `${seller.sellerName} is waiting for admin review and activation.`,
  );
  return seller;
}

function createProduct(store, sellerId, payload) {
  const nextId = `PRD-${store.meta.nextProductId}`;
  store.meta.nextProductId += 1;
  const requestedStatus = String(payload.status || "").trim();
  let status = "Draft";

  if (requestedStatus === "Active") {
    status = safeNumber(payload.stock, 0) > 0 ? "Active" : "Out of Stock";
  } else if (requestedStatus === "Out of Stock") {
    status = "Out of Stock";
  } else if (payload.intent === "publish") {
    status = safeNumber(payload.stock, 0) > 0 ? "Active" : "Out of Stock";
  } else if (safeNumber(payload.stock, 0) <= 0) {
    status = "Out of Stock";
  }

  const imageList = normalizeProductImageList(payload, { required: true });

  const product = {
    id: nextId,
    sellerId,
    name: payload.name,
    category: payload.category,
    gender: payload.gender || "",
    price: roundCurrency(payload.price),
    discountPrice: roundCurrency(payload.discountPrice || payload.price),
    stock: roundCurrency(payload.stock),
    status,
    brand: payload.brand || "",
    sizes: Array.isArray(payload.sizes) ? payload.sizes : [],
    colors: Array.isArray(payload.colors) ? payload.colors : [],
    description: payload.description || "",
    image: imageList[0],
    images: imageList,
    fabric: payload.fabric || "",
    fit: payload.fit || "",
    occasion: payload.occasion || "",
    styleHighlights: payload.styleHighlights || "",
    sleeveType: payload.sleeveType || "",
    neckType: payload.neckType || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  store.products.unshift(product);
  createAdminNotification(
    store,
    "product",
    product.status === "Active" ? `${product.name} is now live` : `${product.name} needs product moderation`,
    product.status === "Active"
      ? `Seller ${sellerId} added ${product.name} and it is live in the marketplace catalog.`
      : `Seller ${sellerId} submitted ${product.name} for marketplace review.`,
  );
  createSellerNotification(
    store,
    sellerId,
    "approval",
    product.status === "Active" ? `${product.name} is live` : `${product.name} is in review`,
    product.status === "Active"
      ? "Your listing is now visible in the customer marketplace."
      : "Your listing has been submitted and is waiting for marketplace approval.",
  );
  return product;
}

function updateProduct(store, productId, payload, actor = "seller") {
  const product = store.products.find((item) => item.id === productId);
  if (!product) {
    return null;
  }

  product.name = payload.name ?? product.name;
  product.category = payload.category ?? product.category;
  product.brand = payload.brand ?? product.brand;
  product.price = payload.price !== undefined ? roundCurrency(payload.price) : product.price;
  product.discountPrice =
    payload.discountPrice !== undefined ? roundCurrency(payload.discountPrice) : product.discountPrice;
  product.stock = payload.stock !== undefined ? roundCurrency(payload.stock) : product.stock;
  product.description = payload.description ?? product.description;
  product.sizes = Array.isArray(payload.sizes) ? payload.sizes : product.sizes;
  product.colors = Array.isArray(payload.colors) ? payload.colors : product.colors;
  if (Array.isArray(payload.images) || payload.image !== undefined) {
    const nextImages = normalizeProductImageList(payload, { required: true });
    if (nextImages.length) {
      product.images = nextImages;
      product.image = nextImages[0];
    }
  }
  if (payload.status) {
    product.status = resolveAdminProductStatus(payload.status, payload.stock !== undefined ? payload.stock : product.stock);
  } else if (actor === "seller" && payload.intent === "publish") {
    product.status = product.stock > 0 ? "Active" : "Out of Stock";
  } else if (actor === "seller" && payload.intent === "draft") {
    product.status = "Draft";
  } else if (product.stock <= 0) {
    product.status = "Out of Stock";
  }
  product.updatedAt = new Date().toISOString();
  return product;
}

function createOrder(store, payload) {
  const customer = findCustomerByIdentifier(store, payload.customerIdentifier);
  if (!customer) {
    return { error: "Customer account not found." };
  }
  if (customer.accountStatus === "Blocked") {
    return { error: "This customer account is blocked." };
  }

  const orders = [];
  const items = Array.isArray(payload.items) ? payload.items : [];
  for (const lineItem of items) {
    const product = store.products.find((entry) => entry.id === lineItem.productId);
    if (!product) {
      return { error: "One or more products no longer exist." };
    }
    if (product.status !== "Active") {
      return { error: `${product.name} is not available for purchase right now.` };
    }
    const seller = store.sellers.find((entry) => entry.id === product.sellerId);
    if (seller && seller.status !== "Active") {
      return { error: `${product.name} is unavailable because the seller is inactive.` };
    }
    const quantity = Math.max(1, roundCurrency(lineItem.quantity || 1));
    if (product.stock < quantity) {
      return { error: `${product.name} does not have enough stock.` };
    }

    product.stock -= quantity;
    if (product.stock <= 0) {
      product.status = "Out of Stock";
    }
    product.updatedAt = new Date().toISOString();

    const nextId = `ORD-${store.meta.nextOrderId}`;
    store.meta.nextOrderId += 1;
    const paymentMethod = payload.paymentMethod || "UPI";
    const paymentStatus = paymentMethod === "Cash on Delivery" ? "COD" : "Paid";
    const amount = roundCurrency((product.discountPrice || product.price) * quantity);
    const order = {
      id: nextId,
      customerId: customer.id,
      sellerId: product.sellerId,
      productId: product.id,
      quantity,
      amount,
      paymentMethod,
      paymentStatus,
      orderStatus: paymentStatus === "Paid" ? "Processing" : "Processing",
      deliveryStatus: "Label Created",
      placedAt: new Date().toISOString(),
      estimatedDelivery: payload.estimatedDelivery || "2026-05-02T18:00:00+05:30",
      shippingAddress: payload.shippingAddress || "",
      items: [
        {
          productId: product.id,
          name: product.name,
          variant: `${lineItem.color || "Standard"} / ${lineItem.size || "M"}`,
          quantity,
          price: product.discountPrice || product.price
        }
      ]
    };
    store.orders.unshift(order);
    orders.push(order);

    createSellerNotification(
      store,
      product.sellerId,
      "order",
      `New order ${order.id} received`,
      `${customer.name} placed an order for ${product.name}.`,
    );
  }

  return { orders, customer };
}

function resolveAdminProductStatus(status, stock) {
  if (status === "Active" && safeNumber(stock, 0) <= 0) {
    return "Out of Stock";
  }
  return status;
}

function handleApiRequest(request, response, url) {
  const { pathname, searchParams } = url;
  const method = request.method || "GET";

  if (method === "OPTIONS") {
    setCorsHeaders(response);
    response.writeHead(204);
    response.end();
    return;
  }

  const store = readStore();

  if (method === "GET" && pathname === "/api/storefront/catalog") {
    let products = getActiveStorefrontProducts(store);
    const category = normalizeCategory(searchParams.get("category"));
    const brand = normalize(searchParams.get("brand"));
    const gender = normalize(searchParams.get("gender"));
    const sellerId = normalize(searchParams.get("sellerId"));
    const productId = normalize(searchParams.get("productId"));

    if (productId) {
      products = products.filter((product) => normalize(product.id) === productId);
    }
    if (sellerId) {
      products = products.filter((product) => normalize(product.sellerId) === sellerId);
    }
    if (category) {
      products = products.filter(
        (product) => normalizeCategory(product.category) === category || normalizeCategory(product.categoryKey) === category,
      );
    }
    if (brand) {
      products = products.filter((product) => normalize(product.brand) === brand);
    }
    if (gender) {
      products = products.filter((product) => !product.gender || normalize(product.gender) === gender);
    }

    sendJson(response, 200, { products });
    return;
  }

  if (method === "GET" && pathname.startsWith("/api/storefront/products/")) {
    const productId = pathname.split("/").pop();
    const product = getActiveStorefrontProducts(store).find((item) => item.id === productId);
    if (!product) {
      sendJson(response, 404, { message: "Product not found." });
      return;
    }
    sendJson(response, 200, { product });
    return;
  }

  if (method === "GET" && pathname === "/api/storefront/customers/by-identifier") {
    const identifier = searchParams.get("identifier") || "";
    const customer = findCustomerByIdentifier(store, identifier);
    sendJson(response, 200, { customer });
    return;
  }

  if (method === "POST" && pathname === "/api/storefront/customers/upsert") {
    readRequestBody(request)
      .then((body) => {
        let customer = findCustomerByIdentifier(store, body.identifier || body.email || body.phone);
        if (customer) {
          customer.name = body.name ?? customer.name;
          customer.email = body.email ?? customer.email;
          customer.phone = body.phone ? normalizePhone(body.phone) : customer.phone;
          customer.password = body.password ?? customer.password;
          customer.gender = body.gender ?? customer.gender;
          customer.dateOfBirth = body.dateOfBirth ?? customer.dateOfBirth;
          customer.location = body.location ?? customer.location;
          customer.accountStatus = body.accountStatus ?? customer.accountStatus;
        } else {
          customer = createCustomer(store, body);
        }
        writeStore(store);
        sendJson(response, 200, { customer });
      })
      .catch((error) => sendJson(response, 400, { message: error.message }));
    return;
  }

  if (method === "PUT" && pathname.startsWith("/api/storefront/customers/")) {
    readRequestBody(request)
      .then((body) => {
        const customerId = pathname.split("/").pop();
        const customer = store.customers.find((item) => item.id === customerId);
        if (!customer) {
          sendJson(response, 404, { message: "Customer not found." });
          return;
        }
        customer.name = body.name ?? customer.name;
        customer.email = body.email ?? customer.email;
        customer.phone = body.phone ? normalizePhone(body.phone) : customer.phone;
        customer.gender = body.gender ?? customer.gender;
        customer.dateOfBirth = body.dateOfBirth ?? customer.dateOfBirth;
        customer.location = body.location ?? customer.location;
        writeStore(store);
        sendJson(response, 200, { customer });
      })
      .catch((error) => sendJson(response, 400, { message: error.message }));
    return;
  }

  if (method === "GET" && pathname === "/api/storefront/orders") {
    const customerId = searchParams.get("customerId");
    const customerIdentifier = searchParams.get("identifier");
    let targetCustomerId = customerId;
    if (!targetCustomerId && customerIdentifier) {
      const customer = findCustomerByIdentifier(store, customerIdentifier);
      targetCustomerId = customer ? customer.id : "";
    }

    const orders = store.orders
      .filter((order) => !targetCustomerId || order.customerId === targetCustomerId)
      .map((order) => buildOrderRecord(store, order))
      .sort((left, right) => new Date(right.placedAt) - new Date(left.placedAt));

    sendJson(response, 200, { orders });
    return;
  }

  if (method === "POST" && pathname === "/api/storefront/orders") {
    readRequestBody(request)
      .then((body) => {
        const result = createOrder(store, body);
        if (result.error) {
          sendJson(response, 400, { message: result.error });
          return;
        }
        writeStore(store);
        sendJson(response, 201, {
          orders: result.orders.map((order) => buildOrderRecord(store, order))
        });
      })
      .catch((error) => sendJson(response, 400, { message: error.message }));
    return;
  }

  if (method === "POST" && pathname === "/api/storefront/sellers/register") {
    readRequestBody(request)
      .then((body) => {
        const existingSeller = store.sellers.find((seller) => {
          return normalize(seller.emailAddress) === normalize(body.emailAddress) ||
            normalizePhone(seller.phoneNumber) === normalizePhone(body.phoneNumber) ||
            normalize(seller.storeName) === normalize(body.storeName);
        });
        if (existingSeller) {
          sendJson(response, 409, { message: "Seller account already exists with this email, phone, or store name." });
          return;
        }
        const seller = createSeller(store, body);
        writeStore(store);
        sendJson(response, 201, { seller });
      })
      .catch((error) => sendJson(response, 400, { message: error.message }));
    return;
  }

  if (method === "POST" && pathname === "/api/storefront/sellers/login") {
    readRequestBody(request)
      .then((body) => {
        const identifier = body.identifier || "";
        const password = String(body.password || "");
        const seller = store.sellers.find((item) => {
          return normalize(item.emailAddress) === normalize(identifier) ||
            normalizePhone(item.phoneNumber) === normalizePhone(identifier);
        });
        if (!seller || String(seller.password || "") !== password) {
          sendJson(response, 401, { message: "Invalid seller credentials." });
          return;
        }
        if (seller.status !== "Active") {
          const statusMessage = seller.status === "Pending"
            ? "Your seller account is pending admin approval."
            : "Your seller account is suspended.";
          sendJson(response, 403, { message: statusMessage, status: seller.status });
          return;
        }
        sendJson(response, 200, {
          seller: {
            sellerId: seller.id,
            sellerName: seller.sellerName,
            storeName: seller.storeName,
            emailAddress: seller.emailAddress,
            phoneNumber: seller.phoneNumber,
            businessName: seller.businessName,
            status: seller.status
          }
        });
      })
      .catch((error) => sendJson(response, 400, { message: error.message }));
    return;
  }

  if (method === "GET" && pathname.startsWith("/api/sellers/portal/")) {
    const sellerId = pathname.split("/").pop();
    const portal = buildSellerPortal(store, sellerId);
    if (!portal) {
      sendJson(response, 404, { message: "Seller portal not found." });
      return;
    }
    sendJson(response, 200, portal);
    return;
  }

  if (method === "POST" && pathname.startsWith("/api/sellers/") && pathname.endsWith("/products")) {
    readRequestBody(request)
      .then((body) => {
        const sellerId = pathname.split("/")[3];
        const product = createProduct(store, sellerId, body);
        const seller = store.sellers.find((item) => item.id === sellerId);
        writeStore(store);
        sendJson(response, 201, { product: buildSellerProduct(product, seller ? seller.storeName : "") });
      })
      .catch((error) => sendJson(response, 400, { message: error.message }));
    return;
  }

  if ((method === "PUT" || method === "PATCH") && pathname.startsWith("/api/sellers/") && pathname.includes("/products/")) {
    readRequestBody(request)
      .then((body) => {
        const productId = pathname.split("/").pop();
        const product = updateProduct(store, productId, body, "seller");
        if (!product) {
          sendJson(response, 404, { message: "Product not found." });
          return;
        }
        const seller = store.sellers.find((item) => item.id === product.sellerId);
        writeStore(store);
        sendJson(response, 200, { product: buildSellerProduct(product, seller ? seller.storeName : "") });
      })
      .catch((error) => sendJson(response, 400, { message: error.message }));
    return;
  }

  if (method === "DELETE" && pathname.startsWith("/api/sellers/") && pathname.includes("/products/")) {
    const productId = pathname.split("/").pop();
    const productIndex = store.products.findIndex((item) => item.id === productId);
    if (productIndex === -1) {
      sendJson(response, 404, { message: "Product not found." });
      return;
    }
    const [deletedProduct] = store.products.splice(productIndex, 1);
    createAdminNotification(
      store,
      "product",
      `${deletedProduct.name} was removed by the seller`,
      "The product was deleted from the seller catalog and is no longer visible.",
    );
    writeStore(store);
    sendJson(response, 200, { success: true });
    return;
  }

  if ((method === "PUT" || method === "PATCH") && pathname.startsWith("/api/sellers/") && pathname.endsWith("/profile")) {
    readRequestBody(request)
      .then((body) => {
        const sellerId = pathname.split("/")[3];
        const seller = store.sellers.find((item) => item.id === sellerId);
        if (!seller) {
          sendJson(response, 404, { message: "Seller not found." });
          return;
        }
        seller.storeName = body.storeName ?? seller.storeName;
        seller.sellerName = body.sellerName ?? seller.sellerName;
        seller.businessEmail = body.businessEmail ?? seller.businessEmail;
        seller.emailAddress = body.businessEmail ?? seller.emailAddress;
        seller.phone = body.phoneNumber ?? seller.phone;
        seller.phoneNumber = normalizePhone(body.phoneNumber ?? seller.phoneNumber);
        seller.businessAddress = body.businessAddress ?? seller.businessAddress;
        seller.gstNumber = body.gstNumber ?? seller.gstNumber;
        seller.panNumber = body.panNumber ?? seller.panNumber;
        seller.logo = body.logo ?? seller.logo;
        seller.tagline = body.tagline ?? seller.tagline;
        writeStore(store);
        sendJson(response, 200, { seller });
      })
      .catch((error) => sendJson(response, 400, { message: error.message }));
    return;
  }

  if ((method === "PUT" || method === "PATCH") && pathname.startsWith("/api/sellers/") && pathname.endsWith("/bank-details")) {
    readRequestBody(request)
      .then((body) => {
        const sellerId = pathname.split("/")[3];
        const seller = store.sellers.find((item) => item.id === sellerId);
        if (!seller) {
          sendJson(response, 404, { message: "Seller not found." });
          return;
        }
        seller.bankDetails = { ...seller.bankDetails, ...body };
        writeStore(store);
        sendJson(response, 200, { bankDetails: seller.bankDetails });
      })
      .catch((error) => sendJson(response, 400, { message: error.message }));
    return;
  }

  if ((method === "PUT" || method === "PATCH") && pathname.startsWith("/api/sellers/") && pathname.endsWith("/delivery-settings")) {
    readRequestBody(request)
      .then((body) => {
        const sellerId = pathname.split("/")[3];
        const seller = store.sellers.find((item) => item.id === sellerId);
        if (!seller) {
          sendJson(response, 404, { message: "Seller not found." });
          return;
        }
        seller.deliverySettings = { ...seller.deliverySettings, ...body };
        writeStore(store);
        sendJson(response, 200, { deliverySettings: seller.deliverySettings });
      })
      .catch((error) => sendJson(response, 400, { message: error.message }));
    return;
  }

  if ((method === "PUT" || method === "PATCH") && pathname.startsWith("/api/sellers/") && pathname.endsWith("/notifications/read-all")) {
    const sellerId = pathname.split("/")[3];
    const sellerNotifications = Array.isArray(store.sellerNotifications) ? store.sellerNotifications : [];
    sellerNotifications.forEach((item) => {
      if (item.sellerId === sellerId) {
        item.read = true;
      }
    });
    writeStore(store);
    sendJson(response, 200, { success: true });
    return;
  }

  if ((method === "PUT" || method === "PATCH") && pathname.startsWith("/api/sellers/") && pathname.includes("/notifications/")) {
    const sellerId = pathname.split("/")[3];
    const notificationId = pathname.split("/").pop();
    const notification = (store.sellerNotifications || []).find(
      (item) => item.sellerId === sellerId && item.id === notificationId,
    );
    if (!notification) {
      sendJson(response, 404, { message: "Notification not found." });
      return;
    }
    notification.read = true;
    writeStore(store);
    sendJson(response, 200, { notification });
    return;
  }

  if ((method === "PUT" || method === "PATCH") && pathname.startsWith("/api/sellers/") && pathname.endsWith("/password")) {
    readRequestBody(request)
      .then((body) => {
        const sellerId = pathname.split("/")[3];
        const seller = store.sellers.find((item) => item.id === sellerId);
        if (!seller) {
          sendJson(response, 404, { message: "Seller not found." });
          return;
        }
        if (String(seller.password || "") !== String(body.currentPassword || "")) {
          sendJson(response, 400, { message: "Current password is incorrect." });
          return;
        }
        seller.password = String(body.newPassword || "");
        writeStore(store);
        sendJson(response, 200, { success: true });
      })
      .catch((error) => sendJson(response, 400, { message: error.message }));
    return;
  }

  if ((method === "PUT" || method === "PATCH") && pathname.startsWith("/api/sellers/") && pathname.includes("/orders/")) {
    readRequestBody(request)
      .then((body) => {
        const orderId = pathname.split("/").pop();
        const order = store.orders.find((item) => item.id === orderId);
        if (!order) {
          sendJson(response, 404, { message: "Order not found." });
          return;
        }
        order.orderStatus = body.orderStatus || order.orderStatus;
        order.deliveryStatus = body.deliveryStatus || order.deliveryStatus;
        writeStore(store);
        sendJson(response, 200, { order: buildOrderRecord(store, order) });
      })
      .catch((error) => sendJson(response, 400, { message: error.message }));
    return;
  }

  if (method === "GET" && pathname === "/api/admin/portal") {
    sendJson(response, 200, buildAdminPortal(store));
    return;
  }

  if ((method === "PUT" || method === "PATCH") && pathname.startsWith("/api/admin/sellers/")) {
    readRequestBody(request)
      .then((body) => {
        const sellerId = pathname.split("/").pop();
        const seller = store.sellers.find((item) => item.id === sellerId);
        if (!seller) {
          sendJson(response, 404, { message: "Seller not found." });
          return;
        }
        seller.status = body.status || seller.status;
        createSellerNotification(
          store,
          sellerId,
          "approval",
          `Seller account status changed to ${seller.status}`,
          `Admin updated your seller account to ${seller.status}.`,
        );
        writeStore(store);
        sendJson(response, 200, { seller });
      })
      .catch((error) => sendJson(response, 400, { message: error.message }));
    return;
  }

  if ((method === "PUT" || method === "PATCH") && pathname.startsWith("/api/admin/customers/")) {
    readRequestBody(request)
      .then((body) => {
        const customerId = pathname.split("/").pop();
        const customer = store.customers.find((item) => item.id === customerId);
        if (!customer) {
          sendJson(response, 404, { message: "Customer not found." });
          return;
        }
        customer.accountStatus = body.accountStatus || customer.accountStatus;
        writeStore(store);
        sendJson(response, 200, { customer });
      })
      .catch((error) => sendJson(response, 400, { message: error.message }));
    return;
  }

  if ((method === "PUT" || method === "PATCH") && pathname.startsWith("/api/admin/products/")) {
    readRequestBody(request)
      .then((body) => {
        const productId = pathname.split("/").pop();
        const product = updateProduct(store, productId, {
          ...body,
          status: resolveAdminProductStatus(body.status || body.orderStatus || body.productStatus || body.state || body.status, body.stock ?? undefined)
        }, "admin");
        if (!product) {
          sendJson(response, 404, { message: "Product not found." });
          return;
        }
        writeStore(store);
        sendJson(response, 200, { product });
      })
      .catch((error) => sendJson(response, 400, { message: error.message }));
    return;
  }

  if (method === "DELETE" && pathname.startsWith("/api/admin/products/")) {
    const productId = pathname.split("/").pop();
    const productIndex = store.products.findIndex((item) => item.id === productId);
    if (productIndex === -1) {
      sendJson(response, 404, { message: "Product not found." });
      return;
    }
    store.products.splice(productIndex, 1);
    writeStore(store);
    sendJson(response, 200, { success: true });
    return;
  }

  if ((method === "PUT" || method === "PATCH") && pathname.startsWith("/api/admin/orders/")) {
    readRequestBody(request)
      .then((body) => {
        const orderId = pathname.split("/").pop();
        const order = store.orders.find((item) => item.id === orderId);
        if (!order) {
          sendJson(response, 404, { message: "Order not found." });
          return;
        }
        order.orderStatus = body.orderStatus || order.orderStatus;
        order.deliveryStatus = body.deliveryStatus || order.deliveryStatus;
        writeStore(store);
        sendJson(response, 200, { order: buildOrderRecord(store, order) });
      })
      .catch((error) => sendJson(response, 400, { message: error.message }));
    return;
  }

  if ((method === "PUT" || method === "PATCH") && pathname.startsWith("/api/admin/payouts/")) {
    readRequestBody(request)
      .then((body) => {
        const payoutId = pathname.split("/").pop();
        const payout = store.payoutRequests.find((item) => item.id === payoutId);
        if (!payout) {
          sendJson(response, 404, { message: "Payout request not found." });
          return;
        }
        payout.status = body.status || payout.status;
        writeStore(store);
        sendJson(response, 200, { payout });
      })
      .catch((error) => sendJson(response, 400, { message: error.message }));
    return;
  }

  if (method === "POST" && pathname === "/api/admin/categories") {
    readRequestBody(request)
      .then((body) => {
        const category = {
          id: `CAT-${store.meta.nextCategoryId}`,
          name: body.name || "New Category",
          parentCategory: body.parentCategory || "Root",
          subcategory: body.subcategory || "",
          status: body.status || "Active",
          image: body.image || "/Banner.jpg"
        };
        store.meta.nextCategoryId += 1;
        store.categories.unshift(category);
        writeStore(store);
        sendJson(response, 201, { category });
      })
      .catch((error) => sendJson(response, 400, { message: error.message }));
    return;
  }

  if ((method === "PUT" || method === "PATCH") && pathname.startsWith("/api/admin/categories/")) {
    readRequestBody(request)
      .then((body) => {
        const categoryId = pathname.split("/").pop();
        const category = store.categories.find((item) => item.id === categoryId);
        if (!category) {
          sendJson(response, 404, { message: "Category not found." });
          return;
        }
        Object.assign(category, body);
        writeStore(store);
        sendJson(response, 200, { category });
      })
      .catch((error) => sendJson(response, 400, { message: error.message }));
    return;
  }

  if (method === "DELETE" && pathname.startsWith("/api/admin/categories/")) {
    const categoryId = pathname.split("/").pop();
    const index = store.categories.findIndex((item) => item.id === categoryId);
    if (index === -1) {
      sendJson(response, 404, { message: "Category not found." });
      return;
    }
    store.categories.splice(index, 1);
    writeStore(store);
    sendJson(response, 200, { success: true });
    return;
  }

  if ((method === "PUT" || method === "PATCH") && pathname === "/api/admin/commission-settings") {
    readRequestBody(request)
      .then((body) => {
        store.commissionSettings = {
          ...store.commissionSettings,
          ...body
        };
        writeStore(store);
        sendJson(response, 200, { commissionSettings: store.commissionSettings });
      })
      .catch((error) => sendJson(response, 400, { message: error.message }));
    return;
  }

  if ((method === "PUT" || method === "PATCH") && pathname === "/api/admin/platform-settings") {
    readRequestBody(request)
      .then((body) => {
        store.platformSettings = {
          ...store.platformSettings,
          ...body
        };
        writeStore(store);
        sendJson(response, 200, { platformSettings: store.platformSettings });
      })
      .catch((error) => sendJson(response, 400, { message: error.message }));
    return;
  }

  if ((method === "PUT" || method === "PATCH") && pathname === "/api/admin/profile") {
    readRequestBody(request)
      .then((body) => {
        store.adminProfile = {
          ...store.adminProfile,
          ...body
        };
        writeStore(store);
        sendJson(response, 200, { adminProfile: store.adminProfile });
      })
      .catch((error) => sendJson(response, 400, { message: error.message }));
    return;
  }

  sendJson(response, 404, { message: "API route not found." });
}

function resolveStaticFile(filePath) {
  try {
    const resolvedPath = path.resolve(filePath);
    const stats = fs.statSync(resolvedPath);
    if (stats.isDirectory()) {
      return path.join(resolvedPath, "index.html");
    }
    return resolvedPath;
  } catch (error) {
    return "";
  }
}

function serveFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[extension] || "application/octet-stream";
  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendText(response, 500, "Unable to read file.");
      return;
    }
    response.writeHead(200, { "Content-Type": mimeType });
    response.end(content);
  });
}

function serveStaticRoute(response, pathname) {
  if (pathname.startsWith("/seller-dashboard")) {
    const relativePath = pathname.replace(/^\/seller-dashboard\/?/, "");
    const requestedFile = resolveStaticFile(path.join(SELLER_DIST_DIR, relativePath || "index.html"));
    if (requestedFile && requestedFile.startsWith(SELLER_DIST_DIR)) {
      serveFile(response, requestedFile);
      return true;
    }
    const fallbackFile = path.join(SELLER_DIST_DIR, "index.html");
    if (fs.existsSync(fallbackFile)) {
      serveFile(response, fallbackFile);
      return true;
    }
    return false;
  }

  if (pathname.startsWith("/super-admin-dashboard")) {
    const relativePath = pathname.replace(/^\/super-admin-dashboard\/?/, "");
    const requestedFile = resolveStaticFile(path.join(ADMIN_DIST_DIR, relativePath || "index.html"));
    if (requestedFile && requestedFile.startsWith(ADMIN_DIST_DIR)) {
      serveFile(response, requestedFile);
      return true;
    }
    const fallbackFile = path.join(ADMIN_DIST_DIR, "index.html");
    if (fs.existsSync(fallbackFile)) {
      serveFile(response, fallbackFile);
      return true;
    }
    return false;
  }

  const safePath = pathname === "/" ? "/index.html" : pathname;
  const requestedFile = resolveStaticFile(path.join(ROOT_DIR, safePath));
  if (requestedFile && requestedFile.startsWith(ROOT_DIR) && fs.existsSync(requestedFile)) {
    serveFile(response, requestedFile);
    return true;
  }
  return false;
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || `localhost:${PORT}`}`);

  if (url.pathname.startsWith("/api/")) {
    handleApiRequest(request, response, url);
    return;
  }

  if (serveStaticRoute(response, url.pathname)) {
    return;
  }

  sendText(response, 404, "Not found.");
});

server.listen(PORT, () => {
  console.log(`Fresh Republic marketplace server is running at http://localhost:${PORT}`);
});
