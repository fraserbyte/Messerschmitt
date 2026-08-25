import { useRef, useState } from "react";
import carOutline from "./outline.jpg";
import carMask from "./outline-mask.png";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, LabelList, PieChart, Pie, Cell
} from "recharts";

const MODEL_DATA = [
  { name: "Deluxe", value: 3028 },
  { name: "Roadster", value: 138 },
  { name: "Standard", value: 5 },
  { name: "Sport", value: 3 },
  { name: "Deluxe (tow bar)", value: 3 },
];

const TYPE_DATA = [
  { name: "KR200", value: 3042 },
  { name: "KR201", value: 134 },
  { name: "Tg500", value: 26 },
  { name: "KR200 Cabrio", value: 1 },
];

// Chassis types broken down by franchise (dealer) so the chart can be filtered.
// Franchise is only ever recorded for Testwood Motors on the surviving invoices.
const TYPE_FRANCHISE_DATA = {
  All: [...TYPE_DATA],
  Testwood: [
    { name: "KR200", value: 82 },
    { name: "KR201", value: 7 },
    { name: "Tg500", value: 1 },
  ],
};
const TYPE_FRANCHISES = ["All", "Testwood"];

// Two-tone entries are recorded on the invoice as "primary / secondary" colour;
// any name containing a "/" is split and marked "Two tone" in the legend below.
// Single colours keep their rank so the two shades of red sit together centrally.
const COLOUR_DATA = [
  { name: "Blue", value: 403, hex: "#3A5C82" },
  { name: "Aero Silver", value: 394, hex: "#B7BAB8" },
  { name: "Yellow", value: 384, hex: "#D9A83B" },
  { name: "Black", value: 157, hex: "#2A2A28" },
  { name: "Red", value: 643, hex: "#B7332B" },
  { name: "Monza Red", value: 219, hex: "#8C2A22" },
  { name: "White", value: 136, hex: "#E9E6DD" },
  { name: "Green", value: 121, hex: "#4C6B4F" },
  { name: "Grey", value: 109, hex: "#8B8B85" },
  { name: "Ivory/Red", value: 102, hex: "#EFE7D3", hex2: "#B7332B" },
  { name: "Grey/Grey", value: 88, hex: "#8B8B85", hex2: "#C4C4BF" },
  { name: "Blue/Blue", value: 86, hex: "#3A5C82", hex2: "#7D9DC0" },
  { name: "Grey/Blue", value: 65, hex: "#8B8B85", hex2: "#3A5C82" },
  { name: "Red/Red", value: 58, hex: "#B7332B", hex2: "#D0635A" },
  { name: "Green/Green", value: 46, hex: "#4C6B4F", hex2: "#6E8F73" },
  { name: "Beige/Coral", value: 43, hex: "#D9C4A9", hex2: "#D98A76" },
];

const YEAR_DATA = [
  { year: "1956", value: 18 },
  { year: "1957", value: 542 },
  { year: "1958", value: 464 },
  { year: "1959", value: 1112 },
  { year: "1960", value: 631 },
  { year: "1961", value: 240 },
  { year: "1962", value: 96 },
  { year: "1963", value: 37 },
  { year: "1964", value: 18 },
];

const SHIP_DATA = [
  { name: "Rail", value: 1938, icon: "🚂" },
  { name: "Air", value: 844, icon: "✈️" },
  { name: "Unspecified", value: 268, icon: "❓" },
  { name: "Other", value: 82, icon: "📦" },
  { name: "Sea", value: 54, icon: "🚢" },
];

// Where each car entered the UK — the destination town named on the invoice,
// grouped by import method so the chart can be filtered. (Origins like
// "from Calais" are deliberately excluded.)
const ENTRY_DATA = {
  All: [
    { name: "Southend", value: 222 },
    { name: "Ship — port not stated", value: 127 },
    { name: "Harwich", value: 98 },
    { name: "Plymouth", value: 30 },
    { name: "Leeds", value: 24 },
    { name: "London Airport", value: 24 },
    { name: "Leighton Buzzard", value: 12 },
    { name: "Gatwick", value: 8 },
    { name: "Ipswich", value: 6 },
    { name: "Brighton", value: 6 },
    { name: "Northampton", value: 4 },
    { name: "Glasgow", value: 4 },
    { name: "Mansfield", value: 4 },
    { name: "Nottingham", value: 4 },
  ],
  Rail: [
    { name: "Harwich", value: 98 },
    { name: "Plymouth", value: 30 },
    { name: "Leeds", value: 24 },
    { name: "Leighton Buzzard", value: 12 },
    { name: "Ipswich", value: 6 },
    { name: "Brighton", value: 6 },
    { name: "Northampton", value: 4 },
    { name: "Glasgow", value: 4 },
    { name: "Nottingham", value: 4 },
  ],
  Air: [
    { name: "Southend", value: 222 },
    { name: "London Airport", value: 24 },
    { name: "Gatwick", value: 8 },
  ],
  Sea: [{ name: "Ship — port not stated", value: 127 }],
  Unspecified: [{ name: "Mansfield", value: 4 }],
};

