import { useState, useEffect, useRef } from "react";
import "./App.css";
import { CATEGORIES, COVER_COLORS } from "./data";
import {
  apiLogin, apiRegister,
  apiGetAllBooks, apiGetBookDetail, apiSearchBooks, apiGetBooksByCategory,
  apiGetCart, apiAddToCart, apiRemoveFromCart, apiIncreaseQty, apiDecreaseQty,
  apiGetOrders, apiCreateOrder, apiDeleteOrder,
  apiGetProfile,
} from "./api";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function BookCover({ book, size = "md" }) {
  const idx = parseInt((book.book_id || "B_0").replace("B_", "")) % COVER_COLORS.length;
  const [bg, accent] = COVER_COLORS[idx];
  const sizes = { sm: { w: 72, h: 100 }, md: { w: 112, h: 160 }, lg: { w: 196, h: 280 } };
  const { w, h } = sizes[size];
  return (
    <div style={{
      width: w, height: h,
      background: `linear-gradient(135deg, ${bg} 0%, ${accent}33 100%)`,
      borderRadius: 6, display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: 8, flexShrink: 0, border: `1px solid ${accent}44`
    }}>
      <div style={{ color: accent, fontSize: size === "lg" ? 13 : 10, fontWeight: 700, textAlign: "center", lineHeight: 1.3, wordBreak: "break-word" }}>
        {book.title}
      </div>
      <div style={{ color: "#ffffff88", fontSize: 9, marginTop: 6, textAlign: "center" }}>{book.author}</div>
    </div>
  );
}

function formatPrice(p) { return (p || 0).toLocaleString("vi-VN") + "đ"; }

