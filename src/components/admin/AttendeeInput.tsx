"use client"

import { useState, useRef, useEffect } from "react"

interface Props {
  attendees: string[]
  suggestions: string[]
  onAdd: (name: string) => void
  onRemove: (name: string) => void
}

export default function AttendeeInput({ attendees, suggestions, onAdd, onRemove }: Props) {
  const [input, setInput] = useState("")
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const filtered = input.trim()
    ? suggestions.filter(
        (s) =>
          s.toLowerCase().includes(input.toLowerCase()) &&
          !attendees.includes(s)
      )
    : suggestions.filter((s) => !attendees.includes(s))

  useEffect(() => { setHighlighted(-1) }, [input])

  function add(name: string) {
    const n = name.trim()
    if (!n || attendees.includes(n)) return
    onAdd(n)
    setInput("")
    setOpen(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, -1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (highlighted >= 0 && filtered[highlighted]) {
        add(filtered[highlighted])
      } else if (input.trim()) {
        add(input)
      }
    } else if (e.key === "Escape") {
      setOpen(false)
      setHighlighted(-1)
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder="Jméno..."
            className="flex-1 px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:border-[#007aff]"
          />
          <button
            type="button"
            onClick={() => add(input)}
            className="px-4 py-2 text-sm bg-[#f2f2f7] text-[#3a3a3c] rounded-xl hover:bg-[#e5e5ea] transition-colors"
          >
            Přidat
          </button>
        </div>

        {open && filtered.length > 0 && (
          <ul
            ref={listRef}
            className="absolute z-20 top-full mt-1 left-0 right-14 bg-white border border-[#e5e5ea] rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto"
          >
            {filtered.map((name, i) => (
              <li key={name}>
                <button
                  type="button"
                  onMouseDown={() => add(name)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    i === highlighted
                      ? "bg-[#007aff] text-white"
                      : "hover:bg-[#f2f2f7] text-[#1d1d1f]"
                  }`}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {attendees.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {attendees.map((a) => (
            <span
              key={a}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#132257]/10 text-[#132257] text-xs rounded-full"
            >
              {a}
              <button
                type="button"
                onClick={() => onRemove(a)}
                className="hover:text-[#ff3b30] leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