// Per-method count of invoices that recorded no entry town (not shown as bars).
const ENTRY_NOT_STATED = { All: 2609, Rail: 1750, Air: 590, Sea: 0, Unspecified: 269 };
const ENTRY_METHODS = ["All", "Rail", "Air", "Sea", "Unspecified"];

// Outline image geometry (src/outline.jpg is 1024 x 531; car spans x 38..1001)
const CAR_LEFT = 38;
const CAR_RIGHT = 1001;
const CAR_WIDTH = CAR_RIGHT - CAR_LEFT;
const CAR_ASPECT = "1024 / 531";

// Dotted fill for the "Other colours" segment — distinct from the diagonal
// stripes used for two-tone colours, so the misc bucket doesn't blend in.
const OTHER_PATTERN = "#E4DFCF radial-gradient(circle, #B7BAB8 1.6px, transparent 2.6px) 0 0/9px 9px";

// Fill for a colour segment: solid for single colours, a diagonal stripe of
// both shades for two-tone entries, hatching for the "Other colours" bucket.
function colourFill(c) {
  if (c.pattern) return OTHER_PATTERN;
  if (c.twoTone) {
    return `repeating-linear-gradient(45deg, ${c.hex} 0 6px, ${c.hex2} 6px 12px)`;
  }
  return c.hex;
}

// Same stripe treatment for two-tone entries inside the "Other colours" pie:
// SVG pattern ids referenced by the pie slices, and CSS stripes for the swatches.
const otherPatternId = (name) => `other-stripe-${name.replace(/[^A-Za-z0-9]/g, "")}`;
function otherFill(c) {
  if (!c.name.includes("/")) return c.hex;
  return `url(#${otherPatternId(c.name)})`;
}

const COLOUR_TOTAL = 3186;
const COLOUR_NAMED_SUM = COLOUR_DATA.reduce((s, c) => s + c.value, 0);

// Mark any "primary/secondary" invoice entry as two-tone, and split it into
// its two named halves so the graphic can render/label it as such.
function withTwoTone(c) {
  if (!c.name.includes("/")) return c;
  const [primary, secondary] = c.name.split("/").map((s) => s.trim());
  return { ...c, twoTone: true, primary, secondary };
}

const COLOUR_SEGMENTS = [
  ...COLOUR_DATA.map(withTwoTone),
  { name: "Other colours", value: COLOUR_TOTAL - COLOUR_NAMED_SUM, hex: null, pattern: true },
];

// Breakdown of the "Other colours" segment — hues too small to earn their own
// bar in the car graphic. Two-tone entries keep their "primary/secondary" slash
// so they stay classified as two-tone. All entries sum to the total.
const OTHER_COLOUR_DATA = [
  { name: "Light Blue", value: 16, hex: "#7E9FB5" },
  { name: "Steel Blue", value: 16, hex: "#5A7896" },
  { name: "Coral", value: 14, hex: "#D98A76" },
  { name: "Polar White", value: 12, hex: "#F4F2EC" },
  { name: "Special White", value: 12, hex: "#E9E6DD" },
  { name: "Sun Yellow", value: 9, hex: "#E3B93E" },
  { name: "Rose", value: 8, hex: "#E8A2A6" },
  { name: "Turkish Green", value: 7, hex: "#3E7A6B" },
  { name: "Beige", value: 6, hex: "#D9C4A9" },
  { name: "Platinum Grey", value: 6, hex: "#C4C4BF" },
  { name: "Strato Silver", value: 5, hex: "#A9A9A5" },
  { name: "Ruby Red", value: 4, hex: "#5B1F28" },
  { name: "Unrecorded", value: 3, hex: "#E4DFCF" },
  { name: "Iris Blue", value: 3, hex: "#6A7FA8" },
  { name: "Blue/White", value: 3, hex: "#3A5C82", hex2: "#E9E6DD" },
  { name: "Reed/Red", value: 2, hex: "#C9A96A", hex2: "#B7332B" },
  { name: "Coral Red", value: 1, hex: "#C75A4A" },
  { name: "Graphite", value: 1, hex: "#4A4A47" },
  { name: "Maroon", value: 1, hex: "#6E2430" },
  { name: "Black/Lizard", value: 1, hex: "#2A2A28", hex2: "#5E7A42" },
  { name: "Aero Silver/Iris Blue", value: 1, hex: "#B7BAB8", hex2: "#6A7FA8" },
  { name: "Cream", value: 1, hex: "#E8DCC2" },
];
const OTHER_COLOUR_TOTAL = OTHER_COLOUR_DATA.reduce((s, c) => s + c.value, 0);