// ─── LOADING SPINNER ─────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        border: "3px solid #374151", borderTopColor: "#F59E0B",
        animation: "spin 0.7s linear infinite"
      }} />
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]               = useState("home");
  const [currentUser, setCurrentUser] = useState(null);   // { id, name, role, token }
  const [cart, setCart]               = useState([]);      // cart items from backend chi_tiet[]
  const [selectedBook, setSelectedBook] = useState(null);
  const [orders, setOrders]           = useState([]);
  const [books, setBooks]             = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [search, setSearch]           = useState("");
  const [filterCat, setFilterCat]     = useState("Tất cả");
  const [toast, setToast]             = useState(null);

  // ── Toast ──────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // ── Token helper ──────────────────────────────────────────
  const token = currentUser?.token || null;

  // ── Load books on mount ───────────────────────────────────
  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setBooksLoading(true);
    try {
      const data = await apiGetAllBooks();
      setBooks(data);
    } catch (err) {
      showToast("Không thể tải danh sách sách: " + err.message, "error");
    } finally {
      setBooksLoading(false);
    }
  };

  // ── Load cart when user logs in ───────────────────────────
  useEffect(() => {
    if (!currentUser) { setCart([]); return; }
    loadCart(currentUser.token);
    loadOrders(currentUser.token);
  }, [currentUser]);

  const loadCart = async (tk) => {
    try {
      const data = await apiGetCart(tk);
      // Backend returns { chi_tiet: [{book_id, quantity, price}] }
      // We also need book title/author for display — merge with books state
      setCart(data.chi_tiet || []);
    } catch {
      setCart([]);
    }
  };

  const loadOrders = async (tk) => {
    try {
      const data = await apiGetOrders(tk);
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    }
  };

  // ── Filtered books (client-side after fetch) ──────────────
  // Search/category filtering: re-fetch from API when possible,
  // but also support fast local filter for instant UX.
  const filteredBooks = books.filter(b => {
    const matchCat = filterCat === "Tất cả" || b.category === filterCat;
    const kw = search.toLowerCase();
    const matchSearch = !kw ||
      b.title.toLowerCase().includes(kw) ||
      b.author.toLowerCase().includes(kw);
    return matchCat && matchSearch;
  });

  // ── Cart operations ───────────────────────────────────────
  const addToCart = async (book) => {
    if (!currentUser) {
      showToast("Vui lòng đăng nhập để thêm vào giỏ hàng", "error");
      navigate("signin");
      return;
    }
    try {
      const data = await apiAddToCart(book.book_id, 1, token);
      setCart(data.detail?.chi_tiet || []);
      showToast(`Đã thêm "${book.title}" vào giỏ hàng`);
      // Refresh book list so stock number updates live
      fetchBooks();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const updateQty = async (book_id, delta) => {
    if (!currentUser) return;
    try {
      let data;
      if (delta > 0) {
        data = await apiIncreaseQty(book_id, token);
      } else {
        data = await apiDecreaseQty(book_id, token);
      }
      setCart(data.order?.chi_tiet || []);
      // Refresh books so stock number updates live
      fetchBooks();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const removeFromCart = async (book_id) => {
    if (!currentUser) return;
    try {
      const data = await apiRemoveFromCart(book_id, token);
      setCart(data.detail?.chi_tiet || []);
      showToast("Đã xóa sản phẩm khỏi giỏ hàng");
      fetchBooks();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ── Checkout ──────────────────────────────────────────────
  const checkout = async () => {
    if (!currentUser) { navigate("signin"); return; }
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const vat = Math.round(subtotal * 0.08);
    const total = subtotal + vat;
    try {
      await apiCreateOrder(total, token);
      setCart([]);
      await loadOrders(token);
      fetchBooks(); // Stock already decremented at add-to-cart, just refresh display
      showToast("Đặt hàng thành công!");
      navigate("home");
    } catch (err) {
      showToast("Lỗi thanh toán: " + err.message, "error");
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      await apiDeleteOrder(orderId, token);
      await loadOrders(token);
      showToast("Đã xóa đơn hàng");
    } catch (err) {
      showToast("Lỗi xóa đơn: " + err.message, "error");
    }
  };

  const navigate = (p, book = null) => {
    setSelectedBook(book);
    setPage(p);
    window.scrollTo(0, 0);
  };

  // Cart count based on backend chi_tiet quantities
  const cartCount = cart.reduce((s, i) => s + (i.quantity || 0), 0);

  // Enrich cart items with book metadata for display
  const enrichedCart = cart.map(item => {
    const bookInfo = books.find(b => b.book_id === item.book_id) || {};
    return {
      ...item,
      title: bookInfo.title || item.book_id,
      author: bookInfo.author || "",
      // stockAvailable = what's still in the warehouse (not yet in any cart)
      // The + item.quantity adds back what this user has reserved, giving the
      // real remaining stock if they were to increase their own qty further.
      stockAvailable: (bookInfo.stock || 0) + item.quantity,
    };
  });

  return (
    <div className="app-wrapper">
      {/* TOAST */}
      {toast && (
        <div className={`toast ${toast.type === "success" ? "toast-success" : "toast-error"}`}>
          {toast.msg}
        </div>
      )}

      <Navbar
        currentUser={currentUser} cartCount={cartCount} navigate={navigate}
        onLogout={() => { setCurrentUser(null); navigate("home"); showToast("Đã đăng xuất"); }}
        search={search} setSearch={setSearch}
        filterCat={filterCat} setFilterCat={setFilterCat}
      />

      <main className="site-container">
        {page === "home" && (
          <HomePage
            books={filteredBooks} loading={booksLoading}
            navigate={navigate} addToCart={addToCart}
            filterCat={filterCat} setFilterCat={setFilterCat}
          />
        )}
        {page === "product" && selectedBook && (
          <ProductPage book={selectedBook} navigate={navigate} addToCart={addToCart} />
        )}
        {page === "signin" && (
          <SignIn navigate={navigate} setCurrentUser={setCurrentUser} showToast={showToast} />
        )}
        {page === "signup" && (
          <SignUp navigate={navigate} showToast={showToast} />
        )}
        {page === "account" && (
          <AccountPage
            currentUser={currentUser} navigate={navigate}
            orders={orders} deleteOrder={deleteOrder}
            showToast={showToast} token={token}
          />
        )}
        {page === "cart" && (
          <CartPage
            cart={enrichedCart} updateQty={updateQty}
            removeFromCart={removeFromCart} checkout={checkout}
            navigate={navigate} currentUser={currentUser}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
function Navbar({ currentUser, cartCount, navigate, onLogout, search, setSearch, filterCat, setFilterCat }) {
  const [dropdown, setDropdown] = useState(false);
  const [catOpen, setCatOpen]   = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setDropdown(false); setCatOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <nav className="app-nav" ref={ref}>
      <div className="nav-top">
        <div onClick={() => navigate("home")} className="nav-logo">
          <div className="nav-logo-icon">📚</div>
          <span className="nav-logo-text">JEON CHAN JEOK</span>
        </div>

        <div className="nav-account">
          <button onClick={() => setDropdown(p => !p)} className="icon-button">👤</button>
          {dropdown && (
            <div className="nav-dropdown nav-dropdown-right">
              {currentUser ? (
                <>
                  <div className="nav-dropdown-header">{currentUser.name}</div>
                  <MenuItem label="Quản lý tài khoản" onClick={() => { navigate("account"); setDropdown(false); }} />
                  <MenuItem label="Quản lý giỏ hàng"  onClick={() => { navigate("cart");    setDropdown(false); }} />
                  <MenuItem label="Đăng xuất"          onClick={() => { onLogout();          setDropdown(false); }} accent />
                </>
              ) : (
                <>
                  <MenuItem label="Đăng nhập" onClick={() => { navigate("signin"); setDropdown(false); }} accent />
                  <MenuItem label="Đăng ký"   onClick={() => { navigate("signup"); setDropdown(false); }} />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="nav-secondary">
        <div className="filter-wrapper">
          <button className="btn-ghost" onClick={() => setCatOpen(p => !p)}>
            <span>Lọc</span>
            <span className="filter-icon">▾</span>
          </button>
          {catOpen && (
            <div className="nav-dropdown nav-dropdown-left">
              {CATEGORIES.map(cat => (
                <div key={cat}
                  onClick={() => { setFilterCat(cat); setCatOpen(false); navigate("home"); }}
                  className={filterCat === cat ? "nav-dropdown-item active" : "nav-dropdown-item"}>
                  {cat}
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tìm kiếm tên sách, tác giả hoặc từ khóa"
          className="search-input"
          onKeyDown={e => e.key === "Enter" && navigate("home")}
        />

        <div onClick={() => navigate("cart")} className="nav-cart">
          <span className="icon-button">🛒</span>
          {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
        </div>
      </div>
    </nav>
  );
}

function MenuItem({ label, onClick, accent }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: "11px 16px", cursor: "pointer", fontSize: 13,
        color: accent ? "#F59E0B" : "#F9FAFB",
        background: hov ? "#F59E0B11" : "transparent", transition: "all 0.15s"
      }}>
      {label}
    </div>
  );
}

// ─── HOME PAGE ───────────────────────────────────────────────────────────────
function HomePage({ books, loading, navigate, addToCart }) {
  const banchay = books.slice(0, 4);
  const xuhuong = books.slice(2, 6);
  const moitinh = books.slice(4, 8);
  const tuoitre = books.slice(1, 5);

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      {/* Hero Banner */}
      <div style={{
        margin: "24px 24px 0", borderRadius: 12, overflow: "hidden",
        background: "linear-gradient(135deg, #0e1d45 0%, #111827 50%, #111827 100%)",
        padding: "40px 48px", display: "flex", alignItems: "center", gap: 40,
        border: "1px solid #1E3A8A", position: "relative"
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Nunito Sans','Noto Sans Mono',monospace", fontSize: 11, color: "#F59E0B", letterSpacing: 3, marginBottom: 8 }}>COMBO ĐẶC BIỆT</div>
          <div style={{ fontFamily: "'Nunito Sans','Noto Sans Mono',monospace", fontSize: 52, fontWeight: 900, color: "#fff", lineHeight: 1, marginBottom: 8 }}>-15%</div>
          <div style={{ color: "#B4BCC4", fontSize: 16, marginBottom: 24 }}>Kèm chữ ký tác giả Nguyễn Nhật Ánh</div>
          <button className="btn-primary" onClick={() => navigate("home")}>Khám phá ngay →</button>
        </div>
        <div style={{ display: "flex", gap: -20, position: "relative" }}>
          {books.filter(b => b.author === "Nguyễn Nhật Ánh").map((b, i) => (
            <div key={b.book_id} style={{ transform: `rotate(${(i - 1) * 8}deg) translateY(${i % 2 ? -10 : 0}px)`, zIndex: i }}>
              <BookCover book={b} size="md" />
            </div>
          ))}
        </div>
      </div>

      {loading ? <Spinner /> : (
        books.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
            Không tìm thấy sách nào
          </div>
        ) : (
          [
            { title: "Bán chạy", books: banchay },
            { title: "Xu hướng", books: xuhuong },
            { title: "Mới tinh", books: moitinh },
            { title: "Tuổi trẻ", books: tuoitre },
          ].map(section => (
            <BookSection key={section.title} title={section.title} books={section.books}
              navigate={navigate} addToCart={addToCart} />
          ))
        )
      )}
    </div>
  );
}

function BookSection({ title, books, navigate, addToCart }) {
  if (!books || books.length === 0) return null;
  return (
    <div className="book-section">
      <div className="book-section-header">
        <div className="section-label">{title}</div>
        <button className="section-button"
          onMouseEnter={e => e.target.style.background = "#E5E7EB"}
          onMouseLeave={e => e.target.style.background = "#F3F4F6"}>
          →
        </button>
      </div>
      <div className="section-divider" />
      <div className="book-list">
        {books.map(book => (
          <BookCard key={book.book_id} book={book} navigate={navigate} addToCart={addToCart} />
        ))}
      </div>
    </div>
  );
}

function BookCard({ book, navigate, addToCart }) {
  const outOfStock = book.stock <= 0;
  return (
    <div className="book-card" style={{
      background: "#1F2937", border: "1px solid #374151", borderRadius: 10,
      padding: 16, minWidth: 160, maxWidth: 160, cursor: "pointer",
      boxShadow: "0 4px 16px #0003", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 8,
      position: "relative", overflow: "hidden",
      opacity: outOfStock ? 0.6 : 1
    }}>
      {outOfStock && (
        <div style={{
          position: "absolute", top: 10, right: 10,
          background: "#EF4444", color: "#fff", fontSize: 9,
          fontWeight: 700, padding: "3px 7px", borderRadius: 4, letterSpacing: 1
        }}>HẾT HÀNG</div>
      )}
      <div onClick={() => navigate("product", book)} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        <BookCover book={book} size="md" />
        <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: "#F9FAFB", lineHeight: 1.4, height: 38, overflow: "hidden", textAlign: "center", width: "100%" }}>
          {book.title}
        </div>
        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4, marginBottom: 8, textAlign: "center", width: "100%" }}>{book.author}</div>
        <div style={{ color: "#F59E0B", fontWeight: 700, fontSize: 15, fontFamily: "'Nunito Sans','Noto Sans Mono',monospace" }}>
          {formatPrice(book.price)}
        </div>
      </div>
      <button
        className={outOfStock ? "btn-ghost" : "btn-primary"}
        onClick={e => { e.stopPropagation(); if (!outOfStock) addToCart(book); }}
        disabled={outOfStock}
        style={{ width: "100%", fontSize: 11, padding: "8px 0", cursor: outOfStock ? "not-allowed" : "pointer" }}>
        {outOfStock ? "Hết hàng" : "+ Giỏ hàng"}
      </button>
    </div>
  );
}

// ─── PRODUCT PAGE ─────────────────────────────────────────────────────────────
function ProductPage({ book, navigate, addToCart }) {
  const outOfStock = book.stock <= 0;
  return (
    <div style={{ maxWidth: 1100, margin: "32px auto", padding: "0 24px", animation: "fadeUp 0.4s ease" }}>
      <span onClick={() => navigate("home")} style={{ color: "#F59E0B", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 6, marginBottom: 32 }}>
        ← Quay lại
      </span>
      <div style={{ display: "flex", gap: 48, background: "#1F2937", borderRadius: 12, padding: 40, border: "1px solid #1f2937" }}>
        <BookCover book={book} size="lg" />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 32, marginBottom: 24, color: "#B4BCC4", fontSize: 13 }}>
            <span>Tác giả: <strong style={{ color: "#F9FAFB" }}>{book.author}</strong></span>
            <span>Thể loại: <strong style={{ color: "#F9FAFB" }}>{book.category}</strong></span>
            <span>Còn:{" "}
              <strong style={{ color: outOfStock ? "#EF4444" : "#F59E0B" }}>
                {outOfStock ? "Hết hàng" : book.stock}
              </strong>
            </span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display','Noto Serif',serif", fontSize: 32, fontWeight: 900, color: "#F9FAFB", marginBottom: 20, lineHeight: 1.2 }}>
            {book.title}
          </h1>
          <div style={{ background: "#111827", borderRadius: 8, padding: "20px 24px", marginBottom: 16, border: "1px solid #1f2937" }}>
            <div style={{ fontFamily: "'Nunito Sans','Noto Sans Mono',monospace", fontSize: 11, color: "#F59E0B", marginBottom: 8, letterSpacing: 2 }}>GIỚI THIỆU</div>
            <p style={{ color: "#d1cbc3", lineHeight: 1.8, fontSize: 15 }}>{book.description}</p>
          </div>
          <div style={{ background: "#111827", borderRadius: 8, padding: "20px 24px", marginBottom: 28, border: "1px solid #1f2937" }}>
            <div style={{ fontFamily: "'Nunito Sans','Noto Sans Mono',monospace", fontSize: 11, color: "#F59E0B", marginBottom: 8, letterSpacing: 2 }}>MÔ TẢ NGẮN</div>
            <p style={{ color: "#d1cbc3", lineHeight: 1.8, fontSize: 14 }}>
              {book.category} • {book.author} — một tác phẩm đáng đọc trong bộ sưu tập của bạn.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Giá bán</div>
              <div style={{ fontFamily: "'Nunito Sans',monospace", fontSize: 28, fontWeight: 700, color: "#F59E0B" }}>
                {formatPrice(book.price)}
              </div>
            </div>
            <button
              className={outOfStock ? "btn-ghost" : "btn-primary"}
              onClick={() => { if (!outOfStock) addToCart(book); }}
              disabled={outOfStock}
              style={{ fontSize: 15, padding: "14px 36px", flex: 1, cursor: outOfStock ? "not-allowed" : "pointer" }}>
              {outOfStock ? "Hết hàng" : "Thêm vào giỏ hàng"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SIGN IN ──────────────────────────────────────────────────────────────────
function SignIn({ navigate, setCurrentUser, showToast }) {
  const [form, setForm]     = useState({ login: "", password: "" });
  const [err, setErr]       = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.login || !form.password) { setErr("Vui lòng nhập đầy đủ thông tin"); return; }
    setLoading(true);
    setErr("");
    try {
      // Backend login field is 'loginname', not 'email'
      const data = await apiLogin(form.login, form.password);
      // data = { token, user: { id, name, role } }
      setCurrentUser({ ...data.user, token: data.token });
      showToast(`Chào mừng, ${data.user.name}!`);
      navigate("home");
    } catch (err) {
      setErr(err.message || "Sai tên đăng nhập hoặc mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeUp 0.4s ease" }}>
      <div style={{ background: "#1F2937", border: "1px solid #1f2937", borderRadius: 12, padding: 48, width: "100%", maxWidth: 480 }}>
        <span onClick={() => navigate("home")} style={{ color: "#F59E0B", cursor: "pointer", fontSize: 14 }}>← Quay lại</span>
        <h2 style={{ fontFamily: "'Playfair Display','Noto Serif',serif", fontSize: 28, margin: "24px 0 32px", textAlign: "center", letterSpacing: 4 }}>ĐĂNG NHẬP</h2>
        {err && <div style={{ background: "#EF444411", color: "#EF4444", padding: "10px 14px", borderRadius: 6, marginBottom: 16, fontSize: 13 }}>{err}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input
            placeholder="Tên đăng nhập" value={form.login}
            onChange={e => setForm({ ...form, login: e.target.value })}
            style={{ width: "100%" }}
          />
          <input
            type="password" placeholder="Mật khẩu" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            style={{ width: "100%" }}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
          />
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            <span>Chưa có tài khoản? </span>
            <span style={{ color: "#F59E0B", cursor: "pointer" }} onClick={() => navigate("signup")}>Đăng ký</span>
          </div>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}
            style={{ width: "100%", padding: "13px 0", fontSize: 14, marginTop: 8, opacity: loading ? 0.6 : 1 }}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SIGN UP ──────────────────────────────────────────────────────────────────
function SignUp({ navigate, showToast }) {
  const [form, setForm]     = useState({ login: "", password: "", confirm: "", name: "" });
  const [err, setErr]       = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.login || !form.password || !form.name) { setErr("Vui lòng điền đầy đủ thông tin"); return; }
    if (form.password !== form.confirm)              { setErr("Mật khẩu xác nhận không khớp");  return; }
    setLoading(true);
    setErr("");
    try {
      await apiRegister(form.login, form.password, form.name);
      showToast("Đăng ký thành công! Hãy đăng nhập");
      navigate("signin");
    } catch (err) {
      setErr(err.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeUp 0.4s ease" }}>
      <div style={{ background: "#1F2937", border: "1px solid #1f2937", borderRadius: 12, padding: 48, width: "100%", maxWidth: 480 }}>
        <span onClick={() => navigate("home")} style={{ color: "#F59E0B", cursor: "pointer", fontSize: 14 }}>← Quay lại</span>
        <h2 style={{ fontFamily: "'Playfair Display','Noto Serif',serif", fontSize: 28, margin: "24px 0 32px", textAlign: "center", letterSpacing: 4 }}>ĐĂNG KÝ</h2>
        {err && <div style={{ background: "#EF444411", color: "#EF4444", padding: "10px 14px", borderRadius: 6, marginBottom: 16, fontSize: 13 }}>{err}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { key: "name",     placeholder: "Họ và tên" },
            { key: "login",    placeholder: "Tên đăng nhập" },
            { key: "password", placeholder: "Mật khẩu",           type: "password" },
            { key: "confirm",  placeholder: "Nhập lại mật khẩu",  type: "password" },
          ].map(f => (
            <input key={f.key} type={f.type || "text"} placeholder={f.placeholder}
              value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
              style={{ width: "100%" }}
            />
          ))}
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}
              style={{ flex: 1, padding: "13px 0", fontSize: 14, opacity: loading ? 0.6 : 1 }}>
              {loading ? "Đang đăng ký..." : "Đăng ký ngay"}
            </button>
            <button className="btn-ghost" onClick={() => navigate("home")} style={{ flex: 1 }}>Hủy</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ACCOUNT PAGE ─────────────────────────────────────────────────────────────
function AccountPage({ currentUser, navigate, orders, deleteOrder, showToast, token }) {
  const [form, setForm] = useState({
    name:    currentUser?.name  || "",
    phone:   "",
    address: "",
    newPass: "",
    confirm: "",
  });

  if (!currentUser) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <p style={{ color: "#6b7280", marginBottom: 20 }}>Bạn chưa đăng nhập</p>
        <button className="btn-primary" onClick={() => navigate("signin")}>Đăng nhập ngay</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "32px auto", padding: "0 24px", animation: "fadeUp 0.4s ease" }}>
      <span onClick={() => navigate("home")} style={{ color: "#F59E0B", cursor: "pointer", fontSize: 14 }}>← Quay lại</span>

      <div style={{ background: "#1F2937", border: "1px solid #1f2937", borderRadius: 12, padding: 40, marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36 }}>
          <div style={{ width: 64, height: 64, background: "#F59E0B33", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, border: "2px solid #F59E0B" }}>
            👤
          </div>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display','Noto Serif',serif", fontSize: 22, margin: 0 }}>Tài khoản người dùng</h2>
            <div style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>
              ID: {currentUser.id} &nbsp;·&nbsp; Role: {currentUser.role === 1 ? "Admin" : "Khách hàng"}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { label: "Tên hiển thị", key: "name"    },
            { label: "Số điện thoại", key: "phone"  },
            { label: "Địa chỉ",       key: "address" },
          ].map(f => (
            <div key={f.label} style={{ gridColumn: f.label === "Địa chỉ" ? "1 / -1" : "auto" }}>
              <label style={{ fontSize: 12, color: "#B4BCC4", display: "block", marginBottom: 6, fontFamily: "'Nunito Sans','Noto Sans Mono',monospace" }}>{f.label}</label>
              <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={{ width: "100%" }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 12, color: "#B4BCC4", display: "block", marginBottom: 6, fontFamily: "'Nunito Sans','Noto Sans Mono',monospace" }}>Mật khẩu mới</label>
            <input type="password" value={form.newPass} onChange={e => setForm({ ...form, newPass: e.target.value })} style={{ width: "100%" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#B4BCC4", display: "block", marginBottom: 6, fontFamily: "'Nunito Sans','Noto Sans Mono',monospace" }}>Xác nhận lại</label>
            <input type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} style={{ width: "100%" }} />
          </div>
        </div>

        <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
          <button className="btn-primary" onClick={() => showToast("Cập nhật thông tin thành công!")}>Lưu thay đổi</button>
          {form.newPass && <button className="btn-ghost" onClick={() => showToast("Đổi mật khẩu thành công!")}>Thay đổi mật khẩu</button>}
        </div>
      </div>

      {/* Order History */}
      <div style={{ background: "#1F2937", border: "1px solid #1f2937", borderRadius: 12, padding: 32, marginTop: 20 }}>
        <h3 style={{ fontFamily: "'Playfair Display','Noto Serif',serif", margin: "0 0 20px", fontSize: 18 }}>Lịch sử đơn hàng</h3>
        {orders.length === 0 ? (
          <p style={{ color: "#6b7280", fontSize: 14 }}>Chưa có đơn hàng nào</p>
        ) : (
          orders.map(o => (
            <div key={o._id} style={{ background: "#111827", borderRadius: 8, padding: 16, marginBottom: 12, border: "1px solid #1f2937", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "'Nunito Sans','Noto Sans Mono',monospace", fontSize: 12, color: "#F59E0B" }}>Đơn #{o._id?.slice(-6) || o._id}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{o.ngay_mua}</div>
                <div style={{ marginTop: 6, color: "#F59E0B", fontWeight: 700 }}>{formatPrice(o.tong_tien)}</div>
              </div>
              <button onClick={() => deleteOrder(o._id)}
                style={{ background: "none", border: "1px solid #374151", color: "#EF4444", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>
                Xóa
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── CART PAGE ────────────────────────────────────────────────────────────────
function CartPage({ cart, updateQty, removeFromCart, checkout, navigate, currentUser }) {
  const subtotal = cart.reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0);
  const vat      = Math.round(subtotal * 0.08);
  const total    = subtotal + vat;

  return (
    <div className="cart-page">
      <div className="cart-header">
        <span onClick={() => navigate("home")} style={{ color: "#F59E0B", cursor: "pointer", fontSize: 14 }}>← Quay lại</span>
        <h2 style={{ fontFamily: "'Playfair Display','Noto Serif',serif", fontSize: 24, margin: 0 }}>Giỏ hàng</h2>
        <div />
      </div>

      {cart.length === 0 ? (
        <div style={{ textAlign: "center", padding: 80, color: "#6b7280" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
          <p>Giỏ hàng trống</p>
          <button className="btn-primary" onClick={() => navigate("home")} style={{ marginTop: 16 }}>Tiếp tục mua sắm</button>
        </div>
      ) : (
        <div className="cart-grid">
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.book_id} className="cart-item">
                <BookCover book={item} size="sm" />

                <div className="cart-item-info">
                  <div className="cart-item-title">{item.title || item.book_id}</div>
                  <div style={{ fontSize: 13, color: "#D1D5DB", marginBottom: 2 }}>{item.author}</div>
                  <div className="cart-item-price">
                    {formatPrice(item.price)} <span className="multiply">×</span> {item.quantity}
                  </div>
                </div>

                <div className="cart-item-actions">
                  <div className="qty-control">
                    <button onClick={() => updateQty(item.book_id, -1)}
                      style={{ background: "none", border: "none", color: "#111827", cursor: "pointer", padding: "4px 8px", fontSize: 16, fontWeight: "bold" }}>−</button>
                    <span style={{ fontSize: 13, padding: "4px 8px", minWidth: 24, textAlign: "center", color: "#111827", fontWeight: 600 }}>{item.quantity}</span>
                    <button onClick={() => updateQty(item.book_id, 1)}
                      disabled={item.quantity >= item.stockAvailable}
                      style={{
                        background: "none", border: "none", color: "#111827",
                        cursor: item.quantity >= item.stockAvailable ? "not-allowed" : "pointer",
                        padding: "4px 8px", fontSize: 16, fontWeight: "bold",
                        opacity: item.quantity >= item.stockAvailable ? 0.3 : 1
                      }}>+</button>
                  </div>
                  <div className="item-total">{formatPrice((item.price || 0) * (item.quantity || 0))}</div>
                  <button onClick={() => removeFromCart(item.book_id)} className="remove-button">🗑</button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="cart-summary">
            <h3 className="summary-title">TỔNG CỘNG</h3>
            <div style={{ borderTop: "1px solid #374151", borderBottom: "1px solid #374151", padding: "16px 0", marginBottom: 20, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, color: "#B4BCC4" }}>
                <span>Tổng</span><span style={{ color: "#F9FAFB" }}>{formatPrice(subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#B4BCC4" }}>
                <span>VAT (8%)</span><span style={{ color: "#F9FAFB" }}>{formatPrice(vat)}</span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, fontSize: 14 }}>
              <span style={{ fontWeight: 700, color: "#F9FAFB" }}>Tổng thanh toán</span>
              <span style={{ color: "#F59E0B", fontWeight: 700, fontFamily: "'Nunito Sans','Noto Sans Mono',monospace", fontSize: 15 }}>{formatPrice(total)}</span>
            </div>
            <button className="btn-primary" onClick={checkout}
              style={{ width: "100%", padding: "12px 0", fontSize: 14 }}>
              {currentUser ? "Thanh toán" : "Đăng nhập để thanh toán"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="footer-bar">
      <div className="footer-inner">
        <div className="footer-columns">
          {[
            { title: "Dịch vụ",     items: ["Giao hàng tận nơi", "Thanh toán online", "Đổi trả 30 ngày"] },
            { title: "Về chúng tôi", items: ["Giới thiệu", "Tuyển dụng", "Tin tức"] },
            { title: "Trợ giúp",    items: ["FAQ", "Liên hệ", "Hướng dẫn mua"] },
            { title: "Mua hàng",    items: ["Tất cả sách", "Khuyến mãi", "Combo"] },
          ].map(col => (
            <div key={col.title} className="footer-column">
              <div className="footer-column-title">{col.title}</div>
              {col.items.map(i => <div key={i} className="footer-link">{i}</div>)}
            </div>
          ))}
          <div className="footer-column footer-subscribe">
            <div className="footer-column-title">Tìm chúng tôi</div>
            <input placeholder="Nhập địa chỉ email" className="footer-input" />
          </div>
        </div>
        <div className="footer-legal">
          {["Điều khoản sử dụng", "Bản quyền", "Quyền riêng tư", "Trợ năng", "Điều khoản Cookie"].map(t => (
            <span key={t} style={{ color: "#4b5563", fontSize: 12, cursor: "pointer" }}>{t}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}
