// Sketchy wireframe primitives — 中くらいスケッチ感
// 整った枠線 + 手書きメモのフォント / 淡いオフセット

const WIRE = {
  ink: '#1f1a16',
  ink2: '#4a423b',
  ink3: '#8a8078',
  paper: '#faf8f3',
  paperAlt: '#f3efe6',
  line: '#2a2420',
  lineSoft: '#cbc2b5',
  accent: '#c96442',   // 赤茶 (YouTubeの赤を和らげた)
  accent2: '#3a7a9b',  // 青
  accent3: '#d9a441',  // 琥珀
  highlight: '#fff2a8',
};

const fontHand = '"Kalam", "Comic Sans MS", "Segoe Print", cursive';
const fontUI = '"Kalam", "Inter", system-ui, sans-serif';
const fontMono = '"JetBrains Mono", "Courier New", monospace';

// ── shape helpers ────────────────────────────────────────────
const Box = ({ children, style, dashed, soft, thick, bg, onClick }) => (
  <div onClick={onClick} style={{
    border: `${thick ? 2 : 1.2}px ${dashed ? 'dashed' : 'solid'} ${soft ? WIRE.lineSoft : WIRE.line}`,
    borderRadius: 4,
    background: bg || 'transparent',
    padding: 10,
    fontFamily: fontUI,
    color: WIRE.ink,
    ...style,
  }}>{children}</div>
);

const Hand = ({ children, style, size = 14, color }) => (
  <span style={{ fontFamily: fontHand, fontSize: size, color: color || WIRE.ink, ...style }}>{children}</span>
);

// text placeholder — 3 wavy lines
const Lines = ({ n = 3, width = '100%', gap = 6, color, style }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap, ...style }}>
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} style={{
        height: 6, borderRadius: 3,
        width: typeof width === 'string' ? width : width - (i === n - 1 ? 40 : 0),
        background: `repeating-linear-gradient(90deg, ${color || WIRE.lineSoft} 0 8px, transparent 8px 10px)`,
      }} />
    ))}
  </div>
);

