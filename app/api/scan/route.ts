import { NextResponse } from "next/server";
import OpenAI from "openai";

import { wordToId } from "@/app/lib/slug";

export const dynamic = "force-dynamic";

type ScanRequestBody = {
  imageBase64: string;
  mimeType: string;
};

function extractJsonArray(raw: string) {
  const first = raw.indexOf("[");
  const last = raw.lastIndexOf("]");
  if (first === -1 || last === -1 || last <= first) return null;
  return raw.slice(first, last + 1);
}

function parseWordArray(rawText: string) {
  const jsonRaw = extractJsonArray(rawText);
  if (!jsonRaw) return null;

  try {
    return JSON.parse(jsonRaw) as string[];
  } catch {
    // 兼容模型返回单引号数组: ['a','b']
    const repaired = jsonRaw.replace(/'/g, "\"");
    try {
      return JSON.parse(repaired) as string[];
    } catch {
      return null;
    }
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<ScanRequestBody>;
  const imageBase64 = typeof body.imageBase64 === "string" ? body.imageBase64 : "";
  const mimeType = typeof body.mimeType === "string" ? body.mimeType : "image/jpeg";

  if (!imageBase64) {
    return NextResponse.json(
      { error: "Missing imageBase64" },
      { status: 400 }
    );
  }

  const apiKey = process.env.ARK_API_KEY ?? process.env.DOUBAO_API_KEY;
  const baseURL =
    process.env.ARK_BASE_URL ??
    process.env.DOUBAO_BASE_URL ??
    "https://ark.cn-beijing.volces.com/api/v3";
  const visionModel =
    process.env.ARK_VISION_MODEL ??
    process.env.DOUBAO_VISION_MODEL ??
    "doubao-seed-2-0-mini-260215";

  if (!apiKey) {
    // MVP：未配置 Key 时先返回模拟数据，保证页面可交互
    const mock = ["apple", "book", "cat", "bottle", "phone"].map((w) => ({
      id: wordToId(w),
      word: w,
      phonetic: "",
      meaningZhShort:
        w === "apple"
          ? "苹果"
          : w === "book"
            ? "书"
            : w === "cat"
              ? "猫"
              : w === "bottle"
                ? "瓶子"
                : "手机",
    }));

    return NextResponse.json({ words: mock });
  }

  const client = new OpenAI({
    apiKey,
    baseURL,
  });

  try {
    const resp = await client.responses.create({
      model: visionModel,
      temperature: 0.1,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "你是一个视觉分析专家。请识别图片中 5 个最显著的办公/生活物体。请直接返回一个 JSON 数组，格式为: ['word1', 'word2', 'word3', 'word4', 'word5']。不要返回任何多余的解释文字。",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: `data:${mimeType};base64,${imageBase64}`,
              detail: "auto",
            },
            {
              type: "input_text",
              text: "你看见了什么？请按 system 要求返回 JSON 数组。",
            },
          ],
        },
      ],
    });

    const rawText = resp.output_text ?? "";
    const parsed = parseWordArray(rawText);
    if (!parsed) {
      return NextResponse.json(
        { error: "Model output is not valid JSON array", detail: rawText },
        { status: 500 }
      );
    }

    const normalized = parsed.slice(0, 5).map((rawWord, idx) => {
      const word = String(rawWord ?? "").trim().toLowerCase() || `object-${idx + 1}`;
      return {
        id: wordToId(word),
        word,
        phonetic: "",
        meaningZhShort: "",
      };
    });

    return NextResponse.json({ words: normalized });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Unknown scan provider error";
    return NextResponse.json(
      { error: "Doubao scan request failed", detail },
      { status: 500 }
    );
  }
}