const INK = "#2A2A28";
const CREAM = "#F1ECE0";
const PANEL = "#FAF7EF";
const RIVET = "#C9C2AC";
const ACCENT = "#B7332B";
const ACCENT2 = "#3A5C82";

function Panel({ title, eyebrow, children, className = "" }) {
  return (
    <div
      className={`bg-white/70 ${className}`}
      style={{
        border: `1px solid ${RIVET}`,
        borderRadius: "2px",
        boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
        padding: "20px 20px 12px",
      }}
    >
      {(eyebrow || title) && (
        <div className="flex items-baseline justify-between mb-3">
          <div>
            {eyebrow && (
              <div
                className="text-[10px] tracking-[0.18em] uppercase mb-1"
                style={{ color: ACCENT, fontFamily: "'Arial Narrow', Arial, sans-serif", fontWeight: 700 }}
              >
                {eyebrow}
              </div>
            )}
            {title && (
              <h3
                className="text-lg"
                style={{ color: INK, fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700 }}
              >
                {title}
              </h3>
            )}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: INK,
        color: CREAM,
        padding: "6px 10px",
        fontSize: "12px",
        fontFamily: "'Arial Narrow', Arial, sans-serif",
        borderRadius: "2px",
      }}
    >
      <div>{label ?? payload[0].name}</div>
      <div style={{ fontWeight: 700 }}>{payload[0].value.toLocaleString()} cars</div>
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: INK,
        color: CREAM,
        padding: "6px 10px",
        fontSize: "12px",
        fontFamily: "'Arial Narrow', Arial, sans-serif",
        borderRadius: "2px",
      }}
    >
      <div>{payload[0].name}</div>
      <div style={{ fontWeight: 700 }}>{payload[0].value.toLocaleString()} cars</div>
    </div>
  );
}