// rectangle with diagonal "image" slashes
const ImgBox = ({ w = '100%', h = 80, label = 'IMG', style }) => (
  <div style={{
    width: w, height: h, border: `1.2px solid ${WIRE.line}`, borderRadius: 4,
    background: `repeating-linear-gradient(135deg, ${WIRE.paperAlt} 0 10px, transparent 10px 20px)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: fontMono, fontSize: 10, color: WIRE.ink3, letterSpacing: 0.5,
    position: 'relative', ...style,
  }}>
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="none">
      <line x1="0" y1="0" x2="100%" y2="100%" stroke={WIRE.lineSoft} strokeWidth="1" />
      <line x1="100%" y1="0" x2="0" y2="100%" stroke={WIRE.lineSoft} strokeWidth="1" />
    </svg>
    <span style={{ position: 'relative', background: WIRE.paper, padding: '2px 6px' }}>{label}</span>
  </div>
);

// pill button
const Btn = ({ children, primary, ghost, small, style, onClick }) => (
  <button onClick={onClick} style={{
    border: `1.2px solid ${primary ? WIRE.accent : WIRE.line}`,
    background: primary ? WIRE.accent : (ghost ? 'transparent' : WIRE.paper),
    color: primary ? '#fff' : WIRE.ink,
    borderRadius: 20, padding: small ? '3px 10px' : '6px 14px',
    fontFamily: fontUI, fontSize: small ? 11 : 13, fontWeight: 500,
    cursor: 'pointer', ...style,
  }}>{children}</button>
);

// input field
const Field = ({ label, value, w = '100%', h = 28, multiline, lines = 3, hint }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: w }}>
    {label && <div style={{ fontFamily: fontUI, fontSize: 11, color: WIRE.ink2, fontWeight: 500 }}>{label}</div>}
    <div style={{
      border: `1.2px solid ${WIRE.lineSoft}`, borderRadius: 4,
      height: multiline ? undefined : h,
      minHeight: multiline ? lines * 16 + 12 : undefined,
      padding: multiline ? 8 : '4px 8px',
      display: 'flex', alignItems: multiline ? 'flex-start' : 'center',
      fontFamily: value ? fontHand : fontUI,
      fontSize: 12, color: value ? WIRE.ink : WIRE.ink3,
      background: '#fff',
    }}>
      {value || <span style={{ fontFamily: fontUI, fontSize: 11, color: WIRE.ink3 }}>{hint || ''}</span>}
    </div>
  </div>
);

// tiny icon glyph — a square with an X or plus etc
const IconGlyph = ({ kind = 'menu', size = 18, color }) => {
  const c = color || WIRE.ink;
  const s = size;
  const stroke = { stroke: c, strokeWidth: 1.5, strokeLinecap: 'round', fill: 'none' };
  const paths = {
    menu: <><line x1="3" y1="6" x2="15" y2="6" {...stroke}/><line x1="3" y1="10" x2="15" y2="10" {...stroke}/><line x1="3" y1="14" x2="15" y2="14" {...stroke}/></>,
    search: <><circle cx="8" cy="8" r="4" {...stroke}/><line x1="11" y1="11" x2="15" y2="15" {...stroke}/></>,
    plus: <><line x1="9" y1="3" x2="9" y2="15" {...stroke}/><line x1="3" y1="9" x2="15" y2="9" {...stroke}/></>,
    user: <><circle cx="9" cy="6" r="3" {...stroke}/><path d="M3 16c1-3 4-4 6-4s5 1 6 4" {...stroke}/></>,
    home: <><path d="M3 9l6-5 6 5v6H3z" {...stroke}/></>,
    doc: <><path d="M4 2h7l3 3v11H4z" {...stroke}/><path d="M11 2v3h3" {...stroke}/></>,
    flow: <><circle cx="4" cy="9" r="2" {...stroke}/><circle cx="14" cy="5" r="2" {...stroke}/><circle cx="14" cy="13" r="2" {...stroke}/><line x1="6" y1="9" x2="12" y2="5" {...stroke}/><line x1="6" y1="9" x2="12" y2="13" {...stroke}/></>,
    settings: <><circle cx="9" cy="9" r="2.5" {...stroke}/><path d="M9 2v2M9 14v2M2 9h2M14 9h2M4 4l1.5 1.5M13.5 13.5L15 15M4 14l1.5-1.5M13.5 4.5L15 3" {...stroke}/></>,
    sparkle: <><path d="M9 2l1.5 5.5L16 9l-5.5 1.5L9 16l-1.5-5.5L2 9l5.5-1.5z" {...stroke}/></>,
    chevron: <><path d="M6 4l5 5-5 5" {...stroke}/></>,
    close: <><line x1="4" y1="4" x2="14" y2="14" {...stroke}/><line x1="14" y1="4" x2="4" y2="14" {...stroke}/></>,
    dots: <><circle cx="5" cy="9" r="1.2" fill={c}/><circle cx="9" cy="9" r="1.2" fill={c}/><circle cx="13" cy="9" r="1.2" fill={c}/></>,
    grid: <><rect x="3" y="3" width="5" height="5" {...stroke}/><rect x="10" y="3" width="5" height="5" {...stroke}/><rect x="3" y="10" width="5" height="5" {...stroke}/><rect x="10" y="10" width="5" height="5" {...stroke}/></>,
    list: <><line x1="3" y1="5" x2="15" y2="5" {...stroke}/><line x1="3" y1="9" x2="15" y2="9" {...stroke}/><line x1="3" y1="13" x2="15" y2="13" {...stroke}/></>,
    star: <><path d="M9 2l2 5 5 .5-4 3.5 1 5-4-2.5-4 2.5 1-5-4-3.5 5-.5z" {...stroke}/></>,
    heart: <><path d="M9 15c-4-3-6-5-6-8a3 3 0 016-1 3 3 0 016 1c0 3-2 5-6 8z" {...stroke}/></>,
    edit: <><path d="M3 15l3-1 8-8-2-2-8 8z" {...stroke}/></>,
    trash: <><path d="M4 6h10M7 6V4h4v2M5 6l1 9h6l1-9" {...stroke}/></>,
    arrow: <><path d="M3 9h12M10 4l5 5-5 5" {...stroke}/></>,
    save: <><path d="M3 3h10l2 2v10H3z M5 3v4h6V3 M5 11h8" {...stroke}/></>,
    zoom: <><circle cx="8" cy="8" r="4" {...stroke}/><line x1="6" y1="8" x2="10" y2="8" {...stroke}/><line x1="8" y1="6" x2="8" y2="10" {...stroke}/><line x1="11" y1="11" x2="15" y2="15" {...stroke}/></>,
    bell: <><path d="M4 13h10l-1-3V7a4 4 0 00-8 0v3z M7 13v1a2 2 0 004 0v-1" {...stroke}/></>,
  };
  return <svg width={s} height={s} viewBox="0 0 18 18">{paths[kind] || paths.menu}</svg>;
};

// sketchy arrow
const Arrow = ({ from = [0, 0], to = [100, 0], label, color, curve = 0, dashed }) => {
  const [x1, y1] = from, [x2, y2] = to;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + curve;
  const c = color || WIRE.ink2;
  return (
    <g>
      <path d={`M${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} stroke={c} strokeWidth="1.4" fill="none"
        strokeDasharray={dashed ? '4 3' : undefined} />
      <path d={`M${x2} ${y2} L ${x2 - 7} ${y2 - 4} M${x2} ${y2} L ${x2 - 7} ${y2 + 4}`} stroke={c} strokeWidth="1.4" fill="none" />
      {label && <text x={mx} y={my - 6} textAnchor="middle" fontFamily={fontHand} fontSize="11" fill={c}>{label}</text>}
    </g>
  );
};

// chrome: サイドバー + ヘッダー (YouTube風)
const Chrome = ({ active = 'home', collapsed = false, children, headerTitle, headerRight }) => {
  const navItems = [
    { id: 'home', label: 'ホーム', icon: 'home' },
    { id: 'char', label: 'キャラクター', icon: 'user' },
    { id: 'scenario', label: 'シナリオ', icon: 'doc' },
    { id: 'relation', label: '相関図', icon: 'flow' },
    { id: 'settings', label: '設定', icon: 'settings' },
  ];
  const sbW = collapsed ? 56 : 180;
  return (
    <div style={{ width: '100%', height: '100%', background: WIRE.paper, color: WIRE.ink, fontFamily: fontUI, display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <div style={{
        height: 44, borderBottom: `1.2px solid ${WIRE.lineSoft}`, display: 'flex',
        alignItems: 'center', padding: '0 14px', gap: 12, background: WIRE.paper, flexShrink: 0,
      }}>
        <IconGlyph kind="menu" size={18} />
        <div style={{ fontFamily: fontHand, fontSize: 18, fontWeight: 600, color: WIRE.ink, letterSpacing: 0.2 }}>
          <span style={{ color: WIRE.accent }}>▶</span> PlotMaker
        </div>
        <div style={{ flex: 1 }} />
        {headerTitle && <div style={{ fontSize: 12, color: WIRE.ink2, fontFamily: fontHand }}>{headerTitle}</div>}
        <div style={{ flex: 1 }} />
        {headerRight || (
          <>
            <div style={{ display: 'flex', alignItems: 'center', border: `1.2px solid ${WIRE.lineSoft}`, borderRadius: 20, padding: '3px 10px', gap: 6, width: 180 }}>
              <IconGlyph kind="search" size={13} color={WIRE.ink3} />
              <span style={{ fontSize: 11, color: WIRE.ink3 }}>検索…</span>
            </div>
            <IconGlyph kind="bell" size={16} color={WIRE.ink2} />
            <div style={{ width: 24, height: 24, borderRadius: 12, background: WIRE.paperAlt, border: `1px solid ${WIRE.lineSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: WIRE.ink2 }}>You</div>
          </>
        )}
      </div>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* sidebar */}
        <div style={{
          width: sbW, borderRight: `1.2px solid ${WIRE.lineSoft}`,
          padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0,
          background: WIRE.paper,
        }}>
          {navItems.map(it => {
            const sel = it.id === active;
            return (
              <div key={it.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '10px 0' : '8px 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 6,
                background: sel ? WIRE.paperAlt : 'transparent',
                fontWeight: sel ? 600 : 400,
                color: sel ? WIRE.ink : WIRE.ink2,
                fontSize: 12,
              }}>
                <IconGlyph kind={it.icon} size={16} color={sel ? WIRE.accent : WIRE.ink2} />
                {!collapsed && <span>{it.label}</span>}
              </div>
            );
          })}
          {!collapsed && (
            <>
              <div style={{ height: 1, background: WIRE.lineSoft, margin: '10px 6px' }} />
              <div style={{ fontSize: 10, color: WIRE.ink3, padding: '4px 10px', letterSpacing: 0.5 }}>最近のシナリオ</div>
              {['夏の終わり', '赤い回廊', '無題 v3'].map((s, i) => (
                <div key={i} style={{ padding: '6px 10px', fontSize: 11, color: WIRE.ink2, borderRadius: 6 }}>· {s}</div>
              ))}
            </>
          )}
        </div>
        {/* content */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', position: 'relative' }}>{children}</div>
      </div>
    </div>
  );
};

// small note card — sticky-note style, for margin-of-sketch commentary
const Note = ({ children, style, color = WIRE.highlight, rotate = -1 }) => (
  <div style={{
    background: color, padding: '6px 10px', fontFamily: fontHand, fontSize: 12,
    color: WIRE.ink, boxShadow: '0 1px 2px rgba(0,0,0,.1)', transform: `rotate(${rotate}deg)`,
    maxWidth: 180, lineHeight: 1.3, ...style,
  }}>{children}</div>
);

Object.assign(window, { WIRE, fontHand, fontUI, fontMono, Box, Hand, Lines, ImgBox, Btn, Field, IconGlyph, Arrow, Chrome, Note });
