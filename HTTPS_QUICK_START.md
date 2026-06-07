# HTTPS Configuration Summary

## What Was Changed

✅ **Modified Files:**
1. `marketplace-api/server.js` - Added HTTPS support with self-signed certificates
2. `marketplace-api/package.json` - Added new npm scripts for HTTPS
3. `.gitignore` - Added certificate directory exclusion

✅ **New Files:**
1. `marketplace-api/generate-certs.js` - Certificate generation script
2. `HTTPS_SETUP.md` - Complete HTTPS setup guide

## Quick Commands

### Enable HTTPS in 2 Steps:

```bash
# 1. Generate self-signed certificates (one-time)
npm run generate-certs

# 2. Start server with HTTPS
npm run dev:https
```

Server will run at: **https://localhost:4443**

## Available npm Scripts

```bash
# HTTP mode (default)
npm start              # Production HTTP server
npm run dev           # Development HTTP server with auto-reload

# HTTPS mode
npm run start:https   # Production HTTPS server
npm run dev:https     # Development HTTPS server with auto-reload

# Utilities
npm run generate-certs  # Generate SSL certificates
```

## Environment Variables

```bash
# Enable HTTPS (default: false)
USE_HTTPS=true

# HTTP port (default: 4170)
PORT=3000

# HTTPS port (default: 4443)
HTTPS_PORT=8443
```

Example:
```bash
USE_HTTPS=true HTTPS_PORT=8443 npm run start
```

## Browser Security

When accessing `https://localhost:4443`, your browser will show a security warning because the certificate is self-signed. This is **normal for development**.

- **Chrome**: Click "Advanced" → "Proceed to localhost"
- **Firefox**: Click "Advanced..." → "Accept the Risk and Continue"
- **Safari**: Click "Visit Website"

## Important Notes

⚠️ **Self-signed certificates are for development only.** Production deployments require proper SSL certificates from a certificate authority.

For detailed setup instructions and troubleshooting, see [HTTPS_SETUP.md](./HTTPS_SETUP.md).

## Next Steps

1. Install OpenSSL if you don't have it
2. Run: `npm run generate-certs`
3. Run: `npm run dev:https` to start with HTTPS
4. Test the API at: `https://localhost:4443/api`
