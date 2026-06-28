"use client"

import { useState, useMemo } from "react"
import { compressImage } from "@/lib/compressImage"
import { sortCards } from "@/lib/sortCards"
import CardSubsetImport from "@/components/admin/CardSubsetImport"
import type { CardSubset, CardParallel, Card, CardVariant } from "@/types"

interface Props {
  seriesId: string
  initialSubsets: CardSubset[]
  totalCardsCount: number
  isPricingEnabled: boolean
}

export default function CardVariantManager({ seriesId, initialSubsets, totalCardsCount, isPricingEnabled }: Props) {
  const [subsets, setSubsets] = useState<CardSubset[]>(initialSubsets)
  const [toggling, setToggling] = useState<Set<string>>(new Set())
  const [uploadingCardId, setUploadingCardId] = useState<string | null>(null)
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      initialSubsets.flatMap((sub) => (sub.cards ?? []).flatMap((c) => c.variants ?? []))
        .map((v) => [v.id, v.price != null ? String(v.price) : ""])
    )
  )
  const [savingPriceId, setSavingPriceId] = useState<string | null>(null)

  // Subset create
  const [showAddSubset, setShowAddSubset] = useState(false)
  const [newSubsetName, setNewSubsetName] = useState("")
  const [newSubsetSpecial, setNewSubsetSpecial] = useState(false)
  const [addingSubset, setAddingSubset] = useState(false)

  // Subset edit
  const [editingSubsetId, setEditingSubsetId] = useState<string | null>(null)
  const [editSubsetName, setEditSubsetName] = useState("")

  // Parallel create per subset
  const [addParallelSubsetId, setAddParallelSubsetId] = useState<string | null>(null)
  const [newParallelName, setNewParallelName] = useState("")
  const [newParallelLimit, setNewParallelLimit] = useState("")
  const [addingParallel, setAddingParallel] = useState(false)

  // Parallel edit
  const [editingParallelId, setEditingParallelId] = useState<string | null>(null)
  const [editParallelName, setEditParallelName] = useState("")
  const [editParallelLimit, setEditParallelLimit] = useState("")

  // Per-subset search and bulk-own state
  const [searches, setSearches] = useState<Record<string, string>>({})
  const [missingInputs, setMissingInputs] = useState<Record<string, string>>({})
  const [bulkLoading, setBulkLoading] = useState<Record<string, boolean>>({})
  const [bulkResult, setBulkResult] = useState<Record<string, string>>({})

  const allVariants = subsets.flatMap((sub) => (sub.cards ?? []).flatMap((c) => c.variants ?? []))
  const ownedCount = allVariants.filter((v) => v.isOwned).length
  const pct = totalCardsCount > 0 ? Math.min(100, Math.round((ownedCount / totalCardsCount) * 100)) : 0
  const collectionValue = isPricingEnabled
    ? allVariants.filter((v) => v.isOwned).reduce((sum, v) => sum + (v.price ?? 0), 0)
    : 0

  // ── Subset CRUD ──────────────────────────────────────────────────────────────

  async function createSubset() {
    if (!newSubsetName.trim()) return
    setAddingSubset(true)
    try {
      const res = await fetch("/api/card-subsets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seriesId, name: newSubsetName.trim(), isSpecial: newSubsetSpecial, order: subsets.length }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSubsets((prev) => [...prev, { ...data, parallels: [], cards: [] }])
      setNewSubsetName("")
      setNewSubsetSpecial(false)
      setShowAddSubset(false)
    } finally {
      setAddingSubset(false)
    }
  }

  async function saveSubsetName(id: string) {
    if (!editSubsetName.trim()) return
    await fetch(`/api/card-subsets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editSubsetName.trim() }),
    })
    setSubsets((prev) => prev.map((s) => s.id === id ? { ...s, name: editSubsetName.trim() } : s))
    setEditingSubsetId(null)
  }

  async function deleteSubset(id: string) {
    if (!confirm("Smazat tento subset včetně všech karet?")) return
    await fetch(`/api/card-subsets/${id}`, { method: "DELETE" })
    setSubsets((prev) => prev.filter((s) => s.id !== id))
  }

  async function toggleSubsetSpecial(id: string, newIsSpecial: boolean) {
    await fetch(`/api/card-subsets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isSpecial: newIsSpecial }),
    })
    setSubsets((prev) => prev.map((s) => s.id === id ? { ...s, isSpecial: newIsSpecial } : s))
  }

  async function reloadSubsets() {
    const res = await fetch(`/api/card-series/${seriesId}`)
    const data = await res.json()
    setSubsets(data.subsets)
    setPriceInputs((prev) => {
      const next = { ...prev }
      data.subsets.flatMap((sub: CardSubset) => (sub.cards ?? []).flatMap((c: Card) => c.variants ?? []))
        .forEach((v: CardVariant) => { if (!(v.id in next)) next[v.id] = v.price != null ? String(v.price) : "" })
      return next
    })
  }

  // ── Parallel CRUD ────────────────────────────────────────────────────────────

  async function createParallel(subsetId: string) {
    if (!newParallelName.trim()) return
    setAddingParallel(true)
    try {
      const res = await fetch("/api/card-parallels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subsetId,
          name: newParallelName.trim(),
          limitNumber: newParallelLimit !== "" ? Number(newParallelLimit) : null,
          isCollected: true,
          order: (subsets.find((s) => s.id === subsetId)?.parallels?.length ?? 0),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Reload subset cards to include new variant rows
      const cardsRes = await fetch(`/api/card-series/${seriesId}`)
      const seriesData = await cardsRes.json()
      setSubsets(seriesData.subsets)
      setPriceInputs((prev) => {
        const next = { ...prev }
        seriesData.subsets.flatMap((sub: CardSubset) => (sub.cards ?? []).flatMap((c: Card) => c.variants ?? []))
          .forEach((v: CardVariant) => { if (!(v.id in next)) next[v.id] = v.price != null ? String(v.price) : "" })
        return next
      })
      setAddParallelSubsetId(null)
      setNewParallelName("")
      setNewParallelLimit("")
    } finally {
      setAddingParallel(false)
    }
  }

  async function saveParallel(id: string, subsetId: string) {
    if (!editParallelName.trim()) return
    await fetch(`/api/card-parallels/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editParallelName.trim(),
        limitNumber: editParallelLimit !== "" ? Number(editParallelLimit) : null,
      }),
    })
    setSubsets((prev) => prev.map((s) =>
      s.id !== subsetId ? s : {
        ...s,
        parallels: s.parallels?.map((p) =>
          p.id !== id ? p : {
            ...p,
            name: editParallelName.trim(),
            limitNumber: editParallelLimit !== "" ? Number(editParallelLimit) : null,
          }
        ),
      }
    ))
    setEditingParallelId(null)
  }

  async function toggleParallelCollected(subsetId: string, parallel: CardParallel) {
    const newVal = !parallel.isCollected
    await fetch(`/api/card-parallels/${parallel.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCollected: newVal }),
    })
    setSubsets((prev) => prev.map((s) =>
      s.id !== subsetId ? s : {
        ...s,
        parallels: s.parallels?.map((p) => p.id === parallel.id ? { ...p, isCollected: newVal } : p),
      }
    ))
  }

  async function deleteParallel(id: string, subsetId: string) {
    if (!confirm("Smazat tuto paralelu včetně vlastnictví všech karet?")) return
    await fetch(`/api/card-parallels/${id}`, { method: "DELETE" })
    setSubsets((prev) => prev.map((s) =>
      s.id !== subsetId ? s : {
        ...s,
        parallels: s.parallels?.filter((p) => p.id !== id),
        cards: s.cards?.map((c) => ({ ...c, variants: c.variants?.filter((v) => v.parallelId !== id) })),
      }
    ))
  }

  // ── Variant ownership ────────────────────────────────────────────────────────

  async function toggleVariant(subsetId: string, cardId: string, variant: CardVariant) {
    if (toggling.has(variant.id)) return
    setToggling((s) => new Set(s).add(variant.id))
    const newOwned = !variant.isOwned
    setSubsets((prev) => prev.map((sub) =>
      sub.id !== subsetId ? sub : {
        ...sub,
        cards: sub.cards?.map((c) =>
          c.id !== cardId ? c : {
            ...c,
            variants: c.variants?.map((v) => v.id === variant.id ? { ...v, isOwned: newOwned } : v),
          }
        ),
      }
    ))
    try {
      await fetch(`/api/card-variants/${variant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOwned: newOwned }),
      })
    } catch {
      setSubsets((prev) => prev.map((sub) =>
        sub.id !== subsetId ? sub : {
          ...sub,
          cards: sub.cards?.map((c) =>
            c.id !== cardId ? c : {
              ...c,
              variants: c.variants?.map((v) => v.id === variant.id ? { ...v, isOwned: variant.isOwned } : v),
            }
          ),
        }
      ))
    } finally {
      setToggling((s) => { const n = new Set(s); n.delete(variant.id); return n })
    }
  }

  // ── Price ────────────────────────────────────────────────────────────────────

  async function updateVariantPrice(variantId: string, subsetId: string, cardId: string) {
    const raw = priceInputs[variantId] ?? ""
    const price = raw === "" ? null : Number(raw)
    const current = subsets.find((s) => s.id === subsetId)?.cards?.find((c) => c.id === cardId)?.variants?.find((v) => v.id === variantId)?.price ?? null
    if (price === current) return
    setSavingPriceId(variantId)
    try {
      await fetch(`/api/card-variants/${variantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price }),
      })
      setSubsets((prev) => prev.map((sub) =>
        sub.id !== subsetId ? sub : {
          ...sub,
          cards: sub.cards?.map((c) =>
            c.id !== cardId ? c : {
              ...c,
              variants: c.variants?.map((v) => v.id === variantId ? { ...v, price } : v),
            }
          ),
        }
      ))
    } finally {
      setSavingPriceId(null)
    }
  }

  // ── Card image ───────────────────────────────────────────────────────────────

  async function handleCardImageUpload(subsetId: string, cardId: string, file: File) {
    setUploadingCardId(cardId)
    try {
      const compressed = await compressImage(file, "cards")
      const fd = new FormData()
      fd.append("file", compressed)
      fd.append("type", "cards")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Upload failed")
      await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: data.url }),
      })
      setSubsets((prev) => prev.map((s) =>
        s.id !== subsetId ? s : { ...s, cards: s.cards?.map((c) => c.id === cardId ? { ...c, imageUrl: data.url } : c) }
      ))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Chyba uploadu")
    } finally {
      setUploadingCardId(null)
    }
  }

  async function removeCardImage(subsetId: string, cardId: string) {
    await fetch(`/api/cards/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: null }),
    })
    setSubsets((prev) => prev.map((s) =>
      s.id !== subsetId ? s : { ...s, cards: s.cards?.map((c) => c.id === cardId ? { ...c, imageUrl: null } : c) }
    ))
  }

  // ── Bulk-own per subset ──────────────────────────────────────────────────────

  async function applyBulkOwn(subsetId: string) {
    const input = missingInputs[subsetId] ?? ""
    const missingNumbers = input.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean)
    setBulkLoading((prev) => ({ ...prev, [subsetId]: true }))
    setBulkResult((prev) => ({ ...prev, [subsetId]: "" }))
    try {
      const res = await fetch(`/api/card-series/${seriesId}/bulk-own`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subsetId, missingNumbers }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const missingSet = new Set(missingNumbers)
      setSubsets((prev) => prev.map((s) =>
        s.id !== subsetId ? s : {
          ...s,
          cards: s.cards?.map((c) => ({
            ...c,
            variants: c.variants?.map((v) => ({ ...v, isOwned: !missingSet.has(c.number) })),
          })),
        }
      ))
      setBulkResult((prev) => ({ ...prev, [subsetId]: `${data.owned} vlastněných, ${data.missing} chybějících` }))
      setMissingInputs((prev) => ({ ...prev, [subsetId]: "" }))
    } finally {
      setBulkLoading((prev) => ({ ...prev, [subsetId]: false }))
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-[#1d1d1f]">Správa sbírky</h2>
            <p className="text-sm text-[#8e8e93]">
              {ownedCount} / {totalCardsCount || allVariants.length} variant vlastněno
            </p>
            {isPricingEnabled && collectionValue > 0 && (
              <p className="text-sm text-[#34c759] font-medium mt-0.5">
                Hodnota: {Math.round(collectionValue).toLocaleString("cs-CZ")} Kč
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#007aff]">{pct}%</div>
          </div>
        </div>
        <div className="h-2.5 bg-[#e5e5ea] rounded-full overflow-hidden">
          <div className="h-full bg-[#34c759] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Subsets */}
      {subsets.map((subset) => (
        <SubsetSection
          key={subset.id}
          seriesId={seriesId}
          subset={subset}
          isPricingEnabled={isPricingEnabled}
          toggling={toggling}
          uploadingCardId={uploadingCardId}
          priceInputs={priceInputs}
          savingPriceId={savingPriceId}
          search={searches[subset.id] ?? ""}
          missingInput={missingInputs[subset.id] ?? ""}
          bulkLoading={bulkLoading[subset.id] ?? false}
          bulkResult={bulkResult[subset.id] ?? ""}
          editingSubsetId={editingSubsetId}
          editSubsetName={editSubsetName}
          addParallelSubsetId={addParallelSubsetId}
          newParallelName={newParallelName}
          newParallelLimit={newParallelLimit}
          addingParallel={addingParallel}
          editingParallelId={editingParallelId}
          editParallelName={editParallelName}
          editParallelLimit={editParallelLimit}
          onSearchChange={(v) => setSearches((p) => ({ ...p, [subset.id]: v }))}
          onMissingChange={(v) => setMissingInputs((p) => ({ ...p, [subset.id]: v }))}
          onBulkOwn={() => applyBulkOwn(subset.id)}
          onToggleVariant={(cardId, variant) => toggleVariant(subset.id, cardId, variant)}
          onPriceChange={(vid, val) => setPriceInputs((p) => ({ ...p, [vid]: val }))}
          onPriceBlur={(vid, cid) => updateVariantPrice(vid, subset.id, cid)}
          onImageUpload={(cid, f) => handleCardImageUpload(subset.id, cid, f)}
          onImageRemove={(cid) => removeCardImage(subset.id, cid)}
          onEditSubset={(id) => { setEditingSubsetId(id); setEditSubsetName(subset.name) }}
          onSaveSubsetName={() => saveSubsetName(subset.id)}
          onEditSubsetName={(v) => setEditSubsetName(v)}
          onCancelEditSubset={() => setEditingSubsetId(null)}
          onDeleteSubset={() => deleteSubset(subset.id)}
          onToggleSubsetSpecial={(v) => toggleSubsetSpecial(subset.id, v)}
          onImportComplete={reloadSubsets}
          onStartAddParallel={() => { setAddParallelSubsetId(subset.id); setNewParallelName(""); setNewParallelLimit("") }}
          onNewParallelNameChange={setNewParallelName}
          onNewParallelLimitChange={setNewParallelLimit}
          onCreateParallel={() => createParallel(subset.id)}
          onCancelAddParallel={() => setAddParallelSubsetId(null)}
          onToggleParallelCollected={(p) => toggleParallelCollected(subset.id, p)}
          onStartEditParallel={(p) => { setEditingParallelId(p.id); setEditParallelName(p.name); setEditParallelLimit(p.limitNumber != null ? String(p.limitNumber) : "") }}
          onEditParallelNameChange={setEditParallelName}
          onEditParallelLimitChange={setEditParallelLimit}
          onSaveParallel={(pid) => saveParallel(pid, subset.id)}
          onCancelEditParallel={() => setEditingParallelId(null)}
          onDeleteParallel={(pid) => deleteParallel(pid, subset.id)}
        />
      ))}

      {/* Add subset */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-4">
        {showAddSubset ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#1d1d1f]">Nový subset</p>
            <input
              value={newSubsetName}
              onChange={(e) => setNewSubsetName(e.target.value)}
              placeholder="Název subsetu (např. Gold Inserts)"
              autoFocus
              className="w-full px-3.5 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff]"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setNewSubsetSpecial(!newSubsetSpecial)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${newSubsetSpecial ? "bg-[#ff9f0a] text-white border-[#ff9f0a]" : "bg-white text-[#3c3c43] border-[#e5e5ea]"}`}
              >
                {newSubsetSpecial ? "✨ Speciální" : "📦 Base"}
              </button>
              <button
                onClick={createSubset}
                disabled={addingSubset || !newSubsetName.trim()}
                className="px-4 py-1.5 bg-[#007aff] text-white text-sm font-medium rounded-lg hover:bg-[#0066d6] disabled:opacity-40"
              >
                {addingSubset ? "Přidávám…" : "Přidat"}
              </button>
              <button onClick={() => setShowAddSubset(false)} className="text-sm text-[#8e8e93] hover:text-[#1d1d1f]">
                Zrušit
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddSubset(true)}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-[#007aff] hover:text-[#0066d6] font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Přidat subset
          </button>
        )}
      </div>
    </div>
  )
}

