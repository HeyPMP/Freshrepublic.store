const API_CONFIG = {
  BASE_URL: "http://localhost:4170/api",
  STORAGE_KEY_TOKEN: "fr_token",
  STORAGE_KEY_USER: "fr_user",
  STORAGE_KEY_ROLE: "fr_role"
};

const MARKETPLACE_CATALOG_CACHE_KEY = "fr_vendor_products_v1";
const MARKETPLACE_CATALOG_SYNC_KEY = "fr_marketplace_catalog_synced_at_v1";

class APIClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.token = localStorage.getItem(API_CONFIG.STORAGE_KEY_TOKEN);
  }

  normalizeMarketplaceCatalogProduct(product) {
    if (!product || typeof product !== "object") {
      return null;
    }

    const galleryImages = Array.isArray(product.images)
      ? product.images
        .map((image) => String(image || "").trim())
        .filter(Boolean)
      : [];
    const primaryImage = String(product.image || galleryImages[0] || "").trim();
    const dedupedImages = [];

    [primaryImage].concat(galleryImages).forEach((image) => {
      if (image && !dedupedImages.includes(image)) {
        dedupedImages.push(image);
      }
    });

    return {
      ...product,
      id: String(product.id || product.vendorProductId || "").trim(),
      vendorProductId: String(product.vendorProductId || product.id || "").trim(),
      sellerId: String(product.sellerId || "").trim(),
      sellerName: String(product.sellerName || "").trim(),
      image: primaryImage,
      images: dedupedImages,
      price: Number(product.priceValue ?? product.price ?? 0),
      mrp: Number(product.mrpValue ?? product.mrp ?? product.price ?? 0),
      priceValue: Number(product.priceValue ?? product.price ?? 0),
      mrpValue: Number(product.mrpValue ?? product.mrp ?? product.price ?? 0),
      sizes: Array.isArray(product.sizes) ? product.sizes.filter(Boolean) : [],
      colors: Array.isArray(product.colors) ? product.colors.filter(Boolean) : [],
      stock: Number(product.stock || 0),
      status: product.status || "Active"
    };
  }

  writeMarketplaceCatalogCache(products) {
    const normalizedProducts = (Array.isArray(products) ? products : [])
      .map((product) => this.normalizeMarketplaceCatalogProduct(product))
      .filter(Boolean);

    try {
      localStorage.setItem(MARKETPLACE_CATALOG_CACHE_KEY, JSON.stringify(normalizedProducts));
      localStorage.setItem(MARKETPLACE_CATALOG_SYNC_KEY, String(Date.now()));
    } catch (error) {
      console.warn("Failed to persist marketplace catalog cache:", error.message);
    }

    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function" && typeof window.CustomEvent === "function") {
      window.dispatchEvent(new window.CustomEvent("marketplace:catalog-updated", {
        detail: { products: normalizedProducts }
      }));
    }

    return normalizedProducts;
  }

  async refreshMarketplaceCatalogCache() {
    try {
      const result = await this.request("GET", "/storefront/catalog", null, { includeAuth: false });
      return this.writeMarketplaceCatalogCache(result.products || []);
    } catch (error) {
      console.warn("Failed to refresh marketplace catalog cache:", error.message);
      return [];
    }
  }

  getHeaders(includeAuth = true) {
    const headers = { "Content-Type": "application/json" };
    if (includeAuth && this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(method, endpoint, data = null, options = {}) {
    const includeAuth = options.includeAuth === true;
    const requestOptions = {
      method,
      headers: this.getHeaders(includeAuth)
    };

    if (data !== null && data !== undefined) {
      requestOptions.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, requestOptions);
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error.message);
      throw error;
    }
  }

  setAuth(token, user, role) {
    localStorage.setItem(API_CONFIG.STORAGE_KEY_TOKEN, token);
    localStorage.setItem(API_CONFIG.STORAGE_KEY_USER, JSON.stringify(user));
    localStorage.setItem(API_CONFIG.STORAGE_KEY_ROLE, role);
    this.token = token;
  }

  getAuth() {
    return {
      token: localStorage.getItem(API_CONFIG.STORAGE_KEY_TOKEN),
      user: JSON.parse(localStorage.getItem(API_CONFIG.STORAGE_KEY_USER) || "null"),
      role: localStorage.getItem(API_CONFIG.STORAGE_KEY_ROLE)
    };
  }

  isAuthenticated() {
    return !!localStorage.getItem(API_CONFIG.STORAGE_KEY_TOKEN);
  }

  logout() {
    localStorage.removeItem(API_CONFIG.STORAGE_KEY_TOKEN);
    localStorage.removeItem(API_CONFIG.STORAGE_KEY_USER);
    localStorage.removeItem(API_CONFIG.STORAGE_KEY_ROLE);
    this.token = null;
  }

  getCurrentUser() {
    return this.getAuth().user || {};
  }

  getCurrentSellerId() {
    const user = this.getCurrentUser();
    const explicitSellerId = String(user.sellerId || user.id || "").trim();
    if (explicitSellerId) {
      return explicitSellerId;
    }

    const fallbackStoreName = String(user.storeName || "").trim().toLowerCase();
    const fallbackEmail = String(user.email || user.emailAddress || "").trim().toLowerCase();
    if (fallbackStoreName === "fresh republic demo store" || fallbackEmail === "seller@example.com") {
      return "SEL-406";
    }

    return "";
  }

  async fetchSellerPortal() {
    const sellerId = this.getCurrentSellerId();
    if (!sellerId) {
      throw new Error("Seller session not found.");
    }
    return this.request("GET", `/sellers/portal/${encodeURIComponent(sellerId)}`);
  }

  async fetchAdminPortal() {
    return this.request("GET", "/admin/portal");
  }

  normalizeSellerUser(seller) {
    const sellerId = String(seller.sellerId || seller.id || "").trim();
    return {
      id: sellerId,
      sellerId,
      name: seller.sellerName || seller.name || seller.storeName || "Seller",
      sellerName: seller.sellerName || seller.name || seller.storeName || "Seller",
      storeName: seller.storeName || seller.name || "Fresh Republic Store",
      email: seller.emailAddress || seller.email || "",
      emailAddress: seller.emailAddress || seller.email || "",
      phone: seller.phoneNumber || seller.phone || "",
      phoneNumber: seller.phoneNumber || seller.phone || "",
      businessName: seller.businessName || seller.storeName || "",
      status: seller.status || "Active"
    };
  }

  normalizeCustomerUser(customer) {
    const customerId = String(customer.id || customer.customerId || "").trim();
    return {
      id: customerId,
      customerId,
      name: customer.name || "Customer",
      email: customer.email || "",
      phone: customer.phone || "",
      identifier: customer.identifier || customer.email || customer.phone || "",
      accountStatus: customer.accountStatus || "Active"
    };
  }

  normalizeSellerProduct(product) {
    if (!product || typeof product !== "object") {
      return null;
    }

    return {
      id: product.id || "",
      sellerId: product.sellerId || "",
      sellerName: product.sellerName || "",
      name: product.name || "Product",
      category: product.category || "",
      brand: product.brand || "",
      price: Number(product.price || 0),
      discountPrice: Number(product.discountPrice || product.price || 0),
      stock: Number(product.stock || 0),
      totalSold: Number(product.totalSold || 0),
      status: product.status || "Active",
      description: product.description || "",
      image: product.image || "",
      images: Array.isArray(product.images) ? product.images.slice() : [],
      sizes: Array.isArray(product.sizes) ? product.sizes.slice() : [],
      colors: Array.isArray(product.colors) ? product.colors.slice() : [],
      gender: product.gender || "",
      createdAt: product.createdAt || "",
      updatedAt: product.updatedAt || ""
    };
  }

  normalizeOrder(order) {
    if (!order || typeof order !== "object") {
      return null;
    }

    const items = Array.isArray(order.items) ? order.items.slice() : [];
    return {
      ...order,
      id: order.id || "",
      customerName: order.customerName || order.customer || "",
      sellerName: order.sellerName || order.seller || "",
      totalAmount: Number(order.totalAmount || order.amount || 0),
      amount: Number(order.amount || order.totalAmount || 0),
      items,
      status: order.status || order.orderStatus || "Processing",
      orderStatus: order.orderStatus || order.status || "Processing",
      deliveryStatus: order.deliveryStatus || "",
      placedAt: order.placedAt || "",
      productName: order.productName || order.product || ""
    };
  }

  normalizeAdminProduct(product) {
    if (!product || typeof product !== "object") {
      return null;
    }

    return {
      id: product.id || "",
      sellerId: product.sellerId || "",
      sellerName: product.sellerName || "",
      name: product.name || "Product",
      category: product.category || "",
      price: Number(product.price || 0),
      stock: Number(product.stock || 0),
      status: product.status || "Active",
      image: product.image || "",
      createdAt: product.createdAt || "",
      updatedAt: product.updatedAt || ""
    };
  }

  async sellerRegister(data) {
    const result = await this.request("POST", "/storefront/sellers/register", data, { includeAuth: false });
    if (result && result.seller && result.seller.status === "Active") {
      const seller = this.normalizeSellerUser(result.seller);
      this.setAuth(`seller-${seller.sellerId || Date.now()}`, seller, "seller");
    }
    return result;
  }

  async sellerLogin(data) {
    const identifier = data.identifier || data.email || data.phone || "";
    const result = await this.request(
      "POST",
      "/storefront/sellers/login",
      { identifier, password: data.password || "" },
      { includeAuth: false }
    );

    if (result && result.seller) {
      const seller = this.normalizeSellerUser(result.seller);
      this.setAuth(`seller-${seller.sellerId || Date.now()}`, seller, "seller");
      return { ...result, token: `seller-${seller.sellerId || Date.now()}`, seller };
    }

    return result;
  }

  async customerRegister(data) {
    const payload = {
      identifier: data.email || data.phone || data.name || "",
      name: data.name || "",
      email: data.email || "",
      phone: data.phone || "",
      password: data.password || "",
      accountStatus: "Active"
    };
    const result = await this.request("POST", "/storefront/customers/upsert", payload, { includeAuth: false });
    if (result && result.customer) {
      const customer = this.normalizeCustomerUser(result.customer);
      this.setAuth(`customer-${customer.customerId || Date.now()}`, customer, "customer");
      return { ...result, token: `customer-${customer.customerId || Date.now()}`, customer };
    }
    return result;
  }

  async customerLogin(data) {
    const identifier = data.identifier || data.email || data.phone || "";
    const result = await this.request(
      "GET",
      `/storefront/customers/by-identifier?identifier=${encodeURIComponent(identifier)}`,
      null,
      { includeAuth: false }
    );

    if (!result.customer) {
      throw new Error("Customer account not found.");
    }

    if (String(result.customer.password || "") !== String(data.password || "")) {
      throw new Error("Invalid customer credentials.");
    }

    const customer = this.normalizeCustomerUser(result.customer);
    this.setAuth(`customer-${customer.customerId || Date.now()}`, customer, "customer");
    return { ...result, token: `customer-${customer.customerId || Date.now()}`, customer };
  }

  async adminLogin(data) {
    const result = await this.fetchAdminPortal();
    const adminProfile = result.adminProfile || {};
    const inputEmail = String(data.email || "").trim().toLowerCase();
    const adminEmail = String(adminProfile.email || "").trim().toLowerCase();

    if (!inputEmail || inputEmail !== adminEmail || !String(data.password || "").trim()) {
      throw new Error("Invalid admin credentials.");
    }

    const admin = {
      id: "admin-portal",
      name: adminProfile.name || "Admin",
      email: adminProfile.email || "",
      role: adminProfile.role || "Super Admin"
    };
    this.setAuth("admin-portal-token", admin, "admin");
    return { admin, token: "admin-portal-token" };
  }

  async getSellerDashboard() {
    const portal = await this.fetchSellerPortal();
    const products = Array.isArray(portal.products) ? portal.products : [];
    const stats = portal.dashboardStats || {};
    return {
      data: {
        metrics: {
          totalRevenue: Number(stats.totalSales || 0),
          totalOrders: Number(stats.totalOrders || 0),
          totalEarnings: Number(stats.totalEarnings || 0),
          totalProducts: products.length
        }
      }
    };
  }

  async getSellerProfile() {
    const portal = await this.fetchSellerPortal();
    return { data: portal.sellerProfile || {} };
  }

  async updateSellerProfile(data) {
    const sellerId = this.getCurrentSellerId();
    const result = await this.request("PUT", `/sellers/${encodeURIComponent(sellerId)}/profile`, data);
    return { data: result.seller || result };
  }

  async createProduct(data) {
    const sellerId = this.getCurrentSellerId();
    const result = await this.request("POST", `/sellers/${encodeURIComponent(sellerId)}/products`, data);
    const product = this.normalizeSellerProduct(result.product || result);
    await this.refreshMarketplaceCatalogCache();
    return { data: product };
  }

  async getMyProducts() {
    const portal = await this.fetchSellerPortal();
    const products = (portal.products || [])
      .map((product) => this.normalizeSellerProduct(product))
      .filter(Boolean)
      .sort((left, right) => new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0));
    return { data: products };
  }

  async updateProduct(productId, data) {
    const auth = this.getAuth();
    const endpoint = auth.role === "admin"
      ? `/admin/products/${encodeURIComponent(productId)}`
      : `/sellers/${encodeURIComponent(this.getCurrentSellerId())}/products/${encodeURIComponent(productId)}`;
    const result = await this.request("PUT", endpoint, data);
    const product = this.normalizeSellerProduct(result.product || result);
    await this.refreshMarketplaceCatalogCache();
    return { data: product };
  }

  async deleteProduct(productId) {
    const sellerId = this.getCurrentSellerId();
    const result = await this.request("DELETE", `/sellers/${encodeURIComponent(sellerId)}/products/${encodeURIComponent(productId)}`);
    await this.refreshMarketplaceCatalogCache();
    return result;
  }

  async getProduct(productId) {
    const auth = this.getAuth();
    if (auth.role === "seller") {
      const portal = await this.fetchSellerPortal();
      const product = (portal.products || []).find((item) => String(item.id) === String(productId));
      if (!product) {
        throw new Error("Product not found.");
      }
      return { data: this.normalizeSellerProduct(product) };
    }

    const portal = await this.fetchAdminPortal();
    const product = (portal.products || []).find((item) => String(item.id) === String(productId));
    if (!product) {
      throw new Error("Product not found.");
    }
    return { data: this.normalizeAdminProduct(product) };
  }

  async getStorefrontProducts(filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value);
      }
    });
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request("GET", `/storefront/catalog${query}`);
  }

  async getSellerOrders() {
    const portal = await this.fetchSellerPortal();
    const orders = (portal.orders || [])
      .map((order) => this.normalizeOrder(order))
      .filter(Boolean);
    return { data: orders };
  }

  async updateOrderStatus(orderId, status) {
    const sellerId = this.getCurrentSellerId();
    const result = await this.request(
      "PUT",
      `/sellers/${encodeURIComponent(sellerId)}/orders/${encodeURIComponent(orderId)}`,
      { orderStatus: status }
    );
    return { data: this.normalizeOrder(result.order || result) };
  }

  async getOrder(orderId) {
    const auth = this.getAuth();
    if (auth.role === "seller") {
      const portal = await this.fetchSellerPortal();
      const order = (portal.orders || []).find((item) => String(item.id) === String(orderId));
      if (!order) {
        throw new Error("Order not found.");
      }
      return { data: this.normalizeOrder(order) };
    }

    const portal = await this.fetchAdminPortal();
    const order = (portal.orders || []).find((item) => String(item.id) === String(orderId));
    if (!order) {
      throw new Error("Order not found.");
    }
    return { data: this.normalizeOrder(order) };
  }

  async createOrder(data) {
    return this.request("POST", "/storefront/orders", data, { includeAuth: false });
  }

  async getCustomerOrders() {
    const user = this.getCurrentUser();
    const customerId = user.customerId || user.id || "";
    const query = customerId ? `?customerId=${encodeURIComponent(customerId)}` : "";
    const result = await this.request("GET", `/storefront/orders${query}`);
    return { data: Array.isArray(result.orders) ? result.orders.map((order) => this.normalizeOrder(order)).filter(Boolean) : [] };
  }

  async requestPayout() {
    throw new Error("Payout requests are not enabled in this demo.");
  }

  async getMyPayouts() {
    const portal = await this.fetchSellerPortal();
    return { data: portal.payoutHistory || [] };
  }

  async getAdminDashboard() {
    const portal = await this.fetchAdminPortal();
    const stats = portal.overviewStats || {};
    const products = Array.isArray(portal.products) ? portal.products : [];
    return {
      data: {
        metrics: {
          totalRevenue: Number(stats.totalRevenue || 0),
          totalOrders: Number(stats.totalOrders || 0),
          totalCustomers: Number(stats.totalCustomers || 0),
          totalSellers: Number(stats.totalSellers || 0),
          totalProducts: products.length,
          pendingSellers: Number(stats.pendingSellerApprovals || 0)
        }
      }
    };
  }

  async getAllSellers() {
    const portal = await this.fetchAdminPortal();
    const orders = Array.isArray(portal.orders) ? portal.orders : [];
    const sellers = (portal.sellers || []).map((seller) => {
      const totalOrders = orders.filter((order) => String(order.sellerId) === String(seller.id)).length;
      return {
        ...seller,
        email: seller.email || "",
        totalOrders,
        rating: Number(seller.rating || 4.5),
        kycStatus: seller.status === "Active" ? "Verified" : "Pending",
        products: Array.from({ length: Number(seller.totalProducts || 0) })
      };
    });
    return { data: sellers };
  }

  async updateSellerStatus(sellerId, status) {
    const result = await this.request("PUT", `/admin/sellers/${encodeURIComponent(sellerId)}`, { status });
    await this.refreshMarketplaceCatalogCache();
    return { data: result.seller || result };
  }

  async verifySeller(sellerId) {
    return this.updateSellerStatus(sellerId, "Active");
  }

  async getAllProducts() {
    const portal = await this.fetchAdminPortal();
    const products = (portal.products || [])
      .map((product) => this.normalizeAdminProduct(product))
      .filter(Boolean)
      .sort((left, right) => {
        const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
        const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
        return rightTime - leftTime;
      });
    return { data: products };
  }

  async approveProduct(productId, status) {
    const result = await this.request("PUT", `/admin/products/${encodeURIComponent(productId)}`, { status });
    await this.refreshMarketplaceCatalogCache();
    return { data: this.normalizeAdminProduct(result.product || result) };
  }

  async getAllOrders() {
    const portal = await this.fetchAdminPortal();
    const orders = (portal.orders || [])
      .map((order) => this.normalizeOrder(order))
      .filter(Boolean);
    return { data: orders };
  }

  async getAllCustomers() {
    const portal = await this.fetchAdminPortal();
    return { data: Array.isArray(portal.customers) ? portal.customers : [] };
  }

  async getAllPayouts() {
    const portal = await this.fetchAdminPortal();
    const payouts = Array.isArray(portal.payoutRequests) ? portal.payoutRequests : [];
    return {
      total: payouts.length,
      data: payouts
    };
  }

  async approvePayout(payoutId) {
    const result = await this.request("PUT", `/admin/payouts/${encodeURIComponent(payoutId)}`, { status: "Completed" });
    return { data: result.payout || result };
  }
}

window.api = new APIClient();
