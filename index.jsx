import React, { useState, useEffect, useReducer, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  brand: "#1E3A0E", brandMid: "#2D5016", brandLight: "#3A6B1E",
  accent: "#FFB347", accentWarm: "#F4A261",
  bg: "#FFF8F0", bgWarm: "#FFF0D8",
  white: "#FFFFFF",
  border: "#E8D5B8", borderDim: "#D4B896",
  textDark: "#3D1F00", textMed: "#8B5E2A", textDim: "#BFA07A",
  greenFg: "#8FB870", greenDark: "#2D5016",
  danger: "#E85D04", dangerBg: "#FFF3EA",
};

// ─── Seed Data ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id:1,  emoji:"🍚", name:"Rice",      varieties:[
    { id:101, name:"Pishori 1kg",       price:190, stock:38,  threshold:12, buyPrice:145 },
    { id:102, name:"Kipande 2kg",       price:260, stock:15,  threshold:8,  buyPrice:200 },
    { id:103, name:"China 5kg",         price:550, stock:9,   threshold:5,  buyPrice:420 },
    { id:104, name:"Basmati 1kg",       price:230, stock:22,  threshold:10, buyPrice:175 },
  ]},
  { id:2,  emoji:"🫙", name:"Oil",       varieties:[
    { id:201, name:"Kimbo 500ml",       price:290, stock:7,   threshold:6,  buyPrice:235 },
    { id:202, name:"Rina 1L",           price:470, stock:12,  threshold:5,  buyPrice:380 },
    { id:203, name:"Golden 2L",         price:830, stock:4,   threshold:4,  buyPrice:660 },
    { id:204, name:"Sunflower 1L",      price:400, stock:18,  threshold:8,  buyPrice:320 },
  ]},
  { id:3,  emoji:"🌾", name:"Flour",     varieties:[
    { id:301, name:"Jogoo 2kg",         price:210, stock:23,  threshold:8,  buyPrice:160 },
    { id:302, name:"Pembe 1kg",         price:115, stock:27,  threshold:10, buyPrice:88  },
    { id:303, name:"Apex 2kg",          price:225, stock:14,  threshold:6,  buyPrice:170 },
    { id:304, name:"Hostess 500g",      price:65,  stock:40,  threshold:15, buyPrice:48  },
  ]},
  { id:4,  emoji:"🧂", name:"Sugar",     varieties:[
    { id:401, name:"Mumias 1kg",        price:175, stock:42,  threshold:15, buyPrice:140 },
    { id:402, name:"Whiteline 2kg",     price:340, stock:11,  threshold:6,  buyPrice:270 },
    { id:403, name:"Sony 1kg",          price:170, stock:29,  threshold:10, buyPrice:135 },
  ]},
  { id:5,  emoji:"🧼", name:"Soap",      varieties:[
    { id:501, name:"Sunlight Bar",      price:45,  stock:72,  threshold:20, buyPrice:34  },
    { id:502, name:"Omo 500g",          price:190, stock:9,   threshold:6,  buyPrice:145 },
    { id:503, name:"Geisha Bar",        price:30,  stock:110, threshold:30, buyPrice:22  },
    { id:504, name:"Ariel 1kg",         price:360, stock:6,   threshold:4,  buyPrice:280 },
  ]},
  { id:6,  emoji:"🍞", name:"Bread",     varieties:[
    { id:601, name:"Festive Small",     price:55,  stock:8,   threshold:5,  buyPrice:42  },
    { id:602, name:"Broadways",         price:70,  stock:12,  threshold:6,  buyPrice:54  },
    { id:603, name:"Supaloaf",          price:65,  stock:9,   threshold:5,  buyPrice:50  },
  ]},
  { id:7,  emoji:"🥤", name:"Beverages", varieties:[
    { id:701, name:"Coca-Cola 500ml",   price:60,  stock:48,  threshold:15, buyPrice:48  },
    { id:702, name:"Fanta 500ml",       price:60,  stock:35,  threshold:15, buyPrice:48  },
    { id:703, name:"Keringet Water 1L", price:50,  stock:60,  threshold:20, buyPrice:38  },
    { id:704, name:"Pepsi 500ml",       price:55,  stock:27,  threshold:12, buyPrice:43  },
  ]},
  { id:8,  emoji:"🍪", name:"Snacks",    varieties:[
    { id:801, name:"Nuvita Biscuits",   price:20,  stock:150, threshold:40, buyPrice:15  },
    { id:802, name:"Krackles Crisps",   price:30,  stock:85,  threshold:25, buyPrice:22  },
    { id:803, name:"Big G Cake",        price:25,  stock:62,  threshold:20, buyPrice:18  },
    { id:804, name:"Popcorns 50g",      price:15,  stock:200, threshold:50, buyPrice:10  },
  ]},
  { id:9,  emoji:"🥛", name:"Dairy",     varieties:[
    { id:901, name:"Brookside 500ml",   price:60,  stock:32,  threshold:12, buyPrice:48  },
    { id:902, name:"Ilara Yoghurt",     price:80,  stock:18,  threshold:8,  buyPrice:62  },
    { id:903, name:"KCC Butter 250g",   price:210, stock:7,   threshold:4,  buyPrice:165 },
  ]},
];

