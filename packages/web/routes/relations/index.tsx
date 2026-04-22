import {
  applyNodeChanges,
  Background,
  BaseEdge,
  Controls,
  type Edge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
  Handle,
  MarkerType,
  type Node,
  type NodeChange,
  type NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { createFileRoute } from '@tanstack/react-router'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTheme } from '@/components/theme-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Relation, RelationCharacter, RelationType } from '@/lib/relations'
import { useRelations } from '@/lib/relations'

export const Route = createFileRoute('/relations/')({
  component: RelationsPageWrapper
})

const INITIAL_NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  renka: { x: 80, y: 200 },
  sakurako: { x: 400, y: 30 },
  shota: { x: 400, y: 370 },
  mizuki: { x: 720, y: 200 },
  hayato: { x: 720, y: 450 },
  kazuki: { x: 80, y: 450 }
}

const AVATAR_COLORS: Record<string, string> = {
  renka: 'hsl(var(--primary))',
  sakurako: '#22c55e',
  shota: '#ec4899',
  mizuki: '#3b82f6',
  hayato: '#ef4444',
  kazuki: '#3b82f6'
}

interface RelationTypeConfig {
  readonly lightColor: string
  readonly darkColor: string
  readonly label: string
  readonly dashed: boolean
}

const RELATION_TYPE_CONFIG: Record<RelationType, RelationTypeConfig> = {
  family: { lightColor: '#22c55e', darkColor: '#4ade80', label: '家族', dashed: false },
  friend: { lightColor: '#3b82f6', darkColor: '#60a5fa', label: '友人', dashed: false },
  rival: { lightColor: '#ef4444', darkColor: '#f87171', label: 'ライバル', dashed: true },
  love: { lightColor: '#ec4899', darkColor: '#f472b6', label: '恋愛', dashed: false }
}

const RELATION_TYPES: readonly RelationType[] = ['family', 'friend', 'rival', 'love']

function isDarkMode(theme: string): boolean {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

function getEdgeColor(type: RelationType, dark: boolean): string {
  const cfg = RELATION_TYPE_CONFIG[type]
  return dark ? cfg.darkColor : cfg.lightColor
}

type CharacterNodeData = {
  character: RelationCharacter
  relationCount: number
  selected: boolean
  avatarColor: string
}

type CharacterNode = Node<CharacterNodeData, 'character'>

function CharacterNodeComponent({ data }: NodeProps<CharacterNode>) {
  const { character, relationCount, selected, avatarColor } = data

  return (
    <div
      className={[
        'rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md select-none w-[170px]',
        selected ? 'ring-2 ring-ring ring-offset-2' : ''
      ].join(' ')}
    >
      <Handle type="target" position={Position.Left} className="!size-2 !border-border !bg-background" />
      <Handle type="source" position={Position.Right} className="!size-2 !border-border !bg-background" />

      <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: avatarColor }}
        >
          {character.initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">{character.name}</p>
          <p className="truncate text-[0.625rem] text-muted-foreground leading-tight">{character.role}</p>
        </div>
      </div>

      <div className="border-t border-border mx-2 mb-2 mt-1 pt-1 flex justify-center">
        <Badge variant="secondary" className="text-[0.625rem] px-1.5 py-0">
          {relationCount} 関係
        </Badge>
      </div>
    </div>
  )
}

const NODE_TYPES = { character: CharacterNodeComponent }

type RelationEdgeData = {
  relationType: RelationType
  relationLabel: string
  dark: boolean
}

type RelationEdge = Edge<RelationEdgeData, 'relation'>

function RelationEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd
}: EdgeProps<RelationEdge>) {
  const relationType = data?.relationType ?? 'friend'
  const relationLabel = data?.relationLabel ?? ''
  const dark = data?.dark ?? false

  const cfg = RELATION_TYPE_CONFIG[relationType]
  const color = getEdgeColor(relationType, dark)

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth: 1.5,
          strokeDasharray: cfg.dashed ? '5 3' : undefined,
          opacity: 0.7
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute cursor-pointer rounded px-1.5 py-0.5 text-[9px] font-medium transition-opacity hover:opacity-100"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            color,
            backgroundColor: 'hsl(var(--card))',
            border: `1px solid ${color}33`,
            opacity: 0.85
          }}
        >
          {relationLabel}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