export default function App() {
  const [hoverColour, setHoverColour] = useState(null);
  const [entryMethod, setEntryMethod] = useState("All");
  const [typeFranchise, setTypeFranchise] = useState("All");
  // Small grace period so the "Other colours" popover doesn't flicker as the
  // pointer moves between the car segment, the legend, and the popover itself.
  const otherTimer = useRef(null);
  const enterColour = (name) => {
    if (otherTimer.current) clearTimeout(otherTimer.current);
    setHoverColour(name);
  };
  const leaveColour = () => {
    if (otherTimer.current) clearTimeout(otherTimer.current);
    otherTimer.current = setTimeout(() => setHoverColour(null), 150);
  };

  return (
    <div
      style={{
        background: CREAM,
        minHeight: "100%",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        color: INK,
      }}
      className="w-full"
    >
      {/* Header / hero */}
      <div
        style={{
          borderBottom: `3px solid ${INK}`,
          background: `repeating-linear-gradient(135deg, ${PANEL}, ${PANEL} 22px, #EFE9DA 22px, #EFE9DA 24px)`,
        }}
        className="px-6 sm:px-10 py-8"
      >
        <div className="flex items-center gap-2 mb-2">
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: ACCENT }} />
          <span
            className="text-xs tracking-[0.25em] uppercase"
            style={{ fontFamily: "'Arial Narrow', Arial, sans-serif", fontWeight: 700, color: ACCENT }}
          >
            Messerschmitt Foundation of Great Britain &middot; Chassis Register
          </span>
        </div>
        <h1
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontWeight: 700,
            color: INK,
            fontSize: "clamp(28px, 4.5vw, 44px)",
            letterSpacing: "-0.01em",
            lineHeight: 1.05,
          }}
        >
          3,186 KR200s, traced from the invoice book
        </h1>
        <p className="mt-3 max-w-2xl text-sm sm:text-base" style={{ color: "#55524A" }}>
          Every chassis, engine and colour code the MFGB has on file, drawn from original dealer
          invoices dated 1956&ndash;1964. Nine in ten are Deluxe models finished in one of ten core
          colourways, the vast majority shipped from the factory by rail.
        </p>
        <div className="flex flex-wrap gap-6 mt-6">
          {[
            ["3,186", "Cars on record"],
            ["95%", "Are the Deluxe"],
            ["1959", "Peak invoice year"],
            ["5", "Documented types"],
          ].map(([big, small]) => (
            <div key={small}>
              <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: "26px", color: ACCENT }}>
                {big}
              </div>
              <div className="text-[11px] uppercase tracking-wide" style={{ color: "#7A776D" }}>
                {small}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 sm:px-10 py-8 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Model split */}
        <Panel title="MODELS">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MODEL_DATA} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={RIVET} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#7A776D" }} axisLine={{ stroke: RIVET }} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 12, fill: INK }}
                axisLine={{ stroke: RIVET }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(183,51,43,0.06)" }} />
              <Bar dataKey="value" fill={ACCENT} radius={[0, 2, 2, 0]} barSize={18}>
                <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: INK }} formatter={(v) => v.toLocaleString()} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs mt-1" style={{ color: "#7A776D" }}>
            Only 3 genuine Sport-model KR200s are on record &mdash; 67 cars previously logged as
            &ldquo;Sport&rdquo; have been reclassified as Deluxe. The Standard was a base trim built
            without a heater or upholstery.
          </p>
        </Panel>

        {/* Type split */}
        <Panel eyebrow="Chassis type">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {TYPE_FRANCHISES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setTypeFranchise(m)}
                style={{
                  fontFamily: "'Arial Narrow', Arial, sans-serif",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "3px 10px",
                  borderRadius: 2,
                  cursor: "pointer",
                  background: typeFranchise === m ? ACCENT : "transparent",
                  color: typeFranchise === m ? CREAM : INK,
                  border: `1px solid ${typeFranchise === m ? ACCENT : INK}`,
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
              >
                {m}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={[...TYPE_FRANCHISE_DATA[typeFranchise]].sort((a, b) => a.value - b.value)}
              layout="vertical"
              margin={{ left: 8, right: 36, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="2 4" stroke={RIVET} horizontal={false} />
              <XAxis
                type="number"
                scale="log"
                domain={[1, 4000]}
                allowDataOverflow
                tick={{ fontSize: 11, fill: "#7A776D" }}
                axisLine={{ stroke: RIVET }}
                tickLine={false}
                ticks={[1, 10, 100, 1000]}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 12, fill: INK }}
                axisLine={{ stroke: RIVET }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(183,51,43,0.06)" }} />
              <Bar dataKey="value" fill={ACCENT} radius={[0, 2, 2, 0]} barSize={18}>
                <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: INK }} formatter={(v) => v.toLocaleString()} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs mt-1" style={{ color: "#7A776D" }}>
            {typeFranchise === "All" ? (
              <>Log scale &mdash; otherwise the single KR200 Cabrio and 26 Tg500s would vanish next to 3,042 KR200s.
                Invoices exist for only 8 of the Tg500s, imported through Cabin Scooters; the rest passed
                through other franchised dealers such as Testwood, who kept no surviving invoices. Cabrio
                variants, introduced in 1958, were never recorded on invoices either, so no date survives to
                identify factory-original cars.</>
            ) : (
              <>These 90 cars are the only ones on record invoiced through Testwood Motors, a franchised
                dealer with its own separate FMR agreement. Franchise is never recorded for the rest of the
                register.</>
            )}
          </p>
        </Panel>

        {/* Year timeline */}
        <Panel eyebrow="Year entered the UK" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={YEAR_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 4 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={RIVET} vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#7A776D" }} axisLine={{ stroke: RIVET }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#7A776D" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={ACCENT2}
                strokeWidth={2.5}
                dot={{ r: 4, fill: ACCENT2, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        {/* Shipping */}
        <Panel eyebrow="Logistics">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={SHIP_DATA} margin={{ top: 28, right: 16, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={RIVET} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#7A776D" }} axisLine={{ stroke: RIVET }} tickLine={false} interval={0} angle={-12} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: "#7A776D" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(58,92,130,0.06)" }} />
              <Bar dataKey="value" fill={ACCENT2} radius={[2, 2, 0, 0]} barSize={34}>
                <LabelList dataKey="icon" position="top" style={{ fontSize: 20 }} offset={8} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        {/* Where the cars entered the UK */}
        <Panel eyebrow="Entry point">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {ENTRY_METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setEntryMethod(m)}
                style={{
                  fontFamily: "'Arial Narrow', Arial, sans-serif",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "3px 10px",
                  borderRadius: 2,
                  cursor: "pointer",
                  background: entryMethod === m ? ACCENT : "transparent",
                  color: entryMethod === m ? CREAM : INK,
                  border: `1px solid ${entryMethod === m ? ACCENT : INK}`,
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
              >
                {m}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={Math.max(140, ENTRY_DATA[entryMethod].length * 20 + 40)}>
            <BarChart data={ENTRY_DATA[entryMethod]} layout="vertical" margin={{ left: 8, right: 34, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={RIVET} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#7A776D" }} axisLine={{ stroke: RIVET }} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                interval={0}
                tick={{ fontSize: 12, fill: INK }}
                axisLine={{ stroke: RIVET }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(183,51,43,0.06)" }} />
              <Bar dataKey="value" fill={ACCENT} radius={[0, 2, 2, 0]} barSize={15}>
                <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: INK }} formatter={(v) => v.toLocaleString()} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs mt-1" style={{ color: "#7A776D" }}>
            {entryMethod === "All" ? (
              <>Only 446 invoices name an entry town &mdash; 2,609 recorded no destination,
                127 more arrived by named ship with no UK port recorded, and 4 were exports
                shipped overseas rather than imports.</>
            ) : entryMethod === "Sea" ? (
              <>All 127 sea imports arrived by named ship; the UK port wasn&rsquo;t recorded on the invoices.</>
            ) : (
              <>{ENTRY_DATA[entryMethod].reduce((s, d) => s + d.value, 0).toLocaleString()} of{" "}
                {(ENTRY_DATA[entryMethod].reduce((s, d) => s + d.value, 0) + ENTRY_NOT_STATED[entryMethod]).toLocaleString()}{" "}
                {entryMethod.toLowerCase()} imports name an entry town;{" "}
                {ENTRY_NOT_STATED[entryMethod].toLocaleString()} recorded no destination.</>
            )}
          </p>
        </Panel>

        {/* Generic Car Profile */}
        <Panel eyebrow="Colourway" className="lg:col-span-2">
          {(() => {
            let cum = CAR_LEFT;
            const segments = COLOUR_SEGMENTS.map((c) => {
              const width = (c.value / COLOUR_TOTAL) * CAR_WIDTH;
              const seg = {
                ...c,
                x: cum,
                width,
                leftPct: (cum / 1024) * 100,
                widthPct: (width / 1024) * 100,
              };
              cum += width;
              return seg;
            });
            return (
              <>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "relative",
                      isolation: "isolate",
                      width: "100%",
                      aspectRatio: CAR_ASPECT,
                    WebkitMaskImage: `url(${carMask})`,
                    maskImage: `url(${carMask})`,
                    WebkitMaskSize: "100% 100%",
                    maskSize: "100% 100%",
                    maskRepeat: "no-repeat",
                  }}
                >
                  {/* Colour fill, clipped to the car silhouette */}
                  {segments.map((s) => {
                    const dim = hoverColour && hoverColour !== s.name;
                    return (
                      <div
                        key={s.name}
                        style={{
                          position: "absolute",
                          top: 0,
                          bottom: 0,
                          left: `${s.leftPct}%`,
                          width: `${s.widthPct}%`,
                          background: colourFill(s),
                          opacity: dim ? 0.3 : 1,
                          transition: "opacity 0.15s ease",
                          cursor: "default",
                        }}
                        onMouseEnter={() => enterColour(s.name)}
                        onMouseLeave={leaveColour}
                      />
                    );
                  })}

                  {/* Outline drawing on top: white multiplies away, ink stays black.
                      pointerEvents none so hovers reach the colour segments beneath. */}
                  <img
                    src={carOutline}
                    alt="Messerschmitt outline"
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      mixBlendMode: "multiply",
                      display: "block",
                      pointerEvents: "none",
                    }}
                  />
                </div>

                  {/* Pie breakdown of "Other colours", centred over the car
                      while the other colour segments grey out beneath it */}
                  {hoverColour === "Other colours" && (
                    <div
                      onMouseEnter={() => enterColour("Other colours")}
                      onMouseLeave={leaveColour}
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 30,
                        width: 360,
                        maxWidth: "calc(100vw - 24px)",
                        background: PANEL,
                        border: `1px solid ${INK}`,
                        borderRadius: "2px",
                        boxShadow: "0 10px 30px rgba(42,42,40,0.22)",
                        padding: "12px 14px 10px",
                      }}
                    >
                      <div className="flex items-baseline justify-between mb-1">
                            <span
                              style={{
                                fontFamily: "Georgia, 'Times New Roman', serif",
                                fontWeight: 700,
                                fontSize: 13,
                                color: INK,
                              }}
                            >
                              Other colours
                            </span>
                            <span style={{ fontSize: 12, color: "#948F81" }}>
                              {OTHER_COLOUR_TOTAL.toLocaleString()} cars &middot;{" "}
                              {((OTHER_COLOUR_TOTAL / COLOUR_TOTAL) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                              <defs>
                                {OTHER_COLOUR_DATA.filter((c) => c.name.includes("/")).map((c) => (
                                  <pattern
                                    key={c.name}
                                    id={otherPatternId(c.name)}
                                    width={8}
                                    height={8}
                                    patternUnits="userSpaceOnUse"
                                    patternTransform="rotate(45)"
                                  >
                                    <rect width={4} height={8} fill={c.hex} />
                                    <rect x={4} width={4} height={8} fill={c.hex2} />
                                  </pattern>
                                ))}
                              </defs>
                              <Pie
                                data={OTHER_COLOUR_DATA}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={105}
                                paddingAngle={1}
                                stroke={PANEL}
                                strokeWidth={1}
                              >
                                {OTHER_COLOUR_DATA.map((c) => (
                                  <Cell key={c.name} fill={otherFill(c)} />
                                ))}
                              </Pie>
                              <Tooltip content={<PieTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1">
                            {OTHER_COLOUR_DATA.map((c) => (
                              <div
                                key={c.name}
                                className="flex items-center gap-1.5 text-xs"
                                style={{ color: INK }}
                              >
                                <span
                                  style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: "50%",
                                    background: c.name.includes("/")
                                      ? `repeating-linear-gradient(45deg, ${c.hex} 0 6px, ${c.hex2} 6px 12px)`
                                      : c.hex,
                                    border: `1px solid ${INK}`,
                                    display: "inline-block",
                                    flexShrink: 0,
                                  }}
                                />
                                <span style={{ whiteSpace: "nowrap" }}>{c.name}</span>
                                <span style={{ marginLeft: "auto", color: "#948F81", whiteSpace: "nowrap" }}>
                                  {c.value}
                                </span>
                              </div>
                            ))}
                          </div>
                      </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 justify-center">
                  {segments.map((s) => {
                    const pct = ((s.value / COLOUR_TOTAL) * 100).toFixed(1);
                    const active = hoverColour === s.name;
                    return (
                      <div
                        key={s.name}
                        onMouseEnter={() => enterColour(s.name)}
                        onMouseLeave={leaveColour}
                        className="flex items-center gap-1.5 text-xs cursor-default"
                        style={{ opacity: hoverColour && !active ? 0.45 : 1, transition: "opacity 0.15s ease" }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "2px",
                            background: colourFill(s),
                            border: `1px solid ${INK}`,
                            display: "inline-block",
                          }}
                        />
                        <span style={{ color: INK, fontWeight: active ? 700 : 400 }}>{s.name}</span>
                        {s.twoTone && (
                          <span
                            style={{
                              fontSize: 9,
                              lineHeight: 1,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: ACCENT2,
                              border: `1px solid ${ACCENT2}`,
                              borderRadius: 2,
                              padding: "2px 4px",
                            }}
                          >
                            Two tone
                          </span>
                        )}
                        <span style={{ color: "#948F81" }}>
                          {s.value.toLocaleString()} &middot; {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </Panel>
      </div>

      <div className="px-6 sm:px-10 pb-8 text-[11px]" style={{ color: "#948F81" }}>
        Source: FMR database, MFGB chassis register (3,186 records).
      </div>
    </div>
  );
}
