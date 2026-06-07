# HTTPS Configuration Guide

This guide explains how to enable HTTPS support for the Fresh Republic marketplace server.

## Quick Start

### 1. Generate Self-Signed Certificates

First, ensure you have OpenSSL installed on your system:

**Windows:**
- Download from: https://slproweb.com/products/Win32OpenSSL.html
- Or use: `choco install openssl` (if using Chocolatey)

**macOS:**
```bash
brew install openssl
```

**Linux:**
```bash
sudo apt-get install openssl
```

### 2. Generate Certificates

Run the certificate generation script:

```bash
npm run generate-certs
```

This will create two files in `marketplace-api/certs/`:
- `cert.pem` - SSL certificate
- `key.pem` - Private key

### 3. Start Server with HTTPS

**Development mode with auto-reload:**
```bash
npm run dev:https
```

**Production mode:**
```bash
npm run start:https
```

The server will start at: `https://localhost:4443`

## Using HTTP and HTTPS Simultaneously

If you want both HTTP and HTTPS servers running:

**Option 1: Run two terminals**

Terminal 1 (HTTP):
```bash
npm run dev
```

Terminal 2 (HTTPS):
```bash
npm run dev:https
```

**Option 2: Modify server.js to support both protocols**

Update the bottom of `server.js` to create both servers.

## Environment Variables

Configure HTTPS behavior with environment variables:

```bash
# Enable HTTPS mode (default: false)
USE_HTTPS=true

# Custom HTTP port (default: 4170)
PORT=3000

# Custom HTTPS port (default: 4443)
HTTPS_PORT=8443
```

Example:
```bash
USE_HTTPS=true HTTPS_PORT=8443 npm run start
```

## Browser Security Warnings

When using self-signed certificates, your browser will show a security warning:
- This is **normal and expected** for development
- Click "Advanced" → "Proceed to localhost" (Chrome)
- Or "Accept the Risk and Continue" (Firefox)

## Client-Side Updates

If your client JavaScript makes API calls, update the base URL:

```javascript
// Instead of:
const apiUrl = "http://localhost:4170";

// Use:
const apiUrl = "https://localhost:4443";
```

Or make it dynamic based on the current protocol:

```javascript
const apiUrl = `${window.location.protocol}//${window.location.hostname}:4443/api`;
```

## Production HTTPS

For production deployments:

1. **Get proper certificates** from a certificate authority (Let's Encrypt, Comodo, etc.)
2. **Place certificate files** in `marketplace-api/certs/`
3. **Set environment variable:** `USE_HTTPS=true`
4. **Use reverse proxy** (Nginx, Apache) with proper SSL configuration

Example Nginx configuration:
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:4170;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Troubleshooting

**Error: "Certificates not found"**
- Run: `npm run generate-certs`

**Error: "OpenSSL not installed"**
- Install OpenSSL for your operating system (see Quick Start section)

**Port already in use**
- Change the port: `HTTPS_PORT=8443 npm run dev:https`

**Certificate validation errors**
- Delete `marketplace-api/certs/` directory
- Run: `npm run generate-certs` again

## Security Notes

⚠️ **Development Only:**
- Self-signed certificates should only be used for development
- Production should use certificates from trusted certificate authorities
- Keep `certs/` directory in `.gitignore` (already configured)

## References

- [Node.js HTTPS Module](https://nodejs.org/api/https.html)
- [OpenSSL Documentation](https://www.openssl.org/docs/)
- [Let's Encrypt (Free Certificates)](https://letsencrypt.org/)
