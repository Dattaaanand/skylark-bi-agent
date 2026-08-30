import type { ChatMessage } from "@/types";

export default function MessageBubble({ role, content }: ChatMessage) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-4 py-2.5 text-[14.5px] leading-relaxed text-paper"
            : "max-w-[85%] rounded-2xl rounded-bl-sm border border-line bg-white px-4 py-2.5 text-[14.5px] leading-relaxed text-ink"
        }
      >
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