interface SubsetSectionProps {
  seriesId: string
  subset: CardSubset
  isPricingEnabled: boolean
  toggling: Set<string>
  uploadingCardId: string | null
  priceInputs: Record<string, string>
  savingPriceId: string | null
  search: string
  missingInput: string
  bulkLoading: boolean
  bulkResult: string
  editingSubsetId: string | null
  editSubsetName: string
  addParallelSubsetId: string | null
  newParallelName: string
  newParallelLimit: string
  addingParallel: boolean
  editingParallelId: string | null
  editParallelName: string
  editParallelLimit: string
  onSearchChange: (v: string) => void
  onMissingChange: (v: string) => void
  onBulkOwn: () => void
  onToggleVariant: (cardId: string, variant: CardVariant) => void
  onPriceChange: (variantId: string, val: string) => void
  onPriceBlur: (variantId: string, cardId: string) => void
  onImageUpload: (cardId: string, file: File) => void
  onImageRemove: (cardId: string) => void
  onEditSubset: (id: string) => void
  onSaveSubsetName: () => void
  onEditSubsetName: (v: string) => void
  onCancelEditSubset: () => void
  onDeleteSubset: () => void
  onToggleSubsetSpecial: (newIsSpecial: boolean) => void
  onImportComplete: () => void
  onStartAddParallel: () => void
  onNewParallelNameChange: (v: string) => void
  onNewParallelLimitChange: (v: string) => void
  onCreateParallel: () => void
  onCancelAddParallel: () => void
  onToggleParallelCollected: (p: CardParallel) => void
  onStartEditParallel: (p: CardParallel) => void
  onEditParallelNameChange: (v: string) => void
  onEditParallelLimitChange: (v: string) => void
  onSaveParallel: (parallelId: string) => void
  onCancelEditParallel: () => void
  onDeleteParallel: (parallelId: string) => void
}

