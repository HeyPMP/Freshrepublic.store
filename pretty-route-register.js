(function () {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/pretty-route-sw.js", { scope: "/" }).catch(function () {
      // Ignore service worker registration errors.
    });
  });
}());
