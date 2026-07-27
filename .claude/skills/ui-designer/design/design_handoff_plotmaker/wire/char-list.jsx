// キャラクター一覧 3案

// ── 案A: カードグリッド (YouTube風) ──
const CharListA = ({ collapsed }) => {
  const chars = [
    { n: 'カイ', a: 17, g: '男', p: '頑固で一本気', tag: '主人公' },
    { n: 'リン', a: 16, g: '女', p: '明るいムードメーカー', tag: 'ヒロイン' },
    { n: 'ユウ', a: 18, g: '男', p: '冷静沈着、頭脳派', tag: 'ライバル' },
    { n: 'ミサ', a: 32, g: '女', p: '謎めいた教師', tag: '大人' },
    { n: 'ハル', a: 15, g: '女', p: '天真爛漫', tag: '親友' },
    { n: 'タクミ', a: 17, g: '男', p: '不器用で優しい', tag: 'サブ' },
    { n: 'アオ', a: 16, g: '女', p: '毒舌、でも芯は強い', tag: 'サブ' },
    { n: '先生', a: 45, g: '男', p: '寡黙で頼れる', tag: '大人' },
  ];
  return (
    <Chrome active="char" collapsed={collapsed}>
      <div style={{ padding: '18px 24px', height: '100%', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <Hand size={20} style={{ fontWeight: 700 }}>キャラクター</Hand>
            <div style={{ fontSize: 11, color: WIRE.ink3 }}>{chars.length} 人 · シナリオ横断</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn ghost small><IconGlyph kind="list" size={12} color={WIRE.ink2} /> 並び替え</Btn>
            <Btn primary><IconGlyph kind="plus" size={12} color="#fff" /> 新規作成</Btn>
          </div>
        </div>
        {/* chips */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {['すべて', '主人公', 'ヒロイン', 'ライバル', 'サブ', '大人'].map((c, i) => (
            <div key={i} style={{ padding: '4px 10px', borderRadius: 14, fontSize: 10, border: `1px solid ${i === 0 ? WIRE.ink : WIRE.lineSoft}`, background: i === 0 ? WIRE.ink : 'transparent', color: i === 0 ? WIRE.paper : WIRE.ink2 }}>{c}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {chars.map((c, i) => (
            <Box key={i} style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 42, height: 42, borderRadius: 21, background: WIRE.paperAlt, border: `1.2px solid ${WIRE.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fontHand, fontSize: 16, fontWeight: 700 }}>{c.n[0]}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.n}</div>
                  <div style={{ fontSize: 10, color: WIRE.ink3 }}>{c.a}歳 · {c.g}</div>
                </div>
              </div>
              <div style={{ fontFamily: fontHand, fontSize: 12, color: WIRE.ink2, lineHeight: 1.3 }}>{c.p}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontSize: 10, padding: '2px 6px', background: WIRE.paperAlt, borderRadius: 8, color: WIRE.ink2 }}>#{c.tag}</span>
                <IconGlyph kind="dots" size={14} color={WIRE.ink3} />
              </div>
            </Box>
          ))}
        </div>
      </div>
    </Chrome>
  );
};

// ── 案B: 左ペインリスト + 右プレビュー ──
const CharListB = ({ collapsed }) => {
  const chars = [
    { n: 'カイ', a: 17, g: '男', p: '頑固で一本気', tag: '主人公', sel: true },
    { n: 'リン', a: 16, g: '女', p: '明るいムードメーカー', tag: 'ヒロイン' },
    { n: 'ユウ', a: 18, g: '男', p: '冷静沈着', tag: 'ライバル' },
    { n: 'ミサ', a: 32, g: '女', p: '謎めいた教師', tag: '大人' },
    { n: 'ハル', a: 15, g: '女', p: '天真爛漫', tag: '親友' },
    { n: 'タクミ', a: 17, g: '男', p: '不器用で優しい', tag: 'サブ' },
    { n: 'アオ', a: 16, g: '女', p: '毒舌', tag: 'サブ' },
  ];
  return (
    <Chrome active="char" collapsed={collapsed}>
      <div style={{ display: 'flex', height: '100%' }}>
        <div style={{ width: 280, borderRight: `1.2px solid ${WIRE.lineSoft}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 14px', borderBottom: `1px dashed ${WIRE.lineSoft}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', border: `1px solid ${WIRE.lineSoft}`, borderRadius: 16, padding: '3px 10px', gap: 6 }}>
              <IconGlyph kind="search" size={12} color={WIRE.ink3} />
              <span style={{ fontSize: 11, color: WIRE.ink3 }}>名前で検索…</span>
            </div>
            <IconGlyph kind="plus" size={16} />
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {chars.map((c, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, padding: '10px 14px', alignItems: 'center',
                borderLeft: c.sel ? `3px solid ${WIRE.accent}` : '3px solid transparent',
                background: c.sel ? WIRE.paperAlt : 'transparent',
              }}>
                <div style={{ width: 34, height: 34, borderRadius: 17, background: WIRE.paperAlt, border: `1px solid ${WIRE.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fontHand, fontSize: 14, fontWeight: 600 }}>{c.n[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{c.n} <span style={{ fontWeight: 400, color: WIRE.ink3, fontSize: 10 }}>{c.a}歳</span></div>
                  <div style={{ fontSize: 10, color: WIRE.ink3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.p}</div>
                </div>
                <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 6, background: WIRE.paper, border: `1px solid ${WIRE.lineSoft}`, color: WIRE.ink3 }}>{c.tag}</span>
              </div>
            ))}
          </div>
        </div>

        {/* detail */}
        <div style={{ flex: 1, padding: '20px 28px', overflow: 'auto' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 90, height: 90, borderRadius: 45, background: WIRE.paperAlt, border: `1.2px solid ${WIRE.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fontHand, fontSize: 32, fontWeight: 700 }}>カ</div>
            <div style={{ flex: 1 }}>
              <Hand size={22} style={{ fontWeight: 700 }}>カイ</Hand>
              <div style={{ fontSize: 11, color: WIRE.ink3, marginTop: 2 }}>17歳 · 男 · #主人公</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <Btn small ghost><IconGlyph kind="edit" size={10} /> 編集</Btn>
                <Btn small ghost>複製</Btn>
                <Btn small ghost>削除</Btn>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              ['性格', '頑固で一本気。感情を表に出すのが苦手だが、仲間を想う気持ちは誰よりも強い。'],
              ['外見', '黒髪のショート。背は平均より少し高め。左目の下に小さな傷。'],
              ['背景', '港町で育った漁師の息子。ある事件をきっかけに…'],
              ['口調', 'ぶっきらぼうだが敬語は意外と丁寧。語尾は「〜だ」「〜だろ」。'],
            ].map(([l, v], i) => (
              <Box key={i} style={{ padding: 12 }}>
                <div style={{ fontSize: 11, color: WIRE.ink3, marginBottom: 4 }}>{l}</div>
                <div style={{ fontFamily: fontHand, fontSize: 13, lineHeight: 1.5 }}>{v}</div>
              </Box>
            ))}
          </div>
          <Note style={{ marginTop: 16 }}>登場シナリオ: 夏の終わりに / 赤い回廊の秘密</Note>
        </div>
      </div>
    </Chrome>
  );
};

// ── 案C: テーブル風 (多人数向け) ──
const CharListC = ({ collapsed }) => {
  const chars = [
    ['カイ', 17, '男', '主人公', '頑固で一本気', 2, '2日前'],
    ['リン', 16, '女', 'ヒロイン', '明るい', 2, '3日前'],
    ['ユウ', 18, '男', 'ライバル', '冷静沈着', 1, '昨日'],
    ['ミサ', 32, '女', '大人', '謎めいた', 1, '先週'],
    ['ハル', 15, '女', '親友', '天真爛漫', 1, '先週'],
    ['タクミ', 17, '男', 'サブ', '不器用', 1, '3日前'],
    ['アオ', 16, '女', 'サブ', '毒舌', 1, '先週'],
    ['先生', 45, '男', '大人', '寡黙', 2, '昨日'],
  ];
  return (
    <Chrome active="char" collapsed={collapsed}>
      <div style={{ padding: '18px 24px', height: '100%', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Hand size={20} style={{ fontWeight: 700 }}>キャラクター ({chars.length})</Hand>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn ghost small><IconGlyph kind="grid" size={12} /></Btn>
            <Btn small style={{ background: WIRE.paperAlt }}><IconGlyph kind="list" size={12} /></Btn>
            <Btn primary><IconGlyph kind="plus" size={12} color="#fff" /> 新規</Btn>
          </div>
        </div>
        <Box style={{ padding: 0 }}>
          {/* header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '40px 1.3fr 60px 60px 100px 1.8fr 80px 80px 30px', padding: '8px 14px', borderBottom: `1.2px solid ${WIRE.line}`, fontSize: 10, color: WIRE.ink3, fontWeight: 600, letterSpacing: 0.5 }}>
            <div>#</div><div>名前</div><div>年齢</div><div>性別</div><div>役割</div><div>性格</div><div>登場</div><div>更新</div><div></div>
          </div>
          {chars.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1.3fr 60px 60px 100px 1.8fr 80px 80px 30px', padding: '8px 14px', borderBottom: `1px dashed ${WIRE.lineSoft}`, fontSize: 12, alignItems: 'center' }}>
              <div style={{ color: WIRE.ink3, fontFamily: fontMono }}>{String(i + 1).padStart(2, '0')}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: 12, background: WIRE.paperAlt, border: `1px solid ${WIRE.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: fontHand, fontWeight: 600 }}>{r[0][0]}</div>
                <Hand size={13} style={{ fontWeight: 600 }}>{r[0]}</Hand>
              </div>
              <div>{r[1]}</div>
              <div>{r[2]}</div>
              <div><span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 8, background: WIRE.paperAlt, color: WIRE.ink2 }}>{r[3]}</span></div>
              <div style={{ fontFamily: fontHand, color: WIRE.ink2 }}>{r[4]}</div>
              <div style={{ color: WIRE.ink3 }}>{r[5]} シナリオ</div>
              <div style={{ color: WIRE.ink3, fontSize: 11 }}>{r[6]}</div>
              <div><IconGlyph kind="dots" size={14} color={WIRE.ink3} /></div>
            </div>
          ))}
        </Box>
      </div>
    </Chrome>
  );
};

Object.assign(window, { CharListA, CharListB, CharListC });
