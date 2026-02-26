"use client";

import { useState, useEffect, useCallback } from "react";

const CURRENCIES = ["USD", "ARS", "VES", "CLP", "COP"];
const FLAGS = { USD: "🇺🇸", ARS: "🇦🇷", VES: "🇻🇪", CLP: "🇨🇱", COP: "🇨🇴" };
const NAMES = { USD: "Dólar", ARS: "Peso Arg.", VES: "Bolívar", CLP: "Peso Chi.", COP: "Peso Col." };

const QUICK_PAIRS = [
  ["USD", "ARS"], ["USD", "VES"],
  ["USD", "CLP"], ["USD", "COP"],
  ["ARS", "COP"], ["ARS", "CLP"],
];

function formatNum(n) {
  if (isNaN(n) || n === null) return "";
  if (n === 0) return "0";
  if (n >= 1000) return n.toLocaleString("es", { maximumFractionDigits: 2 });
  if (n >= 1) return n.toLocaleString("es", { maximumFractionDigits: 4 });
  return n.toLocaleString("es", { maximumFractionDigits: 6 });
}

export default function App() {
  const [rates, setRates] = useState({});
  const [fromCur, setFromCur] = useState("USD");
  const [toCur, setToCur] = useState("ARS");
  const [fromVal, setFromVal] = useState("1");
  const [toVal, setToVal] = useState("");
  const [status, setStatus] = useState("loading"); // loading | live | error
  const [statusMsg, setStatusMsg] = useState("Cargando tasas...");
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchRates = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("https://api.yadio.io/exrates/USD");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const usdRates = data.USD ?? data;
      const newRates = { USD: 1 };
      for (const cur of CURRENCIES) {
        if (cur !== "USD" && usdRates[cur]) newRates[cur] = usdRates[cur];
      }
      setRates(newRates);
      const now = new Date();
      setLastUpdate(now);
      setStatus("live");
      setStatusMsg("Actualizado · " + now.toLocaleTimeString("es"));
    } catch (e) {
      setStatus("error");
      setStatusMsg("Error: " + e.message);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    const t = setInterval(fetchRates, 60000);
    return () => clearInterval(t);
  }, [fetchRates]);

  // Recalculate toVal when rates/fromVal/fromCur/toCur change
  useEffect(() => {
    if (!rates[fromCur] || !rates[toCur]) return;
    const n = parseFloat(fromVal);
    if (isNaN(n)) { setToVal(""); return; }
    setToVal(formatNum((n / rates[fromCur]) * rates[toCur]));
  }, [rates, fromCur, toCur, fromVal]);

  const handleFromChange = (v) => {
    setFromVal(v);
    if (!rates[fromCur] || !rates[toCur]) return;
    const n = parseFloat(v);
    setToVal(isNaN(n) ? "" : formatNum((n / rates[fromCur]) * rates[toCur]));
  };

  const handleToChange = (v) => {
    setToVal(v);
    if (!rates[fromCur] || !rates[toCur]) return;
    const n = parseFloat(v.replace(/\./g, "").replace(",", "."));
    setFromVal(isNaN(n) ? "" : formatNum((n / rates[toCur]) * rates[fromCur]));
  };

  const swap = () => {
    setFromCur(toCur);
    setToCur(fromCur);
    setFromVal(toVal.replace(/\./g, "").replace(",", ".") || "1");
  };

  const applyPair = (a, b) => {
    setFromCur(a);
    setToCur(b);
    setFromVal("1");
  };

  const statusColor = { loading: "#888", live: "#3ddc84", error: "#e05a2b" }[status];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#e8e8f0",
    }}>
      {/* Glow bg */}
      <div style={{ position: "fixed", top: "-30%", left: "-10%", width: "60%", height: "60%",
        background: "radial-gradient(ellipse, rgba(240,192,64,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-20%", right: "-10%", width: "50%", height: "50%",
        background: "radial-gradient(ellipse, rgba(224,90,43,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <h1 style={{
          fontSize: "clamp(2.2rem, 6vw, 3.5rem)",
          fontWeight: 800,
          letterSpacing: "-2px",
          background: "linear-gradient(135deg, #f0c040, #e05a2b)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          margin: 0,
        }}>Cambio</h1>
        <p style={{ fontFamily: "monospace", fontSize: "0.65rem", color: "#555570",
          letterSpacing: "3px", textTransform: "uppercase", marginTop: 6 }}>
          Tasas de mercado libre · Yadio.io
        </p>
      </div>

      {/* Main Card */}
      <div style={{
        background: "#111118",
        border: "1px solid #1e1e2e",
        borderRadius: 16,
        padding: 28,
        width: "100%",
        maxWidth: 480,
        boxShadow: "0 0 40px rgba(0,0,0,0.5)",
      }}>
        {/* FROM */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#555570",
            letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
            Monto
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="number"
              value={fromVal}
              onChange={e => handleFromChange(e.target.value)}
              style={{
                flex: 1, background: "#0a0a0f", border: "1px solid #1e1e2e",
                borderRadius: 10, padding: "13px 14px", color: "#e8e8f0",
                fontFamily: "monospace", fontSize: "1.3rem", fontWeight: 700,
                outline: "none", minWidth: 0,
              }}
              onFocus={e => e.target.style.borderColor = "#f0c040"}
              onBlur={e => e.target.style.borderColor = "#1e1e2e"}
            />
            <CurrencySelect value={fromCur} onChange={v => setFromCur(v)} />
          </div>
        </div>

        {/* Swap */}
        <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
          <button
            onClick={swap}
            style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "#1e1e2e", border: "1px solid #2a2a3e",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#555570", transition: "all 0.2s", fontSize: 16,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(240,192,64,0.15)"; e.currentTarget.style.color = "#f0c040"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#1e1e2e"; e.currentTarget.style.color = "#555570"; }}
            title="Intercambiar"
          >⇅</button>
        </div>

        {/* TO */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#555570",
            letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
            Resultado
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="number"
              value={toVal}
              onChange={e => handleToChange(e.target.value)}
              style={{
                flex: 1, background: "#0a0a0f", border: "1px solid #1e1e2e",
                borderRadius: 10, padding: "13px 14px",
                color: "#3ddc84",
                fontFamily: "monospace", fontSize: "1.3rem", fontWeight: 700,
                outline: "none", minWidth: 0,
              }}
              onFocus={e => e.target.style.borderColor = "#3ddc84"}
              onBlur={e => e.target.style.borderColor = "#1e1e2e"}
            />
            <CurrencySelect value={toCur} onChange={v => setToCur(v)} />
          </div>
        </div>

        {/* Rate hint */}
        {rates[fromCur] && rates[toCur] && (
          <div style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#555570",
            background: "#0a0a0f", borderRadius: 8, padding: "8px 12px", marginBottom: 16, textAlign: "center" }}>
            1 {fromCur} = {formatNum(rates[toCur] / rates[fromCur])} {toCur}
          </div>
        )}

        {/* Status */}
        <div style={{ display: "flex", alignItems: "center", gap: 8,
          fontFamily: "monospace", fontSize: "0.62rem", color: "#555570", letterSpacing: "1px" }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
            background: statusColor,
            boxShadow: status === "live" ? `0 0 6px ${statusColor}` : "none",
          }} />
          <span>{statusMsg}</span>
          {status === "loading" && (
            <div style={{
              width: 12, height: 12, border: "2px solid #1e1e2e",
              borderTopColor: "#f0c040", borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }} />
          )}
          {status === "error" && (
            <button onClick={fetchRates}
              style={{ marginLeft: "auto", background: "none", border: "1px solid #e05a2b",
                color: "#e05a2b", borderRadius: 6, padding: "2px 8px", cursor: "pointer",
                fontFamily: "monospace", fontSize: "0.6rem" }}>
              Reintentar
            </button>
          )}
        </div>
      </div>

      {/* Quick rate chips */}
      {Object.keys(rates).length > 0 && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8, width: "100%", maxWidth: 480, marginTop: 12,
        }}>
          {QUICK_PAIRS.map(([a, b]) => (
            <button key={a + b} onClick={() => applyPair(a, b)}
              style={{
                background: "#111118", border: "1px solid #1e1e2e",
                borderRadius: 10, padding: "11px 10px", cursor: "pointer",
                textAlign: "left", transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(240,192,64,0.35)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e2e"; e.currentTarget.style.transform = "none"; }}
            >
              <div style={{ fontFamily: "monospace", fontSize: "0.58rem", color: "#555570",
                letterSpacing: "1px", marginBottom: 3 }}>
                {FLAGS[a]} {a} → {FLAGS[b]} {b}
              </div>
              <div style={{ fontFamily: "monospace", fontSize: "0.82rem",
                fontWeight: 700, color: "#e8e8f0" }}>
                {rates[a] && rates[b] ? formatNum(rates[b] / rates[a]) : "—"}
              </div>
            </button>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function CurrencySelect({ value, onChange }) {
  const CURRENCIES = ["USD", "ARS", "VES", "CLP", "COP"];
  const FLAGS = { USD: "🇺🇸", ARS: "🇦🇷", VES: "🇻🇪", CLP: "🇨🇱", COP: "🇨🇴" };
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: "#0a0a0f", border: "1px solid #1e1e2e",
        borderRadius: 10, padding: "13px 12px",
        color: "#e8e8f0", fontFamily: "monospace", fontSize: "0.85rem",
        fontWeight: 700, outline: "none", cursor: "pointer",
        minWidth: 88,
      }}
    >
      {CURRENCIES.map(c => (
        <option key={c} value={c}>{FLAGS[c]} {c}</option>
      ))}
    </select>
  );
}
