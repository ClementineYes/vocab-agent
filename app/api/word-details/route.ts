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
      weirdMemoryQuote: `不是所有 ${word} 的人都迷失了方向。`,
    };
    return NextResponse.json({ detail: mock });
  }

  const client = new OpenAI({
    apiKey: doubaoKey,
    baseURL,
  });

  const userPrompt = `请为英文单词「${word}」生成词卡 JSON（字段名必须完全一致）。`;

  const resp = await client.responses.create({
    model: textModel,
    temperature: 0.45,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: `你是中文母语、熟悉网络梗与影视综艺爆梗的英语学习内容编辑。

针对用户给出的英文单词，请严格返回一个 JSON 对象（不要 markdown，不要多余说明），字段如下：

- phonetic: 该词的 IPA 音标字符串（可含 / /）
- definition: 完整中文释义（可分段，用 \\n）
- example: 学习用例句：以中文为主说明用法，可夹带一句简短英文例句辅助记忆
- memory_sentence: 核心记忆句。要求：联想与该词相关的网络梗、段子、或近年爆火的台词/名言中的一句；把原句里的「一个词」替换成用户这个英文单词（必须恰好出现一次英文单词 ${word}，且全句除该英文词外全部为中文；不要整句英文化）
- etymology: 简短中文词源故事

只输出 JSON。`,
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
    memory_sentence?: string;
    fun_memory?: string;
    etymology?: string;
  };
  const memoryLine =
    parsed.memory_sentence ?? parsed.fun_memory ?? "";
  const detail: WordDetails = {
    id,
    word,
    phonetic: parsed.phonetic ?? "",
    meaningZhFull: parsed.definition ?? "",
    exampleSentenceEn: parsed.example ?? "",
    exampleSentenceZh: "",
    etymology: parsed.etymology ?? "",
    weirdMemoryQuote: memoryLine,
  };

  return NextResponse.json({ detail });
}

