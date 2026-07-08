#!/bin/bash
git add admin/public/logo.png admin/public/pretina-icon.png
git commit -m "chore(admin): add Pretina branding assets and icons"

git add backend/src/models/User.js
git commit -m "feat(backend): expand User model for B2B/Wholesale fields"

git add backend/src/models/Product.js
git commit -m "feat(backend): upgrade Product model with bulk pricing and advanced variants"

git add backend/src/models/Category.js
git commit -m "feat(backend): update Category model structure"

git add backend/src/controllers/product.controller.js
git commit -m "feat(backend): enhance product controller with complex payload parsing"

git add backend/src/routes/product.routes.js
git commit -m "feat(backend): add duplicate product and low stock endpoints"

git add backend/src/services/otp.service.js
git commit -m "feat(backend): add OTP verification service"

git add backend/src/services/sms.service.js
git commit -m "feat(backend): add transactional SMS service provider integrations"

git add backend/src/services/notification.service.js
git commit -m "feat(backend): add FCM push notification service"

git add backend/src/controllers/notification.controller.js
git commit -m "feat(backend): add notification broadcasting and history APIs"

git add backend/src/routes/notification.routes.js
git commit -m "feat(backend): add notification endpoints"

git add backend/src/routes/order.routes.js
git commit -m "feat(backend): rewrite order routes with dynamic bulk pricing and event hooks"

git add backend/src/routes/user.routes.js
git commit -m "feat(backend): add admin endpoints for customer management"

git add admin/src/api/endpoints.js
git commit -m "feat(admin): add new API integration methods for backend parity"

git add admin/src/components/Sidebar.jsx
git commit -m "feat(admin): update sidebar navigation layout"

git add admin/src/pages/Login.jsx
git commit -m "feat(admin): update login page branding"

git add admin/src/pages/Dashboard.jsx
git commit -m "feat(admin): enhance dashboard with new metrics"

git add admin/src/pages/Categories.jsx
git commit -m "feat(admin): update categories management UI"

git add admin/src/pages/AbandonedCarts.jsx
git commit -m "feat(admin): update abandoned carts interface"

git add admin/src/pages/CustomerDetails.jsx
git commit -m "feat(admin): completely redesign customer profile with B2B tabs"

git add admin/src/pages/Products.jsx
git commit -m "feat(admin): upgrade product form with rich text and bulk tiers"

git add admin/src/components/OrderDrawer.jsx
git commit -m "feat(admin): add fast sliding order drawer component"

git add admin/src/pages/Orders.jsx
git commit -m "feat(admin): overhaul orders page with drawer and bulk actions"

git push origin main
