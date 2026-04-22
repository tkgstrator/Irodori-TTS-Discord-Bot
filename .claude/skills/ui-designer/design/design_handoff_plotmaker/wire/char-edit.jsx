// キャラクター作成/編集 3案

// ── 案A: 縦スクロール型フォーム ──
const CharEditA = ({ collapsed }) => (
  <Chrome active="char" collapsed={collapsed} headerTitle="キャラクター / カイ を編集">
    <div style={{ padding: '18px 32px', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: WIRE.ink3 }}>← キャラクター一覧</div>
          <Hand size={22} style={{ fontWeight: 700 }}>新しいキャラクター</Hand>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn ghost small>キャンセル</Btn>
          <Btn primary><IconGlyph kind="save" size={12} color="#fff" /> 保存</Btn>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ width: 160, flexShrink: 0, textAlign: 'center' }}>
          <div style={{ width: 140, height: 140, borderRadius: 70, border: `1.5px dashed ${WIRE.line}`, background: WIRE.paperAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
            <IconGlyph kind="plus" size={22} color={WIRE.ink3} />
            <span style={{ fontSize: 10, color: WIRE.ink3 }}>画像を追加</span>
          </div>
          <div style={{ marginTop: 10, fontSize: 10, color: WIRE.ink3 }}>任意</div>
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="名前 *" value="カイ" />
          <div style={{ display: 'flex', gap: 10 }}>
            <Field label="年齢" value="17" w={80} />
            <Field label="性別" value="男" w={100} />
          </div>
          <div style={{ gridColumn: 'span 2' }}><Field label="役割 (タグ)" value="主人公" /></div>
          <div style={{ gridColumn: 'span 2' }}><Field label="性格" value="頑固で一本気。仲間想いだが不器用。" multiline lines={2} /></div>
          <div style={{ gridColumn: 'span 2' }}><Field label="外見" value="黒髪ショート。左目の下に傷。" multiline lines={2} /></div>
          <div style={{ gridColumn: 'span 2' }}><Field label="背景 / 経歴" multiline lines={3} hint="生い立ち、重要な出来事など…" /></div>
          <Field label="口調 / 話し方" hint="例: ぶっきらぼう" multiline lines={2} />
          <Field label="目標 / 動機" hint="キャラを動かすもの" multiline lines={2} />
        </div>
      </div>
      <Note style={{ position: 'absolute', right: 28, top: 120 }} rotate={3}>
        * は必須 / 他は空欄でもOK → AIが補完
      </Note>
    </div>
  </Chrome>
);

// ── 案B: 2ペイン(フォーム + ライブプレビュー) ──
const CharEditB = ({ collapsed }) => (
  <Chrome active="char" collapsed={collapsed} headerTitle="カイ">
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ flex: 1, padding: '18px 24px', overflow: 'auto', borderRight: `1px dashed ${WIRE.lineSoft}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Hand size={16} style={{ fontWeight: 700 }}>編集</Hand>
          <Btn small ghost><IconGlyph kind="sparkle" size={12} color={WIRE.accent} /> AIで埋める</Btn>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <Field label="名前" value="カイ" />
            <Field label="年齢" value="17" w={70} />
            <Field label="性別" value="男" w={80} />
          </div>
          <Field label="性格" value="頑固で一本気。仲間想い。" multiline lines={2} />
          <Field label="外見" value="黒髪、傷" multiline lines={2} />
          <Field label="背景" multiline lines={3} hint="…" />
          <Field label="口調" hint="〜だ、〜だろ" />
          <Field label="目標 / 動機" multiline lines={2} hint="…" />
        </div>
      </div>
      <div style={{ width: 320, padding: '18px 20px', background: WIRE.paperAlt, overflow: 'auto' }}>
        <div style={{ fontSize: 10, color: WIRE.ink3, letterSpacing: 1 }}>PREVIEW</div>
        <div style={{ marginTop: 10, textAlign: 'center' }}>
          <div style={{ width: 96, height: 96, borderRadius: 48, margin: '0 auto', background: '#fff', border: `1.2px solid ${WIRE.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fontHand, fontSize: 36, fontWeight: 700 }}>カ</div>
          <Hand size={20} style={{ fontWeight: 700, display: 'block', marginTop: 8 }}>カイ</Hand>
          <div style={{ fontSize: 11, color: WIRE.ink3 }}>17歳 · 男</div>
        </div>
        <div style={{ marginTop: 16 }}>
          {[
            ['性格', '頑固で一本気。仲間想い。'],
            ['外見', '黒髪、傷'],
            ['口調', '—'],
            ['目標', '—'],
          ].map(([l, v], i) => (
            <div key={i} style={{ padding: '8px 0', borderBottom: `1px dashed ${WIRE.lineSoft}` }}>
              <div style={{ fontSize: 10, color: WIRE.ink3 }}>{l}</div>
              <div style={{ fontFamily: fontHand, fontSize: 12, marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </Chrome>
);

// ── 案C: タブ分け + AI対話 ──
const CharEditC = ({ collapsed }) => {
  const tabs = ['基本', '性格', '背景', '口調', 'メモ'];
  return (
    <Chrome active="char" collapsed={collapsed} headerTitle="カイ · 編集">
      <div style={{ padding: '14px 24px', height: '100%', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
          <div style={{ width: 52, height: 52, borderRadius: 26, background: WIRE.paperAlt, border: `1.2px solid ${WIRE.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fontHand, fontSize: 20, fontWeight: 700 }}>カ</div>
          <div style={{ flex: 1 }}>
            <Hand size={20} style={{ fontWeight: 700 }}>カイ</Hand>
            <div style={{ fontSize: 10, color: WIRE.ink3 }}>最終更新: 2日前 · 自動保存中</div>
          </div>
          <Btn ghost small>プレビュー</Btn>
          <Btn primary small>完了</Btn>
        </div>
        <div style={{ display: 'flex', gap: 4, borderBottom: `1.2px solid ${WIRE.line}` }}>
          {tabs.map((t, i) => (
            <div key={i} style={{
              padding: '6px 14px', fontSize: 12,
              borderBottom: i === 1 ? `2px solid ${WIRE.accent}` : '2px solid transparent',
              marginBottom: -1.2,
              color: i === 1 ? WIRE.ink : WIRE.ink3,
              fontWeight: i === 1 ? 600 : 400,
            }}>{t}</div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: 16 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="主要な性格特性" value="頑固 / 一本気 / 内気" />
            <Field label="長所" value="仲間思い・芯がある" multiline lines={2} />
            <Field label="短所" value="頑固すぎて周りと衝突する" multiline lines={2} />
            <Field label="口ぐせ / 特徴的な行動" multiline lines={2} hint="例: 困ると左目の傷を触る" />
          </div>
          <div style={{ width: 280, flexShrink: 0 }}>
            <Box style={{ background: WIRE.paperAlt, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <IconGlyph kind="sparkle" size={14} color={WIRE.accent} />
                <Hand size={13} style={{ fontWeight: 600 }}>AI アシスタント</Hand>
              </div>
              <div style={{ fontSize: 11, color: WIRE.ink2, lineHeight: 1.5 }}>
                名前と年齢から、性格を3パターン提案します：
              </div>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['① 頑固で一本気', '② 明朗快活', '③ 内向的で繊細'].map((t, i) => (
                  <Box key={i} style={{ padding: 8, fontSize: 11, background: '#fff' }}>
                    <Hand size={12}>{t}</Hand>
                  </Box>
                ))}
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center', border: `1px solid ${WIRE.lineSoft}`, borderRadius: 16, padding: '4px 10px', background: '#fff' }}>
                <span style={{ fontSize: 11, color: WIRE.ink3, flex: 1 }}>AIに質問…</span>
                <IconGlyph kind="arrow" size={12} />
              </div>
            </Box>
          </div>
        </div>
      </div>
    </Chrome>
  );
};

Object.assign(window, { CharEditA, CharEditB, CharEditC });
