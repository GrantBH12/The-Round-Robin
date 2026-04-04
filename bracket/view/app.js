const { useState, useEffect } = React;
const DATA_URL = "https://theroundrobin.studio/teams.json";
const MY_BRACKET_URL = "https://theroundrobin.studio/my-bracket.json";
const SEEDS = Array.from({ length: 16 }, (_, i) => ({ id: `seed${i + 1}`, label: `${i + 1}`, num: i + 1, max: i === 10 || i === 15 ? 6 : 4 }));
const EXTRA_TIERS = [
  { id: "ffo", label: "First Four Out", ac: "#8B4444", acLight: "#C0392B" },
  { id: "nfo", label: "Next Four Out", ac: "#6B3A3A", acLight: "#A93226" },
  { id: "ac", label: "Also Considered", ac: "#555B6E", acLight: "#3D4F6E" }
];
const SEED_COLORS = ["#E8872B", "#D97A28", "#C06128", "#A84E26", "#4A6FA5", "#3D5E8C", "#3D5E8C", "#304D73", "#304D73", "#2A4060", "#2A4060", "#7A5A3A", "#7A5A3A", "#606060", "#606060", "#505050"];
const SEED_COLORS_LIGHT = ["#E8872B", "#D97A28", "#B05520", "#9A4020", "#3A5C90", "#305080", "#305080", "#26426A", "#26426A", "#1E3458", "#1E3458", "#6B4A2A", "#6B4A2A", "#484848", "#484848", "#383838"];
const savedTheme = (() => {
  try {
    return localStorage.getItem("bracketology-theme");
  } catch (e) {
    return null;
  }
})();
const initDark = savedTheme ? savedTheme === "dark" : true;
if (!initDark) document.documentElement.classList.add("light");
const _params = new URLSearchParams(window.location.search);
const B_PARAM = _params.get("b");
const PROJECTION = _params.get("projection");
const BRACKET_NAME = _params.get("name") || "";
if (!B_PARAM && PROJECTION !== "current") {
  window.location.replace("/bracket/");
}
function ViewTeamCard({ t, darkMode }) {
  if (!t) return null;
  return /* @__PURE__ */ React.createElement("div", { style: {
    background: "var(--bg-card)",
    border: "1.5px solid var(--border)",
    borderRadius: 6,
    padding: "5px 8px",
    marginBottom: 3
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 12 } }, t.logo && /* @__PURE__ */ React.createElement("img", { src: t.logo, alt: "", style: { width: 20, height: 20, objectFit: "contain", flexShrink: 0 }, onError: (e) => e.target.style.display = "none" }), /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text-primary)", fontWeight: 600, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 12 } }, t.name), /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text-faint)", fontSize: 9 } }, t.conf), t.record && /* @__PURE__ */ React.createElement("span", { style: { color: "#E8872B", fontSize: 10, fontFamily: "monospace", fontWeight: 600 } }, t.record)));
}
function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
function BracketView({ teams, bracket, lastUpdated, darkMode }) {
  const tm = {};
  teams.forEach((t) => tm[t.id] = t);
  const seedColors = darkMode ? SEED_COLORS : SEED_COLORS_LIGHT;
  const formattedDate = formatDate(lastUpdated);
  const totalPlaced = SEEDS.reduce((n, s) => {
    var _a;
    return n + (((_a = bracket[s.id]) == null ? void 0 : _a.length) || 0);
  }, 0);
  return /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "'Segoe UI','Inter',system-ui,sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement("a", { href: "/", style: { display: "flex", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("img", { src: "../../assets/img/logo-01.png", alt: "The Round Robin", style: { height: 44, width: "auto", objectFit: "contain", flexShrink: 0, background: "#003368", borderRadius: 6, padding: "2px 6px" } })), /* @__PURE__ */ React.createElement("div", null, BRACKET_NAME && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 } }, "Shared bracket"), /* @__PURE__ */ React.createElement("h1", { style: { margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", background: "linear-gradient(135deg,#E8872B,#F0A855)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } }, BRACKET_NAME || "The Nest: Bracketology Studio"), /* @__PURE__ */ React.createElement("p", { style: { margin: "2px 0 0", fontSize: 10, color: "var(--text-faint)" } }, totalPlaced, " teams placed \xB7 read-only"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 } }, formattedDate && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--text-secondary)", fontWeight: 600, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 5, padding: "4px 10px" } }, "Last updated: ", formattedDate), /* @__PURE__ */ React.createElement("a", { href: "/bracket/", style: { background: "linear-gradient(135deg,#E8872B,#F0A855)", border: "none", borderRadius: 5, color: "#fff", fontSize: 12, fontWeight: 700, padding: "8px 16px", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", letterSpacing: "0.03em" } }, "Open The Nest: Bracketology Studio \u2192"))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "12px 18px 24px" } }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 960, margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" } }, "Bracket Seedlines"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "var(--text-faint)" } }, totalPlaced, " / 68 placed")), SEEDS.map((seed, si) => {
    const ids = bracket[seed.id] || [];
    const color = seedColors[si];
    const emptyCount = seed.max - ids.length;
    const isFull = ids.length >= seed.max;
    const slotFlex = seed.max === 6 && ids.length > 4 ? "0 0 calc(25% - 2px)" : "1";
    return /* @__PURE__ */ React.createElement("div", { key: seed.id, style: { marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "stretch", gap: 8, minHeight: 40 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 30, minWidth: 30, borderRadius: 5, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", alignSelf: "stretch", minHeight: 40 } }, seed.num), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexWrap: "wrap", gap: 2, minHeight: 40, borderRadius: 6, padding: "2px 4px", border: "1px solid transparent" } }, ids.map((id) => /* @__PURE__ */ React.createElement("div", { key: id, style: { flex: slotFlex, minWidth: 120 } }, /* @__PURE__ */ React.createElement(ViewTeamCard, { t: tm[id], darkMode }))), emptyCount > 0 && Array.from({ length: emptyCount }).map((_, i) => /* @__PURE__ */ React.createElement("div", { key: `e-${i}`, style: { flex: slotFlex, minWidth: 120, height: 34, borderRadius: 5, border: `1px dashed ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: `${color}66`, margin: 1 } }))), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, color: isFull ? "#E85555" : "var(--text-faint)", minWidth: 20, textAlign: "right", alignSelf: "center" } }, ids.length, "/", seed.max)));
  }), /* @__PURE__ */ React.createElement("div", { style: { height: 1, background: "var(--border)", margin: "12px 0" } }), EXTRA_TIERS.map((tier) => {
    const ids = bracket[tier.id] || [];
    const tierColor = darkMode ? tier.ac : tier.acLight;
    return /* @__PURE__ */ React.createElement("div", { key: tier.id, style: { marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 4, height: 14, borderRadius: 2, background: tierColor } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: tierColor } }, tier.label), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, color: "var(--text-faint)" } }, "(", ids.length, ")")), /* @__PURE__ */ React.createElement("div", { style: { minHeight: 28, borderRadius: 6, padding: "2px 4px", border: `1px dashed var(--border)` } }, ids.length === 0 ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "var(--text-ghost)", padding: "4px 8px" } }, "\u2014") : ids.map((id) => /* @__PURE__ */ React.createElement(ViewTeamCard, { key: id, t: tm[id], darkMode }))));
  }), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)", textAlign: "center" } }, /* @__PURE__ */ React.createElement("p", { style: { color: "var(--text-faint)", fontSize: 12, marginBottom: 12 } }, "Want to build your own bracket with full resume data?"), /* @__PURE__ */ React.createElement("a", { href: "/bracket/", style: { background: "linear-gradient(135deg,#E8872B,#F0A855)", borderRadius: 6, color: "#fff", fontSize: 14, fontWeight: 700, padding: "10px 24px", textDecoration: "none", letterSpacing: "0.03em" } }, "Open The Nest: Bracketology Studio \u2192")))));
}
function LoadingScreen() {
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: "var(--bg-page)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", fontFamily: "'Segoe UI','Inter',system-ui,sans-serif" } }, /* @__PURE__ */ React.createElement("h1", { style: { fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", background: "linear-gradient(135deg,#E8872B,#F0A855)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } }, "The Bracketology Nest"), /* @__PURE__ */ React.createElement("p", { style: { color: "var(--text-faint)", fontSize: 13, marginTop: 8 } }, "Loading bracket..."));
}
function ErrorScreen({ error }) {
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: "var(--bg-page)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", fontFamily: "'Segoe UI','Inter',system-ui,sans-serif" } }, /* @__PURE__ */ React.createElement("h1", { style: { fontSize: 20, color: "var(--accent-red)", marginBottom: 8 } }, "Could not load bracket"), /* @__PURE__ */ React.createElement("p", { style: { color: "var(--text-faint)", fontSize: 12, marginBottom: 16 } }, error), /* @__PURE__ */ React.createElement("a", { href: "/bracket/", style: { background: "#E8872B", borderRadius: 6, color: "#fff", fontSize: 13, padding: "8px 20px", textDecoration: "none" } }, "Go to The Nest: Bracketology Studio"));
}
function Root() {
  const [state, setState] = useState({ status: "loading", teams: null, bracket: null, lastUpdated: null, error: null });
  const darkMode = initDark;
  useEffect(() => {
    let cancelled = false;
    fetch(DATA_URL).then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then((data) => {
      if (cancelled) return;
      const teams = data.teams;
      if (B_PARAM) {
        try {
          const decompressed = LZString.decompressFromEncodedURIComponent(B_PARAM);
          if (!decompressed) throw new Error("Could not decompress bracket data.");
          const bracket = JSON.parse(decompressed);
          setState({ status: "ready", teams, bracket, lastUpdated: null, error: null });
        } catch (e) {
          setState({ status: "error", teams: null, bracket: null, lastUpdated: null, error: "Invalid bracket link." });
        }
      } else {
        fetch(MY_BRACKET_URL).then((r) => {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        }).then((myData) => {
          if (cancelled) return;
          setState({ status: "ready", teams, bracket: myData.bracket, lastUpdated: myData.lastUpdated, error: null });
        }).catch((e) => {
          if (cancelled) return;
          setState({ status: "error", teams: null, bracket: null, lastUpdated: null, error: "Could not load current bracket projection." });
        });
      }
    }).catch((e) => {
      if (cancelled) return;
      setState({ status: "error", teams: null, bracket: null, lastUpdated: null, error: "Could not load team data." });
    });
    return () => {
      cancelled = true;
    };
  }, []);
  if (state.status === "loading") return /* @__PURE__ */ React.createElement(LoadingScreen, null);
  if (state.status === "error") return /* @__PURE__ */ React.createElement(ErrorScreen, { error: state.error });
  return /* @__PURE__ */ React.createElement(BracketView, { teams: state.teams, bracket: state.bracket, lastUpdated: state.lastUpdated, darkMode });
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ React.createElement(Root, null));
