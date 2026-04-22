// モバイル画面 (iOS) 各機能3案ずつ
// 402 x 874 デバイス想定

const MW = 402, MH = 874;

// ── 共通: ボトムタブバー ──────────────────────────────────────
const MTabBar = ({ active = 'home' }) => {
  const items = [
    { id: 'home', label: 'ホーム', icon: 'home' },
    { id: 'char', label: 'キャラ', icon: 'user' },
    { id: 'scenario', label: 'シナリオ', icon: 'doc' },
    { id: 'relation', label: '相関図', icon: 'flow' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: WIRE.paper, borderTop: `1px solid ${WIRE.lineSoft}`,
      paddingBottom: 24, paddingTop: 8,
      display: 'flex', zIndex: 30,
    }}>
      {items.map(it => (
        <div key={it.id} style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 2, padding: '4px 0',
          color: it.id === active ? WIRE.accent : WIRE.ink3,
        }}>
          <IconGlyph kind={it.icon} size={22} color={it.id === active ? WIRE.accent : WIRE.ink3} />
          <span style={{ fontSize: 10, fontFamily: fontUI, fontWeight: it.id === active ? 600 : 400 }}>{it.label}</span>
        </div>
      ))}
    </div>
  );
};

// 共通: モバイルヘッダー
const MHeader = ({ title, back, right }) => (
  <div style={{
    height: 52, display: 'flex', alignItems: 'center',
    padding: '0 14px', gap: 10, borderBottom: `1px solid ${WIRE.lineSoft}`,
    background: WIRE.paper, position: 'sticky', top: 0, zIndex: 20,
  }}>
    {back ? <IconGlyph kind="chevron" size={18} color={WIRE.ink} /> : <IconGlyph kind="menu" size={20} color={WIRE.ink} />}
    <Hand size={16} style={{ fontWeight: 700, flex: 1 }}>{title}</Hand>
    {right || <IconGlyph kind="search" size={18} color={WIRE.ink2} />}
  </div>
);

