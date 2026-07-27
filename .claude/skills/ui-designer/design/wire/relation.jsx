// キャラクター相関図 3案 (React Flow風ノード+エッジ)

// sketchy node
const RFNode = ({ x, y, name, role, color = WIRE.accent, selected, size = 72 }) => (
  <g transform={`translate(${x}, ${y})`}>
    <circle r={size / 2} fill="#fff" stroke={selected ? WIRE.accent : WIRE.line} strokeWidth={selected ? 2 : 1.3} />
    {selected && <circle r={size / 2 + 4} fill="none" stroke={WIRE.accent} strokeWidth="1" strokeDasharray="3 3" />}
    <circle r={size / 2 - 8} fill={WIRE.paperAlt} stroke={WIRE.lineSoft} strokeWidth="1" />
    <text y="4" textAnchor="middle" fontFamily={fontHand} fontSize="16" fontWeight="700" fill={WIRE.ink}>{name}</text>
    <text y={size / 2 + 16} textAnchor="middle" fontFamily={fontUI} fontSize="10" fill={WIRE.ink3}>{role}</text>
    <rect x={-4} y={size / 2 - 2} width="8" height="4" fill="#fff" stroke={WIRE.line} strokeWidth="1" />
  </g>
);

// edge with label
const RFEdge = ({ from, to, label, labelColor, curve = -30, dashed, color = WIRE.ink2, bidirectional }) => {
  const [x1, y1] = from, [x2, y2] = to;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + curve;
  const ang = Math.atan2(y2 - my, x2 - mx);
  const hx = x2 - Math.cos(ang) * 40, hy = y2 - Math.sin(ang) * 40;
  const ang2 = Math.atan2(y1 - my, x1 - mx);
  const hx2 = x1 - Math.cos(ang2) * 40, hy2 = y1 - Math.sin(ang2) * 40;
  return (
    <g>
      <path d={`M${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} stroke={color} strokeWidth="1.5" fill="none" strokeDasharray={dashed ? '5 4' : undefined} />
      <polygon points={`${hx},${hy} ${hx - 8},${hy - 5} ${hx - 8},${hy + 5}`} fill={color} transform={`rotate(${ang * 180 / Math.PI} ${hx} ${hy})`} />
      {bidirectional && (
        <polygon points={`${hx2},${hy2} ${hx2 + 8},${hy2 - 5} ${hx2 + 8},${hy2 + 5}`} fill={color} transform={`rotate(${ang2 * 180 / Math.PI} ${hx2} ${hy2})`} />
      )}
      {label && (
        <g transform={`translate(${mx}, ${my - 6})`}>
          <rect x={-label.length * 4 - 6} y={-12} width={label.length * 8 + 12} height="18" fill="#fff" stroke={labelColor || color} strokeWidth="1" rx="3" />
          <text textAnchor="middle" y="2" fontFamily={fontHand} fontSize="12" fill={labelColor || WIRE.ink}>{label}</text>
        </g>
      )}
    </g>
  );
};

const FlowCanvas = ({ children, title, bg = WIRE.paper }) => (
  <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: bg }}>
    {/* grid */}
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <pattern id="flowgrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill={WIRE.lineSoft} opacity="0.6" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#flowgrid)" />
    </svg>
    {/* controls */}
    <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 4, background: '#fff', border: `1px solid ${WIRE.lineSoft}`, borderRadius: 4, padding: 4, zIndex: 2 }}>
      {['plus', 'zoom', 'grid'].map((k, i) => (
        <div key={i} style={{ padding: 4, borderRadius: 3 }}><IconGlyph kind={k} size={14} color={WIRE.ink2} /></div>
      ))}
    </div>
    {/* minimap */}
    <div style={{ position: 'absolute', bottom: 10, right: 10, width: 120, height: 80, background: '#fff', border: `1px solid ${WIRE.lineSoft}`, borderRadius: 4, zIndex: 2, padding: 4 }}>
      <div style={{ fontSize: 9, color: WIRE.ink3, letterSpacing: 1 }}>MAP</div>
      <div style={{ position: 'relative', width: '100%', height: 56 }}>
        <div style={{ position: 'absolute', width: 16, height: 16, borderRadius: 8, background: WIRE.paperAlt, border: `1px solid ${WIRE.ink3}`, left: 20, top: 6 }} />
        <div style={{ position: 'absolute', width: 16, height: 16, borderRadius: 8, background: WIRE.paperAlt, border: `1px solid ${WIRE.ink3}`, right: 20, top: 6 }} />
        <div style={{ position: 'absolute', width: 16, height: 16, borderRadius: 8, background: WIRE.paperAlt, border: `1px solid ${WIRE.ink3}`, left: '40%', bottom: 4 }} />
        <div style={{ position: 'absolute', inset: 0, border: `1.5px solid ${WIRE.accent}`, borderRadius: 2 }} />
      </div>
    </div>
    {title && <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', fontSize: 11, color: WIRE.ink3, background: '#fff', padding: '3px 10px', borderRadius: 12, border: `1px solid ${WIRE.lineSoft}` }}>{title}</div>}
    {children}
  </div>
);

// ── 案A: 三角配置 (3キャラ固定想定) ──
const RelationA = ({ collapsed, layout = 'triangle' }) => {
  // different layouts
  const layouts = {
    triangle: [[260, 110], [120, 340], [400, 340]],
    line: [[110, 230], [260, 230], [410, 230]],
    radial: [[260, 230], [110, 130], [410, 130]],
  };
  const pos = layouts[layout] || layouts.triangle;
  return (
    <Chrome active="relation" collapsed={collapsed} headerTitle="相関図: 夏の終わりに">
      <div style={{ display: 'flex', height: '100%' }}>
        {/* left - selected chars */}
        <div style={{ width: 200, padding: '14px 12px', borderRight: `1px dashed ${WIRE.lineSoft}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, color: WIRE.ink3, letterSpacing: 1 }}>選択中 (3/3)</div>
          {[
            ['カイ', '主人公', WIRE.accent],
            ['リン', 'ヒロイン', WIRE.accent2],
            ['ユウ', 'ライバル', WIRE.accent3],
          ].map(([n, r, c], i) => (
            <Box key={i} style={{ padding: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: WIRE.paperAlt, border: `2px solid ${c}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fontHand, fontSize: 12, fontWeight: 700 }}>{n[0]}</div>
              <div>
                <Hand size={12} style={{ fontWeight: 600 }}>{n}</Hand>
                <div style={{ fontSize: 9, color: WIRE.ink3 }}>{r}</div>
              </div>
            </Box>
          ))}
          <div style={{ marginTop: 6, padding: 8, border: `1px dashed ${WIRE.lineSoft}`, borderRadius: 4, fontSize: 10, color: WIRE.ink3, textAlign: 'center' }}>+ キャラを追加<br/><span style={{ fontSize: 9 }}>(最大3人)</span></div>

          <div style={{ height: 8 }} />
          <div style={{ fontSize: 10, color: WIRE.ink3, letterSpacing: 1 }}>レイアウト</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['三角', '一列', '放射'].map((t, i) => (
              <div key={i} style={{ flex: 1, padding: '4px 0', fontSize: 10, textAlign: 'center', border: `1px solid ${i === 0 ? WIRE.ink : WIRE.lineSoft}`, borderRadius: 3, background: i === 0 ? WIRE.paperAlt : 'transparent' }}>{t}</div>
            ))}
          </div>
        </div>

        <FlowCanvas title="React Flow · 三角配置">
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }} viewBox="0 0 520 460" preserveAspectRatio="xMidYMid meet">
            <RFEdge from={pos[0]} to={pos[1]} label="幼なじみ" curve={-40} color={WIRE.accent2} bidirectional />
            <RFEdge from={pos[1]} to={pos[2]} label="不信感" curve={40} color={WIRE.ink2} dashed />
            <RFEdge from={pos[0]} to={pos[2]} label="ライバル" curve={40} color={WIRE.accent} />
            <RFNode x={pos[0][0]} y={pos[0][1]} name="カ" role="カイ · 主人公" selected />
            <RFNode x={pos[1][0]} y={pos[1][1]} name="リ" role="リン · ヒロイン" />
            <RFNode x={pos[2][0]} y={pos[2][1]} name="ユ" role="ユウ · ライバル" />
          </svg>
        </FlowCanvas>

        {/* edge inspector */}
        <div style={{ width: 220, padding: '14px 14px', background: WIRE.paperAlt, borderLeft: `1px dashed ${WIRE.lineSoft}`, overflow: 'auto' }}>
          <div style={{ fontSize: 10, color: WIRE.ink3, letterSpacing: 1 }}>選択中のエッジ</div>
          <Hand size={14} style={{ fontWeight: 600, display: 'block', marginTop: 4 }}>カイ → ユウ</Hand>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Field label="関係性ラベル" value="ライバル" />
            <Field label="方向" value="→ (片方向)" />
            <Field label="強度" value="強い" />
            <Field label="メモ" value="幼い頃の一件から互いを意識" multiline lines={3} />
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
            <Btn small ghost>削除</Btn>
            <Btn small primary>更新</Btn>
          </div>
        </div>
      </div>
    </Chrome>
  );
};

// ── 案B: フルキャンバス (自由配置) ──
const RelationB = ({ collapsed }) => (
  <Chrome active="relation" collapsed={collapsed} headerTitle="相関図 · 自由配置">
    <div style={{ display: 'flex', height: '100%' }}>
      <FlowCanvas title="ドラッグ自由 · 3人まで">
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }} viewBox="0 0 700 500" preserveAspectRatio="xMidYMid meet">
          <RFEdge from={[180, 160]} to={[500, 160]} label="幼なじみ → 恋心" curve={-25} color={WIRE.accent2} bidirectional />
          <RFEdge from={[180, 160]} to={[340, 380]} label="一方的な憧れ" curve={20} color={WIRE.accent} dashed />
          <RFEdge from={[500, 160]} to={[340, 380]} label="姉妹のように" curve={-20} color={WIRE.accent3} />
          <RFNode x={180} y={160} name="カ" role="カイ" />
          <RFNode x={500} y={160} name="リ" role="リン" selected />
          <RFNode x={340} y={380} name="ハ" role="ハル" size={64} />
        </svg>
      </FlowCanvas>
      {/* inline toolbar top-right */}
      <div style={{ position: 'absolute', top: 54, right: 20, zIndex: 3, display: 'flex', gap: 6 }}>
        <Btn small ghost>保存</Btn>
        <Btn small ghost>画像で書出</Btn>
        <Btn small primary><IconGlyph kind="plus" size={10} color="#fff" /> キャラ追加</Btn>
      </div>
      {/* node-add panel */}
      <div style={{ position: 'absolute', top: 120, right: 20, width: 200, background: '#fff', border: `1.2px solid ${WIRE.line}`, borderRadius: 4, padding: 10, zIndex: 3 }}>
        <div style={{ fontSize: 10, color: WIRE.ink3, letterSpacing: 1, marginBottom: 6 }}>キャラを選ぶ</div>
        {['カイ ✓', 'リン ✓', 'ハル ✓', 'ユウ', 'ミサ', 'タクミ'].map((n, i) => {
          const chosen = n.includes('✓');
          return (
            <div key={i} style={{ padding: '5px 8px', fontSize: 11, borderRadius: 3, background: chosen ? WIRE.paperAlt : 'transparent', color: chosen ? WIRE.ink : WIRE.ink3, fontFamily: fontHand, marginBottom: 2 }}>{n}</div>
          );
        })}
        <div style={{ fontSize: 10, color: WIRE.ink3, marginTop: 6 }}>3/3 選択済み (上限)</div>
      </div>
      <Note style={{ position: 'absolute', bottom: 110, left: 240 }} rotate={-3}>ノードをドラッグで自由配置 / エッジもカーブ自在</Note>
    </div>
  </Chrome>
);

// ── 案C: ネットワークマップ型 + 関係性アイコン ──
const RelationC = ({ collapsed }) => (
  <Chrome active="relation" collapsed={collapsed} headerTitle="相関図 · ネットワーク">
    <div style={{ display: 'flex', height: '100%' }}>
      <FlowCanvas title="関係性の種類でエッジ色分け">
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }} viewBox="0 0 700 500" preserveAspectRatio="xMidYMid meet">
          <RFEdge from={[160, 250]} to={[410, 140]} label="♡ 想い人" curve={-30} color="#c94277" />
          <RFEdge from={[410, 140]} to={[570, 330]} label="⚔ 宿敵" curve={30} color={WIRE.accent} />
          <RFEdge from={[160, 250]} to={[570, 330]} label="盟友" curve={50} color="#3a9b62" dashed />
          <RFNode x={160} y={250} name="カ" role="カイ · 主人公" selected />
          <RFNode x={410} y={140} name="リ" role="リン · ヒロイン" />
          <RFNode x={570} y={330} name="ユ" role="ユウ · ライバル" />
        </svg>
      </FlowCanvas>
      {/* legend / palette */}
      <div style={{ width: 220, padding: '14px 14px', background: WIRE.paperAlt, borderLeft: `1px dashed ${WIRE.lineSoft}`, overflow: 'auto' }}>
        <div style={{ fontSize: 10, color: WIRE.ink3, letterSpacing: 1 }}>関係性プリセット</div>
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            ['♡ 恋愛', '#c94277'],
            ['⚔ 敵対', WIRE.accent],
            ['✦ 盟友', '#3a9b62'],
            ['◎ 家族', WIRE.accent3],
            ['… 不信', WIRE.ink2],
          ].map(([n, c], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: '#fff', border: `1px solid ${WIRE.lineSoft}`, borderRadius: 3 }}>
              <div style={{ width: 20, height: 2, background: c }} />
              <Hand size={12}>{n}</Hand>
            </div>
          ))}
          <div style={{ padding: '5px 8px', border: `1px dashed ${WIRE.lineSoft}`, borderRadius: 3, fontSize: 10, color: WIRE.ink3, textAlign: 'center' }}>+ カスタム</div>
        </div>

        <div style={{ height: 14 }} />
        <div style={{ fontSize: 10, color: WIRE.ink3, letterSpacing: 1 }}>このシナリオで</div>
        <Box style={{ marginTop: 6, padding: 10, background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}><span>ノード</span><Hand size={12} style={{ fontWeight: 600 }}>3</Hand></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}><span>エッジ</span><Hand size={12} style={{ fontWeight: 600 }}>3</Hand></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span>複雑度</span><Hand size={12} style={{ fontWeight: 600, color: WIRE.accent }}>中</Hand></div>
        </Box>
      </div>
    </div>
  </Chrome>
);

Object.assign(window, { RelationA, RelationB, RelationC });
