import { useState, useEffect, useRef } from "react";

// ── PALETTE ──────────────────────────────────────────────────────────────────
// Deep navy base, electric sky blue accent, soft ice highlight, gold rating star
// Blueprint aesthetic: technical precision meets community warmth

const C = {
  navy:    "#0A1628",
  navy2:   "#0F2040",
  navy3:   "#162B52",
  blue:    "#1E6FD9",
  sky:     "#3B9BF4",
  ice:     "#D6EAFF",
  accent:  "#38BDF8",
  gold:    "#F5C518",
  white:   "#F0F6FF",
  muted:   "#7B9FC4",
  border:  "#1E3A5F",
  card:    "#0D1F3C",
  success: "#22C55E",
  danger:  "#EF4444",
};

// ── DATA ─────────────────────────────────────────────────────────────────────
const LISTINGS = [
  { id:1, skill:"Classical Guitar",   area:"Riverside", lat:40.715, lng:-74.009, type:"offer", cat:"Music",   emoji:"🎸", rating:4.9, exchange:"Wants: Spanish cooking",  desc:"Classical & flamenco for beginners to intermediate. 15 years of teaching experience.", color:"#3B9BF4" },
  { id:2, skill:"Carpentry & Decks",  area:"Oak Park",  lat:40.730, lng:-74.030, type:"offer", cat:"Home",    emoji:"🔧", rating:4.7, exchange:"Wants: Web dev help",    desc:"Structural timber work, decking, fencing. Outdoor specialist with a decade of experience.", color:"#38BDF8" },
  { id:3, skill:"Python & Data Sci",  area:"Hillside",  lat:40.720, lng:-73.990, type:"offer", cat:"Tech",    emoji:"💻", rating:5.0, exchange:"Wants: Yoga classes",    desc:"Teaches Python from the basics all the way to machine learning pipelines.", color:"#1E6FD9" },
  { id:4, skill:"Italian Cooking",    area:"Downtown",  lat:40.708, lng:-74.000, type:"offer", cat:"Food",    emoji:"🍳", rating:4.8, exchange:"Wants: Photography",    desc:"Fresh pasta, ragù, and seasonal dishes. Hands-on sessions in a home kitchen.", color:"#3B9BF4" },
  { id:5, skill:"Portrait Photo",     area:"Riverside", lat:40.712, lng:-74.015, type:"want",  cat:"Creative",emoji:"📸", rating:4.6, exchange:"Offers: Pilates",       desc:"Looking for a lighting and editing tutor. Happy to offer Pilates sessions in return.", color:"#38BDF8" },
  { id:6, skill:"Permaculture",       area:"Oak Park",  lat:40.728, lng:-74.025, type:"offer", cat:"Garden",  emoji:"🌱", rating:4.9, exchange:"Wants: Piano lessons",  desc:"Sets up raised beds and compost systems. Will help plan and plant your first season.", color:"#1E6FD9" },
  { id:7, skill:"Piano Lessons",      area:"Hillside",  lat:40.722, lng:-73.998, type:"offer", cat:"Music",   emoji:"🎹", rating:4.7, exchange:"Wants: Gardening help", desc:"ABRSM-qualified teacher. Theory and technique from grade 1 upward.", color:"#3B9BF4" },
  { id:8, skill:"Yoga & Mindfulness", area:"Downtown",  lat:40.705, lng:-74.005, type:"offer", cat:"Fitness", emoji:"🧘", rating:5.0, exchange:"Wants: Cooking lesson", desc:"200-hour certified instructor. Morning flow or evening wind-down — flexible scheduling.", color:"#38BDF8" },
];

const CATEGORIES = ["All","Music","Tech","Home","Food","Creative","Garden","Fitness"];

// ── STAR COMPONENT ────────────────────────────────────────────────────────────
function Stars({ rating, size = 14 }) {
  return (
    <span style={{ display:"inline-flex", gap:1 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20">
          <polygon
            points="10,1 12.9,7 19.5,7.6 14.7,12 16.4,18.5 10,15 3.6,18.5 5.3,12 0.5,7.6 7.1,7"
            fill={i <= Math.round(rating) ? C.gold : "#1E3A5F"}
          />
        </svg>
      ))}
    </span>
  );
}

