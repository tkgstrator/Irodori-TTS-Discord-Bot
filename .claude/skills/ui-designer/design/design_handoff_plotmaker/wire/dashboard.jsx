// ダッシュボード / ホーム 3案
// すべて 1280x720 で design_canvas に収まる想定

// ── 案A: シンプルな最近の作業 + クイック作成 ──
const DashA = ({ collapsed }) => (
  <Chrome active="home" collapsed={collapsed}>
    <div style={{ padding: '20px 28px', height: '100%', overflow: 'auto' }}>
      <Hand size={22} style={{ fontWeight: 700 }}>おかえりなさい</Hand>
      <div style={{ fontSize: 12, color: WIRE.ink3, marginTop: 4 }}>3 件のシナリオ · 12 人のキャラクター</div>

      {/* クイック作成 */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        {[
          { icon: 'doc', label: '新しいシナリオ', sub: '大雑把なプロットから' },
          { icon: 'user', label: '新しいキャラクター', sub: '設定から作成' },
          { icon: 'flow', label: '相関図を描く', sub: '最大3人まで' },
        ].map((c, i) => (
          <Box key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: i === 0 ? '#fff' : WIRE.paper }}>
            <IconGlyph kind={c.icon} size={22} color={i === 0 ? WIRE.accent : WIRE.ink2} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{c.label}</div>
              <div style={{ fontSize: 10, color: WIRE.ink3, marginTop: 2 }}>{c.sub}</div>
            </div>
          </Box>
        ))}
      </div>

      {/* 最近のシナリオ */}
      <div style={{ marginTop: 26, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Hand size={16} style={{ fontWeight: 600 }}>最近のシナリオ</Hand>
        <span style={{ fontSize: 11, color: WIRE.ink3 }}>すべて見る →</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 10 }}>
        {['夏の終わりに', '赤い回廊の秘密', '無題のシナリオ v3'].map((t, i) => (
          <Box key={i} style={{ padding: 0, overflow: 'hidden' }}>
            <ImgBox h={90} label="cover" />
            <div style={{ padding: 10 }}>
              <Hand size={14} style={{ fontWeight: 600 }}>{t}</Hand>
              <div style={{ fontSize: 10, color: WIRE.ink3, marginTop: 4 }}>更新 2 日前 · キャラ {3 + i} 人</div>
              <Lines n={2} style={{ marginTop: 8 }} />
            </div>
          </Box>
        ))}
      </div>

      {/* キャラクター */}
      <div style={{ marginTop: 26, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Hand size={16} style={{ fontWeight: 600 }}>最近のキャラクター</Hand>
        <span style={{ fontSize: 11, color: WIRE.ink3 }}>すべて見る →</span>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        {['カイ', 'リン', 'ユウ', 'ミサ', 'ハル'].map((n, i) => (
          <div key={i} style={{ width: 80, textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: 40, border: `1.2px solid ${WIRE.line}`, background: WIRE.paperAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fontHand, fontSize: 20 }}>{n[0]}</div>
            <div style={{ fontSize: 11, marginTop: 6 }}>{n}</div>
          </div>
        ))}
      </div>
    </div>
  </Chrome>
);

// ── 案B: YouTube風グリッド・サムネ重視 ──
const DashB = ({ collapsed }) => (
  <Chrome active="home" collapsed={collapsed}>
    <div style={{ padding: '16px 24px', height: '100%', overflow: 'auto' }}>
      {/* chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {['すべて', '進行中', '完結', '下書き', 'キャラ多め', 'AI生成'].map((c, i) => (
          <div key={i} style={{
            padding: '5px 12px', borderRadius: 16, fontSize: 11,
            border: `1px solid ${i === 0 ? WIRE.ink : WIRE.lineSoft}`,
            background: i === 0 ? WIRE.ink : WIRE.paperAlt,
            color: i === 0 ? WIRE.paper : WIRE.ink2,
          }}>{c}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { t: '夏の終わりに', c: 4, s: '青春 / 切ない' },
          { t: '赤い回廊の秘密', c: 3, s: 'ミステリー' },
          { t: '無題 v3', c: 2, s: 'SF' },
          { t: '月下の剣客', c: 5, s: '時代劇' },
          { t: '銀の街の少女', c: 3, s: 'ファンタジー' },
          { t: '明日へのキオク', c: 2, s: 'SF / 青春' },
          { t: '深淵のひかり', c: 6, s: 'ホラー' },
          { t: '最後の七月', c: 4, s: '日常' },
        ].map((v, i) => (
          <div key={i}>
            <ImgBox h={100} label="cover" />
            <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
              <div style={{ width: 22, height: 22, borderRadius: 11, background: WIRE.paperAlt, border: `1px solid ${WIRE.lineSoft}`, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.t}</div>
                <div style={{ fontSize: 10, color: WIRE.ink3, marginTop: 2 }}>{v.s} · キャラ{v.c}人</div>
                <div style={{ fontSize: 10, color: WIRE.ink3 }}>2日前に更新</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    {/* floating FAB */}
    <div style={{ position: 'absolute', right: 20, bottom: 20, display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 24, background: WIRE.accent, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,.15)', fontSize: 12, fontWeight: 600 }}>
      <IconGlyph kind="plus" size={16} color="#fff" /> 作成
    </div>
  </Chrome>
);

// ── 案C: タイムライン + AIサジェスト ──
const DashC = ({ collapsed }) => (
  <Chrome active="home" collapsed={collapsed}>
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ flex: 1, padding: '18px 24px', overflow: 'auto', borderRight: `1px dashed ${WIRE.lineSoft}` }}>
        <Hand size={20} style={{ fontWeight: 700 }}>今日の作業</Hand>
        <div style={{ fontSize: 11, color: WIRE.ink3, marginTop: 2 }}>2026年4月22日 · 水</div>

        <div style={{ marginTop: 20 }}>
          {[
            { time: '09:24', title: 'シナリオ「夏の終わりに」を更新', tag: 'シナリオ' },
            { time: '昨日', title: 'キャラクター「カイ」を作成', tag: 'キャラ' },
            { time: '昨日', title: '相関図: カイ × リン × ユウ', tag: '相関図' },
            { time: '3日前', title: 'AI生成: プロット案を3つ保存', tag: 'AI' },
            { time: '先週', title: 'シナリオ「赤い回廊の秘密」を作成', tag: 'シナリオ' },
          ].map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px dashed ${WIRE.lineSoft}` }}>
              <div style={{ width: 48, fontSize: 11, color: WIRE.ink3, fontFamily: fontMono, paddingTop: 2 }}>{e.time}</div>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: WIRE.accent, marginTop: 6, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12 }}>{e.title}</div>
                <div style={{ fontSize: 10, color: WIRE.ink3, marginTop: 2 }}>#{e.tag}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* right column */}
      <div style={{ width: 260, padding: '18px 18px', background: WIRE.paperAlt, overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconGlyph kind="sparkle" size={16} color={WIRE.accent} />
          <Hand size={14} style={{ fontWeight: 600 }}>AI からの提案</Hand>
        </div>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            '「夏の終わりに」第3章の続きを考えてみる？',
            'キャラ「リン」の過去設定がまだ空白です',
            '相関図をもとに対立構造を可視化できます',
          ].map((t, i) => (
            <Box key={i} style={{ background: '#fff', padding: 10, fontSize: 11, lineHeight: 1.5 }}>
              <div style={{ color: WIRE.ink }}>{t}</div>
              <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                <Btn small primary>試す</Btn>
                <Btn small ghost>あとで</Btn>
              </div>
            </Box>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <Hand size={13} style={{ fontWeight: 600 }}>統計</Hand>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 8 }}>
            {[['12', 'キャラ'], ['3', 'シナリオ'], ['7', '相関図'], ['24', 'AI生成']].map(([n, l], i) => (
              <Box key={i} style={{ padding: 8, textAlign: 'center', background: '#fff' }}>
                <div style={{ fontFamily: fontHand, fontSize: 22, fontWeight: 700, color: WIRE.accent }}>{n}</div>
                <div style={{ fontSize: 10, color: WIRE.ink3 }}>{l}</div>
              </Box>
            ))}
          </div>
        </div>
      </div>
    </div>
  </Chrome>
);

Object.assign(window, { DashA, DashB, DashC });
