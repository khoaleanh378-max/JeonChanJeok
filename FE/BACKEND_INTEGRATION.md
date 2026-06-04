# Backend Integration Notes

## How to run

### 1. Start the backend
```bash
cd backend-cnpm-main
npm install
node server.js
# Runs on http://localhost:8080
```

### 2. Start the frontend dev server
```bash
cd JeonChanJeok
npm install
npm run dev
# Runs on http://localhost:5173 (or similar)
# Vite proxies /api/* → http://localhost:8080/api/*
```

## What changed

### Frontend
| File | Change |
|---|---|
| `src/api.js` | **NEW** — all backend API calls centralized here |
| `src/App.jsx` | Full rewrite — replaced local state data with API calls |
| `src/data.js` | Removed `BOOKS_DATA`, `USERS_DATA` — kept `CATEGORIES`, `COVER_COLORS` |
| `vite.config.js` | Added `server.proxy` — `/api` → `http://localhost:8080` |
| `src/App.css` | Added `@keyframes spin` for loading spinner |

### Backend (`server.js`)
| Issue | Fix |
|---|---|
| `require('./routes/orderRoutes')` | Fixed to `require('./routes/OrderRoutes')` (Linux case-sensitive) |
| `require('./routes/orderDetailRoutes')` | Fixed to `require('./routes/OrderdetailRoutes')` (Linux case-sensitive) |

## API endpoints used

| What | Method | URL | Auth |
|---|---|---|---|
| Get all books | GET | /api/books | No |
| Book detail | GET | /api/books/:book_id | No |
| Search books | GET | /api/books/search?keyword= | No |
| Books by category | GET | /api/books/category/:category | No |
| Login | POST | /api/auth/login | No |
| Register | POST | /api/auth/register | No |
| Get profile | GET | /api/auth/profile | Bearer token |
| View cart | GET | /api/orderdetails | Bearer token |
| Add to cart | POST | /api/orderdetails/add | Bearer token |
| Remove from cart | DELETE | /api/orderdetails/remove/:book_id | Bearer token |
| Increase qty | PUT | /api/orderdetails/increase | Bearer token |
| Decrease qty | PUT | /api/orderdetails/decrease | Bearer token |
| Get orders | GET | /api/orders | Bearer token |
| Create order | POST | /api/orders | Bearer token |
| Delete order | DELETE | /api/orders/:id | Bearer token |

## Production deployment
Set `VITE_API_URL` environment variable to your backend URL, e.g.:
```
VITE_API_URL=https://your-backend.com/api
```
The Vite proxy only works in dev. In production, set this env var at build time.