// shell
const MScreen = ({ children, tab, status = true }) => (
  <div style={{ width: '100%', height: '100%', position: 'relative', background: WIRE.paper, color: WIRE.ink, fontFamily: fontUI, overflow: 'hidden' }}>
    {/* status bar placeholder handled by iOS frame */}
    <div style={{ paddingTop: 54, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
    </div>
    {tab && <MTabBar active={tab} />}
  </div>
);

// ─── ホーム 3案 ──────────────────────────────────────────────
const MHomeA = () => (
  <MScreen tab="home">
    <MHeader title="PlotMaker" />
    <div style={{ padding: 16 }}>
      <Hand size={20} style={{ fontWeight: 700 }}>こんにちは</Hand>
      <div style={{ fontSize: 11, color: WIRE.ink3, marginTop: 2 }}>3 シナリオ · 12 キャラ</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        {[['新規シナリオ', 'doc'], ['キャラ作成', 'user']].map(([l, ic], i) => (
          <Box key={i} style={{ flex: 1, padding: 12, textAlign: 'center' }}>
            <IconGlyph kind={ic} size={20} color={i === 0 ? WIRE.accent : WIRE.ink} />
            <div style={{ fontSize: 11, marginTop: 6, fontWeight: 600 }}>{l}</div>
          </Box>
        ))}
      </div>
      <div style={{ marginTop: 20, fontSize: 12, color: WIRE.ink3, fontFamily: fontMono }}>最近のシナリオ</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        {['夏の終わりに', '赤い回廊の秘密', '無題 v3'].map((t, i) => (
          <Box key={i} style={{ padding: 10, display: 'flex', gap: 10 }}>
            <ImgBox w={60} h={60} label="" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <Hand size={14} style={{ fontWeight: 600 }}>{t}</Hand>
              <div style={{ fontSize: 10, color: WIRE.ink3, marginTop: 2 }}>2 日前 · キャラ {3 + i}</div>
              <Lines n={2} style={{ marginTop: 6 }} />
            </div>
          </Box>
        ))}
      </div>
    </div>
  </MScreen>
);

const MHomeB = () => (
  <MScreen tab="home">
    <MHeader title="PlotMaker" right={<IconGlyph kind="bell" size={18} color={WIRE.ink2} />} />
    <div style={{ padding: '10px 0' }}>
      {/* chips */}
      <div style={{ display: 'flex', gap: 6, padding: '0 14px', overflowX: 'auto' }}>
        {['すべて', '進行中', '下書き', 'AI生成'].map((c, i) => (
          <div key={i} style={{ padding: '5px 12px', borderRadius: 14, fontSize: 11, border: `1px solid ${i === 0 ? WIRE.ink : WIRE.lineSoft}`, background: i === 0 ? WIRE.ink : 'transparent', color: i === 0 ? WIRE.paper : WIRE.ink2, flexShrink: 0 }}>{c}</div>
        ))}
      </div>
      <div style={{ padding: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {['夏の終わりに', '赤い回廊', '無題 v3', '月下の剣客', '銀の街', '明日へ'].map((t, i) => (
          <div key={i}>
            <ImgBox h={90} label="cover" />
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t}</div>
            <div style={{ fontSize: 10, color: WIRE.ink3 }}>キャラ {2 + i % 4} 人</div>
          </div>
        ))}
      </div>
    </div>
    {/* FAB */}
    <div style={{ position: 'absolute', right: 16, bottom: 90, width: 52, height: 52, borderRadius: 26, background: WIRE.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,.2)', zIndex: 25 }}>
      <IconGlyph kind="plus" size={22} color="#fff" />
    </div>
  </MScreen>
);

const MHomeC = () => (
  <MScreen tab="home">
    <MHeader title="今日" />
    <div style={{ padding: 16 }}>
      <Box style={{ padding: 14, background: WIRE.paperAlt, borderStyle: 'solid' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconGlyph kind="sparkle" size={16} color={WIRE.accent} />
          <Hand size={13} style={{ fontWeight: 600 }}>続きを書きませんか？</Hand>
        </div>
        <div style={{ fontSize: 12, fontFamily: fontHand, marginTop: 6, lineHeight: 1.5 }}>
          「夏の終わりに」第3章でカイが古い写真を見つけた所で止まっています。
        </div>
        <Btn small primary style={{ marginTop: 10 }}>続きを書く →</Btn>
      </Box>
      <div style={{ fontSize: 11, color: WIRE.ink3, marginTop: 20, fontFamily: fontMono }}>履歴</div>
      <div style={{ marginTop: 8 }}>
        {[
          ['09:24', 'シナリオ更新', '夏の終わりに'],
          ['昨日', 'キャラ作成', 'カイ'],
          ['昨日', '相関図編集', 'カイ × リン × ユウ'],
          ['3日前', 'AI生成', 'プロット 3案'],
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: `1px dashed ${WIRE.lineSoft}` }}>
            <div style={{ width: 48, fontSize: 10, color: WIRE.ink3, fontFamily: fontMono }}>{r[0]}</div>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: WIRE.accent, marginTop: 5 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12 }}>{r[1]}</div>
              <Hand size={12} style={{ color: WIRE.ink2 }}>{r[2]}</Hand>
            </div>
          </div>
        ))}
      </div>
    </div>
  </MScreen>
);

// ─── キャラ一覧 3案 ──────────────────────────────────────────
const MCharA = () => (
  <MScreen tab="char">
    <MHeader title="キャラクター" right={<IconGlyph kind="plus" size={20} color={WIRE.ink} />} />
    <div style={{ padding: '10px 14px' }}>
      {/* chips */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 10 }}>
        {['すべて', '主人公', 'ヒロイン', 'ライバル', 'サブ'].map((c, i) => (
          <div key={i} style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, border: `1px solid ${i === 0 ? WIRE.ink : WIRE.lineSoft}`, background: i === 0 ? WIRE.ink : 'transparent', color: i === 0 ? WIRE.paper : WIRE.ink2, flexShrink: 0 }}>{c}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[['カイ', '主人公'], ['リン', 'ヒロイン'], ['ユウ', 'ライバル'], ['ミサ', '大人'], ['ハル', '親友'], ['タクミ', 'サブ']].map(([n, r], i) => (
          <Box key={i} style={{ padding: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: WIRE.paperAlt, border: `1.2px solid ${WIRE.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fontHand, fontWeight: 700, fontSize: 16 }}>{n[0]}</div>
            <Hand size={14} style={{ fontWeight: 600, display: 'block', marginTop: 8 }}>{n}</Hand>
            <div style={{ fontSize: 10, color: WIRE.ink3 }}>{r}</div>
          </Box>
        ))}
      </div>
    </div>
  </MScreen>
);

const MCharB = () => (
  <MScreen tab="char">
    <MHeader title="キャラクター" right={<IconGlyph kind="plus" size={20} color={WIRE.ink} />} />
    <div style={{ padding: '10px 0' }}>
      <div style={{ padding: '0 14px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${WIRE.lineSoft}`, borderRadius: 20, padding: '6px 12px', gap: 8, background: WIRE.paperAlt }}>
          <IconGlyph kind="search" size={14} color={WIRE.ink3} />
          <span style={{ fontSize: 13, color: WIRE.ink3 }}>名前で検索</span>
        </div>
      </div>
      {[['カイ', 17, '男', '頑固で一本気', '主人公'], ['リン', 16, '女', '明るい', 'ヒロイン'], ['ユウ', 18, '男', '冷静沈着', 'ライバル'], ['ミサ', 32, '女', '謎めいた', '大人'], ['ハル', 15, '女', '天真爛漫', '親友'], ['タクミ', 17, '男', '不器用', 'サブ']].map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', alignItems: 'center', borderBottom: `1px dashed ${WIRE.lineSoft}` }}>
          <div style={{ width: 44, height: 44, borderRadius: 22, background: WIRE.paperAlt, border: `1.2px solid ${WIRE.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fontHand, fontWeight: 700, fontSize: 18 }}>{r[0][0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <Hand size={14} style={{ fontWeight: 600 }}>{r[0]}</Hand>
              <span style={{ fontSize: 10, color: WIRE.ink3 }}>{r[1]}歳 · {r[2]}</span>
            </div>
            <div style={{ fontSize: 11, color: WIRE.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r[3]}</div>
          </div>
          <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 6, background: WIRE.paperAlt, border: `1px solid ${WIRE.lineSoft}`, color: WIRE.ink3 }}>{r[4]}</span>
          <IconGlyph kind="chevron" size={12} color={WIRE.ink3} />
        </div>
      ))}
    </div>
  </MScreen>
);

const MCharC = () => (
  <MScreen tab="char">
    <MHeader title="キャラ詳細" back />
    <div>
      <div style={{ padding: '20px 16px', textAlign: 'center', background: WIRE.paperAlt }}>
        <div style={{ width: 90, height: 90, borderRadius: 45, margin: '0 auto', background: '#fff', border: `1.2px solid ${WIRE.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fontHand, fontSize: 30, fontWeight: 700 }}>カ</div>
        <Hand size={22} style={{ fontWeight: 700, display: 'block', marginTop: 8 }}>カイ</Hand>
        <div style={{ fontSize: 11, color: WIRE.ink3 }}>17歳 · 男 · 主人公</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10 }}>
          <Btn small ghost><IconGlyph kind="edit" size={10} /> 編集</Btn>
          <Btn small ghost>複製</Btn>
        </div>
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[['性格', '頑固で一本気。仲間想いだが不器用。'], ['外見', '黒髪ショート、左目の下に傷。'], ['背景', '港町で育った漁師の息子…'], ['口調', '「〜だ」「〜だろ」'], ['目標', '失踪した妹を探す。']].map(([l, v], i) => (
          <Box key={i} style={{ padding: 12 }}>
            <div style={{ fontSize: 10, color: WIRE.ink3, letterSpacing: 1 }}>{l}</div>
            <div style={{ fontFamily: fontHand, fontSize: 13, lineHeight: 1.5, marginTop: 4 }}>{v}</div>
          </Box>
        ))}
      </div>
    </div>
  </MScreen>
);

// ─── キャラ作成 3案 ──────────────────────────────────────────
const MCharEditA = () => (
  <MScreen>
    <MHeader title="新しいキャラ" back right={<Btn primary small>保存</Btn>} />
    <div style={{ padding: 16 }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ width: 96, height: 96, borderRadius: 48, margin: '0 auto', background: WIRE.paperAlt, border: `1.5px dashed ${WIRE.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
          <IconGlyph kind="plus" size={18} color={WIRE.ink3} />
          <span style={{ fontSize: 9, color: WIRE.ink3 }}>画像</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="名前 *" value="カイ" />
        <div style={{ display: 'flex', gap: 10 }}>
          <Field label="年齢" value="17" w="50%" />
          <Field label="性別" value="男" w="50%" />
        </div>
        <Field label="性格" value="頑固で一本気" multiline lines={2} />
        <Field label="外見" multiline lines={2} hint="黒髪、身長…" />
        <Field label="背景 / 経歴" multiline lines={3} hint="…" />
      </div>
      <Btn ghost small style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
        <IconGlyph kind="sparkle" size={12} color={WIRE.accent} /> AI で残りを埋める
      </Btn>
    </div>
  </MScreen>
);

const MCharEditB = () => {
  const steps = ['基本', '性格', '外見', '背景', '完了'];
  return (
    <MScreen>
      <MHeader title="キャラ作成 2/5" back right={<span style={{ fontSize: 12, color: WIRE.accent, fontWeight: 600 }}>次へ</span>} />
      {/* stepper */}
      <div style={{ display: 'flex', padding: '12px 16px', gap: 4 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{ height: 3, borderRadius: 2, background: i <= 1 ? WIRE.accent : WIRE.lineSoft }} />
            <div style={{ fontSize: 9, color: i <= 1 ? WIRE.ink : WIRE.ink3, marginTop: 4, textAlign: 'center' }}>{s}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 16px' }}>
        <Hand size={18} style={{ fontWeight: 700 }}>性格を決めよう</Hand>
        <div style={{ fontSize: 11, color: WIRE.ink3, marginTop: 2 }}>キーワードを選ぶか、直接入力</div>
        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['頑固', '明るい', '冷静', '不器用', '負けず嫌い', '優しい', '毒舌', '内気', '一本気 ✓', '仲間想い ✓'].map((t, i) => {
            const on = t.endsWith('✓');
            return (
              <div key={i} style={{ padding: '6px 12px', borderRadius: 16, fontSize: 12, border: `1px solid ${on ? WIRE.accent : WIRE.lineSoft}`, background: on ? WIRE.highlight : 'transparent', color: WIRE.ink }}>{t}</div>
            );
          })}
        </div>
        <div style={{ marginTop: 18 }}>
          <Field label="補足メモ (自由入力)" multiline lines={3} value="感情を表に出すのが苦手。" />
        </div>
      </div>
    </MScreen>
  );
};

const MCharEditC = () => (
  <MScreen>
    <MHeader title="カイ" back right={<span style={{ fontSize: 11, color: WIRE.ink3 }}>自動保存</span>} />
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* AI chat card */}
      <Box style={{ padding: 12, background: WIRE.paperAlt, borderStyle: 'solid' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <IconGlyph kind="sparkle" size={16} color={WIRE.accent} />
          <div style={{ flex: 1, fontFamily: fontHand, fontSize: 13, lineHeight: 1.5 }}>
            「カイ」のイメージを一言で教えてください。性格や背景をAIが膨らませます。
          </div>
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center', background: '#fff', border: `1px solid ${WIRE.lineSoft}`, borderRadius: 18, padding: '5px 12px' }}>
          <span style={{ fontSize: 12, flex: 1, color: WIRE.ink3 }}>例: 海辺育ちの17歳</span>
          <IconGlyph kind="arrow" size={14} color={WIRE.accent} />
        </div>
      </Box>
      {/* AI が埋めたフィールド */}
      {[['名前', 'カイ', true], ['年齢', '17', true], ['性別', '男', true], ['性格', '頑固で一本気、仲間想い', false], ['外見', '黒髪ショート、小麦色の肌', false]].map(([l, v, done], i) => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderBottom: `1px dashed ${WIRE.lineSoft}` }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: done ? WIRE.accent : 'transparent', border: `1.5px solid ${done ? WIRE.accent : WIRE.lineSoft}`, marginTop: 3, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {done && <span style={{ color: '#fff', fontSize: 8 }}>✓</span>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: WIRE.ink3 }}>{l}</div>
            <Hand size={13} style={{ fontWeight: 500 }}>{v}</Hand>
          </div>
          <IconGlyph kind="edit" size={12} color={WIRE.ink3} />
        </div>
      ))}
    </div>
  </MScreen>
);

// ─── シナリオ 3案 ────────────────────────────────────────────
const MScenA = () => (
  <MScreen tab="scenario">
    <MHeader title="シナリオ" right={<IconGlyph kind="plus" size={20} color={WIRE.ink} />} />
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[['夏の終わりに', '青春 / 切ない', '第3章まで'], ['赤い回廊の秘密', 'ミステリー', '第2章まで'], ['無題 v3', 'SF', '下書き']].map(([t, g, p], i) => (
        <Box key={i} style={{ padding: 12 }}>
          <Hand size={16} style={{ fontWeight: 700 }}>{t}</Hand>
          <div style={{ fontSize: 11, color: WIRE.ink3, marginTop: 2 }}>{g} · {p}</div>
          <Lines n={2} style={{ marginTop: 10 }} />
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {['カイ', 'リン', 'ユウ'].slice(0, 3 - i % 3 + 1).map((n, j) => (
              <div key={j} style={{ width: 22, height: 22, borderRadius: 11, background: WIRE.paperAlt, border: `1px solid ${WIRE.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontFamily: fontHand }}>{n[0]}</div>
            ))}
          </div>
        </Box>
      ))}
    </div>
  </MScreen>
);