const ALL_VARIETIES = CATEGORIES.flatMap(c => c.varieties);
const PIN = "1234";

// ─── State & Reducer ───────────────────────────────────────────────────────────
const buildStocks = () => { const m = {}; ALL_VARIETIES.forEach(v => { m[v.id] = v.stock; }); return m; };
const buildPrices = () => { const m = {}; ALL_VARIETIES.forEach(v => { m[v.id] = { sell: v.price, buy: v.buyPrice }; }); return m; };

const INIT = {
  stocks: buildStocks(),
  prices: buildPrices(),
  txLog: [],
  sms: { lowStock: true, daily: true, mpesa: false },
};

function reducer(state, action) {
  switch (action.type) {
    case "SALE": {
      const { cart } = action;
      const stocks = { ...state.stocks };
      cart.forEach(i => { stocks[i.id] = Math.max(0, (stocks[i.id] || 0) - i.qty); });
      const total = cart.reduce((s, i) => s + (state.prices[i.id]?.sell ?? i.price) * i.qty, 0);
      const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const tx = {
        id: Date.now(), time, total,
        items: cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: state.prices[i.id]?.sell ?? i.price })),
      };
      return { ...state, stocks, txLog: [tx, ...state.txLog] };
    }
    case "STOCK":
      return { ...state, stocks: { ...state.stocks, [action.id]: Math.max(0, action.val) } };
    case "PRICE":
      return { ...state, prices: { ...state.prices, [action.id]: { ...state.prices[action.id], [action.t]: Math.max(0, action.val) } } };
    case "SMS":
      return { ...state, sms: { ...state.sms, [action.key]: !state.sms[action.key] } };
    default:
      return state;
  }
}

// ─── Shared Styles ─────────────────────────────────────────────────────────────
const qBtn = {
  background: "#F4E8D8", border: `1px solid ${C.borderDim}`, borderRadius: 6,
  width: 22, height: 22, cursor: "pointer", fontSize: 13, fontWeight: 700,
  color: C.textDark, display: "flex", alignItems: "center", justifyContent: "center",
  padding: 0, lineHeight: 1, flexShrink: 0, fontFamily: "inherit",
};

const card = {
  background: C.white, borderRadius: 16, padding: "12px 14px",
  border: `1.5px solid ${C.border}`, boxShadow: "0 4px 8px rgba(0,0,0,0.02)",
};

