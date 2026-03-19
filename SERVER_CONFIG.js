/**
 * Vite Server Configuration for Production
 * Enables compression and smart caching for slow connections
 * 
 * Usage in vite.config.ts:
 * import compressionPlugin from 'vite-plugin-compression';
 * 
 * plugins: [
 *   compressionPlugin({
 *     verbose: true,
 *     disable: false,
 *     threshold: 10240, // 10KB
 *     algorithm: 'gzip',
 *     ext: '.gz',
 *   })
 * ]
 */

// Recommended .htaccess for Apache servers
const APACHE_HTACCESS = `
# Enable gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
  AddOutputFilter DEFLATE js css html xml json
</IfModule>

# Enable browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  
  # Cache static assets for 1 year
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType font/ttf "access plus 1 year"
  ExpiresByType font/otf "access plus 1 year"
  ExpiresByType font/woff "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType application/font-woff "access plus 1 year"
  
  # Cache script and stylesheet for 30 days
  ExpiresByType application/javascript "access plus 30 days"
  ExpiresByType text/css "access plus 30 days"
  
  # Don't cache HTML
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>

# Set proper MIME types
<IfModule mod_mime.c>
  AddType application/javascript js
  AddType font/ttf ttf
  AddType font/otf otf
  AddType font/woff woff
  AddType font/woff2 woff2
  AddType image/svg+xml svg
  AddEncoding gzip svgz
  AddType image/svgz svgz
</IfModule>

# SPA routing - rewrite all requests to index.html
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
  # Prevent MIME type sniffing
  Header set X-Content-Type-Options "nosniff"
  
  # Enable XSS filtering
  Header set X-XSS-Protection "1; mode=block"
  
  # Clickjacking protection
  Header set X-Frame-Options "SAMEORIGIN"
  
  # Service Worker support
  Header set Service-Worker-Allowed "/"
  
  # Allow caching in Service Workers
  Header set Cache-Control "public, max-age=31536000, immutable" "expr=%{REQUEST_FILENAME} -f && %{REQUEST_URI} =~ m|/assets/.*\\.(js|css)$|"
</IfModule>
`;

// Recommended nginx.conf directives
const NGINX_CONFIG = `
# Enable gzip compression
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
gzip_min_length 1024;

# Cache static assets
location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|otf)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
  access_log off;
}

# Service Worker special handling
location = /service-worker.js {
  add_header Cache-Control "public, max-age=3600";
  add_header Service-Worker-Allowed "/";
}

# Manifest and other regular resources
location ~* \\.(json|html|xml|txt|map)$ {
  expires 24h;
  add_header Cache-Control "public, max-age=86400";
}

# SPA routing - rewrite all non-file requests to index.html
location / {
  try_files $uri $uri/ /index.html;
  add_header Cache-Control "public, max-age=0, must-revalidate";
}

# Security headers
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
`;

// Recommended Vercel vercel.json
const VERCEL_CONFIG = {
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/service-worker.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=86400"
        }
      ]
    },
    {
      "source": "/assets/.*\\.(js|css|woff|woff2|ttf|otf|png|jpg|jpeg|gif|svg)$",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/index.html",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
};

console.log("Server configuration templates generated.");
console.log("Use these configurations based on your hosting platform:");
console.log("\n1. Apache: Use the .htaccess directives in your public/ folder");
console.log("2. Nginx: Add the configuration to your nginx.conf or server block");
console.log("3. Vercel: Use the vercel.json configuration file");
console.log("\nThese configurations enable:");
console.log("  ✓ Gzip compression for all text assets");
console.log("  ✓ Browser caching with appropriate TTLs");
console.log("  ✓ Service Worker caching support");
console.log("  ✓ SPA routing");
console.log("  ✓ Security headers");
console.log("  ✓ MIME type optimization");
