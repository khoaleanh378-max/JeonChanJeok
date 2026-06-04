const BASE = import.meta.env.VITE_API_URL || "/api";

// ── Helper ──────────────────────────────────────────────────
async function request(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

const get  = (path, token)        => request("GET",    path, null, token);
const post = (path, body, token)  => request("POST",   path, body, token);
const put  = (path, body, token)  => request("PUT",    path, body, token);
const del  = (path, token)        => request("DELETE", path, null, token);

// ── Auth ────────────────────────────────────────────────────
export const apiLogin    = (loginname, password) =>
  post("/auth/login", { loginname, password });

export const apiRegister = (loginname, password, name) =>
  post("/auth/register", { loginname, password, name });

export const apiGetProfile = (token) =>
  get("/auth/profile", token);

// ── Books ───────────────────────────────────────────────────
export const apiGetAllBooks = () =>
  get("/books");

export const apiGetBookDetail = (book_id) =>
  get(`/books/${book_id}`);

export const apiSearchBooks = (keyword) =>
  get(`/books/search?keyword=${encodeURIComponent(keyword)}`);

export const apiGetBooksByCategory = (category) =>
  get(`/books/category/${encodeURIComponent(category)}`);

// ── Cart (OrderDetails — the live cart) ─────────────────────
export const apiGetCart = (token) =>
  get("/orderdetails", token);

export const apiAddToCart = (book_id, quantity, token) =>
  post("/orderdetails/add", { book_id, quantity }, token);

export const apiRemoveFromCart = (book_id, token) =>
  del(`/orderdetails/remove/${book_id}`, token);

export const apiIncreaseQty = (book_id, token) =>
  put("/orderdetails/increase", { book_id }, token);

export const apiDecreaseQty = (book_id, token) =>
  put("/orderdetails/decrease", { book_id }, token);

// ── Orders (purchase history) ────────────────────────────────
export const apiGetOrders = (token) =>
  get("/orders", token);

export const apiCreateOrder = (tong_tien, token) =>
  post("/orders", { tong_tien }, token);

export const apiDeleteOrder = (id, token) =>
  del(`/orders/${id}`, token);
