"use client";

import { useState, useEffect, useCallback } from "react";

const CURRENCIES = {
  USD: { name: "Dólar estadounidense", flag: "🇺🇸", symbol: "$" },
  ARS: { name: "Peso argentino", flag: "🇦🇷", symbol: "$" },
  VES: { name: "Bolívar venezolano", flag: "🇻🇪", symbol: "Bs." },
  CLP: { name: "Peso chileno", flag: "🇨🇱", symbol: "$" },
  COP: { name: "Peso colombiano", flag: "🇨🇴", symbol: "$" },
};

const CURRENCY_CODES = Object.keys(CURRENCIES);

export default function CurrencyCalculator() {
  const [ratesData, setRatesData] = useState({});
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("ARS");
  const [amount, setAmount] = useState("1");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [swapAnim, setSwapAnim] = useState(false);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Mirrors the Python code pattern:
      // responseVES = requests.get('https://api.yadio.io/exrates/VES')
      // responseUSD = requests.get('https://api.yadio.io/exrates/USD')
      // rate = responseVES.json()['VES']['ARS']
      const responses = await Promise.all(
        CURRENCY_CODES.map(code =>
          fetch(`https://api.yadio.io/exrates/${code}`)
            .then(r => {
              if (!r.ok) throw new Error(`Error fetching ${code}`);
              return r.json();
            })
        )
      );

      const data = {};
      CURRENCY_CODES.forEach((code, i) => {
        // response.json()['VES'] → { ARS: x, USD: y, CLP: z, ... }
        data[code] = responses[i][code];
      });

      setRatesData(data);
      setLastUpdate(new Date());
    } catch (e) {
      setError("No se pudieron cargar las tasas. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Direct rate from API: ratesData[from][to]
  // Same as Python: responseVESYadio.json()['VES']['ARS']
  const getDirectRate = (from, to) => {
    if (!ratesData[from] || !ratesData[from][to]) return null;
    return ratesData[from][to];
  };

  const convert = (val, from, to) => {
    if (!val || isNaN(val) || !ratesData[from]) return "";
    if (from === to) return parseFloat(val).toFixed(2);
    const rate = getDirectRate(from, to);
    if (rate === null) return "";
    return (parseFloat(val) * rate).toFixed(2);
  };

  const formatRate = (from, to) => {
    const rate = getDirectRate(from, to);
    if (rate === null) return "—";
    return rate.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  const handleSwap = () => {
    setSwapAnim(true);
    setTimeout(() => {
      setFromCurrency(toCurrency);
      setToCurrency(fromCurrency);
      setSwapAnim(false);
    }, 250);
  };

  const result = convert(amount, fromCurrency, toCurrency);

  const formatNumber = (num) => {
    if (!num || num === "") return "0";
    return Number(num).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0a0a0f 0%, #111128 40%, #1a0a2e 70%, #0d0d1a 100%)",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        top: -100, right: -100, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)",
        bottom: -50, left: -50, pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: 480, position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 40, padding: "8px 20px", marginBottom: 16,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: error ? "#ef4444" : loading ? "#f59e0b" : "#22c55e",
              boxShadow: error ? "0 0 8px #ef4444" : loading ? "0 0 8px #f59e0b" : "0 0 8px #22c55e",
              animation: loading ? "pulse 1.5s infinite" : "none",
            }} />
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase" }}>
              {loading ? "Cargando tasas..." : error ? "Sin conexión" : "En vivo"}
            </span>
          </div>
          <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>
            Calculadora de Cambio
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "8px 0 0" }}>
            Tasas de mercado libre vía Yadio API
          </p>
        </div>

        {/* Main Card */}
        <div style={{
          background: "rgba(255,255,255,0.03)", backdropFilter: "blur(40px)",
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: 24, overflow: "hidden",
        }}>
          {/* FROM */}
          <div style={{ padding: "24px 24px 20px" }}>
            <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12, display: "block" }}>
              Envías
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <CurrencySelector value={fromCurrency} onChange={setFromCurrency} exclude={toCurrency} />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                style={{
                  flex: 1, background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14, padding: "14px 16px",
                  color: "#fff", fontSize: 22, fontWeight: 600,
                  outline: "none", textAlign: "right", transition: "border-color 0.2s",
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                }}
                onFocus={(e) => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>
          </div>

          {/* Swap + Rate */}
          <div style={{ display: "flex", alignItems: "center", padding: "0 24px" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            <button
              onClick={handleSwap}
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 16px",
                transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s",
                transform: swapAnim ? "rotate(180deg) scale(0.9)" : "rotate(0) scale(1)",
                boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 6px 28px rgba(99,102,241,0.6)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.4)"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
            <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
              <span style={{
                color: "rgba(255,255,255,0.3)", fontSize: 12,
                fontFamily: "'SF Mono', 'Fira Code', monospace",
              }}>
                1 {fromCurrency} = {formatRate(fromCurrency, toCurrency)} {toCurrency}
              </span>
            </div>
          </div>

          {/* TO */}
          <div style={{ padding: "20px 24px 24px" }}>
            <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12, display: "block" }}>
              Recibís
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <CurrencySelector value={toCurrency} onChange={setToCurrency} exclude={fromCurrency} />
              <div style={{
                flex: 1, background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14, padding: "14px 16px",
                textAlign: "right", minHeight: 54,
                display: "flex", alignItems: "center", justifyContent: "flex-end",
              }}>
                <span style={{
                  color: result ? "#a5b4fc" : "rgba(255,255,255,0.2)",
                  fontSize: 22, fontWeight: 600,
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                }}>
                  {loading ? "..." : formatNumber(result)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick conversion table */}
        {Object.keys(ratesData).length > 0 && (
          <div style={{
            marginTop: 20, background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 18, padding: 20,
          }}>
            <h3 style={{
              color: "rgba(255,255,255,0.5)", fontSize: 11,
              textTransform: "uppercase", letterSpacing: 1.5,
              margin: "0 0 14px", fontWeight: 500,
            }}>
              {amount || "1"} {fromCurrency} equivale a
            </h3>
            <div style={{ display: "grid", gap: 6 }}>
              {CURRENCY_CODES.filter(c => c !== fromCurrency).map(code => {
                const converted = convert(amount || "1", fromCurrency, code);
                return (
                  <div key={code} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 14px", borderRadius: 12,
                    background: code === toCurrency ? "rgba(99,102,241,0.08)" : "transparent",
                    border: code === toCurrency ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                    onClick={() => setToCurrency(code)}
                    onMouseEnter={(e) => {
                      if (code !== toCurrency) e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = code === toCurrency ? "rgba(99,102,241,0.08)" : "transparent";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{CURRENCIES[code].flag}</span>
                      <div>
                        <span style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>{code}</span>
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginLeft: 8 }}>
                          {CURRENCIES[code].name}
                        </span>
                      </div>
                    </div>
                    <span style={{
                      color: code === toCurrency ? "#a5b4fc" : "rgba(255,255,255,0.6)",
                      fontSize: 14, fontWeight: 600,
                      fontFamily: "'SF Mono', 'Fira Code', monospace",
                    }}>
                      {CURRENCIES[code].symbol} {formatNumber(converted)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* API source info */}
        {Object.keys(ratesData).length > 0 && (
          <div style={{
            marginTop: 12, background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 18, padding: "16px 20px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                Tasa directa
              </span>
              <span style={{
                color: "rgba(255,255,255,0.7)", fontSize: 13,
                fontFamily: "'SF Mono', 'Fira Code', monospace",
              }}>
                exrates/{fromCurrency} → [{toCurrency}] = {formatRate(fromCurrency, toCurrency)}
              </span>
            </div>
          </div>
        )}

        {/* Refresh */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 16, padding: "0 4px",
        }}>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>
            {lastUpdate && `Actualizado: ${lastUpdate.toLocaleTimeString("es-AR")}`}
          </span>
          <button
            onClick={fetchRates}
            disabled={loading}
            style={{
              background: "none", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.4)", fontSize: 11,
              padding: "6px 14px", borderRadius: 20,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s", letterSpacing: 0.5,
              opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
                e.currentTarget.style.color = "#a5b4fc";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "rgba(255,255,255,0.4)";
            }}
          >
            {loading ? "Cargando..." : "↻ Actualizar"}
          </button>
        </div>

        {error && (
          <div style={{
            marginTop: 12, padding: "12px 16px",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 12, color: "#fca5a5", fontSize: 13, textAlign: "center",
          }}>
            {error}
          </div>
        )}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        ::selection { background: rgba(99,102,241,0.3); }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

function CurrencySelector({ value, onChange, exclude }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14, padding: "10px 14px",
          cursor: "pointer", color: "#fff",
          transition: "border-color 0.2s", minWidth: 120,
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
      >
        <span style={{ fontSize: 22 }}>{CURRENCIES[value].flag}</span>
        <span style={{ fontWeight: 600, fontSize: 16 }}>{value}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" style={{
          marginLeft: "auto",
          transform: open ? "rotate(180deg)" : "rotate(0)",
          transition: "transform 0.2s",
        }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0,
            background: "rgba(20,20,40,0.98)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16, padding: 6, zIndex: 20, minWidth: 200,
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}>
            {CURRENCY_CODES.filter(c => c !== exclude).map(code => (
              <button
                key={code}
                onClick={() => { onChange(code); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "10px 12px", border: "none",
                  background: code === value ? "rgba(99,102,241,0.15)" : "transparent",
                  borderRadius: 10, cursor: "pointer", color: "#fff",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (code !== value) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = code === value ? "rgba(99,102,241,0.15)" : "transparent";
                }}
              >
                <span style={{ fontSize: 20 }}>{CURRENCIES[code].flag}</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{code}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{CURRENCIES[code].name}</div>
                </div>
                {code === value && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" style={{ marginLeft: "auto" }}>
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
