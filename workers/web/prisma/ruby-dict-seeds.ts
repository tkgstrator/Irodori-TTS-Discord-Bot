import { z } from 'zod'

const RubyDictSeedEntrySchema = z.object({
  word: z.string().min(1),
  reading: z.string().min(1)
})

const RubyDictSeedSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  entries: z.array(RubyDictSeedEntrySchema)
})

const RubyDictSeedListSchema = z.array(RubyDictSeedSchema)

export type RubyDictSeed = z.infer<typeof RubyDictSeedSchema>

const rubyDictSeedRowsResult = RubyDictSeedListSchema.safeParse([
  {
    id: '7cf1f934-0209-4adf-95fe-5d307f164e79',
    name: '超かぐや姫',
    entries: [
      { word: '酒寄', reading: 'さかより' },
      { word: '彩葉', reading: 'いろは' }
    ]
  },
  {
    id: '352438c4-df67-4312-baec-1861a4126603',
    name: 'ちえりーらんど',
    entries: [
      { word: 'ぱとて君', reading: 'ぱとてくん' },
      { word: '君', reading: 'きみ' }
    ]
  },
  {
    id: '6210a10f-6f18-4e27-9a89-192edb633c1e',
    name: '孤島症候群',
    entries: [{ word: '高橋家', reading: 'たかはしけ' }]
  },
  {
    id: '07c21f3a-8558-47d3-8d5e-823eb336e3b9',
    name: '地名',
    entries: [
      { word: '茨城', reading: 'いばらき' },
      { word: '高槻', reading: 'たかつき' }
    ]
  }
])

if (!rubyDictSeedRowsResult.success) {
  throw new Error(`Invalid ruby dict seeds: ${rubyDictSeedRowsResult.error.message}`)
}

export const rubyDictSeedRows = rubyDictSeedRowsResult.data
