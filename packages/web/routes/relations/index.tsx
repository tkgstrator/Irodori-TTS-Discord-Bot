import {
  Background,
  BaseEdge,
  type Connection,
  Controls,
  type Edge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
  Handle,
  MarkerType,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useReactFlow
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { createFileRoute } from '@tanstack/react-router'
import { Pencil, Plus, Trash2, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from '@/components/theme-provider'
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

const NEW_NODE_COLORS = ['#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f43f5e', '#6366f1']

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

function getAvatarColor(id: string): string {
  return AVATAR_COLORS[id] ?? NEW_NODE_COLORS[id.charCodeAt(0) % NEW_NODE_COLORS.length]
}

type CharacterNodeData = {
  character: RelationCharacter
  selected: boolean
  avatarColor: string
}

type CharacterNode = Node<CharacterNodeData, 'character'>

function CharacterNodeComponent({ data }: NodeProps<CharacterNode>) {
  const { character, selected, avatarColor } = data

  return (
    <div
      className={[
        'rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md select-none w-[160px]',
        selected ? 'ring-2 ring-ring ring-offset-2' : ''
      ].join(' ')}
    >
      <Handle type="target" position={Position.Left} className="!size-2 !border-border !bg-background" />
      <Handle type="source" position={Position.Right} className="!size-2 !border-border !bg-background" />

      <div className="flex items-center gap-2 px-3 py-2.5">
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

const EMPTY_RELATION_DIALOG: RelationDialogState = {
  open: false,
  editingId: null,
  sourceId: '',
  targetId: '',
  type: 'friend',
  label: ''
}

interface CharacterDialogState {
  readonly open: boolean
  readonly name: string
  readonly initial: string
  readonly role: string
}

const EMPTY_CHARACTER_DIALOG: CharacterDialogState = {
  open: false,
  name: '',
  initial: '',
  role: ''
}

interface RelationsPanelProps {
  readonly className?: string
  readonly dark: boolean
  readonly selectedChar: RelationCharacter | undefined
  readonly selectedCharId: string
  readonly selectedRelations: readonly Relation[]
  readonly getCharacter: (id: string) => RelationCharacter | undefined
  readonly onSelectChar: (id: string) => void
  readonly onAddRelation: () => void
  readonly onEditRelation: (rel: Relation) => void
  readonly onDeleteRelation: (id: string) => void
  readonly onDeleteChar: () => void
}

// 相関図の詳細パネルをモバイル・デスクトップで共通利用する
const RelationsPanel = ({
  className,
  dark,
  selectedChar,
  selectedCharId,
  selectedRelations,
  getCharacter,
  onSelectChar,
  onAddRelation,
  onEditRelation,
  onDeleteRelation,
  onDeleteChar
}: RelationsPanelProps) => (
  <section
    className={['flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm', className]
      .filter(Boolean)
      .join(' ')}
  >
    {selectedChar ? (
      <>
        <div className="border-b border-border p-4">
          <div className="mb-3 flex items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: getAvatarColor(selectedChar.id) }}
            >
              {selectedChar.initial}
            </div>
            <div className="min-w-0">
              <p className="font-semibold leading-tight">{selectedChar.name}</p>
              <p className="mt-0.5 text-xs leading-tight text-muted-foreground">{selectedChar.role}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" size="sm" className="h-9 flex-1 gap-1 text-xs" onClick={onAddRelation}>
              <Plus className="size-3" />
              関係を追加
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1 text-xs text-destructive hover:text-destructive sm:w-auto"
              onClick={onDeleteChar}
            >
              <Trash2 className="size-3" />
              削除
            </Button>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <p className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
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
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                    onClick={() => onSelectChar(otherId)}
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: getAvatarColor(otherId) }}
                    >
                      {other.initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight">{other.name}</p>
                    </div>
                  </button>
                  <span
                    className="shrink-0 rounded-full px-1.5 py-0.5 text-[0.625rem] font-medium text-white"
                    style={{ backgroundColor: color }}
                  >
                    {cfg.label}
                  </span>
                  <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      className="flex size-6 items-center justify-center rounded hover:bg-accent"
                      aria-label="編集"
                      onClick={() => onEditRelation(rel)}
                    >
                      <Pencil className="size-3 text-muted-foreground" />
                    </button>
                    <button
                      type="button"
                      className="flex size-6 items-center justify-center rounded hover:bg-destructive/10"
                      aria-label="削除"
                      onClick={() => onDeleteRelation(rel.id)}
                    >
                      <Trash2 className="size-3 text-destructive" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </>
    ) : (
      <div className="flex flex-1 items-center justify-center p-4 text-center">
        <p className="text-sm text-muted-foreground">キャラクターを選択してください</p>
      </div>
    )}
  </section>
)

function RelationsPageWrapper() {
  return (
    <ReactFlowProvider>
      <RelationsPage />
    </ReactFlowProvider>
  )
}

function buildNode(char: RelationCharacter, position: { x: number; y: number }, selectedId: string): CharacterNode {
  return {
    id: char.id,
    type: 'character' as const,
    position,
    data: {
      character: char,
      selected: char.id === selectedId,
      avatarColor: char.id === selectedId ? 'hsl(var(--primary))' : getAvatarColor(char.id)
    }
  }
}

function RelationsPage() {
  const {
    characters,
    relations,
    getCharacter,
    getRelationsFor,
    addCharacter,
    deleteCharacter,
    addRelation,
    updateRelation,
    deleteRelation
  } = useRelations()
  const { theme } = useTheme()
  const { getViewport } = useReactFlow()
  const [selectedCharId, setSelectedCharId] = useState('renka')
  const [relationDialog, setRelationDialog] = useState<RelationDialogState>(EMPTY_RELATION_DIALOG)
  const [charDialog, setCharDialog] = useState<CharacterDialogState>(EMPTY_CHARACTER_DIALOG)
  const prevCharIdsRef = useRef(new Set(characters.map((c) => c.id)))

  const dark = isDarkMode(theme)

  const selectedChar = useMemo(() => getCharacter(selectedCharId), [getCharacter, selectedCharId])
  const selectedRelations = useMemo(() => getRelationsFor(selectedCharId), [getRelationsFor, selectedCharId])

  const initialNodes: CharacterNode[] = useMemo(
    () => characters.map((char) => buildNode(char, INITIAL_NODE_POSITIONS[char.id] ?? { x: 0, y: 0 }, 'renka')),
    [characters]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)

  useEffect(() => {
    const currentIds = new Set(characters.map((c) => c.id))
    const prevIds = prevCharIdsRef.current
    prevCharIdsRef.current = currentIds

    const addedIds = new Set([...currentIds].filter((id) => !prevIds.has(id)))
    const removedIds = new Set([...prevIds].filter((id) => !currentIds.has(id)))

    if (removedIds.size > 0) {
      setNodes((prev) => prev.filter((n) => !removedIds.has(n.id)))
    }

    if (addedIds.size > 0) {
      const { x: vx, y: vy, zoom } = getViewport()
      const centerX = (-vx + 400) / zoom
      const centerY = (-vy + 300) / zoom

      const newNodes = characters
        .filter((c) => addedIds.has(c.id))
        .map((char, i) => buildNode(char, { x: centerX + i * 200, y: centerY }, selectedCharId))
      setNodes((prev) => [...prev, ...newNodes])
    }
  }, [characters, getViewport, selectedCharId, setNodes])

  useEffect(() => {
    setNodes((prev) =>
      prev.map((node) => {
        const char = getCharacter(node.id)
        if (!char) return node
        return {
          ...node,
          data: {
            ...node.data,
            character: char,
            selected: node.id === selectedCharId,
            avatarColor: node.id === selectedCharId ? 'hsl(var(--primary))' : getAvatarColor(node.id)
          }
        }
      })
    )
  }, [selectedCharId, setNodes, getCharacter])

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

  const onNodeClick = useCallback((_: React.MouseEvent, node: CharacterNode) => {
    setSelectedCharId(node.id)
  }, [])

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: RelationEdge) => {
      const rel = relations.find((r) => r.id === edge.id)
      if (!rel) return
      setRelationDialog({
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

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return
    setRelationDialog({
      ...EMPTY_RELATION_DIALOG,
      open: true,
      sourceId: connection.source,
      targetId: connection.target
    })
  }, [])

  const openAddRelationDialog = useCallback(() => {
    setRelationDialog({
      ...EMPTY_RELATION_DIALOG,
      open: true,
      sourceId: selectedCharId,
      targetId: characters.find((c) => c.id !== selectedCharId)?.id ?? ''
    })
  }, [selectedCharId, characters])

  const openEditRelationDialog = useCallback((rel: Relation) => {
    setRelationDialog({
      open: true,
      editingId: rel.id,
      sourceId: rel.sourceId,
      targetId: rel.targetId,
      type: rel.type,
      label: rel.label
    })
  }, [])

  const handleRelationSave = useCallback(() => {
    if (!relationDialog.sourceId || !relationDialog.targetId || !relationDialog.label.trim()) return
    const input = {
      sourceId: relationDialog.sourceId,
      targetId: relationDialog.targetId,
      type: relationDialog.type,
      label: relationDialog.label.trim()
    }
    if (relationDialog.editingId) {
      updateRelation(relationDialog.editingId, input)
    } else {
      addRelation(input)
    }
    setRelationDialog(EMPTY_RELATION_DIALOG)
  }, [relationDialog, addRelation, updateRelation])

  const handleDeleteRelation = useCallback(
    (id: string) => {
      deleteRelation(id)
    },
    [deleteRelation]
  )

  const handleDeleteCharacter = useCallback(() => {
    if (!selectedCharId) return
    deleteCharacter(selectedCharId)
    const remaining = characters.filter((c) => c.id !== selectedCharId)
    setSelectedCharId(remaining[0]?.id ?? '')
  }, [selectedCharId, characters, deleteCharacter])

  const handleCharacterSave = useCallback(() => {
    if (!charDialog.name.trim() || !charDialog.initial.trim() || characters.length >= 5) return
    const created = addCharacter({
      name: charDialog.name.trim(),
      initial: charDialog.initial.trim(),
      role: charDialog.role.trim()
    })
    setSelectedCharId(created.id)
    setCharDialog(EMPTY_CHARACTER_DIALOG)
  }, [charDialog, addCharacter, characters.length])

  const availableTargets = useMemo(
    () => characters.filter((c) => c.id !== relationDialog.sourceId),
    [characters, relationDialog.sourceId]
  )

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-4 pt-4 pb-4 sm:px-6 sm:pt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">キャラクター関係図</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">キャラクター間の関係性を視覚的に管理</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              disabled={characters.length >= 5}
              onClick={() => setCharDialog({ ...EMPTY_CHARACTER_DIALOG, open: true })}
            >
              <UserPlus data-icon="inline-start" />
              キャラクター追加
            </Button>
            <Button size="lg" className="w-full sm:w-auto" onClick={openAddRelationDialog}>
              <Plus data-icon="inline-start" />
              関係を追加
            </Button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-4 sm:px-6 sm:pb-6 md:flex-row">
        <div className="flex min-h-[22rem] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:min-h-[28rem] md:flex-1 md:min-h-0">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium">相関図キャンバス</p>
            <p className="mt-0.5 text-xs text-muted-foreground">モバイルでは詳細パネルを下部に表示します。</p>
          </div>
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
              nodesConnectable
              onConnect={onConnect}
              elementsSelectable={false}
            >
              <Background gap={24} size={1} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
        </div>

        <RelationsPanel
          className="md:hidden"
          dark={dark}
          selectedChar={selectedChar}
          selectedCharId={selectedCharId}
          selectedRelations={selectedRelations}
          getCharacter={getCharacter}
          onSelectChar={setSelectedCharId}
          onAddRelation={openAddRelationDialog}
          onEditRelation={openEditRelationDialog}
          onDeleteRelation={handleDeleteRelation}
          onDeleteChar={handleDeleteCharacter}
        />
        <RelationsPanel
          className="hidden md:flex md:w-80 md:shrink-0"
          dark={dark}
          selectedChar={selectedChar}
          selectedCharId={selectedCharId}
          selectedRelations={selectedRelations}
          getCharacter={getCharacter}
          onSelectChar={setSelectedCharId}
          onAddRelation={openAddRelationDialog}
          onEditRelation={openEditRelationDialog}
          onDeleteRelation={handleDeleteRelation}
          onDeleteChar={handleDeleteCharacter}
        />
      </div>

      {/* Relation Dialog */}
      <Dialog
        open={relationDialog.open}
        onOpenChange={(open) => setRelationDialog((prev) => (open ? prev : EMPTY_RELATION_DIALOG))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{relationDialog.editingId ? '関係を編集' : '関係を追加'}</DialogTitle>
            <DialogDescription>キャラクター間の関係を設定します。</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>ソース</Label>
              <Select
                value={relationDialog.sourceId}
                onValueChange={(v) =>
                  setRelationDialog((prev) => ({
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
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>ターゲット</Label>
              <Select
                value={relationDialog.targetId}
                onValueChange={(v) => setRelationDialog((prev) => ({ ...prev, targetId: v }))}
              >
                <SelectTrigger className="w-full" aria-label="ターゲットキャラクター">
                  <SelectValue placeholder="キャラクターを選択" />
                </SelectTrigger>
                <SelectContent>
                  {availableTargets.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>関係タイプ</Label>
              <Select
                value={relationDialog.type}
                onValueChange={(v) => setRelationDialog((prev) => ({ ...prev, type: v as RelationType }))}
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
                value={relationDialog.label}
                onChange={(e) => setRelationDialog((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="例: 姉妹、恋人、ライバル"
                aria-label="関係ラベル"
              />
            </div>
          </div>

          <DialogFooter className={relationDialog.editingId ? 'sm:justify-between' : ''}>
            {relationDialog.editingId && (
              <Button
                variant="destructive"
                onClick={() => {
                  deleteRelation(relationDialog.editingId as string)
                  setRelationDialog(EMPTY_RELATION_DIALOG)
                }}
              >
                <Trash2 className="size-4" />
                削除
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setRelationDialog(EMPTY_RELATION_DIALOG)}>
                キャンセル
              </Button>
              <Button
                onClick={handleRelationSave}
                disabled={!relationDialog.sourceId || !relationDialog.targetId || !relationDialog.label.trim()}
              >
                {relationDialog.editingId ? '更新' : '追加'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Character Dialog */}
      <Dialog
        open={charDialog.open}
        onOpenChange={(open) => setCharDialog((prev) => (open ? prev : EMPTY_CHARACTER_DIALOG))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>キャラクターを追加</DialogTitle>
            <DialogDescription>関係図に新しいキャラクターを追加します。</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>名前</Label>
              <Input
                value={charDialog.name}
                onChange={(e) => {
                  const name = e.target.value
                  setCharDialog((prev) => ({
                    ...prev,
                    name,
                    initial: prev.initial || name.slice(0, 1)
                  }))
                }}
                placeholder="例: 太郎"
                aria-label="キャラクター名"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>イニシャル</Label>
              <Input
                value={charDialog.initial}
                onChange={(e) => setCharDialog((prev) => ({ ...prev, initial: e.target.value.slice(0, 1) }))}
                placeholder="例: 太"
                maxLength={1}
                aria-label="イニシャル"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>役割</Label>
              <Input
                value={charDialog.role}
                onChange={(e) => setCharDialog((prev) => ({ ...prev, role: e.target.value }))}
                placeholder="例: 主人公の友人"
                aria-label="役割"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCharDialog(EMPTY_CHARACTER_DIALOG)}>
              キャンセル
            </Button>
            <Button onClick={handleCharacterSave} disabled={!charDialog.name.trim() || !charDialog.initial.trim()}>
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
