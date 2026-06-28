"use client"

import type { ReactNode } from "react"

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|==[^=]+==)/g).map((seg, i) => {
    if (seg.startsWith("**") && seg.endsWith("**"))
      return <strong key={i}>{seg.slice(2, -2)}</strong>
    if (seg.startsWith("*") && seg.endsWith("*"))
      return <em key={i}>{seg.slice(1, -1)}</em>
    if (seg.startsWith("==") && seg.endsWith("=="))
      return <mark key={i} className="bg-amber-100 text-amber-900 px-0.5 rounded-sm not-italic">{seg.slice(2, -2)}</mark>
    return seg
  })
}

interface Props {
  text: string
  className?: string
}

export default function MarkdownText({ text, className }: Props) {
  if (!text.trim()) return null
  return (
    <div className={className}>
      {text.split(/\n\n+/).map((para, i) => {
        if (para.trimStart().startsWith("> ")) {
          return (
            <blockquote key={i} className="border-l-[3px] border-[#007aff] pl-4 italic text-[#6e6e73]">
              {para.trimStart().slice(2).split(/\n/).map((line, li, arr) => (
                <span key={li}>
                  {renderInline(line.trimStart().replace(/^>\s*/, ""))}
                  {li < arr.length - 1 && <br />}
                </span>
              ))}
            </blockquote>
          )
        }
        return (
          <p key={i} className={i > 0 ? "mt-3" : ""}>
            {para.split(/\n/).map((line, li, arr) => (
              <span key={li}>
                {renderInline(line)}
                {li < arr.length - 1 && <br />}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}
