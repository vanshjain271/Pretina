# Pretina V2

Pretina V2 is a premium, full-stack e-commerce platform built to offer a seamless shopping experience for high-quality eyewear. It features a robust backend, an intuitive React Admin Panel, and a responsive React Native Mobile Application.

## Architecture & Tech Stack

This project is divided into three main architectures:

### 1. Backend (Node.js & Express)
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ORM)
- **Authentication:** Firebase Admin Auth & JWT
- **Payments:** Razorpay Integration
- **Features:** 
  - Comprehensive API for Orders, Products, Cart, Users, and Brands.
  - Native PDF Invoice Generation.
  - Role-based Access Control (Admin, Employee, Customer).
  - Push Notification Integration via FCM.

### 2. Admin Panel (React)
- **Framework:** React (Vite)
- **State Management:** Redux Toolkit
- **Styling:** TailwindCSS
- **Features:**
  - Full CRUD operations for Products, Categories, and Brands.
  - Comprehensive Order Management system.
  - Dashboard analytics & sales reporting.
  - Banner & App configuration controls.

### 3. Mobile App (React Native/Expo)
- **Framework:** React Native with Expo
- **State Management:** Redux Toolkit & RTK Query
- **UI/UX:** React Navigation, Custom animations
- **Features:**
  - Live Search functionality.
  - Push Notifications integration.
  - Shopping Cart, Wishlist, and Checkout.
  - Live Order Tracking and Native Invoice Downloads.

## Installation & Setup

### Environment Variables
Ensure you have `.env` files correctly set up in both the `backend` and `admin` directories. Key environment variables include your MongoDB URI, Razorpay Keys, and Firebase service accounts.

### Running Locally

1. **Backend Server:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Admin Panel:**
   ```bash
   cd admin
   npm install
   npm run dev
   ```

3. **React Native Mobile App:**
   ```bash
   cd pretina_rn_app
   npm install
   npx expo start
   ```

## Deployment
The backend is configured to be deployed on AWS Lightsail using PM2. The Admin panel can be built and deployed via Nginx, and the React Native app is compiled into a standalone Android APK via EAS/Gradle.

---
*Developed with precision for Pretina.*
