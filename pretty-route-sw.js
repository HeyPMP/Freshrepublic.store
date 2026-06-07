const PRODUCT_ROUTE_BASES = {
  bestseller: true,
  brands: true,
  categories: true,
  dailyessentials: true,
  localboutiques: true,
  products: true
};

function isPrettyProductNavigation(requestUrl) {
  const pathname = String(requestUrl.pathname || "");
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length < 3) {
    return false;
  }

  const routeBase = String(segments[0] || "").toLowerCase();
  const lastSegment = String(segments[segments.length - 1] || "");

  if (!PRODUCT_ROUTE_BASES[routeBase]) {
    return false;
  }

  return !/\.[a-z0-9]+$/i.test(lastSegment);
}

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function (event) {
  if (!event.request || event.request.mode !== "navigate") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (!isPrettyProductNavigation(requestUrl)) {
    return;
  }

  event.respondWith(
    fetch("/view-product.html", { cache: "no-cache" }).catch(function () {
      return fetch(event.request);
    })
  );
});
