import OpenAI from "openai";
import { DEFAULT_AI_PROMPT } from "../../shared/api-types.js";
import type { AiGenerationResult } from "../types.js";

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-flash";
const MAX_INLINE_IMAGE_BYTES = 30 * 1024 * 1024;

let client: OpenAI | null | undefined;
let warnedMissingKey = false;

function emptyResult(): AiGenerationResult {
  return {
    title: null,
    description: null,
  };
}

function parseGeneration(content: string | null | undefined): AiGenerationResult {
  const text = content?.trim();
  if (!text) {
    return emptyResult();
  }

  const withoutFence = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const candidate = withoutFence.startsWith("{")
    ? withoutFence
    : withoutFence.slice(withoutFence.indexOf("{"), withoutFence.lastIndexOf("}") + 1);

  try {
    const parsed = JSON.parse(candidate) as unknown;
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      const record = parsed as Record<string, unknown>;
      const title = typeof record.title === "string"
        ? record.title.trim().slice(0, 120)
        : "";
      const description = typeof record.description === "string"
        ? record.description.trim()
        : "";
      return {
        title: title || null,
        description: description || null,
      };
    }
  } catch {
    // Fall back to the raw response as the description.
  }

  return {
    title: null,
    description: text,
  };
}

function getClient(): OpenAI | null {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    if (!warnedMissingKey) {
      console.warn("DEEPSEEK_API_KEY is not configured; skipping AI descriptions.");
      warnedMissingKey = true;
    }
    return null;
  }

  client ??= new OpenAI({
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL ?? DEFAULT_BASE_URL,
    maxRetries: 1,
    timeout: 30_000,
  });

  return client;
}

export async function describeImage(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  prompt: string,
  signal?: AbortSignal,
): Promise<AiGenerationResult> {
  if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mimeType)) {
    return emptyResult();
  }

  if (buffer.byteLength > MAX_INLINE_IMAGE_BYTES) {
    console.warn(`Image is too large; skipping AI title and description: ${fileName}`);
    return emptyResult();
  }

  const openai = getClient();
  if (!openai) {
    return emptyResult();
  }

  try {
    const encoded = buffer.toString("base64");
    const response = await openai.chat.completions.create({
      model: process.env.DESCRIPTION_MODEL ?? DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content:
            "Return only a valid JSON object with keys title and description. " +
            "Use the language requested by the user. Keep the title concise and " +
            "descriptive, at most 80 characters.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt.trim() || process.env.DESCRIPTION_PROMPT || DEFAULT_AI_PROMPT,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${encoded}`,
                detail: "low",
              },
            },
          ],
        },
      ],
    }, signal ? { signal } : undefined);
    return parseGeneration(response.choices[0]?.message.content);
  } catch (error) {
    console.warn(
      `AI title and description failed; continuing without them: ${fileName}`,
      error,
    );
    return emptyResult();
  }
}
