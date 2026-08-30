/**
 * Thin wrapper around the Gemini SDK (@google/genai — the current,
 * actively-maintained Google GenAI SDK; the older @google/generative-ai
 * package is deprecated and its models are being retired) so the rest of
 * the app never touches the SDK directly. Swapping models/providers later
 * means editing only this file plus agent.ts.
 */

import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (client) return client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to your environment (see .env.local.example)."
    );
  }

  client = new GoogleGenAI({ apiKey });
  return client;
}

/**
 * Default model. gemini-2.0-flash was retired; gemini-3.6-flash is the
 * current stable Flash model as of this writing. Override via
 * GEMINI_MODEL if Google ships a newer default before you deploy —
 * check https://ai.google.dev/gemini-api/docs/models for the current
 * list if this ever 404s.
 */
export function getModelName(): string {
  return process.env.GEMINI_MODEL || "gemini-3.6-flash";
}