const MScenB = () => (
  <MScreen>
    <MHeader title="夏の終わりに" back right={<Btn primary small>生成</Btn>} />
    <div style={{ padding: 14 }}>
      <Hand size={22} style={{ fontWeight: 700 }}>夏の終わりに</Hand>
      <div style={{ fontSize: 10, color: WIRE.ink3 }}>自動保存中 · 124字</div>

      <div style={{ marginTop: 14, fontSize: 10, color: WIRE.ink3, letterSpacing: 1 }}>SYNOPSIS</div>
      <Box style={{ marginTop: 6, padding: 12, background: '#fff', minHeight: 180 }}>
        <div style={{ fontFamily: fontHand, fontSize: 13, lineHeight: 1.7 }}>
          高校3年の夏、カイとリンは海辺の小さな町で再会する。幼なじみだった2人は5年前の事件で疎遠に——
        </div>
      </Box>
      <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto' }}>
        {['@キャラ', '#場所', 'AI続き'].map((t, i) => (
          <div key={i} style={{ padding: '5px 12px', fontSize: 11, borderRadius: 14, border: `1px solid ${WIRE.lineSoft}`, background: WIRE.paperAlt, flexShrink: 0 }}>{t}</div>
        ))}
      </div>

      <div style={{ marginTop: 16, fontSize: 10, color: WIRE.ink3, letterSpacing: 1 }}>メタ情報</div>
      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Field label="舞台 / 世界観" value="現代日本、瀬戸内の町" />
        <Field label="参考作品" value="海辺のカフカ、リトル・フォレスト" />
      </div>
    </div>
  </MScreen>
);

