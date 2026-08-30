"use client";

import type { ChatMessage } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-line bg-zinc-950/40">
      <div className="flex items-center justify-between border-b border-line bg-zinc-900 px-3 py-1.5 text-[11px] font-mono text-zinc-400">
        <span>{language || "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-zinc-800 hover:text-zinc-100 transition"
        >
          {copied ? (
            <>
              <svg className="h-3 w-3 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[12.5px] leading-relaxed text-zinc-300">
        <code>{value}</code>
      </pre>
    </div>
  );
}

export default function MessageBubble({ role, content }: ChatMessage) {
  const isUser = role === "user";

  const components = {
    p({ children }: any) {
      return <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>;
    },
    h1({ children }: any) {
      return <h1 className="mt-4 mb-2 font-display text-xl font-semibold first:mt-0">{children}</h1>;
    },
    h2({ children }: any) {
      return <h2 className="mt-3.5 mb-2 font-display text-lg font-semibold first:mt-0">{children}</h2>;
    },
    h3({ children }: any) {
      return <h3 className="mt-3 mb-1.5 font-display text-base font-semibold first:mt-0">{children}</h3>;
    },
    h4({ children }: any) {
      return <h4 className="mt-2.5 mb-1 font-semibold first:mt-0">{children}</h4>;
    },
    ul({ children }: any) {
      return <ul className="mb-3 pl-5 list-disc space-y-1 last:mb-0">{children}</ul>;
    },
    ol({ children }: any) {
      return <ol className="mb-3 pl-5 list-decimal space-y-1 last:mb-0">{children}</ol>;
    },
    li({ children }: any) {
      return <li className="text-[14px] leading-relaxed">{children}</li>;
    },
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      const isInline = inline || (!className && typeof children === "string" && !children.includes("\n"));

      if (isInline) {
        return (
          <code
            className={
              isUser
                ? "rounded bg-black/10 px-1 py-0.5 font-mono text-[12px] text-zinc-950 font-medium"
                : "rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[12px] text-zinc-200"
            }
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <CodeBlock
          language={match ? match[1] : ""}
          value={String(children).replace(/\n$/, "")}
        />
      );
    },
    table({ children }: any) {
      return (
        <div className="my-3.5 w-full overflow-x-auto rounded-lg border border-line bg-zinc-950/50 shadow-sm">
          <table className="w-full border-collapse text-left text-[13px]">{children}</table>
        </div>
      );
    },
    thead({ children }: any) {
      return <thead className="border-b border-line bg-zinc-900 font-medium text-zinc-300">{children}</thead>;
    },
    tbody({ children }: any) {
      return <tbody className="divide-y divide-line/40">{children}</tbody>;
    },
    tr({ children }: any) {
      return <tr className="hover:bg-zinc-900/40 transition-colors">{children}</tr>;
    },
    th({ children }: any) {
      return <th className="px-3.5 py-2.5 font-semibold">{children}</th>;
    },
    td({ children }: any) {
      return <td className="px-3.5 py-2.5 text-zinc-300 leading-normal">{children}</td>;
    },
    blockquote({ children }: any) {
      return (
        <blockquote className="my-2.5 border-l-2 border-brand pl-3.5 italic text-zinc-400">
          {children}
        </blockquote>
      );
    },
    a({ href, children }: any) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={
            isUser
              ? "text-zinc-950 underline hover:text-zinc-800 transition"
              : "text-brand underline hover:text-brand/80 transition"
          }
        >
          {children}
        </a>
      );
    },
    strong({ children }: any) {
      return <strong className={isUser ? "font-semibold text-zinc-950" : "font-semibold text-zinc-50"}>{children}</strong>;
    },
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-4 py-2.5 text-[14px] leading-relaxed text-paper"
            : "max-w-[85%] rounded-2xl rounded-bl-sm border border-line bg-zinc-900/50 px-4 py-2.5 text-[14px] leading-relaxed text-ink"
        }
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

