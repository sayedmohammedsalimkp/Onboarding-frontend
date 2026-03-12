"use client"

import React from "react"

/**
 * Parse inline formatting: **bold** and *italic*
 */
function parseInline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  let i = 0
  while (i < text.length) {
    if (text.slice(i).startsWith("**")) {
      const end = text.indexOf("**", i + 2)
      if (end === -1) {
        out.push(text.slice(i))
        break
      }
      out.push(<strong key={out.length}>{text.slice(i + 2, end)}</strong>)
      i = end + 2
    } else if (text[i] === "*" && text[i + 1] !== "*") {
      const end = text.indexOf("*", i + 1)
      if (end === -1) {
        out.push(text.slice(i))
        break
      }
      out.push(<em key={out.length}>{text.slice(i + 1, end)}</em>)
      i = end + 1
    } else {
      let next = text.length
      const nextBold = text.indexOf("**", i)
      const nextItalic = text.indexOf("*", i)
      if (nextBold !== -1 && nextBold < next) next = nextBold
      if (nextItalic !== -1 && nextItalic < next && text[nextItalic + 1] !== "*") next = nextItalic
      if (next > i) out.push(text.slice(i, next))
      i = next
    }
  }
  return out
}

/**
 * Render plain text with simple markdown: ## heading, **bold**, *italic*, paragraphs
 */
export function SimpleFormattedContent({
  content,
  className = "",
  paragraphClassName = "text-slate-300 leading-relaxed",
  headingClassName = "font-semibold text-white mt-4 mb-2 first:mt-0",
}: {
  content: string
  className?: string
  paragraphClassName?: string
  headingClassName?: string
}) {
  if (!content || !content.trim()) return null

  const blocks = content.split(/\n\n+/)
  return (
    <div className={className}>
      {blocks.map((block, idx) => {
        const trimmed = block.trim()
        if (!trimmed) return null
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className={`text-base ${headingClassName}`}>
              {parseInline(trimmed.slice(4))}
            </h4>
          )
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={idx} className={`text-lg ${headingClassName}`}>
              {parseInline(trimmed.slice(3))}
            </h3>
          )
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h2 key={idx} className={`text-xl ${headingClassName}`}>
              {parseInline(trimmed.slice(2))}
            </h2>
          )
        }
        if (trimmed.startsWith("- ")) {
          const items = block.split(/\n/).filter((l) => l.trim().startsWith("- "))
          return (
            <ul key={idx} className="list-disc list-inside text-slate-300 space-y-1 pl-2">
              {items.map((line, j) => (
                <li key={j}>{parseInline(line.replace(/^-\s*/, ""))}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={idx} className={paragraphClassName}>
            {parseInline(trimmed)}
          </p>
        )
      })}
    </div>
  )
}