const MScenC = () => (
  <MScreen>
    <MHeader title="生成中…" back />
    <div style={{ padding: 16 }}>
      <Box style={{ padding: 14, background: WIRE.paperAlt }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconGlyph kind="sparkle" size={16} color={WIRE.accent} />
          <Hand size={14} style={{ fontWeight: 600 }}>AI がシナリオを生成中</Hand>
        </div>
        <div style={{ fontSize: 11, color: WIRE.ink2, marginTop: 6 }}>入力: 海辺で再会する幼なじみ / 夏</div>
        {/* typing */}
        <div style={{ marginTop: 12, padding: 12, background: '#fff', borderRadius: 4, fontFamily: fontHand, fontSize: 13, lineHeight: 1.7, minHeight: 160 }}>
          高校3年の夏、カイは帰省先の海辺の町で5年ぶりにリンと再会する。かつての事件以来、2人の間には見えない壁があった<span style={{ borderRight: `2px solid ${WIRE.accent}`, marginLeft: 2 }}>&nbsp;</span>
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
          <Btn small ghost>停止</Btn>
          <Btn small ghost>再生成</Btn>
          <Btn small primary>採用</Btn>
        </div>
      </Box>
      <div style={{ marginTop: 18, fontSize: 11, color: WIRE.ink3 }}>別案</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        {['案2: 山間の旧家で起きた失踪事件を…', '案3: 転校生が見つけた謎の日記…'].map((t, i) => (
          <Box key={i} style={{ padding: 10, fontSize: 11, fontFamily: fontHand, lineHeight: 1.4 }}>{t}</Box>
        ))}
      </div>
    </div>
  </MScreen>
);

// ─── 相関図 3案 ──────────────────────────────────────────────
const MRelA = () => (
  <MScreen tab="relation">
    <MHeader title="相関図" right={<IconGlyph kind="save" size={18} color={WIRE.ink2} />} />
    <FlowCanvas>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }} viewBox="0 0 380 500" preserveAspectRatio="xMidYMid meet">
        <RFEdge from={[190, 110]} to={[90, 340]} label="幼なじみ" curve={-30} color={WIRE.accent2} bidirectional />
        <RFEdge from={[190, 110]} to={[290, 340]} label="ライバル" curve={30} color={WIRE.accent} />
        <RFEdge from={[90, 340]} to={[290, 340]} label="不信" curve={50} dashed color={WIRE.ink2} />
        <RFNode x={190} y={110} name="カ" role="カイ" selected />
        <RFNode x={90} y={340} name="リ" role="リン" />
        <RFNode x={290} y={340} name="ユ" role="ユウ" />
      </svg>
    </FlowCanvas>
    {/* bottom sheet */}
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 84, background: '#fff', borderTop: `1.2px solid ${WIRE.line}`, borderRadius: '16px 16px 0 0', padding: '10px 14px 14px', zIndex: 20 }}>
      <div style={{ width: 36, height: 4, borderRadius: 2, background: WIRE.lineSoft, margin: '0 auto 8px' }} />
      <div style={{ fontSize: 10, color: WIRE.ink3, letterSpacing: 1 }}>選択中のエッジ</div>
      <Hand size={14} style={{ fontWeight: 600 }}>カイ → リン</Hand>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <Field label="" value="幼なじみ" w="50%" h={32} />
        <Field label="" value="双方向" w="50%" h={32} />
      </div>
    </div>
  </MScreen>
);

