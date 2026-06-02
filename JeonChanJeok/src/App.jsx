import { useState, useEffect, useRef } from "react";
import "./App.css";
import { BOOKS_DATA, USERS_DATA, CATEGORIES, COVER_COLORS } from "./data"; //Import database

function BookCover({ book, size = "md" }) {
  const idx = parseInt(book.book_id.replace("B_", "")) % COVER_COLORS.length;
  const [bg, accent] = COVER_COLORS[idx];
  const sizes = { sm: { w: 72, h: 100 }, md: { w: 112, h: 160 }, lg: { w: 196, h: 280 } };
  const { w, h } = sizes[size];
  
  return (
    <div style={{
      width: w, height: h, background: `linear-gradient(135deg, ${bg} 0%, ${accent}33 100%)`,
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

function formatPrice(p) { return p.toLocaleString("vi-VN") + "đ"; }

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [currentUser, setCurrentUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Tất cả");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const addToCart = (book) => {
    setCart(prev => {
      const ex = prev.find(i => i.book_id === book.book_id);
      if (ex) return prev.map(i => i.book_id === book.book_id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...book, qty: 1 }];
    });
    showToast(`Đã thêm "${book.title}" vào giỏ hàng`);
  };

  const updateQty = (book_id, delta) => {
    setCart(prev => prev.map(i => i.book_id === book_id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const removeFromCart = (book_id) => {
    setCart(prev => prev.filter(i => i.book_id !== book_id));
  };

  const checkout = () => {
    if (!currentUser) { setPage("signin"); return; }
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const newOrder = {
      _id: orders.length + 1,
      userId: currentUser.id,
      ngay_mua: new Date().toISOString().split("T")[0],
      tong_tien: subtotal,
      chi_tiet: cart.map(i => ({ ma_sach: i.book_id, so_luong: i.qty, gia_tien: i.price }))
    };
    setOrders(prev => [...prev, newOrder]);
    setCart([]);
    showToast("Đặt hàng thành công!");
    setPage("home");
  };

  const navigate = (p, book = null) => {
    setSelectedBook(book);
    setPage(p);
    window.scrollTo(0, 0);
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const filteredBooks = BOOKS_DATA.filter(b => {
    const matchCat = filterCat === "Tất cả" || b.category === filterCat;
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="app-wrapper">
      {/* TOAST */}
      {toast && (
        <div className={`toast ${toast.type === "success" ? "toast-success" : "toast-error"}`}>
          {toast.msg}
        </div>
      )}

      <Navbar currentUser={currentUser} cartCount={cartCount} navigate={navigate}
        onLogout={() => { setCurrentUser(null); navigate("home"); showToast("Đã đăng xuất"); }}
        search={search} setSearch={setSearch} filterCat={filterCat} setFilterCat={setFilterCat} />

      <main className="site-container">
        {page === "home" && <HomePage books={filteredBooks} navigate={navigate} addToCart={addToCart} filterCat={filterCat} setFilterCat={setFilterCat} />}
        {page === "product" && selectedBook && <ProductPage book={selectedBook} navigate={navigate} addToCart={addToCart} />}
        {page === "signin" && <SignIn navigate={navigate} users={USERS_DATA} setCurrentUser={setCurrentUser} showToast={showToast} />}
        {page === "signup" && <SignUp navigate={navigate} showToast={showToast} />}
        {page === "account" && <AccountPage currentUser={currentUser} navigate={navigate} orders={orders} showToast={showToast} />}
        {page === "cart" && <CartPage cart={cart} updateQty={updateQty} removeFromCart={removeFromCart} checkout={checkout} navigate={navigate} currentUser={currentUser} />}
      </main>

      <Footer />
    </div>
  );
}

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
function Navbar({ currentUser, cartCount, navigate, onLogout, search, setSearch, filterCat, setFilterCat }) {
  const [dropdown, setDropdown] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setDropdown(false); setCatOpen(false); } };
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
                  <MenuItem label="Quản lý giỏ hàng" onClick={() => { navigate("cart"); setDropdown(false); }} />
                  <MenuItem label="Đăng xuất" onClick={() => { onLogout(); setDropdown(false); }} accent />
                </>
              ) : (
                <>
                  <MenuItem label="Đăng nhập" onClick={() => { navigate("signin"); setDropdown(false); }} accent />
                  <MenuItem label="Đăng ký" onClick={() => { navigate("signup"); setDropdown(false); }} />
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
                <div key={cat} onClick={() => { setFilterCat(cat); setCatOpen(false); navigate("home"); }}
                  className={filterCat === cat ? "nav-dropdown-item active" : "nav-dropdown-item"}>
                  {cat}
                </div>
              ))}
            </div>
          )}
        </div>

        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tìm kiếm tên sách, tác giả hoặc từ khóa"
          className="search-input"
          onKeyDown={e => e.key === "Enter" && navigate("home")}
        />

        <div onClick={() => navigate("cart")} className="nav-cart">
          <span className="icon-button">🛒</span>
          {cartCount > 0 && (
            <span className="nav-badge">{cartCount}</span>
          )}
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
function HomePage({ books, navigate, addToCart, filterCat }) {
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
          <div style={{ fontFamily: "'Nunito Sans', 'Noto Sans Mono', monospace", fontSize: 11, color: "#F59E0B", letterSpacing: 3, marginBottom: 8 }}>COMBO ĐẶC BIỆT</div>
          <div style={{ fontFamily: "'Nunito Sans', 'Noto Sans Mono', monospace", fontSize: 52, fontWeight: 900, color: "#fff", lineHeight: 1, marginBottom: 8 }}>-15%</div>
          <div style={{ color: "#B4BCC4", fontSize: 16, marginBottom: 24 }}>Kèm chữ ký tác giả Nguyễn Nhật Ánh</div>
          <button className="btn-primary" onClick={() => navigate("home")}>Khám phá ngay →</button>
        </div>
        <div style={{ display: "flex", gap: -20, position: "relative" }}>
          {BOOKS_DATA.filter(b => b.author === "Nguyễn Nhật Ánh").map((b, i) => (
            <div key={b.book_id} style={{ transform: `rotate(${(i - 1) * 8}deg) translateY(${i % 2 ? -10 : 0}px)`, zIndex: i }}>
              <BookCover book={b} size="md" />
            </div>
          ))}
        </div>
      </div>

      {/* Book Sections */}
      {[
        { title: "Bán chạy", books: banchay },
        { title: "Xu hướng", books: xuhuong },
        { title: "Mới tinh", books: moitinh },
        { title: "Tuổi trẻ", books: tuoitre },
      ].map(section => (
        <BookSection key={section.title} title={section.title} books={section.books}
          navigate={navigate} addToCart={addToCart} />
      ))}
    </div>
  );
}

