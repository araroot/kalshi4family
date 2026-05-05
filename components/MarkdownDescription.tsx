'use client'
import ReactMarkdown from 'react-markdown'

export default function MarkdownDescription({ content }: { content: string }) {
  return (
    <div className="prose prose-sm prose-invert max-w-none mb-3
      [&_p]:text-[#a1a1aa] [&_p]:leading-relaxed [&_p]:my-1.5
      [&_h1]:text-white [&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-3 [&_h1]:mb-1
      [&_h2]:text-white [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1
      [&_h3]:text-[#a1a1aa] [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1
      [&_strong]:text-white [&_strong]:font-semibold
      [&_em]:text-[#a1a1aa] [&_em]:italic
      [&_code]:text-[#a78bfa] [&_code]:bg-[#1a1a2e] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
      [&_pre]:bg-[#1a1a1a] [&_pre]:border [&_pre]:border-[#2a2a2a] [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto
      [&_ul]:text-[#a1a1aa] [&_ul]:pl-4 [&_ul]:my-1.5 [&_ul]:space-y-0.5
      [&_ol]:text-[#a1a1aa] [&_ol]:pl-4 [&_ol]:my-1.5 [&_ol]:space-y-0.5
      [&_li]:text-[#a1a1aa] [&_li]:text-sm
      [&_blockquote]:border-l-2 [&_blockquote]:border-[#6366f1] [&_blockquote]:pl-3 [&_blockquote]:text-[#555] [&_blockquote]:italic
      [&_hr]:border-[#2a2a2a] [&_hr]:my-3
      [&_a]:text-[#6366f1] [&_a]:underline [&_a]:underline-offset-2
    ">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