const L = {
  wrap: { minHeight: "100vh", background: "#1a0f00", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit', sans-serif", padding: "20px 16px", boxSizing: "border-box" },
  phone: { width: 375, height: 720, background: C.bg, borderRadius: 40, boxShadow: "0 40px 100px rgba(0,0,0,0.6), inset 0 0 0 2px rgba(255,255,255,0.1)", overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" },
  statusBar: { background: C.brand, color: C.greenFg, fontSize: 11, fontWeight: 600, padding: "10px 20px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", letterSpacing: 0.5, flexShrink: 0 },
  screenBody: { flex: 1, overflowY: "auto", overflowX: "hidden", background: C.bg },
  bottomNav: { background: C.brand, display: "flex", borderTop: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 },
  navBtn: (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 0 10px", cursor: "pointer", background: active ? "rgba(255,255,255,0.12)" : "transparent", border: "none", color: active ? C.accent : C.greenFg, fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", gap: 3, transition: "all 0.15s", fontFamily: "inherit" }),
};

// ─── Components ───────────────────────────────────────────────────────────────

function Clock() {
  const [t, setT] = useState(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  useEffect(() => { const id = setInterval(() => setT(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })), 10000); return () => clearInterval(id); }, []);
  return <span>{t}</span>;
}

function SaleScreen({ state, dispatch }) {
  const { stocks, prices } = state;
  const [selectedCat, setSelectedCat] = useState(null);
  const [cart, setCart] = useState([]);
  const [confirmed, setConfirmed] = useState(false);
  const [search, setSearch] = useState("");

  const addToCart = useCallback((variety) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === variety.id);
      if (ex) return prev.map(i => i.id === variety.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...variety, qty: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id) => setCart(prev => prev.filter(i => i.id !== id)), []);
  const updateQty = useCallback((id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
  }, []);

  const total = useMemo(() => cart.reduce((s, i) => s + (prices[i.id]?.sell ?? i.price) * i.qty, 0), [cart, prices]);

  const confirmSale = useCallback(() => {
    if (cart.length === 0) return;
    dispatch({ type: "SALE", cart });
    setConfirmed(true);
    setCart([]);
    setSelectedCat(null);
    setSearch("");
    setTimeout(() => setConfirmed(false), 2200);
  }, [cart, dispatch]);

  const lowStockCount = useMemo(() => ALL_VARIETIES.filter(v => (stocks[v.id] ?? v.stock) <= v.threshold).length, [stocks]);

  const displayVarieties = useMemo(() => {
    if (search) return ALL_VARIETIES.filter(v => v.name.toLowerCase().includes(search.toLowerCase()));
    return selectedCat?.varieties ?? [];
  }, [search, selectedCat]);

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <header style={{ background: C.brand, padding: "14px 16px 10px", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.accent, letterSpacing: -0.5 }}>Stock Yangu</div>
            <div style={{ fontSize: 10, color: C.greenFg, fontWeight: 600, letterSpacing: 1 }}>QUICK SALE</div>
          </div>
          {lowStockCount > 0 && (
            <div className="pulse-slow" style={{ background: C.danger, borderRadius: 20, padding: "4px 10px", fontSize: 10, fontWeight: 700, color: "#fff" }}>
              ⚠ {lowStockCount} LOW
            </div>
          )}
        </div>
        <div className="search-box">
          <span style={{ color: C.greenFg }}>🔍</span>
          <input type="text" placeholder="Search product..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")}>✕</button>}
        </div>
      </header>

      <div className="cart-area">
        {cart.length === 0 ? (
          <div className="empty-msg">Tap a product below to start a sale...</div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-row">
                  <div className="item-name">{item.name}</div>
                  <div className="qty-ctrl">
                    <button onClick={() => updateQty(item.id, -1)} style={qBtn}>−</button>
                    <span className="qty-val">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} style={qBtn}>+</button>
                    <span className="item-total">KES {((prices[item.id]?.sell ?? item.price) * item.qty).toLocaleString()}</span>
                    <button className="del-btn" onClick={() => removeFromCart(item.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-footer">
              <span className="label">TOTAL</span>
              <span className="value">KES {total.toLocaleString()}</span>
            </div>
          </>
        )}
      </div>

      {!search && (
        <div className="cat-grid-wrap">
          <div className="section-hdr">CATEGORIES</div>
          <div className="cat-grid">
            {CATEGORIES.map(cat => (
              <button key={cat.id} className={selectedCat?.id === cat.id ? "active" : ""} onClick={() => setSelectedCat(selectedCat?.id === cat.id ? null : cat)}>
                <span className="emoji">{cat.emoji}</span>
                <span className="label">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {(search || selectedCat) && (
        <div className="variety-picker">
          <div className="section-hdr">{search ? "SEARCH RESULTS" : `${selectedCat.emoji} ${selectedCat.name.toUpperCase()}`}</div>
          <div className="variety-grid">
            {displayVarieties.map(v => {
              const currStock = stocks[v.id] ?? v.stock;
              const sellPrice = prices[v.id]?.sell ?? v.price;
              const isLow = currStock <= v.threshold;
              const inCart = cart.find(i => i.id === v.id);
              return (
                <button key={v.id} onClick={() => addToCart(v)} className={inCart ? "in-cart" : ""}>
                  {isLow && <span className="warning-dot">!</span>}
                  {inCart && <span className="cart-badge">{inCart.qty}</span>}
                  <div className="v-name">{v.name}</div>
                  <div className="v-price">KES {sellPrice}</div>
                  <div className={`v-stock ${isLow ? 'low' : ''}`}>Stock: {currStock}</div>
                </button>
              );
            })}
            {search && displayVarieties.length === 0 && <div className="no-res">No results for "{search}"</div>}
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {confirmed ? (
        <div className="confirm-overlay">
          <div className="icon">✅</div>
          <div className="text">Sale Recorded!</div>
        </div>
      ) : (
        <button className={`main-action ${cart.length > 0 ? 'active' : ''}`} onClick={confirmSale} disabled={cart.length === 0}>
          {cart.length > 0 ? `CONFIRM SALE • KES ${total.toLocaleString()}` : "ADD ITEMS TO SALE"}
        </button>
      )}
    </div>
  );
}

function LogScreen({ txLog }) {
  const [expanded, setExpanded] = useState(null);
  const dayTotal = useMemo(() => txLog.reduce((s, tx) => s + tx.total, 0), [txLog]);

  return (
    <div className="fade-in">
      <header className="page-hdr">
        <div className="title">Transaction Log</div>
        <div className="subtitle">TODAY • KES {dayTotal.toLocaleString()} TOTAL • {txLog.length} SALE{txLog.length !== 1 ? "S" : ""}</div>
      </header>
      <div className="log-list">
        {txLog.length === 0 ? (
          <div className="empty-log">
            <div className="icon">🧾</div>
            <div className="main">No sales recorded yet</div>
            <div className="sub">Go to Sale tab to record a transaction</div>
          </div>
        ) : txLog.map(tx => (
          <div key={tx.id} className="log-card" onClick={() => setExpanded(expanded === tx.id ? null : tx.id)}>
            <div className="log-summary">
              <div className="main">
                <div className="items-preview">{tx.items.map(i => i.name).join(", ").substring(0, 32)}{tx.items.length > 3 ? "…" : ""}</div>
                <div className="time">🕐 {tx.time} • {tx.items.length} item{tx.items.length !== 1 ? "s" : ""}</div>
              </div>
              <div className="amount">
                <div className="val">KES {tx.total.toLocaleString()}</div>
                <div className="arrow">{expanded === tx.id ? "▲" : "▼"}</div>
              </div>
            </div>
            {expanded === tx.id && (
              <div className="log-details">
                {tx.items.map((item, idx) => (
                  <div key={idx} className="detail-row">
                    <span className="qty-name">{item.qty}× {item.name}</span>
                    <span className="price">KES {(item.price * item.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryScreen({ state }) {
  const { stocks, prices, txLog } = state;

  const stats = useMemo(() => {
    if (!txLog.length) return null;
    const map = {};
    txLog.forEach(tx => tx.items.forEach(i => {
      if (!map[i.name]) map[i.name] = { qty: 0, rev: 0 };
      map[i.name].qty += i.qty;
      map[i.name].rev += i.price * i.qty;
    }));
    const chartData = Object.entries(map).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.rev - a.rev).slice(0, 5);
    const totalRevenue = txLog.reduce((s, tx) => s + tx.total, 0);
    const totalItems = txLog.reduce((s, tx) => s + tx.items.reduce((ss, i) => ss + i.qty, 0), 0);
    const avgSale = Math.round(totalRevenue / txLog.length);
    return { chartData, totalRevenue, totalItems, avgSale };
  }, [txLog]);

  const stockValue = useMemo(() => ALL_VARIETIES.reduce((sum, v) => sum + (stocks[v.id] || 0) * (prices[v.id]?.buy ?? v.buyPrice), 0), [stocks, prices]);
  const lowStockItems = useMemo(() => ALL_VARIETIES.filter(v => (stocks[v.id] ?? v.stock) <= v.threshold), [stocks]);
  const maxRev = stats?.chartData.length ? Math.max(...stats.chartData.map(d => d.rev)) : 1;

  return (
    <div className="fade-in">
      <header className="page-hdr">
        <div className="title">Daily Summary</div>
        <div className="subtitle">TODAY • {new Date().toLocaleDateString("en-KE", { weekday: "long" }).toUpperCase()}</div>
      </header>

      <div className="stats-grid">
        {[
          { label: "Revenue", value: stats ? `KES ${stats.totalRevenue.toLocaleString()}` : "KES 0", icon: "💰", sub: `${txLog.length} sales` },
          { label: "Items Sold", value: stats ? `${stats.totalItems} units` : "0 units", icon: "📦", sub: "today" },
          { label: "Avg Sale", value: stats ? `KES ${stats.avgSale}` : "KES 0", icon: "📊", sub: "per transaction" },
          { label: "Stock Value", value: `KES ${stockValue.toLocaleString()}`, icon: "🏪", sub: "at buy price" },
        ].map(c => (
          <div key={c.label} className="stat-card">
            <div className="hdr"><span>{c.icon}</span><span className="sub">{c.sub}</span></div>
            <div className="val">{c.value}</div>
            <div className="lbl">{c.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <div className="special-grid">
        <div className="special-card margin">
          <div className="lbl">AVG MARGIN</div>
          <div className="val">24%</div>
        </div>
        <div className={`special-card stock ${lowStockItems.length > 0 ? 'warn' : ''}`}>
          <div className="lbl">{lowStockItems.length > 0 ? "⚠ LOW STOCK" : "✓ STOCK OK"}</div>
          <div className="val">{lowStockItems.length}</div>
        </div>
      </div>

      {stats ? (
        <div className="chart-card">
          <div className="lbl">TOP SELLERS BY REVENUE</div>
          {stats.chartData.map(d => (
            <div key={d.name} className="chart-item">
              <div className="item-hdr"><span>{d.name}</span><span className="rev">KES {d.rev.toLocaleString()}</span></div>
              <div className="bar-bg"><div className="bar-fill" style={{ width: `${(d.rev/maxRev)*100}%` }}></div></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-chart">📊 Sales chart will appear after first sale</div>
      )}
    </div>
  );
}

function AdminScreen({ state, dispatch }) {
  const { stocks, prices, txLog, sms } = state;
  const [pinInput, setPinInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const tryPin = (digit) => {
    if (activeTab === "logout") return; 
    const next = pinInput + digit;
    setPinInput(next);
    if (next.length === 4) {
      if (next === PIN) { setUnlocked(true); setPinInput(""); setPinError(false); }
      else { setPinError(true); setTimeout(() => { setPinInput(""); setPinError(false); }, 800); }
    }
  };

  if (!unlocked) {
    return (
      <div className="pin-screen fade-in">
        <div className="icon">🔐</div>
        <div className="title">Admin Access</div>
        <div className="dots">
          {[0,1,2,3].map(i => <div key={i} className={`dot ${pinInput.length > i ? 'fill' : ''} ${pinError ? 'error' : ''}`}></div>)}
        </div>
        <div className="numpad">
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k, i) => (
            <button key={i} onClick={() => { if (k === "⌫") setPinInput(p => p.slice(0,-1)); else if (k !== "") tryPin(k); }} className={k === "⌫" ? "special" : ""}>
              {k}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <header className="page-hdr admin">
        <div className="top-row">
          <div className="title">Admin Panel</div>
          <button className="lock-btn" onClick={() => setUnlocked(false)}>LOCK</button>
        </div>
        <div className="admin-tabs">
          {["overview", "stock", "prices", "sms"].map(t => (
            <button key={t} className={activeTab === t ? "active" : ""} onClick={() => setActiveTab(t)}>{t.toUpperCase()}</button>
          ))}
        </div>
      </header>
      <div className="admin-body">
        {activeTab === "overview" && (
           <div className="overview-pane">
              <div className="admin-card">
                <div className="lbl">TODAY'S REVENUE</div>
                <div className="val">KES {txLog.reduce((s,tx)=>s+tx.total,0).toLocaleString()}</div>
              </div>
              <div className="admin-card">
                <div className="lbl">STOCK VALUE</div>
                <div className="val">KES {ALL_VARIETIES.reduce((s,v)=>s+(stocks[v.id]||0)*(prices[v.id]?.buy??v.buyPrice), 0).toLocaleString()}</div>
              </div>
           </div>
        )}
        {activeTab === "stock" && (
          <div className="stock-pane">
            {ALL_VARIETIES.map(v => {
              const curr = stocks[v.id] ?? v.stock;
              return (
                <div key={v.id} className="stock-row">
                  <span className="name">{v.name}</span>
                  <div className="ctrls">
                    <button onClick={() => dispatch({ type: "STOCK", id: v.id, val: curr-1 })} style={qBtn}>−</button>
                    <span className="val">{curr}</span>
                    <button onClick={() => dispatch({ type: "STOCK", id: v.id, val: curr+1 })} style={qBtn}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {activeTab === "prices" && (
          <div className="prices-pane">
            {ALL_VARIETIES.map(v => (
              <div key={v.id} className="price-card">
                <div className="name">{v.name}</div>
                <div className="inputs">
                  <div className="field"><label>BUY</label>
                    <input type="number" value={prices[v.id]?.buy ?? v.buyPrice} onChange={e => dispatch({ type: "PRICE", id: v.id, t: "buy", val: parseInt(e.target.value)||0 })} />
                  </div>
                  <div className="field"><label>SELL</label>
                    <input type="number" value={prices[v.id]?.sell ?? v.price} onChange={e => dispatch({ type: "PRICE", id: v.id, t: "sell", val: parseInt(e.target.value)||0 })} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === "sms" && (
          <div className="sms-pane">
            {Object.entries(sms).map(([k, v]) => (
               <div key={k} className="sms-row">
                  <span className="lbl">{k.replace(/([A-Z])/g, ' $1').toUpperCase()}</span>
                  <button className={`toggle ${v ? 'active' : ''}`} onClick={() => dispatch({ type: "SMS", key: k })}></button>
               </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [state, dispatch] = useReducer(reducer, INIT);
  const [tab, setTab] = useState("sale");

  const tabs = [
    { id: "sale", icon: "🛒", label: "Sale" },
    { id: "log", icon: "📋", label: "Log" },
    { id: "summary", icon: "📊", label: "Summary" },
    { id: "admin", icon: "⚙️", label: "Admin" },
  ];

  return (
    <div style={L.wrap}>
      <div style={L.phone}>
        <div style={L.statusBar}><Clock /><span>📶 OFFLINE</span><span>🔋 87%</span></div>
        <main style={L.screenBody}>
          {tab === "sale" && <SaleScreen state={state} dispatch={dispatch} />}
          {tab === "log" && <LogScreen txLog={state.txLog} />}
          {tab === "summary" && <SummaryScreen state={state} />}
          {tab === "admin" && <AdminScreen state={state} dispatch={dispatch} />}
        </main>
        <nav style={L.bottomNav}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={L.navBtn(tab === t.id)}>
              <span style={{ fontSize: 18 }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