function SubsetSection({
  subset, isPricingEnabled, toggling, uploadingCardId, priceInputs, savingPriceId,
  search, missingInput, bulkLoading, bulkResult,
  editingSubsetId, editSubsetName, addParallelSubsetId, newParallelName, newParallelLimit,
  addingParallel, editingParallelId, editParallelName, editParallelLimit,
  onSearchChange, onMissingChange, onBulkOwn, onToggleVariant, onPriceChange, onPriceBlur,
  onImageUpload, onImageRemove, onEditSubset, onSaveSubsetName, onEditSubsetName, onCancelEditSubset,
  onDeleteSubset, onToggleSubsetSpecial, onImportComplete, onStartAddParallel, onNewParallelNameChange,
  onNewParallelLimitChange, onCreateParallel, onCancelAddParallel, onToggleParallelCollected, onStartEditParallel,
  onEditParallelNameChange, onEditParallelLimitChange, onSaveParallel, onCancelEditParallel, onDeleteParallel,
}: SubsetSectionProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const isEditingThis = editingSubsetId === subset.id
  const isAddingParallelHere = addParallelSubsetId === subset.id

  const cards = useMemo(() => sortCards(subset.cards ?? []), [subset.cards])
  const parallels = subset.parallels ?? []

  const ownedVariants = cards.flatMap((c) => c.variants ?? []).filter((v) => v.isOwned).length
  const totalVariants = cards.flatMap((c) => c.variants ?? []).length

  const parsedMissing = useMemo(
    () => missingInput.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean),
    [missingInput]
  )
  const missingSet = useMemo(() => new Set(parsedMissing), [parsedMissing])

  const bulkPreview = useMemo(() => {
    if (!parsedMissing.length || !cards.length) return null
    const missingCards = cards.filter((c) => missingSet.has(c.number)).length
    return { ownedCards: cards.length - missingCards, missingCards }
  }, [parsedMissing, missingSet, cards])

  const filtered = search.trim()
    ? cards.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.number.toLowerCase().includes(search.toLowerCase()))
    : cards

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Subset header */}
      <div className="px-6 py-4 border-b border-[#f2f2f7]">
        <div className="flex items-center gap-3">
          <button onClick={() => setCollapsed((v) => !v)} className="text-[#8e8e93] hover:text-[#1d1d1f]">
            <svg className={`w-4 h-4 transition-transform ${collapsed ? "-rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <span className="text-base">{subset.isSpecial ? "✨" : "📦"}</span>

          {isEditingThis ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                value={editSubsetName}
                onChange={(e) => onEditSubsetName(e.target.value)}
                className="flex-1 px-2.5 py-1 text-sm border border-[#e5e5ea] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff]"
                onKeyDown={(e) => { if (e.key === "Enter") onSaveSubsetName(); if (e.key === "Escape") onCancelEditSubset() }}
                autoFocus
              />
              <button onClick={onSaveSubsetName} className="text-xs text-[#007aff] font-medium hover:underline">Uložit</button>
              <button onClick={onCancelEditSubset} className="text-xs text-[#8e8e93] hover:underline">Zrušit</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <span className="font-semibold text-[#1d1d1f]">{subset.name}</span>
              <span className="text-xs text-[#8e8e93]">
                {ownedVariants}/{totalVariants} variant · {cards.length} karet
              </span>
            </div>
          )}

          {!isEditingThis && (
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => onToggleSubsetSpecial(!subset.isSpecial)}
                className={`p-1.5 rounded-lg transition-colors text-sm ${subset.isSpecial ? "text-[#ff9f0a] hover:bg-[#fff8e6]" : "text-[#8e8e93] hover:bg-[#f2f2f7]"}`}
                title={subset.isSpecial ? "Přepnout na Base" : "Přepnout na Speciální"}
              >
                {subset.isSpecial ? "✨" : "📦"}
              </button>
              <button
                onClick={() => setShowImport((v) => !v)}
                className={`p-1.5 rounded-lg transition-colors ${showImport ? "text-[#007aff] bg-[#f0f6ff]" : "text-[#8e8e93] hover:text-[#007aff] hover:bg-[#f0f6ff]"}`}
                title="Importovat karty do tohoto subsetu"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </button>
              <button onClick={() => onEditSubset(subset.id)} className="p-1.5 text-[#8e8e93] hover:text-[#007aff] hover:bg-[#f0f6ff] rounded-lg transition-colors" title="Přejmenovat">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button onClick={onDeleteSubset} className="p-1.5 text-[#8e8e93] hover:text-[#ff3b30] hover:bg-[#fff2f0] rounded-lg transition-colors" title="Smazat">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Parallels row */}
        {!collapsed && (
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-[#8e8e93] font-medium">Paralely:</span>
            {parallels.map((p) =>
              editingParallelId === p.id ? (
                <div key={p.id} className="flex items-center gap-1">
                  <input
                    value={editParallelName}
                    onChange={(e) => onEditParallelNameChange(e.target.value)}
                    placeholder="Název"
                    className="w-24 px-2 py-0.5 text-xs border border-[#e5e5ea] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007aff]/30"
                    autoFocus
                  />
                  <span className="text-xs text-[#8e8e93]">/</span>
                  <input
                    value={editParallelLimit}
                    onChange={(e) => onEditParallelLimitChange(e.target.value)}
                    placeholder="limit"
                    type="number"
                    className="w-14 px-2 py-0.5 text-xs border border-[#e5e5ea] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007aff]/30"
                  />
                  <button onClick={() => onSaveParallel(p.id)} className="text-[10px] text-[#007aff] font-medium">✓</button>
                  <button onClick={onCancelEditParallel} className="text-[10px] text-[#8e8e93]">✕</button>
                </div>
              ) : (
                <div key={p.id} className="group flex items-center gap-1">
                  <button
                    onClick={() => onToggleParallelCollected(p)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                      p.isCollected
                        ? "bg-[#007aff]/10 text-[#007aff] border-[#007aff]/20"
                        : "bg-[#f2f2f7] text-[#8e8e93] border-[#e5e5ea]"
                    }`}
                    title={p.isCollected ? "Sbírám (klik pro vypnutí)" : "Nesbírám (klik pro zapnutí)"}
                  >
                    {p.isCollected ? "✓" : "–"} {p.name}
                    {p.limitNumber != null && <span className="opacity-70">/{p.limitNumber}</span>}
                  </button>
                  <button onClick={() => onStartEditParallel(p)} className="opacity-0 group-hover:opacity-100 text-[#8e8e93] hover:text-[#007aff] transition-all" title="Upravit">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => onDeleteParallel(p.id)} className="opacity-0 group-hover:opacity-100 text-[#8e8e93] hover:text-[#ff3b30] transition-all" title="Smazat">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )
            )}
            {isAddingParallelHere ? (
              <div className="flex items-center gap-1">
                <input
                  value={newParallelName}
                  onChange={(e) => onNewParallelNameChange(e.target.value)}
                  placeholder="Název"
                  className="w-24 px-2 py-0.5 text-xs border border-[#e5e5ea] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007aff]/30"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && onCreateParallel()}
                />
                <span className="text-xs text-[#8e8e93]">/</span>
                <input
                  value={newParallelLimit}
                  onChange={(e) => onNewParallelLimitChange(e.target.value)}
                  placeholder="limit"
                  type="number"
                  className="w-14 px-2 py-0.5 text-xs border border-[#e5e5ea] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007aff]/30"
                />
                <button
                  onClick={onCreateParallel}
                  disabled={addingParallel || !newParallelName.trim()}
                  className="text-[10px] text-[#007aff] font-medium disabled:opacity-40"
                >
                  {addingParallel ? "…" : "✓"}
                </button>
                <button onClick={onCancelAddParallel} className="text-[10px] text-[#8e8e93]">✕</button>
              </div>
            ) : (
              <button
                onClick={onStartAddParallel}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs text-[#007aff] border border-[#007aff]/30 hover:bg-[#f0f6ff] transition-colors"
              >
                + paralela
              </button>
            )}
          </div>
        )}
      </div>

      {/* Per-subset import */}
      {showImport && (
        <div className="px-6 pb-2">
          <CardSubsetImport
            subsetId={subset.id}
            onImportComplete={() => { onImportComplete(); setShowImport(false) }}
            onCancel={() => setShowImport(false)}
          />
        </div>
      )}

      {/* Cards */}
      {!collapsed && (
        <div className="p-4 space-y-3">
          {/* Bulk-own */}
          {cards.length > 0 && (
            <div className="border border-[#e5e5ea] rounded-xl p-3 space-y-2 bg-[#f9f9fb]">
              <div>
                <label className="block text-xs font-medium text-[#1d1d1f] mb-0.5">Čísla chybějících karet</label>
                <p className="text-[10px] text-[#8e8e93] mb-1.5">Zadejte čísla, která <strong>nemáte</strong> — ostatní se označí jako vlastněné.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={missingInput}
                    onChange={(e) => { onMissingChange(e.target.value) }}
                    placeholder="5, 23, 47"
                    className="flex-1 px-3 py-1.5 text-sm font-mono border border-[#e5e5ea] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#007aff]/30"
                  />
                  <button
                    onClick={onBulkOwn}
                    disabled={bulkLoading || parsedMissing.length === 0}
                    className="px-3 py-1.5 bg-[#007aff] text-white text-xs font-medium rounded-lg disabled:opacity-40"
                  >
                    {bulkLoading ? "…" : "Použít"}
                  </button>
                </div>
              </div>
              {bulkPreview && (
                <p className="text-[10px] text-[#3c3c43]">
                  <span className="text-[#34c759] font-medium">{bulkPreview.ownedCards}</span> vlastněné,{" "}
                  <span className="text-[#ff3b30] font-medium">{bulkPreview.missingCards}</span> chybějící
                </p>
              )}
              {bulkResult && <p className="text-[10px] text-[#34c759]">✓ {bulkResult}</p>}
            </div>
          )}

          {/* Search */}
          {cards.length > 5 && (
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Hledat kartu..."
              className="w-full px-3.5 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff]"
            />
          )}

          {cards.length === 0 ? (
            <p className="text-sm text-[#8e8e93] text-center py-4">Zatím žádné karty — použijte Import výše.</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto -mx-1 px-1">
              {filtered.map((card) => (
                <CardRow
                  key={card.id}
                  card={card}
                  parallels={parallels}
                  isPricingEnabled={isPricingEnabled}
                  toggling={toggling}
                  uploadingCardId={uploadingCardId}
                  priceInputs={priceInputs}
                  savingPriceId={savingPriceId}
                  onToggleVariant={(variant) => onToggleVariant(card.id, variant)}
                  onPriceChange={(vid, val) => onPriceChange(vid, val)}
                  onPriceBlur={(vid) => onPriceBlur(vid, card.id)}
                  onImageUpload={(f) => onImageUpload(card.id, f)}
                  onImageRemove={() => onImageRemove(card.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface CardRowProps {
  card: Card
  parallels: CardParallel[]
  isPricingEnabled: boolean
  toggling: Set<string>
  uploadingCardId: string | null
  priceInputs: Record<string, string>
  savingPriceId: string | null
  onToggleVariant: (variant: CardVariant) => void
  onPriceChange: (variantId: string, val: string) => void
  onPriceBlur: (variantId: string) => void
  onImageUpload: (file: File) => void
  onImageRemove: () => void
}

function CardRow({
  card, parallels, isPricingEnabled, toggling, uploadingCardId, priceInputs, savingPriceId,
  onToggleVariant, onPriceChange, onPriceBlur, onImageUpload, onImageRemove,
}: CardRowProps) {
  const variantByParallel = useMemo(() => {
    const map = new Map<string, CardVariant>()
    for (const v of card.variants ?? []) map.set(v.parallelId, v)
    return map
  }, [card.variants])

  return (
    <div className="border border-[#e5e5ea] rounded-xl p-3">
      <div className="flex items-start gap-2 mb-2">
        {card.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.imageUrl} alt={card.name} className="w-8 h-10 object-cover rounded-md border border-[#e5e5ea] flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-mono text-[#8e8e93] bg-[#f2f2f7] px-1.5 py-0.5 rounded-md">#{card.number}</span>
            <span className="text-sm font-medium text-[#1d1d1f]">{card.name}</span>
          </div>
          {card.club && (
            <p className="text-xs text-[#8e8e93] mt-0.5">{card.club}</p>
          )}
        </div>
        <label className={`flex-shrink-0 p-1.5 rounded-lg cursor-pointer transition-colors ${uploadingCardId === card.id ? "opacity-50 pointer-events-none" : "text-[#8e8e93] hover:text-[#007aff] hover:bg-[#f0f6ff]"}`} title="Nahrát obrázek">
          {uploadingCardId === card.id ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImageUpload(f) }} disabled={uploadingCardId === card.id} />
        </label>
        {card.imageUrl && (
          <button onClick={onImageRemove} className="flex-shrink-0 p-1.5 text-[#8e8e93] hover:text-[#ff3b30] hover:bg-[#fff2f0] rounded-lg transition-colors" title="Odebrat obrázek">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {parallels.map((p) => {
          const variant = variantByParallel.get(p.id)
          if (!variant) return null
          return (
            <div key={p.id} className="flex flex-col items-center gap-0.5">
              <button
                onClick={() => onToggleVariant(variant)}
                disabled={toggling.has(variant.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors disabled:opacity-60 ${
                  variant.isOwned
                    ? "bg-[#f0fff4] text-[#34c759] border-[#34c759]/30"
                    : "bg-[#f2f2f7] text-[#8e8e93] border-[#e5e5ea] hover:bg-[#fff2f0] hover:text-[#ff3b30] hover:border-[#ff3b30]/30"
                }`}
              >
                {variant.isOwned ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                )}
                {p.name}
                {p.limitNumber != null && <span className="opacity-70">/{p.limitNumber}</span>}
              </button>
              {isPricingEnabled && (
                <div className="flex items-center">
                  <input
                    type="number" min="0" step="0.01" placeholder="Kč"
                    value={priceInputs[variant.id] ?? ""}
                    onChange={(e) => onPriceChange(variant.id, e.target.value)}
                    onBlur={() => onPriceBlur(variant.id)}
                    disabled={savingPriceId === variant.id}
                    className="w-16 px-1.5 py-0.5 text-[10px] text-center border border-[#e5e5ea] rounded-md focus:outline-none focus:ring-1 focus:ring-[#007aff]/40 disabled:opacity-50"
                  />
                  {savingPriceId === variant.id && (
                    <svg className="w-3 h-3 ml-1 animate-spin text-[#007aff]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