const MRelB = () => (
  <MScreen>
    <MHeader title="キャラを選ぶ" back right={<span style={{ fontSize: 12, color: WIRE.accent, fontWeight: 600 }}>次へ</span>} />
    <div style={{ padding: 14 }}>
      <div style={{ fontSize: 12, color: WIRE.ink2 }}>最大 3 人まで選択できます ({2}/3)</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        {[['カイ', true], ['リン', true], ['', false]].map(([n, on], i) => (
          <Box key={i} style={{ width: 100, textAlign: 'center', padding: 10, borderStyle: on ? 'solid' : 'dashed' }}>
            {on ? (
              <>
                <div style={{ width: 48, height: 48, borderRadius: 24, margin: '0 auto', background: WIRE.paperAlt, border: `2px solid ${WIRE.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fontHand, fontWeight: 700, fontSize: 18 }}>{n[0]}</div>
                <Hand size={12} style={{ fontWeight: 600, display: 'block', marginTop: 6 }}>{n}</Hand>
              </>
            ) : (
              <div style={{ padding: '20px 0', color: WIRE.ink3, fontSize: 11 }}>+ 追加</div>
            )}
          </Box>
        ))}
      </div>
      <div style={{ fontSize: 11, color: WIRE.ink3, marginTop: 18 }}>候補</div>
      <div style={{ marginTop: 6 }}>
        {['ユウ', 'ミサ', 'ハル', 'タクミ', 'アオ'].map((n, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px', borderBottom: `1px dashed ${WIRE.lineSoft}` }}>
            <div style={{ width: 36, height: 36, borderRadius: 18, background: WIRE.paperAlt, border: `1px solid ${WIRE.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fontHand, fontWeight: 700, fontSize: 14 }}>{n[0]}</div>
            <Hand size={13} style={{ fontWeight: 600, flex: 1 }}>{n}</Hand>
            <div style={{ width: 20, height: 20, borderRadius: 10, border: `1.5px solid ${WIRE.lineSoft}` }} />
          </div>
        ))}
      </div>
    </div>
  </MScreen>
);

const MRelC = () => (
  <MScreen>
    <MHeader title="カイ × リン" back />
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        {[['カ', 'カイ'], ['リ', 'リン']].map(([ini, n], i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ width: 70, height: 70, borderRadius: 35, background: WIRE.paperAlt, border: `2px solid ${i === 0 ? WIRE.accent : WIRE.accent2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fontHand, fontWeight: 700, fontSize: 26 }}>{ini}</div>
            <Hand size={13} style={{ fontWeight: 600, display: 'block', marginTop: 6 }}>{n}</Hand>
          </div>
        ))}
      </div>
      {/* connection viz */}
      <svg width="100%" height="50" viewBox="0 0 300 50" style={{ marginTop: 10 }}>
        <path d="M 40 25 Q 150 -10 260 25" stroke={WIRE.accent2} strokeWidth="2" fill="none" />
        <path d="M 40 25 Q 150 60 260 25" stroke={WIRE.accent2} strokeWidth="2" fill="none" />
      </svg>

      <div style={{ marginTop: 16, fontSize: 10, color: WIRE.ink3, letterSpacing: 1 }}>関係性</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {[['♡ 恋愛', false], ['幼なじみ', true], ['⚔ 敵対', false], ['✦ 盟友', false], ['◎ 家族', false], ['… 不信', false]].map(([t, on], i) => (
          <div key={i} style={{ padding: '6px 12px', borderRadius: 16, fontSize: 12, border: `1px solid ${on ? WIRE.accent : WIRE.lineSoft}`, background: on ? WIRE.highlight : 'transparent', fontFamily: fontUI }}>{t}</div>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        <Field label="方向" value="↔ 双方向" />
        <div style={{ height: 10 }} />
        <Field label="メモ" value="5年前の事件以来、気まずい距離が続いている。" multiline lines={3} />
      </div>
      <Btn primary style={{ marginTop: 16, width: '100%' }}>保存</Btn>
    </div>
  </MScreen>
);

Object.assign(window, {
  MHomeA, MHomeB, MHomeC,
  MCharA, MCharB, MCharC,
  MCharEditA, MCharEditB, MCharEditC,
  MScenA, MScenB, MScenC,
  MRelA, MRelB, MRelC,
});
