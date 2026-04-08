import { NextResponse } from "next/server";
import OpenAI from "openai";

import { wordToId } from "@/app/lib/slug";
import type { WordDetails } from "@/app/lib/vibeTypes";

export const dynamic = "force-dynamic";

type WordDetailsRequestBody = {
  word: string;
};

function extractJsonObject(raw: string) {
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  return raw.slice(first, last + 1);
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<WordDetailsRequestBody>;
  const word = typeof body.word === "string" ? body.word.trim() : "";

  if (!word) {
    return NextResponse.json({ error: "Missing word" }, { status: 400 });
  }

  const doubaoKey = process.env.ARK_API_KEY ?? process.env.DOUBAO_API_KEY;
  const baseURL =
    process.env.ARK_BASE_URL ??
    process.env.DOUBAO_BASE_URL ??
    "https://ark.cn-beijing.volces.com/api/v3";
  const textModel =
    process.env.ARK_TEXT_MODEL ??
    process.env.DOUBAO_TEXT_MODEL ??
    "doubao-seed-2-0-mini-260215";
  const id = wordToId(word);

  if (!doubaoKey) {
    const mock: WordDetails = {
      id,
      word,
      phonetic: "",
      meaningZhFull:
        word === "wander"
          ? "（尤指漫无目的地）闲逛；徘徊；走失。\n（比喻）偏离主题/目标"
          : "常见含义：用于日常英语表达的词义。\n补充含义：更具体的用法与场景。",
      exampleSentenceEn: `People like to ${word} during weekends.`,
      exampleSentenceZh: `人们周末喜欢${word}。`,
      etymology: "词源：该词常见于日常用法中，含义随语境变化。",
      weirdMemoryQuote: `不是所有的 ${word} 都会迷失方向。你要做的是把注意力钉住。`,
    };
    return NextResponse.json({ detail: mock });
  }

  const client = new OpenAI({
    apiKey: doubaoKey,
    baseURL,
  });

  const userPrompt = `请针对单词 ${word} 生成 JSON 数据。`;

  const resp = await client.responses.create({
    model: textModel,
    temperature: 0.4,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: `你是一个幽默的英语名师。请针对单词 ${word} 生成 JSON 数据，包含：

phonetic: 音标
definition: 常用含义
example: 英文例句
fun_memory: 诡异记忆法。找一句中文经典台词或名言，将关键词替换为该英文单词。例如：'不是所有 wander 的人都迷失了方向'。
etymology: 简短词源故事。
请严格返回 JSON 格式。`,
          },
        ],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: userPrompt }],
      },
    ],
  });

  const content = resp.output_text ?? "";
  const jsonRaw = extractJsonObject(content);
  if (!jsonRaw) {
    return NextResponse.json(
      { error: "Invalid JSON from model", content },
      { status: 500 }
    );
  }

  const parsed = JSON.parse(jsonRaw) as {
    phonetic?: string;
    definition?: string;
    example?: string;
    fun_memory?: string;
    etymology?: string;
  };
  const detail: WordDetails = {
    id,
    word,
    phonetic: parsed.phonetic ?? "",
    meaningZhFull: parsed.definition ?? "",
    exampleSentenceEn: parsed.example ?? "",
    exampleSentenceZh: "",
    etymology: parsed.etymology ?? "",
    weirdMemoryQuote: parsed.fun_memory ?? "",
  };

  return NextResponse.json({ detail });
}