function BookSection({ title, books, navigate, addToCart }) {
  return (
    <div className="book-section">
      <div className="book-section-header">
        <div className="section-label">
          {title}
        </div>
        <button className="section-button" onMouseEnter={e => e.target.style.background = "#E5E7EB"}
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
  return (
    <div className="book-card" style={{
      background: "#1F2937", border: "1px solid #374151", borderRadius: 10,
      padding: 16, minWidth: 160, maxWidth: 160, cursor: "pointer",
      boxShadow: "0 4px 16px #0003", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
      position: "relative", overflow: "hidden"
    }}>
      <div onClick={() => navigate("product", book)} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        <BookCover book={book} size="md" />
        <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: "#F9FAFB", lineHeight: 1.4, height: 38, overflow: "hidden", textAlign: "center", width: "100%" }}>
          {book.title}
        </div>
        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4, marginBottom: 8, textAlign: "center", width: "100%" }}>{book.author}</div>
        <div style={{ color: "#F59E0B", fontWeight: 700, fontSize: 15, fontFamily: "'Nunito Sans', 'Noto Sans Mono', monospace" }}>
          {formatPrice(book.price)}
        </div>
      </div>
      <button className="btn-primary" onClick={e => { e.stopPropagation(); addToCart(book); }}
        style={{ width: "100%", fontSize: 11, padding: "8px 0" }}>
        + Giỏ hàng
      </button>
    </div>
  );
}

