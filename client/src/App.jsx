
import { useMemo, useState } from "react";
import "./App.css";

const initialProducts = [
  { id: 1, name: "Laptop", category: "Electronics", price: 55000, stock: 12, bin: "A-01", emoji: "💻" },
  { id: 2, name: "Wireless Keyboard", category: "Accessories", price: 1800, stock: 8, bin: "A-02", emoji: "⌨️" },
  { id: 3, name: "Wireless Mouse", category: "Accessories", price: 750, stock: 0, bin: "B-01", emoji: "🖱️" },
  { id: 4, name: "Monitor", category: "Electronics", price: 12000, stock: 15, bin: "B-02", emoji: "🖥️" },
  { id: 5, name: "Headphones", category: "Accessories", price: 2200, stock: 5, bin: "C-01", emoji: "🎧" },
  { id: 6, name: "USB Cable", category: "Accessories", price: 299, stock: 30, bin: "C-02", emoji: "🔌" },
];

function App() {
  const [page, setPage] = useState("home");
  const [role, setRole] = useState("user");
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [notice, setNotice] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newBin, setNewBin] = useState("");

  const money = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        category === "All" || p.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  function showNotice(message) {
    setNotice(message);
  }

  function go(nextPage) {
    setNotice("");
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function login(event) {
    event.preventDefault();

    if (role === "admin") {
      // Demo-only admin login. Replace with server authentication later.
      if (loginId === "admin@wareflow.demo" && password === "Admin123!") {
        setCurrentUser({ id: "ADM-001", name: "Warehouse Admin", role: "admin" });
        go("admin");
      } else {
        showNotice("Demo admin: use admin@wareflow.demo and Admin123!");
      }
      return;
    }

    if (!loginId.trim() || !password) {
      showNotice("Enter your user ID/email and password.");
      return;
    }

    // Demo user login only; this does not verify an account in a database.
    setCurrentUser({
      id: loginId.includes("@") ? "USR-" + Date.now().toString().slice(-6) : loginId,
      name: loginId.includes("@") ? loginId.split("@")[0] : loginId,
      role: "user",
    });
    go("shop");
  }

  function logout() {
    setCurrentUser(null);
    setPassword("");
    setLoginId("");
    go("home");
  }

  function addToCart(product) {
    if (!currentUser) {
      showNotice("Please log in before adding items to your cart.");
      go("login");
      setRole("user");
      return;
    }

    if (product.stock < 1) {
      showNotice("This product is out of stock. You can request restocking.");
      return;
    }

    setCart((oldCart) => {
      const existing = oldCart.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showNotice("You cannot add more than the available stock.");
          return oldCart;
        }
        return oldCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...oldCart, { ...product, quantity: 1 }];
    });
    showNotice(`${product.name} added to your cart.`);
  }

  function changeQuantity(id, amount) {
    const product = products.find((p) => p.id === id);
    setCart((oldCart) =>
      oldCart
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: Math.max(
                  0,
                  Math.min(item.quantity + amount, product?.stock ?? 0)
                ),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function placeOrder() {
    if (!currentUser) {
      go("login");
      return;
    }
    if (!cart.length) {
      showNotice("Your cart is empty.");
      return;
    }

    const orderItems = cart.map((item) => ({ ...item }));
    const insufficient = orderItems.find((item) => {
      const product = products.find((p) => p.id === item.id);
      return !product || product.stock < item.quantity;
    });

    if (insufficient) {
      showNotice("Stock changed. Please review your cart.");
      return;
    }

    setProducts((old) =>
      old.map((p) => {
        const ordered = orderItems.find((item) => item.id === p.id);
        return ordered ? { ...p, stock: p.stock - ordered.quantity } : p;
      })
    );

    const order = {
      id: "ORD-" + Date.now().toString().slice(-6),
      userId: currentUser.id,
      items: orderItems,
      total: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: "Order placed",
    };

    setOrders((old) => [order, ...old]);
    setCart([]);
    showNotice("Order placed successfully in this demo.");
    go("orders");
  }

  function requestRestock(product) {
    if (!currentUser) {
      setRole("user");
      go("login");
      showNotice("Log in to request a restock.");
      return;
    }
    if (requests.some((r) => r.productId === product.id && r.userId === currentUser.id && r.status === "Pending")) {
      showNotice("You already have a pending request for this product.");
      return;
    }
    setRequests((old) => [
      {
        id: "REQ-" + Date.now().toString().slice(-6),
        productId: product.id,
        productName: product.name,
        userId: currentUser.id,
        status: "Pending",
      },
      ...old,
    ]);
    showNotice("Restock request sent to the admin.");
  }

  function addProduct(event) {
    event.preventDefault();
    const price = Number(newPrice);
    const stock = Number(newStock);

    if (!newName.trim() || !newBin.trim() || newPrice === "" || newStock === "") {
      showNotice("Fill in every product field.");
      return;
    }
    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
      showNotice("Enter a valid price and non-negative whole-number stock.");
      return;
    }

    setProducts((old) => [
      ...old,
      {
        id: Date.now(),
        name: newName.trim(),
        category: "Accessories",
        price,
        stock,
        bin: newBin.trim(),
        emoji: "📦",
      },
    ]);
    setNewName("");
    setNewPrice("");
    setNewStock("");
    setNewBin("");
    showNotice("Product added successfully.");
  }

  function updateOrder(id, status) {
    setOrders((old) => old.map((order) => order.id === id ? { ...order, status } : order));
  }

  function updateRequest(id, status) {
    setRequests((old) => old.map((request) => request.id === id ? { ...request, status } : request));
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  function productCard(product) {
    return (
      <article className="product-card" key={product.id}>
        <div className="product-picture">
          <span className="product-emoji">{product.emoji}</span>
          <span className={`stock-badge ${product.stock === 0 ? "stock-out" : product.stock <= 10 ? "stock-low" : "stock-good"}`}>
            {product.stock === 0 ? "Out of stock" : product.stock <= 10 ? "Low stock" : "In stock"}
          </span>
        </div>
        <div className="product-info">
          <span className="eyebrow">{product.category}</span>
          <h3>{product.name}</h3>
          <p className="bin-label">Storage location: {product.bin}</p>
          <div className="product-bottom">
            <strong>{money(product.price)}</strong>
            {product.stock > 0 ? (
              <button className="small-button" onClick={() => addToCart(product)}>+ Add</button>
            ) : (
              <button className="small-button outline-button" onClick={() => requestRestock(product)}>Restock</button>
            )}
          </div>
          <p className="stock-count">{product.stock} units available</p>
        </div>
      </article>
    );
  }

  function header() {
    return (
      <header className="navbar">
        <button className="brand" onClick={() => go("home")}>
          <span className="brand-icon">W</span>
          <span>ware<span className="brand-accent">flow</span><small>WAREHOUSE & COMMERCE</small></span>
        </button>
        <nav className="nav-links">
          <button onClick={() => go("home")}>Home</button>
          <button onClick={() => go("shop")}>Shop</button>
          {currentUser && <button onClick={() => go("orders")}>My Orders</button>}
          {currentUser?.role === "admin" && <button onClick={() => go("admin")}>Admin</button>}
        </nav>
        <div className="nav-actions">
          {currentUser ? (
            <>
              <span className="user-pill">{currentUser.id}</span>
              <button className="text-button" onClick={logout}>Log out</button>
            </>
          ) : (
            <button className="text-button" onClick={() => { setRole("user"); go("login"); }}>Log in</button>
          )}
          <button className="cart-button" onClick={() => go("cart")}>Cart <span>{cartCount}</span></button>
        </div>
      </header>
    );
  }

  function renderHome() {
    return (
      <>
        <section className="hero">
          <div className="hero-copy">
            <span className="hero-tag"><span className="live-dot" /> SMART INVENTORY. SIMPLE SHOPPING.</span>
            <h1>Everything you need.<br /><span>In one flow.</span></h1>
            <p>Discover products, track availability and shop with confidence. WareFlow connects shopping and smart warehouse operations.</p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => go("shop")}>Explore products <span>↗</span></button>
              <button className="secondary-button" onClick={() => { setRole("admin"); go("login"); }}>Admin portal →</button>
            </div>
            <div className="hero-stats">
              <div><strong>{products.length}+</strong><span>Products listed</span></div>
              <div><strong>{totalUnits}</strong><span>Units available</span></div>
              <div><strong>24/7</strong><span>Easy access</span></div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-glow" />
            <div className="warehouse-art">
              <div className="art-top"><span>WAREHOUSE OVERVIEW</span><span className="art-live">● LIVE DEMO</span></div>
              <div className="shelf shelf-one"><i>📦</i><i>💻</i><i>📦</i></div>
              <div className="shelf shelf-two"><i>🎧</i><i>📦</i><i>🖱️</i></div>
              <div className="shelf shelf-three"><i>📦</i><i>🖥️</i><i>📦</i></div>
              <div className="art-footer"><span><b className="live-dot" /> Inventory connected</span><strong>{outOfStock} stock alerts</strong></div>
            </div>
            <div className="float-card float-top">✦ Smart stock tracking</div>
            <div className="float-card float-bottom"><span className="float-icon">↗</span><span><b>Inventory status</b><small>Updated in this demo</small></span></div>
          </div>
        </section>

        <section className="section home-products">
          <div className="section-heading">
            <div><span className="eyebrow">HANDPICKED FOR YOU</span><h2>Popular products</h2><p>Browse our latest warehouse catalogue.</p></div>
            <button className="text-button" onClick={() => go("shop")}>View all products →</button>
          </div>
          <div className="product-grid">{products.slice(0, 4).map(productCard)}</div>
        </section>

        <section className="feature-strip">
          <div><span>01</span><b>Live stock visibility</b><p>See available quantities before ordering.</p></div>
          <div><span>02</span><b>Easy order tracking</b><p>Follow orders from placement to dispatch.</p></div>
          <div><span>03</span><b>Smarter restocking</b><p>Request items when products run out.</p></div>
        </section>
      </>
    );
  }

  function renderShop() {
    return (
      <section className="section page-section">
        <div className="section-heading">
          <div><span className="eyebrow">WAREFLOW CATALOGUE</span><h1>Find your next essential.</h1><p>Search, explore and check availability.</p></div>
        </div>
        <div className="shop-toolbar">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>All</option><option>Electronics</option><option>Accessories</option>
          </select>
        </div>
        <div className="product-grid">{filteredProducts.map(productCard)}</div>
        {filteredProducts.length === 0 && <div className="empty-state">No products found. Try another search.</div>}
      </section>
    );
  }

  function renderLogin() {
    return (
      <section className="login-layout">
        <div className="login-story">
          <span className="hero-tag">WELCOME TO WAREFLOW</span>
          <h1>One platform.<br /><span>Two powerful portals.</span></h1>
          <p>Shop your essentials or manage warehouse operations from one place.</p>
          <div className="login-benefit">✓ Inventory visibility</div>
          <div className="login-benefit">✓ Order and stock tracking</div>
          <div className="login-benefit">✓ Simple, organised workflow</div>
        </div>
        <form className="login-card" onSubmit={login}>
          <div className="login-symbol">{role === "admin" ? "♙" : "↗"}</div>
          <span className="eyebrow">SECURE PORTAL</span>
          <h2>{role === "admin" ? "Admin sign in" : "Welcome back"}</h2>
          <p>{role === "admin" ? "Manage inventory and customer orders." : "Sign in to shop and track your orders."}</p>
          <div className="role-switch">
            <button type="button" className={role === "user" ? "selected" : ""} onClick={() => { setRole("user"); setNotice(""); }}>User</button>
            <button type="button" className={role === "admin" ? "selected" : ""} onClick={() => { setRole("admin"); setNotice(""); }}>Admin</button>
          </div>
          <label>{role === "admin" ? "Admin email" : "User ID or email"}</label>
          <input value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder={role === "admin" ? "admin@wareflow.demo" : "Enter any demo user ID"} required />
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required />
          {role === "admin" && <div className="demo-hint">Demo credentials: admin@wareflow.demo / Admin123!</div>}
          <button className="primary-button full-button" type="submit">Sign in →</button>
          <p className="login-note">Demo interface only. User accounts will be securely verified after backend integration.</p>
        </form>
      </section>
    );
  }

  function renderCart() {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return (
      <section className="section page-section">
        <span className="eyebrow">YOUR SELECTION</span><h1>Shopping cart</h1><p>Review your items before placing your demo order.</p>
        {!cart.length ? (
          <div className="empty-state"><span>🛒</span><h2>Your cart is waiting.</h2><p>Add products from the catalogue to get started.</p><button className="primary-button" onClick={() => go("shop")}>Browse products</button></div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">{cart.map(item => (
              <div className="cart-item" key={item.id}>
                <div className="cart-product-icon">{item.emoji}</div>
                <div className="cart-product-details"><b>{item.name}</b><span>{money(item.price)} each</span><div className="quantity-control"><button onClick={() => changeQuantity(item.id, -1)}>−</button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.id, 1)}>+</button></div></div>
                <strong>{money(item.price * item.quantity)}</strong>
              </div>
            ))}</div>
            <aside className="summary-card"><h2>Order summary</h2><div><span>Items</span><span>{cartCount}</span></div><div><span>Delivery</span><span>Not configured</span></div><div className="summary-total"><b>Total</b><strong>{money(total)}</strong></div><button className="primary-button full-button" onClick={placeOrder}>Place demo order →</button><p className="login-note">No real payment is collected.</p></aside>
          </div>
        )}
      </section>
    );
  }

  function renderOrders() {
    const myOrders = currentUser?.role === "admin" ? orders : orders.filter(o => o.userId === currentUser?.id);
    const myRequests = currentUser?.role === "admin" ? requests : requests.filter(r => r.userId === currentUser?.id);
    return (
      <section className="section page-section">
        <span className="eyebrow">ORDER CENTRE</span><h1>{currentUser?.role === "admin" ? "All orders & requests" : "Your orders & requests"}</h1>
        <h2 className="subheading">Orders</h2>
        {myOrders.length === 0 ? <p className="empty-inline">No orders yet.</p> : myOrders.map(o => (
          <div className="list-card" key={o.id}><div><b>{o.id}</b><p>{o.items.map(i => `${i.name} × ${i.quantity}`).join(", ")}</p><small>User: {o.userId} · {money(o.total)}</small></div><span className="status-pill">{o.status}</span></div>
        ))}
        <h2 className="subheading">Restock requests</h2>
        {myRequests.length === 0 ? <p className="empty-inline">No restock requests yet.</p> : myRequests.map(r => (
          <div className="list-card" key={r.id}><div><b>{r.productName}</b><p>{r.id} · User: {r.userId}</p></div><span className="status-pill">{r.status}</span></div>
        ))}
      </section>
    );
  }

  function renderAdmin() {
    return (
      <section className="section page-section">
        <span className="eyebrow">WAREHOUSE CONTROL CENTRE</span>
        <h1>Admin dashboard</h1>
        <p>Welcome, {currentUser?.name}. Monitor products, inventory and requests.</p>
        <div className="admin-stats">
          <div className="admin-stat"><span>Total products</span><b>{products.length}</b></div>
          <div className="admin-stat"><span>Units in stock</span><b>{totalUnits}</b></div>
          <div className="admin-stat"><span>Low stock items</span><b>{lowStock}</b></div>
          <div className="admin-stat warning-stat"><span>Out of stock</span><b>{outOfStock}</b></div>
        </div>

        <div className="admin-panel">
          <h2>+ Add a product</h2>
          <form className="add-product-form" onSubmit={addProduct}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Product name" required />
            <input type="number" min="0" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="Price (₹)" required />
            <input type="number" min="0" step="1" value={newStock} onChange={e => setNewStock(e.target.value)} placeholder="Stock quantity" required />
            <input value={newBin} onChange={e => setNewBin(e.target.value)} placeholder="Bin (e.g. A-03)" required />
            <button className="primary-button" type="submit">Add product</button>
          </form>
        </div>

        <div className="admin-panel">
          <h2>Inventory management</h2>
          <div className="table-scroll"><table className="inventory-table"><thead><tr><th>Product</th><th>Bin</th><th>Price</th><th>Stock</th><th>Action</th></tr></thead><tbody>
            {products.map(p => <tr key={p.id}><td>{p.emoji} {p.name}</td><td>{p.bin}</td><td>{money(p.price)}</td><td>{p.stock}</td><td><button className="small-button" onClick={() => setProducts(old => old.map(x => x.id === p.id ? { ...x, stock: x.stock + 1 } : x))}>+1 stock</button><button className="small-button outline-button" onClick={() => setProducts(old => old.map(x => x.id === p.id ? { ...x, stock: Math.max(0, x.stock - 1) } : x))}>−1</button></td></tr>)}
          </tbody></table></div>
        </div>

        <div className="admin-panel"><h2>Order processing</h2>
          {orders.length === 0 ? <p className="empty-inline">No orders yet. Place a demo order from the user portal.</p> : orders.map(o => <div className="list-card" key={o.id}><div><b>{o.id}</b><p>{o.userId} · {money(o.total)}</p></div><select value={o.status} onChange={e => updateOrder(o.id, e.target.value)}><option>Order placed</option><option>Processing</option><option>Dispatched</option><option>Delivered</option><option>Cancelled</option></select></div>)}
        </div>

        <div className="admin-panel"><h2>Restock requests</h2>
          {requests.length === 0 ? <p className="empty-inline">No restock requests yet.</p> : requests.map(r => <div className="list-card" key={r.id}><div><b>{r.productName}</b><p>{r.id} · {r.userId}</p></div><select value={r.status} onChange={e => updateRequest(r.id, e.target.value)}><option>Pending</option><option>Approved</option><option>Rejected</option><option>Stock replenished</option></select></div>)}
        </div>
      </section>
    );
  }

  return (
    <div className="app-shell">
      {header()}
      <main>
        {page === "home" && renderHome()}
        {page === "shop" && renderShop()}
        {page === "login" && renderLogin()}
        {page === "cart" && renderCart()}
        {page === "orders" && renderOrders()}
        {page === "admin" && (currentUser?.role === "admin" ? renderAdmin() : renderLogin())}
      </main>
      {notice && <div className="toast" role="status"><span>✦</span>{notice}<button onClick={() => setNotice("")}>×</button></div>}
      <footer className="footer"><div className="footer-brand">W <b>wareflow</b></div><p>Smart inventory. Simple shopping.</p><span>Student project demonstration · {new Date().getFullYear()}</span></footer>
    </div>
  );
}

export default App;
