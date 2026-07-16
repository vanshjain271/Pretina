<div align="center">

# 🛍️ Pretina V2

### A Full-Stack B2B Wholesale E-Commerce Platform

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=white)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-57-000020?logo=expo&logoColor=white)](https://expo.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://mongodb.com)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

**Pretina** is a production-ready, full-stack e-commerce platform built for wholesale electronics distribution. It ships with a secure Node.js API, a feature-rich React Admin Panel, and a polished React Native mobile app — all connected to a shared MongoDB database, AWS S3 media storage, and Firebase authentication.

[System Design](SYSTEM_DESIGN.md) · [API Reference](#-api-reference) · [Setup Guide](#-local-development-setup)

</div>

---

## 📦 Monorepo Structure

```
Pretina-V2/
├── backend/          # Node.js + Express REST API
├── admin/            # React + Vite Admin Dashboard
└── pretina_rn_app/   # React Native + Expo Mobile App
```

---

## ✨ Features

### 🛒 Mobile App (Customer-Facing)
| Feature | Description |
|---|---|
| Phone OTP Login | Firebase Auth — passwordless SMS verification |
| Home Feed | Banners, featured categories, brands, and curated products |
| Live Search | Real-time product search with recommendations |
| Product Detail | HD images, variants, MOQ indicator, rich HTML descriptions |
| Cart & Checkout | Persistent cart, address selection, coupon codes, MOQ enforcement |
| Payment | Razorpay (card/UPI/net banking), QR Code, Cash on Delivery |
| Order Tracking | Full order lifecycle with status timeline |
| Invoice Download | PDF invoices downloadable directly from the app |
| Push Notifications | FCM-powered notifications for order updates and promotions |
| Account Management | Profile, saved addresses, bank details, order history |
| Delete Account | GDPR-compliant account deletion from within the app |

### 🖥️ Admin Panel (Staff-Facing)
| Feature | Description |
|---|---|
| Dashboard | Revenue KPIs, order trends, top products, recent activity |
| Order Management | Full order lifecycle management with drawer UI, status updates, refunds |
| Product Management | Rich product editor — images, variants, MOQ, SEO fields, bulk actions |
| Customer Management | Customer profiles, order history, wallet balance |
| Inventory Analytics | Stock alerts, low-inventory reports |
| Category & Brand CRUD | Hierarchical categories, brand management |
| Coupon Management | Percentage/flat coupons with usage limits and expiry |
| Banner Management | App home screen promotional banners |
| Employee Management | Multi-role staff accounts (Admin, Employee) |
| Invoice Generation | Automatic GST-compliant PDF invoices via PDFKit |
| Push Notification Sender | Broadcast notifications to all users or segments |
| Store Settings | Business info, payment methods, COD advance %, UPI ID |
| Analytics & Reports | Sales trends, geo analytics, revenue breakdown |
| Blog Management | CMS for in-app blog/article content |
| Abandoned Carts | View and recover abandoned carts |
| Reviews & Ratings | Moderate product reviews |
| Activity Log | Full audit trail of all admin actions |

### ⚙️ Backend API
| Feature | Description |
|---|---|
| REST API | 19 route modules, 100+ endpoints, versioned at `/api/v1` |
| Authentication | Firebase Phone Auth (OTP) + JWT for session management |
| Role-Based Access | Customer / Employee / Admin permission layers |
| Rate Limiting | 200 requests / 15 min per IP |
| Security Headers | Helmet.js middleware |
| Image Storage | AWS S3 via Multer-S3, with Sharp image optimization |
| PDF Generation | PDFKit for server-side invoice rendering |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| SMS | MSG91 / Twilio OTP delivery |
| Payment Gateway | Razorpay — orders, webhooks, refunds |
| Health Check | `GET /api/v1/health` |

---

## 🏗️ Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB Atlas (Mongoose ORM) |
| Authentication | Firebase Admin SDK + JSON Web Tokens |
| File Storage | AWS S3 + Multer-S3 + Sharp |
| Payments | Razorpay SDK |
| PDF | PDFKit |
| Push Notifications | Firebase Cloud Messaging |
| SMS / OTP | MSG91 |
| Security | Helmet, CORS, express-rate-limit, bcryptjs |
| Process Manager | PM2 (production) |

### Admin Panel
| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 5 |
| State Management | Redux Toolkit 2 |
| Routing | React Router v6 |
| UI Components | Material UI (MUI) v5 + MUI X DataGrid |
| Charts | Recharts |
| HTTP Client | Axios |
| Styling | CSS Modules + Tailwind CSS |
| Hosting | Vercel (`admin.pretina.in`) |

### Mobile App
| Layer | Technology |
|---|---|
| Framework | React Native 0.86 + Expo SDK 57 |
| State Management | Redux Toolkit 2 + RTK Query |
| Navigation | React Navigation v7 (Native Stack + Bottom Tabs) |
| Authentication | Firebase Auth (Phone OTP) |
| Push Notifications | Firebase Messaging |
| Payments | react-native-razorpay |
| Styling | NativeWind 4 (Tailwind for React Native) |
| OTA Updates | Expo EAS Build |

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+
- npm 9+
- MongoDB Atlas account
- Firebase project with Phone Auth enabled
- AWS S3 bucket
- Razorpay account

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/Pretina-V2.git
cd Pretina-V2
```

### 2. Backend Setup

```bash
cd backend
npm install

# Copy env template and fill in your values
cp .env.example .env
nano .env

# Add your Firebase service account key
# Download from Firebase Console → Project Settings → Service Accounts
# Save as: backend/src/config/serviceAccountKey.json

# Seed the initial admin user
npm run seed:admin

# Start dev server (nodemon)
npm run dev
```

The API will be available at `http://localhost:5001/api/v1`

### 3. Admin Panel Setup

```bash
cd admin
npm install

# Create env file
echo "VITE_API_BASE_URL=http://localhost:5001/api/v1" > .env

# Start dev server
npm run dev
```

The admin panel will be available at `http://localhost:5173`

### 4. Mobile App Setup

```bash
cd pretina_rn_app
npm install

# Add your Firebase config files:
# Android: pretina_rn_app/google-services.json
# iOS:     pretina_rn_app/GoogleService-Info.plist
# (Download from Firebase Console → Project Settings → Your Apps)

# Update API URL
echo "VITE_API_BASE_URL is set in src/config.js"
# Edit pretina_rn_app/src/config.js → set API_BASE_URL to your local backend

# Start Expo
npx expo start

# Or run directly on a platform:
npx expo run:android
npx expo run:ios
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|---|---|---|
| `NODE_ENV` | `development` or `production` | ✅ |
| `PORT` | Server port (default: 5001) | ✅ |
| `MONGODB_URI` | MongoDB Atlas connection string | ✅ |
| `JWT_SECRET` | Secret key for JWT signing (min 32 chars) | ✅ |
| `JWT_EXPIRES_IN` | JWT expiry (e.g., `30d`) | ✅ |
| `FIREBASE_PROJECT_ID` | Firebase project ID | ✅ |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key | ✅ |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key | ✅ |
| `AWS_REGION` | S3 bucket region | ✅ |
| `AWS_S3_BUCKET` | S3 bucket name | ✅ |
| `RAZORPAY_KEY_ID` | Razorpay API key ID | ✅ |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret | ✅ |
| `PAYMENT_RAZORPAY_ENABLED` | Enable Razorpay checkout | ✅ |
| `PAYMENT_QR_ENABLED` | Enable QR code payments | ✅ |
| `PAYMENT_COD_ENABLED` | Enable Cash on Delivery | ✅ |
| `COD_ADVANCE_PERCENTAGE` | % advance required for COD orders | ✅ |
| `BUSINESS_NAME` | Business display name | ✅ |
| `BUSINESS_PHONE` | Business contact number | ✅ |
| `BUSINESS_EMAIL` | Business contact email | ✅ |
| `BUSINESS_UPI_ID` | UPI ID for QR payments | ✅ |
| `BUSINESS_QR_IMAGE_URL` | S3 URL for QR code image | ✅ |
| `ADMIN_EMAIL` | Initial admin account email (seed only) | ✅ |
| `ADMIN_PASSWORD` | Initial admin account password (seed only) | ✅ |

### Admin (`admin/.env`)

| Variable | Description | Required |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | ✅ |

---

## 📡 API Reference

**Base URL:** `https://api.pretina.in/api/v1`

| Module | Endpoint | Description |
|---|---|---|
| Health | `GET /health` | Server health check |
| Auth | `POST /auth/send-otp` | Send OTP to phone |
| Auth | `POST /auth/verify-otp` | Verify OTP + issue JWT |
| Auth | `DELETE /auth/delete-account` | Delete user account |
| Products | `GET /products` | List products (paginated, filterable) |
| Products | `GET /products/:id` | Single product detail |
| Products | `POST /products` | Create product (Admin) |
| Products | `PUT /products/:id` | Update product (Admin) |
| Products | `DELETE /products/:id` | Delete product (Admin) |
| Categories | `GET /categories` | List all categories |
| Brands | `GET /brands` | List all brands |
| Cart | `GET /cart` | Get user cart |
| Cart | `POST /cart/add` | Add item to cart |
| Cart | `PUT /cart/update` | Update cart item |
| Orders | `POST /orders` | Place new order |
| Orders | `GET /orders/my` | User's order history |
| Orders | `GET /orders/:id` | Order detail |
| Payments | `POST /payments/razorpay/create` | Create Razorpay order |
| Payments | `POST /payments/razorpay/verify` | Verify payment signature |
| Analytics | `GET /analytics/dashboard` | Dashboard KPIs (Admin) |
| Upload | `POST /upload/image` | Upload image to S3 |
| Notifications | `POST /notifications/send` | Send push notification (Admin) |

> Full API documentation is available in [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md).

---

## 🚢 Deployment

### Backend (AWS Lightsail + PM2)

```bash
# SSH into your server
ssh ubuntu@your-server-ip

# Pull latest code
cd ~/Pretina/backend
git pull origin main
npm install --production

# Restart with PM2
pm2 restart all
pm2 save

# Check status
pm2 status
```

**Domain:** `https://api.pretina.in` (Cloudflare proxy → AWS Lightsail)

### Admin Panel (Vercel)

The admin panel auto-deploys on every push to `main` via Vercel GitHub integration.

**Domain:** `https://admin.pretina.in`

### Mobile App (EAS Build)

```bash
cd pretina_rn_app

# iOS — TestFlight
eas build -p ios

# Android — Google Play
eas build -p android

# Submit iOS to TestFlight
eas submit -p ios

# Submit Android to Google Play
eas submit -p android
```

---

## 🗂️ System Design

For a complete breakdown of the system architecture, data models, authentication flows, payment flows, and future roadmap, see **[SYSTEM_DESIGN.md](SYSTEM_DESIGN.md)**.

---

## 🔒 Security

- All API traffic is encrypted via HTTPS (Cloudflare SSL)
- Authentication via Firebase OTP (no password storage)
- JWT tokens for stateless session management
- Role-based access control (Customer / Employee / Admin)
- Helmet.js security headers on all responses
- Rate limiting: 200 requests per 15 minutes per IP
- AWS S3 private buckets with pre-signed URLs
- No secrets in codebase — all via environment variables
- Firebase `serviceAccountKey.json` is gitignored and never committed
- GDPR-compliant: users can delete their own account from the app

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  Built with ❤️ by the Pretina Team
</div>