// ─── PRODUCT PAGE ─────────────────────────────────────────────────────────────
function ProductPage({ book, navigate, addToCart }) {
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
            <span>Còn: <strong style={{ color: "#F59E0B" }}>{book.stock}</strong></span>
          </div>

          <h1 style={{ fontFamily: "'Playfair Display', 'Noto Serif', serif", fontSize: 32, fontWeight: 900, color: "#F9FAFB", marginBottom: 20, lineHeight: 1.2 }}>
            {book.title}
          </h1>

          <div style={{ background: "#111827", borderRadius: 8, padding: "20px 24px", marginBottom: 16, border: "1px solid #1f2937" }}>
            <div style={{ fontFamily: "'Nunito Sans', 'Noto Sans Mono', monospace", fontSize: 11, color: "#F59E0B", marginBottom: 8, letterSpacing: 2 }}>GIỚI THIỆU</div>
            <p style={{ color: "#d1cbc3", lineHeight: 1.8, fontSize: 15 }}>{book.description}</p>
          </div>

          <div style={{ background: "#111827", borderRadius: 8, padding: "20px 24px", marginBottom: 28, border: "1px solid #1f2937" }}>
            <div style={{ fontFamily: "'Nunito Sans', 'Noto Sans Mono', monospace", fontSize: 11, color: "#F59E0B", marginBottom: 8, letterSpacing: 2 }}>MÔ TẢ NGẮN</div>
            <p style={{ color: "#d1cbc3", lineHeight: 1.8, fontSize: 14 }}>
              {book.category} • {book.author} — một tác phẩm đáng đọc trong bộ sưu tập của bạn.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Giá bán</div>
              <div style={{ fontFamily: "'Nunito Sans', monospace", fontSize: 28, fontWeight: 700, color: "#F59E0B" }}>
                {formatPrice(book.price)}
              </div>
            </div>
            <button className="btn-primary" onClick={() => addToCart(book)} style={{ fontSize: 15, padding: "14px 36px", flex: 1 }}>
              Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SIGN IN ──────────────────────────────────────────────────────────────────
function SignIn({ navigate, users, setCurrentUser, showToast }) {
  const [form, setForm] = useState({ login: "", password: "" });
  const [err, setErr] = useState("");

  const handleSubmit = () => {
    const user = users.find(u => (u.loginname === form.login || u.email === form.login) && u.password === form.password);
    if (user) { setCurrentUser(user); showToast(`Chào mừng, ${user.name}!`); navigate("home"); }
    else { setErr("Sai tên đăng nhập hoặc mật khẩu"); }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeUp 0.4s ease" }}>
      <div style={{ background: "#1F2937", border: "1px solid #1f2937", borderRadius: 12, padding: 48, width: "100%", maxWidth: 480 }}>
        <span onClick={() => navigate("home")} style={{ color: "#F59E0B", cursor: "pointer", fontSize: 14 }}>← Quay lại</span>
        <h2 style={{ fontFamily: "'Playfair Display', 'Noto Serif', serif", fontSize: 28, margin: "24px 0 32px", textAlign: "center", letterSpacing: 4 }}>ĐĂNG NHẬP</h2>
        {err && <div style={{ background: "#EF444411", color: "#EF4444", padding: "10px 14px", borderRadius: 6, marginBottom: 16, fontSize: 13 }}>{err}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input placeholder="Email đăng nhập" value={form.login} onChange={e => setForm({ ...form, login: e.target.value })} style={{ width: "100%" }} />
          <input type="password" placeholder="Mật khẩu" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
            style={{ width: "100%" }} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            <span style={{ color: "#F59E0B", cursor: "pointer" }}>Quên mật khẩu</span>
            {"  ·  "}
            <span>Chưa có tài khoản? </span>
            <span style={{ color: "#F59E0B", cursor: "pointer" }} onClick={() => navigate("signup")}>Đăng ký</span>
          </div>
          <button className="btn-primary" onClick={handleSubmit} style={{ width: "100%", padding: "13px 0", fontSize: 14, marginTop: 8 }}>Đăng nhập</button>
          <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>
            Thử: nguyenvana / 123@
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SIGN UP ──────────────────────────────────────────────────────────────────
function SignUp({ navigate, showToast }) {
  const [form, setForm] = useState({ login: "", password: "", confirm: "", email: "" });
  const [err, setErr] = useState("");

  const handleSubmit = () => {
    if (!form.login || !form.password || !form.email) { setErr("Vui lòng điền đầy đủ thông tin"); return; }
    if (form.password !== form.confirm) { setErr("Mật khẩu xác nhận không khớp"); return; }
    showToast("Đăng ký thành công! Hãy đăng nhập");
    navigate("signin");
  };

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeUp 0.4s ease" }}>
      <div style={{ background: "#1F2937", border: "1px solid #1f2937", borderRadius: 12, padding: 48, width: "100%", maxWidth: 480 }}>
        <span onClick={() => navigate("home")} style={{ color: "#F59E0B", cursor: "pointer", fontSize: 14 }}>← Quay lại</span>
        <h2 style={{ fontFamily: "'Playfair Display', 'Noto Serif', serif", fontSize: 28, margin: "24px 0 32px", textAlign: "center", letterSpacing: 4 }}>ĐĂNG KÝ</h2>
        {err && <div style={{ background: "#EF444411", color: "#EF4444", padding: "10px 14px", borderRadius: 6, marginBottom: 16, fontSize: 13 }}>{err}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { key: "login", placeholder: "Tên truy cập" },
            { key: "password", placeholder: "Mật khẩu", type: "password" },
            { key: "confirm", placeholder: "Nhập lại mật khẩu", type: "password" },
            { key: "email", placeholder: "Email" },
          ].map(f => (
            <input key={f.key} type={f.type || "text"} placeholder={f.placeholder}
              value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
              style={{ width: "100%" }} />
          ))}
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn-primary" onClick={handleSubmit} style={{ flex: 1, padding: "13px 0", fontSize: 14 }}>Đăng ký ngay</button>
            <button className="btn-ghost" onClick={() => navigate("home")} style={{ flex: 1 }}>Hủy</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ACCOUNT PAGE ─────────────────────────────────────────────────────────────
function AccountPage({ currentUser, navigate, orders, showToast }) {
  const [form, setForm] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: "09********",
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

  const myOrders = orders.filter(o => o.userId === currentUser.id);

  return (
    <div style={{ maxWidth: 800, margin: "32px auto", padding: "0 24px", animation: "fadeUp 0.4s ease" }}>
      <span onClick={() => navigate("home")} style={{ color: "#F59E0B", cursor: "pointer", fontSize: 14 }}>← Quay lại</span>

      <div style={{ background: "#1F2937", border: "1px solid #1f2937", borderRadius: 12, padding: 40, marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36 }}>
          <div style={{ width: 64, height: 64, background: "#F59E0B33", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, border: "2px solid #F59E0B" }}>
          </div>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', 'Noto Serif', serif", fontSize: 22, margin: 0 }}>Tài khoản người dùng</h2>
            <div style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>ID: {currentUser.id}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { label: "Tên tài khoản", key: "name" },
            { label: "Email", key: "email" },
            { label: "Họ và tên", key: "name" },
            { label: "Số điện thoại", key: "phone" },
            { label: "Địa chỉ", key: "address" },
          ].map(f => (
            <div key={f.label} style={{ gridColumn: f.label === "Địa chỉ" ? "1 / -1" : "auto" }}>
              <label style={{ fontSize: 12, color: "#B4BCC4", display: "block", marginBottom: 6, fontFamily: "'Nunito Sans', 'Noto Sans Mono', monospace" }}>{f.label}</label>
              <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={{ width: "100%" }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 12, color: "#B4BCC4", display: "block", marginBottom: 6, fontFamily: "'Nunito Sans', 'Noto Sans Mono', monospace" }}>Mật khẩu mới</label>
            <input type="password" value={form.newPass} onChange={e => setForm({ ...form, newPass: e.target.value })} style={{ width: "100%" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#B4BCC4", display: "block", marginBottom: 6, fontFamily: "'Nunito Sans', 'Noto Sans Mono', monospace" }}>Xác nhận lại</label>
            <input type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} style={{ width: "100%" }} />
          </div>
        </div>

        <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
          <button className="btn-primary" onClick={() => showToast("Cập nhật thông tin thành công!")}>Lưu thay đổi</button>
          {form.newPass && <button className="btn-ghost" onClick={() => showToast("Đổi mật khẩu thành công!")}>Thay đổi mật khẩu</button>}
        </div>
      </div>

      {/* Order History */}
      {myOrders.length > 0 && (
        <div style={{ background: "#1F2937", border: "1px solid #1f2937", borderRadius: 12, padding: 32, marginTop: 20 }}>
          <h3 style={{ fontFamily: "'Playfair Display', 'Noto Serif', serif", margin: "0 0 20px", fontSize: 18 }}>Lịch sử đơn hàng</h3>
          {myOrders.map(o => (
            <div key={o._id} style={{ background: "#111827", borderRadius: 8, padding: 16, marginBottom: 12, border: "1px solid #1f2937" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "'Nunito Sans', 'Noto Sans Mono', monospace", fontSize: 12, color: "#F59E0B" }}>Đơn #{o._id}</span>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{o.ngay_mua}</span>
              </div>
              <div style={{ marginTop: 8, color: "#F59E0B", fontWeight: 700 }}>{formatPrice(o.tong_tien)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CART PAGE ────────────────────────────────────────────────────────────────
function CartPage({ cart, updateQty, removeFromCart, checkout, navigate, currentUser }) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const vat = Math.round(subtotal * 0.08);
  const total = subtotal + vat;

  return (
    <div className="cart-page">
      <div className="cart-header">
        <span onClick={() => navigate("home")} style={{ color: "#F59E0B", cursor: "pointer", fontSize: 14 }}>← Quay lại</span>
        <h2 style={{ fontFamily: "'Playfair Display', 'Noto Serif', serif", fontSize: 24, margin: 0 }}>Giỏ hàng</h2>
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
                  <div className="cart-item-title">{item.title}</div>
                  <div style={{ fontSize: 13, color: "#D1D5DB", marginBottom: 2 }}>{item.author}</div>
                  <div className="cart-item-price">
                    {formatPrice(item.price)} <span className="multiply">×</span> {item.qty}
                  </div>
                </div>

                <div className="cart-item-actions">
                  <div className="qty-control">
                    <button onClick={() => updateQty(item.book_id, -1)} style={{ background: "none", border: "none", color: "#111827", cursor: "pointer", padding: "4px 8px", fontSize: 16, fontWeight: "bold" }}>−</button>
                    <span style={{ fontSize: 13, padding: "4px 8px", minWidth: 24, textAlign: "center", color: "#111827", fontWeight: 600 }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.book_id, 1)} style={{ background: "none", border: "none", color: "#111827", cursor: "pointer", padding: "4px 8px", fontSize: 16, fontWeight: "bold" }}>+</button>
                  </div>

                  <div className="item-total">
                    {formatPrice(item.price * item.qty)}
                  </div>

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
              <span style={{ color: "#F59E0B", fontWeight: 700, fontFamily: "'Nunito Sans', 'Noto Sans Mono', monospace", fontSize: 15 }}>{formatPrice(total)}</span>
            </div>
            <button className="btn-primary" onClick={checkout} style={{ width: "100%", padding: "12px 0", fontSize: 14 }}>
              {currentUser ? "Thanh toán" : "Đăng nhập"}
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
          { title: "Dịch vụ", items: ["Giao hàng tận nơi", "Thanh toán online", "Đổi trả 30 ngày"] },
          { title: "Về chúng tôi", items: ["Giới thiệu", "Tuyển dụng", "Tin tức"] },
          { title: "Trợ giúp", items: ["FAQ", "Liên hệ", "Hướng dẫn mua"] },
          { title: "Mua hàng", items: ["Tất cả sách", "Khuyến mãi", "Combo"] },
        ].map(col => (
          <div key={col.title} className="footer-column">
            <div className="footer-column-title">{col.title}</div>
            {col.items.map(i => <div key={i} className="footer-link">{i}</div>)}
          </div>
        ))}
        <div className="footer-column footer-subscribe">
          <div className="footer-column-title">Tìm chúng tôi</div>
          <input placeholder="Nhập địa chỉ" className="footer-input" />
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