// ── MAP COMPONENT ─────────────────────────────────────────────────────────────
function SkillMap({ listings, selected, onSelect }) {
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Project lat/lng to canvas x/y
  const lats = listings.map(l => l.lat);
  const lngs = listings.map(l => l.lng);
  const minLat = Math.min(...lats) - 0.005;
  const maxLat = Math.max(...lats) + 0.005;
  const minLng = Math.min(...lngs) - 0.01;
  const maxLng = Math.max(...lngs) + 0.01;

  function project(lat, lng, W, H) {
    const x = ((lng - minLng) / (maxLng - minLng)) * (W - 60) + 30;
    const y = H - ((lat - minLat) / (maxLat - minLat)) * (H - 60) - 30;
    return { x, y };
  }

  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background grid lines
    ctx.strokeStyle = "rgba(30,63,95,0.4)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath(); ctx.moveTo(i * W/8, 0); ctx.lineTo(i * W/8, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * H/8); ctx.lineTo(W, i * H/8); ctx.stroke();
    }

    // Draw roads (simplified grid)
    ctx.strokeStyle = "rgba(59,155,244,0.12)";
    ctx.lineWidth = 2;
    const roads = [
      [[0, H*0.3],[W, H*0.3]],
      [[0, H*0.6],[W, H*0.6]],
      [[W*0.25,0],[W*0.25,H]],
      [[W*0.6,0],[W*0.6,H]],
      [[0,H*0.5],[W*0.4,H*0.2]],
      [[W*0.4,H*0.2],[W,H*0.45]],
    ];
    roads.forEach(([a,b]) => {
      ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
    });

    // Neighborhood blobs
    const hoods = [
      { name:"Riverside",  cx:W*0.22, cy:H*0.38, r:55, color:"rgba(30,111,217,0.08)" },
      { name:"Oak Park",   cx:W*0.38, cy:H*0.62, r:60, color:"rgba(56,189,248,0.08)" },
      { name:"Hillside",   cx:W*0.7,  cy:H*0.45, r:55, color:"rgba(30,111,217,0.08)" },
      { name:"Downtown",   cx:W*0.55, cy:H*0.72, r:50, color:"rgba(56,189,248,0.08)" },
    ];
    hoods.forEach(h => {
      ctx.beginPath();
      ctx.arc(h.cx, h.cy, h.r, 0, Math.PI*2);
      ctx.fillStyle = h.color;
      ctx.fill();
      ctx.font = "500 10px Inter, sans-serif";
      ctx.fillStyle = "rgba(59,155,244,0.4)";
      ctx.textAlign = "center";
      ctx.fillText(h.name, h.cx, h.cy + h.r + 14);
    });

    // Draw markers
    listings.forEach(l => {
      const { x, y } = project(l.lat, l.lng, W, H);
      const isSelected = selected && selected.id === l.id;

      // Pulse ring
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI*2);
        ctx.fillStyle = "rgba(59,155,244,0.15)";
        ctx.fill();
      }

      // Outer ring
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 14 : 10, 0, Math.PI*2);
      ctx.fillStyle = isSelected ? C.sky : C.blue;
      ctx.fill();

      // White center
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 5 : 4, 0, Math.PI*2);
      ctx.fillStyle = "#fff";
      ctx.fill();
    });
  }, [listings, selected]);

  function handleMouseMove(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const W = canvas.width;
    const H = canvas.height;
    setMousePos({ x: e.clientX, y: e.clientY });

    let found = null;
    listings.forEach(l => {
      const { x, y } = project(l.lat, l.lng, W, H);
      if (Math.hypot(mx - x, my - y) < 18) found = l;
    });
    setTooltip(found);
  }

  function handleClick(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const W = canvas.width;
    const H = canvas.height;
    let found = null;
    listings.forEach(l => {
      const { x, y } = project(l.lat, l.lng, W, H);
      if (Math.hypot(mx - x, my - y) < 18) found = l;
    });
    if (found) onSelect(found);
  }

  return (
    <div ref={containerRef} style={{ position:"relative", borderRadius:14, overflow:"hidden", border:`1px solid ${C.border}` }}>
      <canvas
        ref={canvasRef}
        width={640} height={360}
        style={{ display:"block", width:"100%", cursor:"pointer", background:`linear-gradient(135deg, ${C.navy} 0%, ${C.navy2} 100%)` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        onClick={handleClick}
      />
      {tooltip && (
        <div style={{
          position:"fixed", left:mousePos.x+12, top:mousePos.y-10,
          background:C.card, border:`1px solid ${C.border}`,
          borderRadius:8, padding:"8px 12px", pointerEvents:"none", zIndex:999,
          boxShadow:"0 4px 20px rgba(0,0,0,0.5)", minWidth:160,
        }}>
          <div style={{ fontWeight:600, fontSize:13, color:C.white }}>{tooltip.skill}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{tooltip.area}</div>
          <div style={{ marginTop:4, display:"flex", alignItems:"center", gap:4 }}>
            <Stars rating={tooltip.rating} size={11} />
            <span style={{ fontSize:11, color:C.gold }}>{tooltip.rating}</span>
          </div>
        </div>
      )}
      <div style={{
        position:"absolute", top:10, right:10,
        background:"rgba(10,22,40,0.85)", backdropFilter:"blur(8px)",
        border:`1px solid ${C.border}`, borderRadius:8,
        padding:"6px 10px", fontSize:11, color:C.muted,
      }}>
        📍 {listings.length} skills nearby
      </div>
    </div>
  );
}

// ── LISTING CARD ─────────────────────────────────────────────────────────────
function ListingCard({ l, onClick, compact }) {
  return (
    <div onClick={() => onClick(l)} style={{
      background:C.card, border:`1px solid ${C.border}`,
      borderRadius:14, padding: compact ? "14px" : "18px",
      cursor:"pointer", transition:"all 0.18s",
      display:"flex", flexDirection:"column", gap:8,
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = C.sky; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(59,155,244,0.12)"; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{
          width:42, height:42, borderRadius:12, flexShrink:0,
          background:`${l.color}22`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:20,
        }}>{l.emoji}</div>
        <span style={{
          fontSize:11, fontWeight:600, letterSpacing:"0.06em",
          padding:"3px 8px", borderRadius:100,
          background: l.type==="offer" ? "rgba(34,197,94,0.15)" : "rgba(59,155,244,0.15)",
          color: l.type==="offer" ? C.success : C.sky,
        }}>{l.type === "offer" ? "OFFERING" : "SEEKING"}</span>
      </div>
      <div>
        <div style={{ fontWeight:700, fontSize:compact?13:15, color:C.white, lineHeight:1.3 }}>{l.skill}</div>
        <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{l.area}</div>
      </div>
      {!compact && <div style={{ fontSize:13, color:"#8AAEC8", lineHeight:1.5 }}>{l.desc}</div>}
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <Stars rating={l.rating} size={12} />
        <span style={{ fontSize:12, color:C.gold, fontWeight:600 }}>{l.rating}</span>
      </div>
      <div style={{ fontSize:12, color:C.accent, fontWeight:500 }}>{l.exchange}</div>
    </div>
  );
}

function Modal({ listing, onClose }) {
  if (!listing) return null;
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)",
      zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20,
    }} onClick={onClose}>
      <div style={{
        background:C.navy2, border:`1px solid ${C.border}`, borderRadius:18,
        maxWidth:520, width:"100%", maxHeight:"85vh", overflowY:"auto",
        padding:28, position:"relative",
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{
          position:"absolute", top:14, right:14, background:"transparent",
          border:"none", color:C.muted, fontSize:22, cursor:"pointer", lineHeight:1,
        }}>×</button>

        <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:20 }}>
          <div style={{
            width:56, height:56, borderRadius:14,
            background:`${listing.color}22`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:26,
          }}>{listing.emoji}</div>
          <div>
            <div style={{ fontWeight:800, fontSize:20, color:C.white }}>{listing.skill}</div>
            <div style={{ color:C.muted, fontSize:13 }}>{listing.area}</div>
          </div>
        </div>

        <p style={{ color:"#8AAEC8", fontSize:14, lineHeight:1.65, marginBottom:18 }}>{listing.desc}</p>

        <div style={{ display:"flex", gap:16, marginBottom:20, flexWrap:"wrap" }}>
          <div style={{ background:C.navy3, borderRadius:10, padding:"10px 16px", flex:1 }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>RATING</div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <Stars rating={listing.rating} size={14} />
              <span style={{ fontWeight:700, color:C.gold }}>{listing.rating}</span>
            </div>
          </div>
          <div style={{ background:C.navy3, borderRadius:10, padding:"10px 16px", flex:1 }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>CATEGORY</div>
            <div style={{ fontWeight:700, color:C.white }}>{listing.cat}</div>
          </div>
          <div style={{ background:C.navy3, borderRadius:10, padding:"10px 16px", flex:1 }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>AREA</div>
            <div style={{ fontWeight:700, color:C.white }}>{listing.area}</div>
          </div>
        </div>

        <div style={{ background:C.navy3, borderRadius:10, padding:"12px 16px", marginBottom:24 }}>
          <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>EXCHANGE PROPOSAL</div>
          <div style={{ fontWeight:600, color:C.accent }}>{listing.exchange}</div>
        </div>

        <button style={{
          width:"100%", padding:"13px", borderRadius:12, border:"none",
          background:`linear-gradient(135deg, ${C.blue} 0%, ${C.sky} 100%)`,
          color:"#fff", fontWeight:700, fontSize:15, cursor:"pointer",
          fontFamily:"Inter, sans-serif",
        }}>
          💬 Propose an Exchange
        </button>
      </div>
    </div>
  );
}

// ── LOGIN PAGE ────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (tab === "signup" && !name) { setError("Please enter your name."); return; }
    onLogin(name || email.split("@")[0]);
  }

  return (
    <div style={{
      minHeight:"100vh", background:`linear-gradient(135deg, ${C.navy} 0%, ${C.navy3} 100%)`,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20,
      position:"relative", overflow:"hidden",
    }}>
      {/* Background rings */}
      {[260,420,580].map((r,i) => (
        <div key={i} style={{
          position:"absolute", width:r*2, height:r*2,
          border:`1px solid rgba(59,155,244,${0.06 - i*0.015})`,
          borderRadius:"50%", top:"50%", left:"50%",
          transform:"translate(-50%,-50%)",
          pointerEvents:"none",
        }} />
      ))}

      <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:1 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{
            display:"inline-flex", alignItems:"center", justifyContent:"center",
            width:56, height:56, borderRadius:16,
            background:`linear-gradient(135deg, ${C.blue} 0%, ${C.sky} 100%)`,
            marginBottom:14, boxShadow:`0 0 30px rgba(59,155,244,0.4)`,
          }}>
            <span style={{ fontSize:26 }}>⟷</span>
          </div>
          <h1 style={{
            fontFamily:"Georgia, serif", fontSize:28, fontWeight:800,
            color:C.white, letterSpacing:"-0.02em", margin:0,
          }}>SkillSwap</h1>
          <p style={{ color:C.muted, fontSize:13, marginTop:6 }}>Trade skills with your neighbors</p>
        </div>

        {/* Card */}
        <div style={{
          background:"rgba(13,31,60,0.85)", backdropFilter:"blur(12px)",
          border:`1px solid ${C.border}`, borderRadius:20, padding:32,
          boxShadow:"0 24px 60px rgba(0,0,0,0.5)",
        }}>
          {/* Tabs */}
          <div style={{ display:"flex", background:C.navy, borderRadius:10, padding:4, marginBottom:24 }}>
            {["login","signup"].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(""); }} style={{
                flex:1, padding:"8px", border:"none", cursor:"pointer",
                borderRadius:8, fontWeight:600, fontSize:13, transition:"all 0.15s",
                background: tab === t ? `linear-gradient(135deg, ${C.blue} 0%, ${C.sky} 100%)` : "transparent",
                color: tab === t ? "#fff" : C.muted,
              }}>
                {t === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {tab === "signup" && (
              <div>
                <label style={{ display:"block", fontSize:12, color:C.muted, marginBottom:5, fontWeight:500 }}>Full name</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  style={{
                    width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${C.border}`,
                    background:C.navy, color:C.white, fontSize:14, outline:"none",
                    fontFamily:"Inter, sans-serif", boxSizing:"border-box",
                  }}
                  onFocus={e => e.target.style.borderColor = C.sky}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
            )}
            <div>
              <label style={{ display:"block", fontSize:12, color:C.muted, marginBottom:5, fontWeight:500 }}>Email address</label>
              <input value={email} onChange={e => setEmail(e.target.value)}
                type="email" placeholder="you@example.com"
                style={{
                  width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${C.border}`,
                  background:C.navy, color:C.white, fontSize:14, outline:"none",
                  fontFamily:"Inter, sans-serif", boxSizing:"border-box",
                }}
                onFocus={e => e.target.style.borderColor = C.sky}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>
            <div>
              <label style={{ display:"block", fontSize:12, color:C.muted, marginBottom:5, fontWeight:500 }}>Password</label>
              <input value={password} onChange={e => setPassword(e.target.value)}
                type="password" placeholder="••••••••"
                style={{
                  width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${C.border}`,
                  background:C.navy, color:C.white, fontSize:14, outline:"none",
                  fontFamily:"Inter, sans-serif", boxSizing:"border-box",
                }}
                onFocus={e => e.target.style.borderColor = C.sky}
                onBlur={e => e.target.style.borderColor = C.border}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
            </div>
          </div>

          {error && (
            <div style={{ marginTop:12, padding:"8px 12px", borderRadius:8, background:"rgba(239,68,68,0.15)", color:"#FCA5A5", fontSize:12 }}>
              {error}
            </div>
          )}

          <button onClick={handleSubmit} style={{
            width:"100%", marginTop:20, padding:"13px",
            borderRadius:12, border:"none", cursor:"pointer", fontWeight:700,
            fontSize:15, color:"#fff", fontFamily:"Inter, sans-serif",
            background:`linear-gradient(135deg, ${C.blue} 0%, ${C.sky} 100%)`,
            boxShadow:`0 4px 20px rgba(59,155,244,0.35)`, transition:"transform 0.15s",
          }}
          onMouseEnter={e => e.target.style.transform = "translateY(-1px)"}
          onMouseLeave={e => e.target.style.transform = ""}>
            {tab === "login" ? "Sign in →" : "Create account →"}
          </button>

          <div style={{ marginTop:16, display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ flex:1, height:1, background:C.border }} />
            <span style={{ color:C.muted, fontSize:11 }}>or continue with</span>
            <div style={{ flex:1, height:1, background:C.border }} />
          </div>

          <div style={{ display:"flex", gap:10, marginTop:14 }}>
            {["Google","GitHub"].map(p => (
              <button key={p} onClick={() => onLogin("Demo User")} style={{
                flex:1, padding:"9px", borderRadius:10, border:`1px solid ${C.border}`,
                background:"transparent", color:C.muted, fontSize:13, cursor:"pointer",
                fontFamily:"Inter, sans-serif", transition:"all 0.15s",
              }}
              onMouseEnter={e => { e.target.style.borderColor = C.sky; e.target.style.color = C.white; }}
              onMouseLeave={e => { e.target.style.borderColor = C.border; e.target.style.color = C.muted; }}>
                {p === "Google" ? "🌐" : "🐙"} {p}
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign:"center", color:C.muted, fontSize:11, marginTop:20 }}>
          No money. No subscriptions. Just neighbors helping neighbors.
        </p>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("home");        // home | map | profile
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedListing, setSelectedListing] = useState(null);
  const [mapSelected, setMapSelected] = useState(null);

  if (!user) return <LoginPage onLogin={name => setUser(name)} />;

  const filtered = LISTINGS.filter(l =>
    (cat === "All" || l.cat === cat) &&
    (search === "" || l.skill.toLowerCase().includes(search.toLowerCase()) ||
     l.name.toLowerCase().includes(search.toLowerCase()))
  );

  const avgRating = (LISTINGS.reduce((a,l) => a+l.rating, 0) / LISTINGS.length).toFixed(1);

  return (
    <div style={{ minHeight:"100vh", background:C.navy, color:C.white, fontFamily:"Inter, system-ui, sans-serif" }}>

      {/* NAV */}
      <nav style={{
        position:"sticky", top:0, zIndex:100, height:58,
        background:"rgba(10,22,40,0.92)", backdropFilter:"blur(12px)",
        borderBottom:`1px solid ${C.border}`,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 24px",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:28 }}>
          <div style={{
            fontFamily:"Georgia, serif", fontSize:18, fontWeight:800,
            color:C.white, letterSpacing:"-0.01em",
          }}>
            Skill<span style={{ color:C.sky }}>Swap</span>
          </div>
          <div style={{ display:"flex", gap:4 }}>
            {[["home","Browse"],["map","Map View"],["profile","My Profile"]].map(([v,label]) => (
              <button key={v} onClick={() => setView(v)} style={{
                background: view===v ? `rgba(59,155,244,0.15)` : "transparent",
                border: view===v ? `1px solid rgba(59,155,244,0.3)` : "1px solid transparent",
                color: view===v ? C.sky : C.muted,
                padding:"5px 14px", borderRadius:8,
                fontSize:13, fontWeight:500, cursor:"pointer",
                fontFamily:"Inter, sans-serif", transition:"all 0.15s",
              }}>{label}</button>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button style={{
            background:`linear-gradient(135deg, ${C.blue} 0%, ${C.sky} 100%)`,
            border:"none", color:"#fff", padding:"7px 16px",
            borderRadius:100, fontSize:13, fontWeight:600, cursor:"pointer",
            fontFamily:"Inter, sans-serif",
          }}>+ Offer a Skill</button>
          <div style={{
            width:32, height:32, borderRadius:50,
            background:`linear-gradient(135deg, ${C.blue}, ${C.accent})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:13, fontWeight:700, cursor:"pointer",
          }}>{user[0].toUpperCase()}</div>
        </div>
      </nav>

      {/* HOME VIEW */}
      {view === "home" && (
        <main style={{ maxWidth:1160, margin:"0 auto", padding:"28px 24px" }}>

          {/* Hero */}
          <div style={{
            background:`linear-gradient(135deg, ${C.navy2} 0%, ${C.navy3} 100%)`,
            border:`1px solid ${C.border}`, borderRadius:20, padding:"36px 40px",
            marginBottom:28, position:"relative", overflow:"hidden",
          }}>
            <div style={{ position:"absolute", right:-20, top:-20, width:300, height:300,
              background:`radial-gradient(circle, rgba(59,155,244,0.1) 0%, transparent 70%)`,
              pointerEvents:"none" }} />
            <p style={{ fontSize:12, color:C.sky, fontWeight:600, letterSpacing:"0.1em", marginBottom:8 }}>YOUR NEIGHBORHOOD, CONNECTED</p>
            <h1 style={{ fontFamily:"Georgia, serif", fontSize:"clamp(28px,4vw,42px)", fontWeight:800,
              lineHeight:1.1, letterSpacing:"-0.02em", margin:"0 0 12px" }}>
              Trade skills,<br /><span style={{ color:C.sky, fontStyle:"italic" }}>not money.</span>
            </h1>
            <p style={{ color:C.muted, fontSize:15, maxWidth:460, lineHeight:1.65, marginBottom:24 }}>
              Learn guitar in exchange for web help. Fix a fence for cooking lessons. Connect with neighbors who share what they know.
            </p>
            <div style={{ display:"flex", gap:40, flexWrap:"wrap" }}>
              {[["1,240","Skills offered"],["387","Active neighbors"],[avgRating,"Avg. rating"],["94","Exchanges this month"]].map(([n,l]) => (
                <div key={l}>
                  <div style={{ fontFamily:"Georgia,serif", fontSize:26, fontWeight:700, color:C.sky }}>{n}</div>
                  <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Search + Filter */}
          <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search skills, names…"
              style={{
                flex:"1 1 240px", padding:"10px 16px", borderRadius:10,
                border:`1px solid ${C.border}`, background:C.card,
                color:C.white, fontSize:14, outline:"none",
                fontFamily:"Inter, sans-serif",
              }}
              onFocus={e => e.target.style.borderColor = C.sky}
              onBlur={e => e.target.style.borderColor = C.border}
            />
            <button onClick={() => setView("map")} style={{
              padding:"10px 18px", borderRadius:10, border:`1px solid ${C.border}`,
              background:C.card, color:C.muted, fontSize:13, cursor:"pointer",
              fontFamily:"Inter, sans-serif",
            }}>🗺 Map View</button>
          </div>

          <div style={{ display:"flex", gap:6, marginBottom:20, flexWrap:"wrap" }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{
                padding:"5px 14px", borderRadius:100, fontSize:12, fontWeight:500,
                border: cat===c ? "none" : `1px solid ${C.border}`,
                background: cat===c ? `linear-gradient(135deg, ${C.blue}, ${C.sky})` : "transparent",
                color: cat===c ? "#fff" : C.muted,
                cursor:"pointer", fontFamily:"Inter, sans-serif", transition:"all 0.15s",
              }}>{c}</button>
            ))}
          </div>

          {/* Grid */}
          <div style={{ marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <h2 style={{ fontFamily:"Georgia,serif", fontSize:20, fontWeight:700, margin:0 }}>
              {filtered.length} skills {cat !== "All" ? `in ${cat}` : "nearby"}
            </h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:14 }}>
            {filtered.map(l => <ListingCard key={l.id} l={l} onClick={setSelectedListing} />)}
          </div>
        </main>
      )}

      {/* MAP VIEW */}
      {view === "map" && (
        <main style={{ maxWidth:1160, margin:"0 auto", padding:"28px 24px" }}>
          <h2 style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:700, marginBottom:20 }}>Skills near you</h2>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:18, alignItems:"start" }}>
            <div>
              <SkillMap listings={LISTINGS} selected={mapSelected} onSelect={l => { setMapSelected(l); setSelectedListing(l); }} />
              <div style={{ marginTop:14, display:"flex", gap:16, fontSize:12, color:C.muted }}>
                <span>🔵 Tap a marker to see details</span>
                <span>· Showing {LISTINGS.length} skills in 4 neighborhoods</span>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10, maxHeight:380, overflowY:"auto" }}>
              {LISTINGS.map(l => <ListingCard key={l.id} l={l} onClick={l => { setMapSelected(l); setSelectedListing(l); }} compact />)}
            </div>
          </div>
        </main>
      )}

      {view === "profile" && (
        <main style={{ maxWidth:680, margin:"0 auto", padding:"28px 24px" }}>
          <div style={{
            background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:28, marginBottom:20,
            display:"flex", gap:20, alignItems:"center",
          }}>
            <div style={{
              width:72, height:72, borderRadius:50, flexShrink:0,
              background:`linear-gradient(135deg, ${C.blue}, ${C.sky})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:28, fontWeight:800,
            }}>{user[0].toUpperCase()}</div>
            <div>
              <div style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:700 }}>{user}</div>
              <div style={{ color:C.muted, fontSize:13, marginTop:3 }}>Hillside neighborhood · Joined 2026</div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:6 }}>
                <Stars rating={4.9} size={13} />
                <span style={{ fontSize:13, color:C.gold, fontWeight:600 }}>4.9</span>
              </div>
            </div>
            <button style={{
              marginLeft:"auto", padding:"8px 16px", borderRadius:10,
              border:`1px solid ${C.border}`, background:"transparent",
              color:C.muted, fontSize:12, cursor:"pointer", fontFamily:"Inter,sans-serif",
            }}>Edit profile</button>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:20 }}>
            {[["3","Skills offered"],["5","Exchanges done"],["4.9","Avg. rating"]].map(([n,l]) => (
              <div key={l} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px", textAlign:"center" }}>
                <div style={{ fontFamily:"Georgia,serif", fontSize:28, fontWeight:700, color:C.sky }}>{n}</div>
                <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:22, marginBottom:20 }}>
            <h3 style={{ fontFamily:"Georgia,serif", fontSize:17, fontWeight:700, marginBottom:14 }}>My Skills</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {LISTINGS.slice(0,3).map(l => (
                <div key={l.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:C.navy3, borderRadius:10 }}>
                  <span style={{ fontSize:20 }}>{l.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:14, color:C.white }}>{l.skill}</div>
                    <div style={{ fontSize:12, color:C.muted }}>{l.cat} · {l.area}</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <Stars rating={l.rating} size={11} />
                    <span style={{ fontSize:12, color:C.gold }}>{l.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => setUser(null)} style={{
            width:"100%", padding:"11px",
            borderRadius:12, border:`1px solid ${C.border}`,
            background:"transparent", color:C.muted, fontSize:14,
            cursor:"pointer", fontFamily:"Inter,sans-serif",
          }}>Sign out</button>
        </main>
      )}

      {/* MODAL */}
      <Modal listing={selectedListing} onClose={() => setSelectedListing(null)} />
    </div>
  );
}
