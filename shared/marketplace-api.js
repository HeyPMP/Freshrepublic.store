(function attachMarketplaceApi(window) {
  var DEFAULT_API_ORIGIN = "http://localhost:4170";
  var CACHE_KEY = "fr_vendor_products_v1";
  var LAST_SYNC_KEY = "fr_marketplace_catalog_synced_at_v1";

  function getApiOrigin() {
    if (window.location && String(window.location.port) === "4170") {
      return window.location.origin;
    }
    return DEFAULT_API_ORIGIN;
  }

  function resolveApiUrl(pathname) {
    var path = String(pathname || "");
    if (!path) {
      return getApiOrigin();
    }
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    return getApiOrigin().replace(/\/$/, "") + (path.charAt(0) === "/" ? path : "/" + path);
  }

  function resolveAssetUrl(pathname) {
    var path = String(pathname || "").trim();
    if (!path) {
      return "Logo.png";
    }
    if (/^(?:https?:|data:|blob:)/i.test(path)) {
      return path;
    }
    return resolveApiUrl(path);
  }

  function request(pathname, options) {
    return window.fetch(resolveApiUrl(pathname), options).then(function (response) {
      return response
        .json()
        .catch(function () {
          return {};
        })
        .then(function (payload) {
          if (!response.ok) {
            var error = new Error(payload && payload.message ? payload.message : "Request failed.");
            error.payload = payload;
            throw error;
          }
          return payload;
        });
    });
  }

  function readCachedProducts() {
    try {
      var raw = window.localStorage.getItem(CACHE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function writeCachedProducts(products) {
    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(products));
      window.localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
    } catch (error) {
      return;
    }
  }

  function normalizeProduct(product) {
    if (!product || typeof product !== "object") {
      return null;
    }
    var images = Array.isArray(product.images) ? product.images.map(resolveAssetUrl) : [];
    return {
      id: product.id || product.vendorProductId || "",
      vendorProductId: product.vendorProductId || product.id || "",
      sellerId: product.sellerId || "",
      sellerName: product.sellerName || "",
      name: product.name || "Product",
      image: resolveAssetUrl(product.image || images[0] || "Logo.png"),
      images: images.length ? images : [resolveAssetUrl(product.image || "Logo.png")],
      price: Number(product.priceValue || product.price || 0),
      mrp: Number(product.mrpValue || product.mrp || product.price || 0),
      priceValue: Number(product.priceValue || product.price || 0),
      mrpValue: Number(product.mrpValue || product.mrp || product.price || 0),
      priceText: product.priceText || ("Rs. " + Number(product.priceValue || product.price || 0).toLocaleString("en-IN")),
      mrpText: product.mrpText || ("Rs. " + Number(product.mrpValue || product.mrp || product.price || 0).toLocaleString("en-IN")),
      category: product.category || product.categoryKey || "",
      categoryKey: product.categoryKey || product.category || "",
      brand: product.brand || "",
      sizes: Array.isArray(product.sizes) ? product.sizes.slice() : [],
      colors: Array.isArray(product.colors) ? product.colors.slice() : [],
      description: product.description || "",
      stock: Number(product.stock || 0),
      status: product.status || "Active",
      gender: product.gender || "",
      fabric: product.fabric || "",
      fit: product.fit || "",
      occasion: product.occasion || "",
      styleHighlights: product.styleHighlights || "",
      sleeveType: product.sleeveType || "",
      neckType: product.neckType || ""
    };
  }

  function syncCatalogToCache(products) {
    var normalizedProducts = Array.isArray(products)
      ? products.map(normalizeProduct).filter(Boolean)
      : [];
    writeCachedProducts(normalizedProducts);
    window.dispatchEvent(
      new window.CustomEvent("marketplace:catalog-updated", {
        detail: { products: normalizedProducts }
      }),
    );
    return normalizedProducts;
  }

  function fetchCatalog(query) {
    var params = new window.URLSearchParams(query || {});
    return request("/api/storefront/catalog" + (params.toString() ? "?" + params.toString() : "")).then(function (payload) {
      return syncCatalogToCache(payload.products || []);
    });
  }

  function primeCatalogCache() {
    return fetchCatalog().catch(function () {
      return readCachedProducts();
    });
  }

  function getProductById(productId) {
    return request("/api/storefront/products/" + encodeURIComponent(productId)).then(function (payload) {
      return normalizeProduct(payload.product);
    });
  }

  function findCustomerByIdentifier(identifier) {
    return request("/api/storefront/customers/by-identifier?identifier=" + encodeURIComponent(identifier || "")).then(function (payload) {
      return payload.customer || null;
    });
  }

  function upsertCustomer(customer) {
    return request("/api/storefront/customers/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customer || {})
    }).then(function (payload) {
      return payload.customer || null;
    });
  }

  function updateCustomer(customerId, customer) {
    return request("/api/storefront/customers/" + encodeURIComponent(customerId || ""), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customer || {})
    }).then(function (payload) {
      return payload.customer || null;
    });
  }

  function getCustomerOrders(query) {
    var params = new window.URLSearchParams(query || {});
    return request("/api/storefront/orders" + (params.toString() ? "?" + params.toString() : "")).then(function (payload) {
      return Array.isArray(payload.orders) ? payload.orders : [];
    });
  }

  function createOrders(orderPayload) {
    return request("/api/storefront/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload || {})
    }).then(function (payload) {
      return Array.isArray(payload.orders) ? payload.orders : [];
    });
  }

  function registerSeller(payload) {
    return request("/api/storefront/sellers/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {})
    }).then(function (response) {
      return response.seller || null;
    });
  }

  function loginSeller(payload) {
    return request("/api/storefront/sellers/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {})
    }).then(function (response) {
      return response.seller || null;
    });
  }

  window.MarketplaceApi = {
    getApiOrigin: getApiOrigin,
    resolveApiUrl: resolveApiUrl,
    resolveAssetUrl: resolveAssetUrl,
    request: request,
    readCachedProducts: readCachedProducts,
    writeCachedProducts: writeCachedProducts,
    normalizeProduct: normalizeProduct,
    syncCatalogToCache: syncCatalogToCache,
    fetchCatalog: fetchCatalog,
    primeCatalogCache: primeCatalogCache,
    getProductById: getProductById,
    findCustomerByIdentifier: findCustomerByIdentifier,
    upsertCustomer: upsertCustomer,
    updateCustomer: updateCustomer,
    getCustomerOrders: getCustomerOrders,
    createOrders: createOrders,
    registerSeller: registerSeller,
    loginSeller: loginSeller
  };
})(window);
