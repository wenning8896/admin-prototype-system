# Deployment

This project is a Vite static site. It does not need a Node.js process in production.

## Recommended server shape

- OS: Ubuntu 22.04+ or Debian 12+
- Web server: Nginx
- App path: `/var/www/admin-prototype-system`

## 1. Build locally

```bash
npm install
npm run build
```

Build output is generated in `dist/`.

## 2. Upload files

You can use the helper script in `deploy/deploy-static.sh`.

```bash
DEPLOY_HOST=your.server.ip \
DEPLOY_USER=root \
DEPLOY_PATH=/var/www/admin-prototype-system \
bash deploy/deploy-static.sh
```

Optional:

```bash
DEPLOY_PORT=22
```

## 3. Configure Nginx

Copy `deploy/nginx.admin-prototype.conf` to the server, for example:

```bash
scp deploy/nginx.admin-prototype.conf root@your.server.ip:/etc/nginx/sites-available/admin-prototype-system.conf
```

Then enable it on the server:

```bash
ln -sf /etc/nginx/sites-available/admin-prototype-system.conf /etc/nginx/sites-enabled/admin-prototype-system.conf
nginx -t
systemctl reload nginx
```

## 4. Important note for routing

This project uses React Router browser history, so the Nginx config must include:

```nginx
try_files $uri $uri/ /index.html;
```

Without that rule, directly opening or refreshing detail pages will return 404.
