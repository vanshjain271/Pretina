# Pretina V2 — System Design

> A comprehensive technical reference for the Pretina platform architecture, data models, security design, and operational flows.

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Component Interaction Map](#2-component-interaction-map)
3. [Authentication & Authorization Flow](#3-authentication--authorization-flow)
4. [Payment Flow](#4-payment-flow)
5. [Order Lifecycle](#5-order-lifecycle)
6. [Push Notification Pipeline](#6-push-notification-pipeline)
7. [Media Upload Pipeline](#7-media-upload-pipeline)
8. [Database Schema (ERD)](#8-database-schema-erd)
9. [API Architecture](#9-api-architecture)
10. [Security Model](#10-security-model)
11. [Infrastructure & Deployment](#11-infrastructure--deployment)
12. [Future Roadmap](#12-future-roadmap)

---

## 1. High-Level Architecture

```mermaid
graph TB
    subgraph Clients["👥 Clients"]
        APP["📱 Mobile App<br/>React Native / Expo<br/>iOS & Android"]
        ADMIN["🖥️ Admin Panel<br/>React / Vite<br/>admin.pretina.in"]
    end

    subgraph CDN["🌐 Cloudflare"]
        CF["Cloudflare Proxy<br/>SSL Termination<br/>DDoS Protection"]
    end

    subgraph AWS["☁️ AWS Cloud"]
        LH["🖥️ AWS Lightsail<br/>Ubuntu 22.04<br/>2 vCPU / 1GB RAM"]
        PM2["⚙️ PM2<br/>Process Manager"]
        API["🔌 Node.js / Express<br/>REST API v1<br/>Port 5001"]
        S3["🗄️ AWS S3<br/>Image Storage<br/>pretina-uploads"]
    end

    subgraph Firebase["🔥 Firebase"]
        FAUTH["Firebase Auth<br/>Phone OTP"]
        FCM["Firebase Cloud<br/>Messaging (FCM)"]
    end

    subgraph MongoDB["🍃 MongoDB Atlas"]
        DB["MongoDB Atlas<br/>Cluster M0<br/>15 Collections"]
    end

    subgraph Razorpay["💳 Razorpay"]
        RPY["Razorpay API<br/>Payment Gateway"]
    end

    subgraph Vercel["▲ Vercel"]
        VCL["Vercel Edge Network<br/>admin.pretina.in"]
    end

    APP -->|HTTPS| CF
    ADMIN -->|HTTPS| VCL
    VCL -->|API Calls| CF
    CF -->|Proxy| LH
    LH --> PM2
    PM2 --> API
    API --> DB
    API --> S3
    API --> FAUTH
    API --> FCM
    API --> RPY
    APP -->|OTP Auth| FAUTH
    APP -->|Push Notifications| FCM
```

---

## 2. Component Interaction Map

```mermaid
graph LR
    subgraph RN["📱 React Native App"]
        NAV["React Navigation"]
        RTK["RTK Query / Redux"]
        RN_FIREBASE["Firebase SDK<br/>Auth + Messaging"]
        RN_RAZORPAY["Razorpay RN SDK"]
    end

    subgraph ADMIN_PANEL["🖥️ Admin Panel"]
        REACT["React + Router v6"]
        REDUX["Redux Toolkit"]
        AXIOS_CLIENT["Axios Client"]
        MUI_UI["Material UI + Recharts"]
    end

    subgraph BACKEND["⚙️ Express API"]
        MIDDLEWARE["Helmet → CORS → Rate Limiter → Morgan"]
        AUTH_MW["JWT + Firebase Auth Middleware"]
        ROUTES["19 Route Modules"]
        CTRL["Controllers + Services"]
    end

    NAV --> RTK
    RTK -->|HTTP Requests| BACKEND
    RN_FIREBASE -->|OTP Token| BACKEND
    RN_RAZORPAY -->|Payment Verify| BACKEND

    REACT --> REDUX
    REDUX --> AXIOS_CLIENT
    AXIOS_CLIENT -->|HTTP Requests| BACKEND

    MIDDLEWARE --> AUTH_MW
    AUTH_MW --> ROUTES
    ROUTES --> CTRL
```

---

## 3. Authentication & Authorization Flow

### 3.1 Phone OTP Login (New & Returning Users)

```mermaid
sequenceDiagram
    actor User
    participant App as 📱 Mobile App
    participant Firebase as 🔥 Firebase Auth
    participant API as ⚙️ Backend API
    participant DB as 🍃 MongoDB

    User->>App: Enter phone number
    App->>Firebase: signInWithPhoneNumber(+91XXXXXXXXXX)
    Firebase-->>User: Send OTP via SMS
    User->>App: Enter 6-digit OTP
    App->>Firebase: confirmResult.confirm(otp)
    Firebase-->>App: Firebase ID Token (JWT)
    App->>API: POST /auth/verify-otp { idToken }
    API->>Firebase: Admin SDK verifyIdToken(idToken)
    Firebase-->>API: Decoded token { phone, uid }
    API->>DB: findOrCreate User by phone number

    alt New User
        DB-->>API: Created user (isNewUser: true)
        API-->>App: { token: <JWT>, user, isNewUser: true }
        App->>App: Navigate → Registration Details Screen
    else Returning User
        DB-->>API: Existing user
        API-->>App: { token: <JWT>, user, isNewUser: false }
        App->>App: Navigate → Home Screen
    end
```

### 3.2 Role-Based Access Control (RBAC)

```mermaid
graph TD
    REQ["Incoming API Request"] --> AUTH_MW["auth.js Middleware"]
    AUTH_MW --> VERIFY["Verify JWT Token"]
    VERIFY -->|Invalid| REJECT["401 Unauthorized"]
    VERIFY -->|Valid| ROLE{"Check Role"}
    ROLE -->|customer| CUSTOMER_ROUTES["Customer Routes<br/>/cart /orders /profile"]
    ROLE -->|employee| EMPLOYEE_ROUTES["Employee Routes<br/>Customer-level + View Orders"]
    ROLE -->|admin| ADMIN_ROUTES["Admin Routes<br/>Full Access + Analytics + Settings"]
```

| Role | Access Level |
|---|---|
| `customer` | Own profile, cart, orders, payments |
| `employee` | Customer-level + view/manage orders |
| `admin` | Full access — all CRUD + analytics + settings + employee management |

---

## 4. Payment Flow

### 4.1 Full Razorpay Payment Flow

```mermaid
sequenceDiagram
    actor User
    participant App as 📱 Mobile App
    participant API as ⚙️ Backend API
    participant RPY as 💳 Razorpay
    participant DB as 🍃 MongoDB

    User->>App: Proceed to Checkout (Full Payment)
    App->>API: POST /payments/razorpay/create { amount, orderId }
    API->>RPY: Create Razorpay Order (amount in paise)
    RPY-->>API: { razorpay_order_id }
    API-->>App: { razorpay_order_id, key_id, amount }

    App->>RPY: Open Razorpay Checkout SDK
    User->>RPY: Complete payment (Card/UPI/Net Banking)
    RPY-->>App: { razorpay_payment_id, razorpay_signature }

    App->>API: POST /payments/razorpay/verify { payment_id, signature, order_id }
    API->>API: Verify HMAC SHA256 signature
    alt Signature Valid
        API->>DB: Update order → paymentStatus: paid, status: confirmed
        API->>DB: Store razorpayPaymentId + razorpayOrderId
        API-->>App: { success: true }
        App->>App: Show success — invoice shows PAID IN FULL stamp
    else Signature Invalid
        API-->>App: 400 Payment verification failed
        App->>App: Show failure screen
    end
```

### 4.2 Partial Razorpay (Advance) Payment Flow

```mermaid
sequenceDiagram
    actor User
    participant App as 📱 Mobile App
    participant API as ⚙️ Backend API
    participant RPY as 💳 Razorpay
    participant DB as 🍃 MongoDB

    User->>App: Proceed to Checkout (Partial / Advance)
    App->>API: POST /payments/razorpay/create { amount: advanceAmount, orderId }
    API->>RPY: Create Razorpay Order (advance in paise)
    RPY-->>API: { razorpay_order_id }
    API-->>App: { razorpay_order_id, key_id, amount }

    App->>RPY: Open Razorpay Checkout SDK
    User->>RPY: Pay advance amount only
    RPY-->>App: { razorpay_payment_id, razorpay_signature }

    App->>API: POST /payments/razorpay/verify { payment_id, signature, order_id }
    API->>API: Verify HMAC SHA256 signature
    alt Signature Valid
        API->>DB: Update order → paymentStatus: advance_paid, store codAdvanceAmount
        API-->>App: { success: true }
        App->>App: Show success — invoice shows Advance Paid + Balance Due on Delivery
    end
```

### 4.3 COD (Cash on Delivery) Flow

```mermaid
graph LR
    CHECKOUT["User places COD order"] --> METHOD{"Payment Method"}
    METHOD --> |Full COD| CONFIRM["Order confirmed instantly\npaymentStatus: paid"]
    METHOD --> |Partial COD\n(advance via UPI/QR)| QR_PAY["Pay advance amount"]
    QR_PAY --> MANUAL["Admin manually confirms advance receipt"]
    MANUAL --> CONFIRM2["Order confirmed\npaymentStatus: advance_paid"]
    CONFIRM --> DISPATCH["Order dispatched"]
    CONFIRM2 --> DISPATCH
    DISPATCH --> DELIVERED["Remaining balance collected on delivery"]
```

---

## 5. Order Lifecycle

```mermaid
stateDiagram-v2
    [*] --> pending : User places order
    pending --> confirmed : Admin confirms
    confirmed --> processing : Assigned for packing
    processing --> shipped : Handed to courier
    shipped --> out_for_delivery : Courier out
    out_for_delivery --> delivered : Customer receives
    delivered --> [*]

    pending --> cancelled : User/Admin cancels
    confirmed --> cancelled : Before shipping
    delivered --> return_requested : Customer raises issue
    return_requested --> refunded : Admin approves refund
    refunded --> [*]
    cancelled --> [*]
```

---

## 6. Push Notification Pipeline

```mermaid
sequenceDiagram
    participant Admin as 🖥️ Admin Panel
    participant API as ⚙️ Backend API
    participant FCM as 🔥 Firebase FCM
    participant Device as 📱 User Device

    Note over Admin,Device: Admin-triggered broadcast
    Admin->>API: POST /notifications/send { title, body, target }
    API->>API: Query DB for target user FCM tokens
    API->>FCM: sendMulticast({ tokens, notification })
    FCM-->>Device: Push notification delivered

    Note over API,Device: Automated order update notification
    API->>API: Order status changes
    API->>FCM: send({ token: user.fcmToken, data: { orderId } })
    FCM-->>Device: "Your order has been shipped!"
    Device->>Device: Navigate to Order Detail on tap
```

---

## 7. Media Upload Pipeline

```mermaid
sequenceDiagram
    participant Admin as 🖥️ Admin Panel
    participant API as ⚙️ Backend API
    participant SHARP as 🖼️ Sharp (Image Optimizer)
    participant S3 as 🗄️ AWS S3

    Admin->>API: POST /upload/image (multipart/form-data)
    API->>API: Multer receives file buffer
    API->>SHARP: Resize + compress (WebP/JPEG, max 1200px)
    SHARP-->>API: Optimized buffer
    API->>S3: PutObjectCommand (pretina-uploads bucket)
    S3-->>API: { Location: "https://s3.amazonaws.com/..." }
    API-->>Admin: { url: "https://s3.amazonaws.com/..." }
    Admin->>Admin: Store URL in product/banner form
```

---

## 8. Database Schema (ERD)

### Core Entities

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        string name
        string phone UK
        string email
        string role "customer|employee|admin"
        string fcmToken
        array addresses
        string profileImage
        number walletBalance
        boolean isActive
        date createdAt
    }

    PRODUCT {
        ObjectId _id PK
        string name
        string slug UK
        string description
        ObjectId category FK
        ObjectId brand FK
        number mrp
        number salePrice
        number minOrderQty
        number stock
        array images
        array tags
        boolean isActive
        boolean isFeatured
    }

    ORDER {
        ObjectId _id PK
        string orderNumber UK "Atomic via Counter model"
        ObjectId user FK
        array items
        string status
        object shippingAddress
        string paymentMethod "cod|partial_razorpay|full_razorpay"
        string paymentStatus "pending|advance_paid|paid"
        number subtotal
        number discount
        number total
        number codAdvanceAmount "Advance paid for partial/COD"
        number tokenReceived "Legacy advance field"
        ObjectId coupon FK
        string razorpayOrderId
        string razorpayPaymentId
        date createdAt
    }

    COUNTER {
        ObjectId _id PK
        string name UK "e.g. orderNumber"
        number seq "Auto-incremented atomically"
    }

    CART {
        ObjectId _id PK
        ObjectId user FK
        array items
        date updatedAt
    }

    CATEGORY {
        ObjectId _id PK
        string name
        string slug UK
        string image
        ObjectId parent FK
        boolean isActive
    }

    BRAND {
        ObjectId _id PK
        string name
        string slug UK
        string logo
        boolean isActive
    }

    COUPON {
        ObjectId _id PK
        string code UK
        string type "percentage|flat"
        number value
        number minOrderAmount
        number maxUses
        number usedCount
        date expiresAt
        boolean isActive
    }

    INVOICE {
        ObjectId _id PK
        string invoiceNumber UK
        ObjectId order FK
        ObjectId user FK
        string pdfUrl
        date issuedAt
    }

    NOTIFICATION {
        ObjectId _id PK
        string title
        string body
        string target "all|user"
        ObjectId user FK
        boolean isRead
        date createdAt
    }

    REVIEW {
        ObjectId _id PK
        ObjectId user FK
        ObjectId product FK
        number rating
        string comment
        boolean isApproved
        date createdAt
    }

    BANNER {
        ObjectId _id PK
        string title
        string imageUrl
        string linkType
        string linkValue
        number order
        boolean isActive
    }

    SETTINGS {
        ObjectId _id PK
        object businessInfo
        object paymentMethods
        object orderSettings
        object appConfig
        object smsConfig
    }

    USER ||--o{ ORDER : "places"
    USER ||--|| CART : "has"
    USER ||--o{ REVIEW : "writes"
    USER ||--o{ NOTIFICATION : "receives"
    ORDER ||--o{ INVOICE : "generates"
    ORDER }o--|| COUPON : "uses"
    ORDER }o--|| USER : "belongs to"
    PRODUCT }o--|| CATEGORY : "belongs to"
    PRODUCT }o--|| BRAND : "belongs to"
    PRODUCT ||--o{ REVIEW : "receives"
    CATEGORY ||--o{ CATEGORY : "parent-child"
    CART }o--|| USER : "belongs to"
```

---

## 9. API Architecture

### Middleware Stack (Request Pipeline)

```mermaid
graph TD
    REQ["Incoming HTTP Request"] --> HELMET["helmet()<br/>Security Headers"]
    HELMET --> CORS["CORS<br/>Whitelist: admin.pretina.in, pretina.in"]
    CORS --> RATE["express-rate-limit<br/>200 req / 15 min / IP"]
    RATE --> BODY["express.json()<br/>10MB limit"]
    BODY --> MORGAN["morgan('dev')<br/>Dev logging only"]
    MORGAN --> ROUTES["Route Handler"]
    ROUTES --> AUTH["auth.js Middleware<br/>JWT + Firebase verification"]
    AUTH --> CTRL["Controller / Inline Handler"]
    CTRL --> DB["MongoDB via Mongoose"]
    DB --> RES["HTTP Response"]
    CTRL -->|Error| ERR["errorHandler.js<br/>Global Error Handler"]
    ERR --> RES
```

### Route Modules Overview

| Module | Route | Auth Required | Admin Only |
|---|---|---|---|
| `auth` | `/api/v1/auth` | Partial | No |
| `users` | `/api/v1/users` | ✅ | Partial |
| `products` | `/api/v1/products` | Partial | CRUD only |
| `categories` | `/api/v1/categories` | Partial | CRUD only |
| `brands` | `/api/v1/brands` | Partial | CRUD only |
| `orders` | `/api/v1/orders` | ✅ | Partial |
| `cart` | `/api/v1/cart` | ✅ | No |
| `payments` | `/api/v1/payments` | ✅ | No |
| `coupons` | `/api/v1/coupons` | ✅ | CRUD only |
| `banners` | `/api/v1/banners` | Partial | CRUD only |
| `notifications` | `/api/v1/notifications` | ✅ | Send only |
| `analytics` | `/api/v1/analytics` | ✅ | ✅ |
| `employees` | `/api/v1/employees` | ✅ | ✅ |
| `invoices` | `/api/v1/invoices` | ✅ | Partial |
| `reviews` | `/api/v1/reviews` | Partial | Moderate only |
| `settings` | `/api/v1/settings` | ✅ | ✅ |
| `upload` | `/api/v1/upload` | ✅ | ✅ |
| `alerts` | `/api/v1/alerts` | ✅ | ✅ |
| `blogs` | `/api/v1/blogs` | Partial | CRUD only |

---

## 10. Security Model

### Defence-in-Depth Layers

```mermaid
graph TB
    subgraph L1["Layer 1 — Network"]
        CF["Cloudflare DDoS Protection<br/>SSL/TLS Termination<br/>IP Reputation Filtering"]
    end

    subgraph L2["Layer 2 — Transport"]
        HTTPS["HTTPS Everywhere<br/>TLS 1.2+ enforced<br/>HSTS Headers"]
    end

    subgraph L3["Layer 3 — Application"]
        HELMET["Helmet.js<br/>CSP, X-Frame-Options,<br/>X-Content-Type-Options"]
        CORS["CORS Whitelist<br/>Only admin.pretina.in allowed"]
        RATE["Rate Limiting<br/>200 req / 15 min / IP"]
    end

    subgraph L4["Layer 4 — Authentication"]
        FIREBASE["Firebase Phone Auth<br/>No password storage<br/>OTP expiry: 5 mins"]
        JWT["JWT Tokens<br/>Signed with 32+ char secret<br/>30 day expiry"]
    end

    subgraph L5["Layer 5 — Authorization"]
        RBAC["Role-Based Access Control<br/>customer / employee / admin<br/>Enforced per route"]
    end

    subgraph L6["Layer 6 — Data"]
        MONGO["MongoDB: Input sanitization<br/>Mongoose schema validation"]
        ENV["Secrets in .env only<br/>Never in codebase<br/>gitignored + server-only"]
        S3["S3: Private bucket<br/>No public ACLs"]
    end

    L1 --> L2 --> L3 --> L4 --> L5 --> L6
```

### Security Checklist

| Control | Status |
|---|---|
| All traffic over HTTPS | ✅ |
| No passwords stored (OTP-only) | ✅ |
| JWT signed with strong secret | ✅ |
| Role-based route protection | ✅ |
| Security headers (Helmet) | ✅ |
| CORS restricted to known origins | ✅ |
| Rate limiting enabled | ✅ |
| No secrets in codebase | ✅ |
| `.env` gitignored on all packages | ✅ |
| Firebase service account gitignored | ✅ |
| Google services files gitignored | ✅ |
| User can delete their own account | ✅ (GDPR) |
| S3 bucket not publicly accessible | ✅ |
| Input validation via Mongoose schemas | ✅ |
| Payment signature verification (HMAC) | ✅ |

---

## 11. Infrastructure & Deployment

```mermaid
graph LR
    subgraph GitHub["GitHub Repository"]
        MAIN["main branch"]
    end

    subgraph CI["Deployment Pipelines"]
        VERCEL_CI["Vercel Auto-Deploy<br/>on push to main<br/>→ admin.pretina.in"]
        EAS_BUILD["EAS Build<br/>Manual trigger<br/>→ TestFlight / Play Store"]
    end

    subgraph BACKEND_INFRA["Backend Infrastructure"]
        SSH["SSH Deploy<br/>git pull + pm2 restart<br/>→ api.pretina.in"]
    end

    MAIN -->|Auto| VERCEL_CI
    MAIN -->|Manual EAS| EAS_BUILD
    MAIN -->|Manual SSH| SSH
```

### Server Specs

| Component | Spec |
|---|---|
| Provider | AWS Lightsail |
| OS | Ubuntu 22.04 LTS |
| Instance | 2 vCPU, 1 GB RAM |
| Process Manager | PM2 (cluster mode) |
| Reverse Proxy | Cloudflare (Flexible SSL for app/API, Full SSL via Page Rules for PHP website) |
| API Port | 5001 |
| Domain | `api.pretina.in` |

### DNS Architecture (Cloudflare)

| Subdomain | Type | Target | Notes |
|---|---|---|---|
| `pretina.in` | A | `162.241.123.12` | Client's PHP website (webhostbox hosting) |
| `www.pretina.in` | CNAME | `pretina.in` | Alias for PHP website |
| `admin.pretina.in` | CNAME | Vercel Edge | Admin panel via Vercel |
| `api.pretina.in` | A | AWS Lightsail IP | Backend API |
| `mail.pretina.in` | A | `162.241.123.12` | Client email (DNS only, not proxied) |

> **Note:** Cloudflare Page Rules are configured to apply **Full SSL** only to `pretina.in/*` and `www.pretina.in/*` to fix the PHP website's redirect loop, while the app and API remain on **Flexible SSL**.

### PM2 Configuration

```bash
# View running processes
pm2 status

# Restart backend after deploy
pm2 restart all

# View logs
pm2 logs

# Auto-start on server reboot
pm2 startup
pm2 save
```

---

## 12. Future Roadmap

### Short Term (v1.1)
| Feature | Status | Description |
|---|---|---|
| Product Variants | ✅ Done | Colour/size selector in app with quantity controls |
| Partial Razorpay Payment | ✅ Done | Pay advance via Razorpay, balance on delivery |
| Atomic Order Numbers | ✅ Done | Counter collection prevents duplicate order numbers |
| Invoice PAID Stamp | ✅ Done | PDF shows PAID/Balance Due based on payment status |
| Double-tap Order Guard | ✅ Done | useRef guard prevents duplicate orders on rapid tap |
| Wishlist | 🔜 Planned | Save products for later |
| Advanced Filters | 🔜 Planned | Filter by price range, brand, rating |
| Order Returns | 🔜 Planned | In-app return request flow |
| Referral System | 🔜 Planned | User referral codes with wallet rewards |

### Medium Term (v2.0)
| Feature | Description |
|---|---|
| Vendor/Supplier Portal | Multi-vendor support for product listing |
| Inventory Management | Automatic stock deduction on order |
| Loyalty Points | Points earned per purchase, redeemable at checkout |
| B2B Credit | Credit limit and deferred payment for business buyers |
| Regional Language Support | Hindi + regional language UI |

### Long Term (v3.0)
| Feature | Description |
|---|---|
| AI Product Recommendations | Personalized feed based on purchase history |
| Route Optimization | Delivery route planning for in-house logistics |
| Warehouse Management | Multi-warehouse inventory tracking |
| ERP Integration | SAP / Tally sync for accounting |
| White-Label App | Configurable multi-tenant platform |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to your branch: `git push origin feat/your-feature-name`
5. Open a Pull Request against `main`

Please ensure:
- No secrets or credentials in any committed file
- Environment variables documented in `.env.example`
- Code follows existing patterns (Express MVC, RTK for state)

---

*Last updated: July 2026 | Pretina V2.0 — App v1.0.21*