const EDGE_TYPES = { relation: RelationEdgeComponent }

function RelationTypeDot({ type }: { type: RelationType }) {
  const cfg = RELATION_TYPE_CONFIG[type]
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center w-8">
        <div className="h-px w-full" style={{ backgroundColor: cfg.lightColor, opacity: 0.8 }} />
        {cfg.dashed && (
          <div
            className="absolute inset-0 h-px w-full"
            style={{
              backgroundImage: `repeating-linear-gradient(to right, ${cfg.lightColor} 0, ${cfg.lightColor} 4px, transparent 4px, transparent 7px)`
            }}
          />
        )}
      </div>
      <span className="text-xs text-muted-foreground">{cfg.label}</span>
    </div>
  )
}

interface RelationDialogState {
  readonly open: boolean
  readonly editingId: string | null
  readonly sourceId: string
  readonly targetId: string
  readonly type: RelationType
  readonly label: string
}

const EMPTY_DIALOG: RelationDialogState = {
  open: false,
  editingId: null,
  sourceId: '',
  targetId: '',
  type: 'friend',
  label: ''
}

function RelationsPageWrapper() {
  return (
    <ReactFlowProvider>
      <RelationsPage />
    </ReactFlowProvider>
  )
}

function RelationsPage() {
  const { characters, relations, getCharacter, getRelationsFor, addRelation, updateRelation, deleteRelation } =
    useRelations()
  const { theme } = useTheme()
  const [selectedCharId, setSelectedCharId] = useState('renka')
  const [search, setSearch] = useState('')
  const [nodePositions, setNodePositions] = useState(INITIAL_NODE_POSITIONS)
  const [dialog, setDialog] = useState<RelationDialogState>(EMPTY_DIALOG)

  const dark = isDarkMode(theme)

  const selectedChar = useMemo(() => getCharacter(selectedCharId), [getCharacter, selectedCharId])
  const selectedRelations = useMemo(() => getRelationsFor(selectedCharId), [getRelationsFor, selectedCharId])

  const relationCountMap = useMemo(
    () =>
      characters.reduce<Record<string, number>>((acc, c) => {
        acc[c.id] = getRelationsFor(c.id).length
        return acc
      }, {}),
    [characters, getRelationsFor]
  )

  const filteredCharacters = useMemo(() => {
    if (!search.trim()) return characters
    const q = search.toLowerCase()
    return characters.filter((c) => c.name.includes(q) || c.role.toLowerCase().includes(q))
  }, [characters, search])

  const nodes: CharacterNode[] = useMemo(
    () =>
      filteredCharacters.map((char) => ({
        id: char.id,
        type: 'character' as const,
        position: nodePositions[char.id] ?? { x: 0, y: 0 },
        data: {
          character: char,
          relationCount: relationCountMap[char.id] ?? 0,
          selected: char.id === selectedCharId,
          avatarColor:
            char.id === selectedCharId ? 'hsl(var(--primary))' : (AVATAR_COLORS[char.id] ?? 'hsl(var(--primary))')
        }
      })),
    [filteredCharacters, relationCountMap, selectedCharId, nodePositions]
  )

  const edges: RelationEdge[] = useMemo(
    () =>
      relations.map((rel) => ({
        id: rel.id,
        source: rel.sourceId,
        target: rel.targetId,
        type: 'relation' as const,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: getEdgeColor(rel.type, dark),
          width: 16,
          height: 16
        },
        data: {
          relationType: rel.type,
          relationLabel: rel.label,
          dark
        }
      })),
    [relations, dark]
  )

  const onNodesChange = useCallback(
    (changes: NodeChange<CharacterNode>[]) => {
      const applied = applyNodeChanges(changes, nodes)
      const positionChanges = changes.filter((c) => c.type === 'position' && c.position)
      if (positionChanges.length > 0) {
        setNodePositions((prev) => {
          const next = { ...prev }
          for (const node of applied) {
            next[node.id] = node.position
          }
          return next
        })
      }
    },
    [nodes]
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: CharacterNode) => {
    setSelectedCharId(node.id)
  }, [])

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: RelationEdge) => {
      const rel = relations.find((r) => r.id === edge.id)
      if (!rel) return
      setDialog({
        open: true,
        editingId: rel.id,
        sourceId: rel.sourceId,
        targetId: rel.targetId,
        type: rel.type,
        label: rel.label
      })
    },
    [relations]
  )

  const openAddDialog = useCallback(() => {
    setDialog({
      ...EMPTY_DIALOG,
      open: true,
      sourceId: selectedCharId,
      targetId: characters.find((c) => c.id !== selectedCharId)?.id ?? ''
    })
  }, [selectedCharId, characters])

  const openEditDialog = useCallback((rel: Relation) => {
    setDialog({
      open: true,
      editingId: rel.id,
      sourceId: rel.sourceId,
      targetId: rel.targetId,
      type: rel.type,
      label: rel.label
    })
  }, [])

  const handleDialogSave = useCallback(() => {
    if (!dialog.sourceId || !dialog.targetId || !dialog.label.trim()) return
    const input = {
      sourceId: dialog.sourceId,
      targetId: dialog.targetId,
      type: dialog.type,
      label: dialog.label.trim()
    }
    if (dialog.editingId) {
      updateRelation(dialog.editingId, input)
    } else {
      addRelation(input)
    }
    setDialog(EMPTY_DIALOG)
  }, [dialog, addRelation, updateRelation])

  const handleDelete = useCallback(
    (id: string) => {
      deleteRelation(id)
    },
    [deleteRelation]
  )

  const availableTargets = useMemo(
    () => characters.filter((c) => c.id !== dialog.sourceId),
    [characters, dialog.sourceId]
  )

  return (
    <div className="-m-4 sm:-m-6 flex h-[calc(100svh-3.5rem)] flex-col">
      {/* Header */}
      <div className="h-12 shrink-0 border-b border-border px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm font-semibold whitespace-nowrap">キャラクター関係図</h1>
          <Badge variant="secondary" className="text-xs whitespace-nowrap">
            {characters.length} キャラクター · {relations.length} 関係
          </Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative hidden sm:block">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="text"
              placeholder="検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 w-48 text-xs"
              aria-label="キャラクターを検索"
            />
          </div>
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={openAddDialog}>
            <Plus className="size-3.5" />
            関係を追加
          </Button>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 min-h-0">
        {/* Canvas */}
        <div className="relative flex-1">
          <ReactFlow<CharacterNode, RelationEdge>
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            edgeTypes={EDGE_TYPES}
            onNodesChange={onNodesChange}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.3}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
            colorMode={dark ? 'dark' : 'light'}
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable={false}
          >
            <Background gap={24} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        {/* Sidebar */}
        <div className="w-72 shrink-0 flex flex-col border-l border-border bg-card overflow-y-auto">
          {selectedChar ? (
            <>
              {/* Character info */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: AVATAR_COLORS[selectedChar.id] ?? 'hsl(var(--primary))' }}
                  >
                    {selectedChar.initial}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold leading-tight">{selectedChar.name}</p>
                    <p className="text-xs text-muted-foreground leading-tight mt-0.5">{selectedChar.role}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1" onClick={openAddDialog}>
                  <Plus className="size-3" />
                  関係を追加
                </Button>
              </div>

              {/* Relations */}
              <div className="p-4 flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  関係 ({selectedRelations.length})
                </p>
                <div className="flex flex-col gap-2">
                  {selectedRelations.map((rel) => {
                    const otherId = rel.sourceId === selectedCharId ? rel.targetId : rel.sourceId
                    const other = getCharacter(otherId)
                    if (!other) return null
                    const cfg = RELATION_TYPE_CONFIG[rel.type]
                    const color = dark ? cfg.darkColor : cfg.lightColor
                    return (
                      <div
                        key={rel.id}
                        className="group flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2"
                      >
                        <button
                          type="button"
                          className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                          onClick={() => setSelectedCharId(otherId)}
                        >
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ backgroundColor: AVATAR_COLORS[otherId] ?? 'hsl(var(--primary))' }}
                          >
                            {other.initial}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-tight">{other.name}</p>
                            <p className="text-[0.625rem] text-muted-foreground leading-tight mt-0.5">{rel.label}</p>
                          </div>
                        </button>
                        <span
                          className="shrink-0 rounded-full px-1.5 py-0.5 text-[0.625rem] font-medium text-white"
                          style={{ backgroundColor: color }}
                        >
                          {cfg.label}
                        </span>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            type="button"
                            className="size-6 flex items-center justify-center rounded hover:bg-accent"
                            aria-label="編集"
                            onClick={() => openEditDialog(rel)}
                          >
                            <Pencil className="size-3 text-muted-foreground" />
                          </button>
                          <button
                            type="button"
                            className="size-6 flex items-center justify-center rounded hover:bg-destructive/10"
                            aria-label="削除"
                            onClick={() => handleDelete(rel.id)}
                          >
                            <Trash2 className="size-3 text-destructive" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="p-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">凡例</p>
                <div className="flex flex-col gap-1.5">
                  {(Object.keys(RELATION_TYPE_CONFIG) as RelationType[]).map((type) => (
                    <RelationTypeDot key={type} type={type} />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-4 text-center">
              <p className="text-sm text-muted-foreground">キャラクターを選択してください</p>
            </div>
          )}
        </div>
      </div>

      {/* Relation Dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => setDialog((prev) => (open ? prev : EMPTY_DIALOG))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog.editingId ? '関係を編集' : '関係を追加'}</DialogTitle>
            <DialogDescription>キャラクター間の関係を設定します。</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>ソース</Label>
              <Select
                value={dialog.sourceId}
                onValueChange={(v) =>
                  setDialog((prev) => ({
                    ...prev,
                    sourceId: v,
                    targetId: prev.targetId === v ? '' : prev.targetId
                  }))
                }
              >
                <SelectTrigger className="w-full" aria-label="ソースキャラクター">
                  <SelectValue placeholder="キャラクターを選択" />
                </SelectTrigger>
                <SelectContent>
                  {characters.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}（{c.role}）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>ターゲット</Label>
              <Select value={dialog.targetId} onValueChange={(v) => setDialog((prev) => ({ ...prev, targetId: v }))}>
                <SelectTrigger className="w-full" aria-label="ターゲットキャラクター">
                  <SelectValue placeholder="キャラクターを選択" />
                </SelectTrigger>
                <SelectContent>
                  {availableTargets.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}（{c.role}）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>関係タイプ</Label>
              <Select
                value={dialog.type}
                onValueChange={(v) => setDialog((prev) => ({ ...prev, type: v as RelationType }))}
              >
                <SelectTrigger className="w-full" aria-label="関係タイプ">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block size-2.5 rounded-full"
                          style={{ backgroundColor: RELATION_TYPE_CONFIG[t].lightColor }}
                        />
                        {RELATION_TYPE_CONFIG[t].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>ラベル</Label>
              <Input
                value={dialog.label}
                onChange={(e) => setDialog((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="例: 姉妹、恋人、ライバル"
                aria-label="関係ラベル"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(EMPTY_DIALOG)}>
              キャンセル
            </Button>
            <Button onClick={handleDialogSave} disabled={!dialog.sourceId || !dialog.targetId || !dialog.label.trim()}>
              {dialog.editingId ? '更新' : '追加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
