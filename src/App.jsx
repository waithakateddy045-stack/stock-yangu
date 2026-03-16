import { useState, useEffect, useReducer, useMemo, useCallback } from "react";

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
const PIN = "1234"; // change before going live

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
        items: cart.map(i => ({ name: i.name, qty: i.qty, price: state.prices[i.id]?.sell ?? i.price })),
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
  phone: { width: 375, height: 720, background: C.bg, borderRadius: 40, boxShadow: "0 40px 100px rgba(0,0,0,0.6), inset 0 0 0 2px rgba(255,255,255,0.1)", overflow: "hidden", display: "flex", flexDirection: "column" },
  statusBar: { background: C.brand, color: C.greenFg, fontSize: 11, fontWeight: 600, padding: "10px 20px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", letterSpacing: 0.5, flexShrink: 0 },
  screenBody: { flex: 1, overflowY: "auto", overflowX: "hidden", background: C.bg },
  bottomNav: { background: C.brand, display: "flex", borderTop: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 },
  navBtn: (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 0 10px", cursor: "pointer", background: active ? "rgba(255,255,255,0.12)" : "transparent", border: "none", color: active ? C.accent : C.greenFg, fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", gap: 3, transition: "all 0.15s", fontFamily: "inherit" }),
};

// ─── Clock (ticking) ──────────────────────────────────────────────────────────
function Clock() {
  const fmt = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const [t, setT] = useState(fmt);
  useEffect(() => { const id = setInterval(() => setT(fmt()), 15000); return () => clearInterval(id); }, []);
  return <span>{t}</span>;
}

