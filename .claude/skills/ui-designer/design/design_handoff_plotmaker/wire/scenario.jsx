// シナリオ作成 3案

// ── 案A: 本文エディタ中心 + 右サイドにメタ ──
const ScenarioA = ({ collapsed }) => (
  <Chrome active="scenario" collapsed={collapsed} headerTitle="夏の終わりに">
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ flex: 1, padding: '18px 32px', overflow: 'auto' }}>
        <div style={{ fontSize: 10, color: WIRE.ink3 }}>← シナリオ一覧</div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Hand size={26} style={{ fontWeight: 700, flex: 1 }}>夏の終わりに</Hand>
          <Btn small ghost>保存済み</Btn>
          <Btn small primary><IconGlyph kind="sparkle" size={12} color="#fff" /> 生成</Btn>
        </div>
        <div style={{ marginTop: 2, fontSize: 11, color: WIRE.ink3 }}>自動保存: たった今</div>

        <div style={{ marginTop: 18, fontSize: 11, color: WIRE.ink3, fontFamily: fontMono }}>あらすじ</div>
        <div style={{ marginTop: 4, padding: 14, border: `1.2px solid ${WIRE.lineSoft}`, borderRadius: 4, fontFamily: fontHand, fontSize: 14, lineHeight: 1.7, background: '#fff', minHeight: 260 }}>
          高校3年の夏、カイとリンは海辺の小さな町で再会する。<br/>
          幼なじみだった2人は、5年前の事件をきっかけに疎遠になっていた。<br/>
          町に伝わる古い伝承と、ユウが密かに進めていた計画が…
          <div style={{ marginTop: 10, padding: '8px 10px', background: WIRE.highlight, borderRadius: 4, display: 'inline-block' }}>
            <span style={{ fontSize: 11, color: WIRE.ink2 }}>💭 この先をAIが続きを書きます →</span>
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <Btn small ghost>章を追加</Btn>
          <Btn small ghost>キャラを呼び出す @</Btn>
          <Btn small ghost>参考作品を引用</Btn>
        </div>
      </div>

      <div style={{ width: 260, padding: '18px 18px', background: WIRE.paperAlt, overflow: 'auto', borderLeft: `1px dashed ${WIRE.lineSoft}` }}>
        <Field label="舞台 / 世界観" value="現代日本、瀬戸内の海辺の町" multiline lines={3} />
        <div style={{ height: 12 }} />
        <Field label="参考作品" value="小説『海辺のカフカ』、映画『リトル・フォレスト』" multiline lines={3} />
        <div style={{ height: 18 }} />
        <div style={{ fontSize: 11, color: WIRE.ink3, marginBottom: 6 }}>登場キャラクター</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {['カイ', 'リン', 'ユウ', 'ミサ'].map((n, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: '#fff', border: `1px solid ${WIRE.lineSoft}`, borderRadius: 4 }}>
              <div style={{ width: 22, height: 22, borderRadius: 11, background: WIRE.paperAlt, border: `1px solid ${WIRE.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: fontHand, fontWeight: 600 }}>{n[0]}</div>
              <span style={{ fontSize: 12 }}>{n}</span>
              <span style={{ flex: 1 }} />
              <IconGlyph kind="close" size={10} color={WIRE.ink3} />
            </div>
          ))}
          <div style={{ padding: '5px 8px', border: `1px dashed ${WIRE.lineSoft}`, borderRadius: 4, fontSize: 11, color: WIRE.ink3, textAlign: 'center' }}>+ キャラを追加</div>
        </div>
      </div>
    </div>
  </Chrome>
);

// ── 案B: ノート風カード + AI生成パネル ──
const ScenarioB = ({ collapsed }) => (
  <Chrome active="scenario" collapsed={collapsed} headerTitle="赤い回廊の秘密">
    <div style={{ padding: '16px 28px', height: '100%', overflow: 'auto' }}>
      <Hand size={22} style={{ fontWeight: 700 }}>赤い回廊の秘密</Hand>
      <div style={{ fontSize: 11, color: WIRE.ink3 }}>ミステリー · 全5章 · キャラ3人</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <Box style={{ padding: 12 }}>
          <div style={{ fontSize: 10, color: WIRE.ink3, letterSpacing: 1 }}>TITLE</div>
          <Hand size={18} style={{ fontWeight: 600, display: 'block', marginTop: 2 }}>赤い回廊の秘密</Hand>
        </Box>
        <Box style={{ padding: 12 }}>
          <div style={{ fontSize: 10, color: WIRE.ink3, letterSpacing: 1 }}>STAGE / 世界観</div>
          <div style={{ fontFamily: fontHand, fontSize: 13, marginTop: 2, lineHeight: 1.4 }}>昭和40年代、山間の寄宿学校</div>
        </Box>
        <div style={{ gridColumn: 'span 2' }}>
          <Box style={{ padding: 14, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 10, color: WIRE.ink3, letterSpacing: 1 }}>SYNOPSIS / あらすじ</div>
              <span style={{ fontSize: 10, color: WIRE.ink3 }}>124 / 500 字</span>
            </div>
            <div style={{ marginTop: 8, fontFamily: fontHand, fontSize: 14, lineHeight: 1.7 }}>
              寄宿学校「朱雀寮」で起きた連続失踪事件。残された手がかりは赤い紐と一枚の写真だけ。新入生の主人公は、校舎の奥にある立入禁止の回廊に秘密が眠ることを知る——
            </div>
          </Box>
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <Box style={{ padding: 12 }}>
            <div style={{ fontSize: 10, color: WIRE.ink3, letterSpacing: 1 }}>REFERENCES / 参考作品</div>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['『悪霊島』横溝正史', '『十角館の殺人』', '映画『告白』'].map((t, i) => (
                <div key={i} style={{ padding: '4px 10px', border: `1px solid ${WIRE.lineSoft}`, borderRadius: 14, fontSize: 11, background: WIRE.paperAlt }}>{t}</div>
              ))}
              <div style={{ padding: '4px 10px', border: `1px dashed ${WIRE.lineSoft}`, borderRadius: 14, fontSize: 11, color: WIRE.ink3 }}>+ 追加</div>
            </div>
          </Box>
        </div>
      </div>

      {/* AI 生成パネル */}
      <Box style={{ marginTop: 16, padding: 14, background: WIRE.paperAlt, borderStyle: 'solid' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconGlyph kind="sparkle" size={16} color={WIRE.accent} />
          <Hand size={14} style={{ fontWeight: 600 }}>この情報からシナリオを生成</Hand>
          <span style={{ flex: 1 }} />
          <Btn primary>生成する</Btn>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          {['短編 (5章)', '長編 (20章)', '章立てのみ'].map((p, i) => (
            <div key={i} style={{ padding: '6px 12px', border: `1px solid ${i === 0 ? WIRE.ink : WIRE.lineSoft}`, borderRadius: 14, fontSize: 11, background: i === 0 ? '#fff' : 'transparent' }}>{p}</div>
          ))}
        </div>
      </Box>
      <Note style={{ position: 'absolute', right: 40, top: 200 }} rotate={4}>生成結果は右パネルに表示 / 何度でも再生成OK</Note>
    </div>
  </Chrome>
);

// ── 案C: 3カラム(章立て + 本文 + アウトライン) ──
const ScenarioC = ({ collapsed }) => (
  <Chrome active="scenario" collapsed={collapsed} headerTitle="無題 v3">
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ width: 200, borderRight: `1px dashed ${WIRE.lineSoft}`, padding: '14px 10px', overflow: 'auto' }}>
        <div style={{ fontSize: 10, color: WIRE.ink3, padding: '0 6px 8px', letterSpacing: 1 }}>章立て</div>
        {['序章', '第1章 出会い', '第2章 疑惑', '第3章 追跡', '第4章 対峙', '終章'].map((t, i) => (
          <div key={i} style={{
            padding: '7px 10px', fontSize: 12, borderRadius: 4,
            background: i === 2 ? WIRE.paperAlt : 'transparent',
            fontWeight: i === 2 ? 600 : 400,
            color: i === 2 ? WIRE.ink : WIRE.ink2,
            marginBottom: 2,
          }}>
            <Hand size={12}>{t}</Hand>
          </div>
        ))}
        <div style={{ padding: '7px 10px', fontSize: 11, color: WIRE.ink3, border: `1px dashed ${WIRE.lineSoft}`, borderRadius: 4, marginTop: 6, textAlign: 'center' }}>+ 章を追加</div>
      </div>

      <div style={{ flex: 1, padding: '18px 24px', overflow: 'auto' }}>
        <div style={{ fontSize: 10, color: WIRE.ink3, letterSpacing: 1 }}>第2章</div>
        <Hand size={22} style={{ fontWeight: 700 }}>疑惑</Hand>
        <div style={{ marginTop: 14, padding: 14, border: `1.2px solid ${WIRE.lineSoft}`, borderRadius: 4, fontFamily: fontHand, fontSize: 14, lineHeight: 1.8, background: '#fff', minHeight: 280 }}>
          カイは港で古い写真を見つける。<br/>そこに写っていたのは、見覚えのある少女——<br/><br/>
          <span style={{ color: WIRE.ink3 }}>（この先を書くか、@AIで続きを生成）</span>
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <Btn small ghost>@ キャラ</Btn>
          <Btn small ghost># 場所</Btn>
          <Btn small primary><IconGlyph kind="sparkle" size={10} color="#fff"/> 続きを生成</Btn>
        </div>
      </div>

      <div style={{ width: 240, padding: '14px 16px', background: WIRE.paperAlt, overflow: 'auto', borderLeft: `1px dashed ${WIRE.lineSoft}` }}>
        <div style={{ fontSize: 10, color: WIRE.ink3, letterSpacing: 1 }}>OUTLINE</div>
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['起', 'カイが古い写真を発見'],
            ['承', 'リンに写真のことを相談'],
            ['転', 'ユウが実は関係者だと判明'],
            ['結', '次章への引き'],
          ].map(([k, v], i) => (
            <Box key={i} style={{ padding: 8, background: '#fff' }}>
              <span style={{ fontSize: 10, color: WIRE.accent, fontWeight: 700 }}>{k}</span>
              <div style={{ fontFamily: fontHand, fontSize: 12, marginTop: 2 }}>{v}</div>
            </Box>
          ))}
        </div>
      </div>
    </div>
  </Chrome>
);

Object.assign(window, { ScenarioA, ScenarioB, ScenarioC });
