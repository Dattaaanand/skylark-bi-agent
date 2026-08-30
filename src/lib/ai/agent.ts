/**
 * Orchestrates a single turn of the agent: sends the conversation to
 * Gemini, executes any tool calls it requests, feeds results back, and
 * repeats until Gemini returns a final text answer (or we hit a safety
 * cap on tool-call rounds).
 *
 * Built against @google/genai's Chat API (ai.chats.create / sendMessage),
 * the current SDK — see client.ts for why this isn't the older
 * @google/generative-ai package.
 */

import type { Content } from "@google/genai";
import { getGeminiClient, getModelName } from "./client";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { executeTool, toolDeclarations } from "./tools";
import type { ChatMessage } from "@/types";

const MAX_TOOL_ROUNDS = 4;

function toGeminiHistory(messages: ChatMessage[]): Content[] {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

export async function runAgent(messages: ChatMessage[]): Promise<string> {
  const ai = getGeminiClient();

  const history = toGeminiHistory(messages);
  // Last message is the new user turn; everything before it is prior history.
  const lastMessage = history[history.length - 1];
  const priorHistory = history.slice(0, -1);

  if (!lastMessage) {
    throw new Error("No message to send to the agent.");
  }

  const chat = ai.chats.create({
    model: getModelName(),
    history: priorHistory,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ functionDeclarations: toolDeclarations }],
    },
  });

  let response = await chat.sendMessage({ message: lastMessage.parts ?? [] });
  let rounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    const call = response.functionCalls?.[0];
    if (!call || !call.name) break; // model produced a final text answer

    const result = await executeTool(call.name, call.args);

    response = await chat.sendMessage({
      message: {
        functionResponse: {
          name: call.name,
          response: { result },
        },
      },
    });
    rounds += 1;
  }

  const text = response.text;
  if (text) return text;

  return "I wasn't able to produce an answer for that — could you rephrase the question?";
}