// ─── Sale Screen ───────────────────────────────────────────────────────────────
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

  const lowStockCount = useMemo(
    () => ALL_VARIETIES.filter(v => (stocks[v.id] ?? v.stock) <= v.threshold).length,
    [stocks]
  );

  const displayVarieties = useMemo(() => {
    if (search) return ALL_VARIETIES.filter(v => v.name.toLowerCase().includes(search.toLowerCase()));
    return selectedCat?.varieties ?? [];
  }, [search, selectedCat]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ background: C.brand, padding: "14px 16px 10px", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.accent, letterSpacing: -0.5 }}>Stock Yangu</div>
            <div style={{ fontSize: 10, color: C.greenFg, fontWeight: 600, letterSpacing: 1 }}>QUICK SALE</div>
          </div>
          {lowStockCount > 0 && (
            <div style={{ background: C.danger, borderRadius: 20, padding: "4px 10px", fontSize: 10, fontWeight: 700, color: "#fff", animation: "pulse 1.5s infinite" }}>
              ⚠ {lowStockCount} LOW
            </div>
          )}
        </div>
        <div style={{ marginTop: 10, background: "rgba(255,255,255,0.15)", borderRadius: 30, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: C.greenFg }}>🔍</span>
          <input type="text" placeholder="Search product..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 12, width: "100%", fontFamily: "inherit" }} />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: C.greenFg, cursor: "pointer", fontSize: 14, padding: 0, fontFamily: "inherit" }}>✕</button>}
        </div>
      </div>

      {/* Cart */}
      <div style={{ background: C.bgWarm, borderBottom: `2px solid ${C.accentWarm}`, minHeight: 72, padding: "8px 12px", flexShrink: 0 }}>
        {cart.length === 0 ? (
          <div style={{ color: C.textDim, fontSize: 12, fontStyle: "italic", textAlign: "center", paddingTop: 12 }}>Tap a product below to start a sale...</div>
        ) : (
          <>
            <div style={{ maxHeight: 92, overflowY: "auto" }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5, gap: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.textDark, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    <button onClick={() => updateQty(item.id, -1)} style={qBtn}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 800, color: C.textDark, minWidth: 18, textAlign: "center" }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} style={qBtn}>+</button>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.greenDark, minWidth: 54, textAlign: "right" }}>
                      KES {((prices[item.id]?.sell ?? item.price) * item.qty).toLocaleString()}
                    </span>
                    <button onClick={() => removeFromCart(item.id)} style={{ ...qBtn, background: "#ffd5d5", color: "#c0392b", marginLeft: 2 }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px dashed #F4A261", marginTop: 6, paddingTop: 5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.textMed, letterSpacing: 0.5 }}>TOTAL</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: C.brand }}>KES {total.toLocaleString()}</span>
            </div>
          </>
        )}
      </div>

      {/* Category grid */}
      {!search && (
        <div style={{ padding: "10px 12px 4px", flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, letterSpacing: 1, marginBottom: 6 }}>CATEGORIES</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCat(selectedCat?.id === cat.id ? null : cat)}
                style={{ background: selectedCat?.id === cat.id ? C.brand : C.white, border: `2px solid ${selectedCat?.id === cat.id ? C.brand : C.border}`, borderRadius: 12, padding: "8px 4px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, transition: "all 0.15s", fontFamily: "inherit" }}>
                <span style={{ fontSize: 20 }}>{cat.emoji}</span>
                <span style={{ fontSize: 8, fontWeight: 700, color: selectedCat?.id === cat.id ? C.accent : C.textMed }}>{cat.name.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Variety picker */}
      {(search || selectedCat) && (
        <div style={{ padding: "6px 12px", background: C.bgWarm, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.accentWarm, letterSpacing: 1, marginBottom: 6 }}>
            {search ? "SEARCH RESULTS" : `${selectedCat.emoji} ${selectedCat.name.toUpperCase()}`}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 190, overflowY: "auto" }}>
            {displayVarieties.map(v => {
              const currStock = stocks[v.id] ?? v.stock;
              const sellPrice = prices[v.id]?.sell ?? v.price;
              const isLow = currStock <= v.threshold;
              const inCart = cart.find(i => i.id === v.id);
              return (
                <button key={v.id} onClick={() => addToCart(v)}
                  style={{ background: inCart ? C.brand : C.white, border: `2px solid ${isLow ? C.danger : inCart ? C.brand : C.borderDim}`, borderRadius: 10, padding: "6px 10px", cursor: "pointer", textAlign: "left", minWidth: 88, position: "relative", transition: "all 0.12s", fontFamily: "inherit" }}>
                  {isLow && <span style={{ position: "absolute", top: -6, right: -6, background: C.danger, borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#fff", fontWeight: 900 }}>!</span>}
                  {inCart && <span style={{ position: "absolute", top: -6, left: -6, background: C.accent, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: C.brand, fontWeight: 900 }}>{inCart.qty}</span>}
                  <div style={{ fontSize: 11, fontWeight: 700, color: inCart ? C.accent : C.textDark }}>{v.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: inCart ? C.greenFg : C.brand }}>KES {sellPrice}</div>
                  <div style={{ fontSize: 9, color: isLow ? C.danger : C.textDim, fontWeight: 600 }}>Stock: {currStock}</div>
                </button>
              );
            })}
            {search && displayVarieties.length === 0 && (
              <div style={{ padding: "14px 0", textAlign: "center", width: "100%", color: C.textDim, fontSize: 12 }}>No results for "{search}"</div>
            )}
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Confirm */}
      {confirmed ? (
        <div style={{ background: C.brand, padding: 18, textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 28 }}>✅</div>
          <div style={{ color: C.greenFg, fontWeight: 800, fontSize: 16 }}>Sale Recorded!</div>
        </div>
      ) : (
        <button onClick={confirmSale} disabled={cart.length === 0}
          style={{ background: cart.length > 0 ? C.danger : C.borderDim, color: "#fff", border: "none", padding: 16, width: "100%", fontSize: 15, fontWeight: 800, letterSpacing: 1, cursor: cart.length > 0 ? "pointer" : "default", transition: "background 0.2s", flexShrink: 0, fontFamily: "inherit" }}>
          {cart.length > 0 ? `CONFIRM SALE • KES ${total.toLocaleString()}` : "ADD ITEMS TO SALE"}
        </button>
      )}
    </div>
  );
}

// ─── Log Screen ────────────────────────────────────────────────────────────────
function LogScreen({ txLog }) {
  const [expanded, setExpanded] = useState(null);
  const dayTotal = useMemo(() => txLog.reduce((s, tx) => s + tx.total, 0), [txLog]);

  return (
    <div style={{ paddingBottom: 16 }}>
      <div style={{ background: C.brand, padding: "14px 16px 12px" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.accent }}>Transaction Log</div>
        <div style={{ fontSize: 10, color: C.greenFg, fontWeight: 600, letterSpacing: 0.8, marginTop: 2 }}>
          TODAY • KES {dayTotal.toLocaleString()} TOTAL • {txLog.length} SALE{txLog.length !== 1 ? "S" : ""}
        </div>
      </div>
      <div style={{ padding: "12px 12px 0" }}>
        {txLog.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: C.textDim }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🧾</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.textMed }}>No sales recorded yet</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>Go to Sale tab to record a transaction</div>
          </div>
        ) : txLog.map(tx => (
          <div key={tx.id} onClick={() => setExpanded(expanded === tx.id ? null : tx.id)}
            style={{ background: C.white, borderRadius: 12, marginBottom: 8, border: `1.5px solid ${C.border}`, overflow: "hidden", cursor: "pointer" }}>
            <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.textDark }}>
                  {tx.items.map(i => i.name).join(", ").substring(0, 26)}{tx.items.map(i => i.name).join(", ").length > 26 ? "…" : ""}
                </div>
                <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600, marginTop: 2 }}>
                  🕐 {tx.time} • {tx.items.length} item{tx.items.length !== 1 ? "s" : ""}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: C.brand }}>KES {tx.total.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: C.greenFg, fontWeight: 600 }}>{expanded === tx.id ? "▲" : "▼"}</div>
              </div>
            </div>
            {expanded === tx.id && (
              <div style={{ borderTop: `1px dashed ${C.border}`, padding: "8px 14px", background: C.bg }}>
                {tx.items.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                    <span style={{ color: "#5C3D17" }}>{item.qty}× {item.name}</span>
                    <span style={{ fontWeight: 700, color: C.brand }}>KES {(item.price * item.qty).toLocaleString()}</span>
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

// ─── Summary Screen ────────────────────────────────────────────────────────────
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
    const chartData = Object.entries(map).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.rev - a.rev).slice(0, 8);
    const totalRevenue = txLog.reduce((s, tx) => s + tx.total, 0);
    const totalItems = txLog.reduce((s, tx) => s + tx.items.reduce((ss, i) => ss + i.qty, 0), 0);
    const avgSale = Math.round(totalRevenue / txLog.length);
    return { chartData, totalRevenue, totalItems, avgSale };
  }, [txLog]);

  const stockValue = useMemo(() =>
    ALL_VARIETIES.reduce((sum, v) => sum + (stocks[v.id] || 0) * (prices[v.id]?.buy ?? v.buyPrice), 0),
  [stocks, prices]);

  const avgMargin = useMemo(() => {
    const margins = ALL_VARIETIES.map(v => {
      const sell = prices[v.id]?.sell ?? v.price;
      const buy = prices[v.id]?.buy ?? v.buyPrice;
      return sell > 0 ? (sell - buy) / sell : 0;
    });
    return Math.round((margins.reduce((s, m) => s + m, 0) / margins.length) * 100);
  }, [prices]);

  const lowStockItems = useMemo(
    () => ALL_VARIETIES.filter(v => (stocks[v.id] ?? v.stock) <= v.threshold),
    [stocks]
  );
  const maxRev = stats?.chartData.length ? Math.max(...stats.chartData.map(d => d.rev)) : 1;

  return (
    <div>
      <div style={{ background: C.brand, padding: "14px 16px 12px" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.accent }}>Daily Summary</div>
        <div style={{ fontSize: 10, color: C.greenFg, fontWeight: 600, letterSpacing: 0.8, marginTop: 2 }}>
          TODAY • {new Date().toLocaleDateString("en-KE", { weekday: "long" }).toUpperCase()}
        </div>
      </div>

      <div style={{ padding: "12px 12px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[
            { label: "Revenue",    value: stats ? `KES ${stats.totalRevenue.toLocaleString()}` : "KES 0",  icon: "💰", sub: `${txLog.length} sales` },
            { label: "Items Sold", value: stats ? `${stats.totalItems} units` : "—",                       icon: "📦", sub: "today" },
            { label: "Avg Sale",   value: stats ? `KES ${stats.avgSale}` : "—",                            icon: "📊", sub: "per transaction" },
            { label: "Stock Value",value: `KES ${stockValue.toLocaleString()}`,                             icon: "🏪", sub: "at buy price" },
          ].map(c => (
            <div key={c.label} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 16 }}>{c.icon}</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: C.textDim }}>{c.sub}</span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: C.brand, marginTop: 4 }}>{c.value}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.textDim, letterSpacing: 0.5, marginTop: 2 }}>{c.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Margin + Low Stock tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div style={{ ...card, background: "#E6F0DC", borderColor: "#8FB870" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.brand, letterSpacing: 0.5 }}>AVG MARGIN</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: C.brand, marginTop: 4 }}>{avgMargin}%</div>
            <div style={{ fontSize: 9, color: C.textMed, fontWeight: 600, marginTop: 2 }}>across all products</div>
          </div>
          <div style={{ ...card, background: lowStockItems.length > 0 ? C.dangerBg : "#E6F0DC", borderColor: lowStockItems.length > 0 ? "#F4A261" : "#8FB870" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: lowStockItems.length > 0 ? C.danger : C.brand, letterSpacing: 0.5 }}>
              {lowStockItems.length > 0 ? "⚠ LOW STOCK" : "✓ STOCK OK"}
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: lowStockItems.length > 0 ? C.danger : C.brand, marginTop: 4 }}>{lowStockItems.length}</div>
            <div style={{ fontSize: 9, color: C.textMed, fontWeight: 600, marginTop: 2 }}>items need restocking</div>
          </div>
        </div>

        {/* Chart */}
        {stats?.chartData.length > 0 ? (
          <div style={{ ...card, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.textMed, letterSpacing: 0.8, marginBottom: 10 }}>TOP SELLERS BY REVENUE</div>
            {stats.chartData.map(d => (
              <div key={d.name} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.textDark }}>{d.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: C.brand }}>KES {d.rev.toLocaleString()}</span>
                </div>
                <div style={{ height: 8, background: "#F4E8D8", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.round((d.rev / maxRev) * 100)}%`, background: `linear-gradient(90deg, ${C.brand}, ${C.brandLight})`, borderRadius: 4, transition: "width 0.6s ease" }} />
                </div>
                <div style={{ fontSize: 9, color: C.textDim, fontWeight: 600, marginTop: 2 }}>{d.qty} units sold</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ ...card, textAlign: "center", padding: "24px 14px", marginBottom: 12 }}>
            <div style={{ fontSize: 28 }}>📊</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textMed, marginTop: 8 }}>No sales recorded yet</div>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 3 }}>Sales chart will appear after first sale</div>
          </div>
        )}

        {/* Low stock list */}
        {lowStockItems.length > 0 && (
          <div style={{ ...card, background: C.dangerBg, borderColor: "#F4A261", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.danger, letterSpacing: 0.8, marginBottom: 6 }}>RESTOCK NEEDED</div>
            {lowStockItems.map(v => (
              <div key={v.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: "#5C3D17", fontWeight: 600 }}>{v.name}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: C.danger }}>{stocks[v.id] ?? v.stock} left</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Admin Screen ──────────────────────────────────────────────────────────────
function AdminScreen({ state, dispatch }) {
  const { stocks, prices, txLog, sms } = state;
  const [pinInput, setPinInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  const tryPin = (digit) => {
    const next = pinInput + digit;
    setPinInput(next);
    if (next.length === 4) {
      if (next === PIN) { setUnlocked(true); setPinInput(""); setPinError(false); }
      else { setPinError(true); setTimeout(() => { setPinInput(""); setPinError(false); }, 800); }
    }
  };

  if (!unlocked) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px 20px" }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🔐</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.brand, marginBottom: 4 }}>Admin Access</div>
        <div style={{ fontSize: 12, color: C.textDim, fontWeight: 600, marginBottom: 24 }}>Enter your PIN to continue</div>
        <div style={{ display: "flex", gap: 12, marginBottom: pinError ? 4 : 20 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: pinInput.length > i ? (pinError ? C.danger : C.brand) : C.border, transition: "background 0.15s" }} />
          ))}
        </div>
        {pinError && <div style={{ color: C.danger, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>Incorrect PIN</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, width: 220 }}>
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k, i) => (
            <button key={i} onClick={() => { if (k === "⌫") setPinInput(p => p.slice(0,-1)); else if (k !== "") tryPin(k); }}
              style={{ height: 54, borderRadius: 14, border: `2px solid ${C.border}`, background: k === "" ? "transparent" : C.white, fontSize: k === "⌫" ? 18 : 22, fontWeight: 700, color: C.textDark, cursor: k !== "" ? "pointer" : "default", boxShadow: "0 2px 6px rgba(0,0,0,0.08)", fontFamily: "inherit" }}>
              {k}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const sections = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "stock",    label: "Stock",    icon: "📦" },
    { id: "prices",   label: "Prices",   icon: "🏷️" },
    { id: "sms",      label: "SMS",      icon: "📱" },
  ];

  const totalRevenue = useMemo(() => txLog.reduce((s, tx) => s + tx.total, 0), [txLog]);
  const stockValue = useMemo(() => ALL_VARIETIES.reduce((s, v) => s + (stocks[v.id]||0)*(prices[v.id]?.buy??v.buyPrice), 0), [stocks, prices]);
  const topSeller = useMemo(() => {
    if (!txLog.length) return null;
    const counts = {};
    txLog.forEach(tx => tx.items.forEach(i => { counts[i.name] = (counts[i.name]||0)+i.qty; }));
    const top = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
    return top ? { name: top[0], qty: top[1] } : null;
  }, [txLog]);
  const avgMargin = useMemo(() => {
    const ms = ALL_VARIETIES.map(v => { const s=prices[v.id]?.sell??v.price, b=prices[v.id]?.buy??v.buyPrice; return s>0?(s-b)/s:0; });
    return Math.round((ms.reduce((a,m)=>a+m,0)/ms.length)*100);
  }, [prices]);

  return (
    <div>
      <div style={{ background: C.brand, padding: "14px 16px 10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.accent }}>Admin Panel</div>
            <div style={{ fontSize: 10, color: C.greenFg, fontWeight: 600, letterSpacing: 0.8, marginTop: 2 }}>OWNER ACCESS UNLOCKED ✓</div>
          </div>
          <button onClick={() => setUnlocked(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: C.greenFg, padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5, fontFamily: "inherit" }}>LOCK</button>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, overflowX: "auto", paddingBottom: 2 }}>
          {sections.map(sec => (
            <button key={sec.id} onClick={() => setActiveSection(sec.id)}
              style={{ background: activeSection===sec.id ? C.accent : "rgba(255,255,255,0.1)", color: activeSection===sec.id ? C.brand : C.greenFg, border: "none", borderRadius: 20, padding: "5px 12px", fontSize: 10, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", letterSpacing: 0.5, fontFamily: "inherit" }}>
              {sec.icon} {sec.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "12px 12px 16px" }}>
        {activeSection === "overview" && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.textMed, letterSpacing: 0.8, marginBottom: 8 }}>BUSINESS SNAPSHOT</div>
            {[
              { label: "Today's Revenue", value: `KES ${totalRevenue.toLocaleString()}`, badge: `${txLog.length} sales`, up: true },
              { label: "Stock Value",     value: `KES ${stockValue.toLocaleString()}`,   badge: "at buy price",          up: null },
              { label: "Top Seller",      value: topSeller ? topSeller.name : "No sales yet", badge: topSeller ? `${topSeller.qty} units` : "—", up: !!topSeller },
              { label: "Avg Margin",      value: `${avgMargin}%`,                        badge: "all products",          up: avgMargin > 15 },
            ].map(row => (
              <div key={row.label} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, letterSpacing: 0.5 }}>{row.label.toUpperCase()}</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: C.brand, marginTop: 2 }}>{row.value}</div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: row.up===null ? C.textDim : row.up ? C.greenDark : C.danger, background: row.up===null ? "#F4E8D8" : row.up ? "#E6F0DC" : "#FFE8E0", padding: "4px 8px", borderRadius: 20 }}>{row.badge}</div>
              </div>
            ))}
          </div>
        )}

        {activeSection === "stock" && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.textMed, letterSpacing: 0.8, marginBottom: 8 }}>ADJUST STOCK LEVELS</div>
            <div style={card}>
              {ALL_VARIETIES.map(v => {
                const curr = stocks[v.id] ?? v.stock;
                const isLow = curr <= v.threshold;
                return (
                  <div key={v.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: isLow ? C.danger : C.textDark, flex: 1 }}>
                      {v.name}{isLow ? " ⚠" : ""}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => dispatch({ type: "STOCK", id: v.id, val: curr - 1 })} style={qBtn}>−</button>
                      <span style={{ fontSize: 13, fontWeight: 800, color: isLow ? C.danger : C.brand, minWidth: 28, textAlign: "center" }}>{curr}</span>
                      <button onClick={() => dispatch({ type: "STOCK", id: v.id, val: curr + 1 })} style={qBtn}>+</button>
                    </div>
                  </div>
                );
              })}
              <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>Changes reflect immediately in the Sale screen.</div>
            </div>
          </div>
        )}

        {activeSection === "prices" && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.textMed, letterSpacing: 0.8, marginBottom: 8 }}>MANAGE PRICES</div>
            {ALL_VARIETIES.map(v => {
              const sell = prices[v.id]?.sell ?? v.price;
              const buy  = prices[v.id]?.buy  ?? v.buyPrice;
              const margin = sell > 0 ? Math.round(((sell - buy) / sell) * 100) : 0;
              return (
                <div key={v.id} style={{ ...card, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.textDark }}>{v.name}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: margin > 0 ? C.greenDark : C.danger, background: margin > 0 ? "#E6F0DC" : "#FFE8E0", padding: "2px 8px", borderRadius: 10 }}>
                      {margin}% margin
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {[["buy", buy, "BUY PRICE"], ["sell", sell, "SELL PRICE"]].map(([type, val, label]) => (
                      <div key={type}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: C.textDim, letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
                        <input type="number" value={val}
                          onChange={e => dispatch({ type: "PRICE", id: v.id, t: type, val: parseInt(e.target.value) || 0 })}
                          style={{ width: "100%", background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 7, padding: "6px 8px", fontSize: 13, fontWeight: 800, color: C.brand, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeSection === "sms" && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.textMed, letterSpacing: 0.8, marginBottom: 8 }}>SMS SETTINGS</div>
            <div style={card}>
              {[
                { key: "lowStock", label: "Low Stock Alerts" },
                { key: "daily",    label: "Daily Summary SMS" },
                { key: "mpesa",    label: "M-Pesa Confirmations" },
              ].map(row => (
                <div key={row.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F4E8D8" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.textDark }}>{row.label}</span>
                  <div onClick={() => dispatch({ type: "SMS", key: row.key })}
                    style={{ width: 42, height: 24, borderRadius: 12, cursor: "pointer", background: sms[row.key] ? C.brand : C.borderDim, position: "relative", transition: "background 0.2s" }}>
                    <div style={{ position: "absolute", top: 3, left: sms[row.key] ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                  </div>
                </div>
              ))}
              <button style={{ width: "100%", background: C.brand, color: C.accent, border: "none", borderRadius: 10, padding: 10, fontWeight: 800, fontSize: 12, marginTop: 10, cursor: "pointer", fontFamily: "inherit" }}>
                SEND TEST SMS
              </button>
            </div>
            <div style={{ ...card, background: "#E6F0DC", borderColor: "#8FB870", marginTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.brand, letterSpacing: 0.5, marginBottom: 4 }}>📡 SMS CREDITS</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.brand }}>247 credits remaining</div>
              <div style={{ fontSize: 10, color: C.textMed, fontWeight: 600, marginTop: 2 }}>≈ KES 0.32 per SMS via Africa's Talking</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Feasibility Panel ─────────────────────────────────────────────────────────
function FeasibilityPanel() {
  const [open, setOpen] = useState(false);
  const items = [
    { icon:"✅", color:"#1E3A0E", title:"Real Problem — Validated",         body:"Over 50% of duka owners in Nairobi record no sales at all; another 40% do it manually. Dukas supply ~80% of consumer goods in Kenya and account for 70% of all retail revenue." },
    { icon:"✅", color:"#1E3A0E", title:"Market Size",                       body:"300,000+ dukas in Kenya. Even 1% penetration at KES 500/month = KES 18M ARR. SMS credits become an upsell. TAM expands to Uganda, Tanzania, Rwanda easily." },
    { icon:"⚠️", color:"#8B5E2A", title:"Competition Exists",                body:"Duka Manager, PawaPOS, LinearPOS, JamPOS all serve this space. Most target mid-size retailers, require internet, or have complex UIs. Offline-first + SMS is a real differentiator." },
    { icon:"✅", color:"#1E3A0E", title:"SMS Infrastructure — Ready",        body:"Africa's Talking charges KES 0.32–0.40/SMS. Daily summary + 2–3 low-stock alerts = ~KES 3/day. Charge KES 200–500/mo and profit after infra. 98% SMS open rate in Kenya." },
    { icon:"✅", color:"#1E3A0E", title:"Tech Stack is Viable",              body:"Android offline-first with SQLite → Neon/Supabase sync when online. Africa's Talking for SMS. Daraja API for M-Pesa. Well-trodden stack with Kenyan dev support." },
    { icon:"⚠️", color:"#8B5E2A", title:"GTM Risk: Adoption",               body:"Duka owners trust WhatsApp demos and word-of-mouth. Sales cycles are short but require in-person trust. Agent-based distribution (like M-Pesa kiosks) is likely the fastest GTM channel." },
    { icon:"💡", color:"#6B3A00", title:"Key Differentiator to Double Down", body:"No PIN for attendant = zero friction for staff. Category+variety model is perfect for dukas that sell same-SKU in different sizes/grades. Most POS apps don't think this way." },
  ];

  return (
    <div style={{ width: 375, background: "#1a1a2e", borderRadius: 20, marginTop: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: "100%", background: "linear-gradient(135deg, #1E3A0E, #3A6B1E)", border: "none", color: "#fff", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "inherit" }}>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: C.accent, letterSpacing: -0.3 }}>📋 FEASIBILITY REPORT</div>
          <div style={{ fontSize: 10, color: C.greenFg, fontWeight: 600, letterSpacing: 0.8, marginTop: 2 }}>STOCK YANGU • KENYA DUKA POS</div>
        </div>
        <div style={{ fontSize: 18, color: C.accent }}>{open ? "▲" : "▼"}</div>
      </button>
      {open && (
        <div style={{ padding: "16px 16px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            {[
              { label: "Verdict",       value: "STRONG GO ✓",  color: "#4A8025" },
              { label: "Market",        value: "300K+ Dukas",  color: C.accent },
              { label: "Differentiator",value: "Offline+SMS",  color: C.accentWarm },
              { label: "Risk Level",    value: "Medium",       color: C.danger },
            ].map(m => (
              <div key={m.label} style={{ background: "#16213E", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: "#5C7A9F", letterSpacing: 1 }}>{m.label.toUpperCase()}</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: m.color, marginTop: 4 }}>{m.value}</div>
              </div>
            ))}
          </div>
          {items.map((item, i) => (
            <div key={i} style={{ background: "#0F3460", borderRadius: 12, padding: "12px 14px", marginBottom: 8, borderLeft: `3px solid ${item.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#E0E0E0" }}>{item.title}</span>
              </div>
              <div style={{ fontSize: 11, color: "#8FA8C8", lineHeight: 1.6 }}>{item.body}</div>
            </div>
          ))}
          <div style={{ background: "#16213E", borderRadius: 12, padding: "12px 14px", marginTop: 8, borderLeft: `3px solid ${C.accent}` }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.accent, letterSpacing: 0.5, marginBottom: 6 }}>RECOMMENDED NEXT STEPS</div>
            {[
              "Build MVP Android APK (React Native + SQLite + offline-first sync)",
              "Pilot with 10 dukas in a single Nairobi estate for 30 days",
              "SMS daily summary as the #1 hook — owners love closing numbers on their phones",
              "Price at KES 0 free trial → KES 300/mo basic → KES 600/mo with SMS",
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "flex-start" }}>
                <span style={{ color: C.accent, fontWeight: 900, fontSize: 11, minWidth: 16, marginTop: 1 }}>{i+1}.</span>
                <span style={{ fontSize: 11, color: "#8FA8C8", lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── App Root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [state, dispatch] = useReducer(reducer, INIT);
  const [tab, setTab] = useState("sale");

  useEffect(() => {
    const s = document.createElement("style");
    s.innerHTML = `@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }`;
    document.head.appendChild(s);
    return () => s.remove();
  }, []);

  const tabs = [
    { id: "sale",    icon: "🛒", label: "Sale" },
    { id: "log",     icon: "📋", label: "Log" },
    { id: "summary", icon: "📊", label: "Summary" },
    { id: "admin",   icon: "⚙️", label: "Admin" },
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <div style={L.wrap}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={L.phone}>
            <div style={L.statusBar}>
              <Clock />
              <span>📶 OFFLINE</span>
              <span>🔋 87%</span>
            </div>
            <div style={L.screenBody}>
              {tab === "sale"    && <SaleScreen    state={state} dispatch={dispatch} />}
              {tab === "log"     && <LogScreen     txLog={state.txLog} />}
              {tab === "summary" && <SummaryScreen state={state} />}
              {tab === "admin"   && <AdminScreen   state={state} dispatch={dispatch} />}
            </div>
            <div style={L.bottomNav}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={L.navBtn(tab === t.id)}>
                  <span style={{ fontSize: 18 }}>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <FeasibilityPanel />
          <div style={{ color: "#4A4A5A", fontSize: 10, marginTop: 12, fontFamily: "Outfit, sans-serif", letterSpacing: 0.5 }}>
            STOCK YANGU • PROTOTYPE v0.3 • CLICK TO INTERACT
          </div>
        </div>
      </div>
    </>
  );
}
