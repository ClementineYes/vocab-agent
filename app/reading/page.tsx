"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { wordToId } from "@/app/lib/slug";

function loadWordIdToWordMap(): Record<string, string> {
  return {};
}

export default function ReadingHomePage() {
  const router = useRouter();
  const lastViewedWordId: string | null = null;
  const wordIdToWord: Record<string, string> = {};
  const [manualWord, setManualWord] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  const word = lastViewedWordId ? wordIdToWord[lastViewedWordId] : "";

  const onGenerateByWord = () => {
    const cleaned = manualWord.trim().toLowerCase();
    if (!cleaned) {
      setManualError("请输入一个英文单词。");
      return;
    }
    if (!/^[a-z-]+$/i.test(cleaned)) {
      setManualError("一次只能输入一个英文单词（仅字母）。");
      return;
    }
    setManualError(null);
    const id = wordToId(cleaned);
    const currentMap = loadWordIdToWordMap();
    window.localStorage.setItem(
      "vibe_vocab:wordIdToWord",
      JSON.stringify({
        ...currentMap,
        [id]: cleaned,
      })
    );
    router.push(`/reading/${id}`);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-5">
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl shadow-[0_0_35px_rgba(109,40,217,0.14)]">
        <div className="text-sm font-semibold text-white/70">阅览</div>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-white">
          灵魂词卡
        </h2>

        <div className="mt-4 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
          <div className="text-sm font-semibold text-white/80">
            手动输入单词（一次一个）
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              value={manualWord}
              onChange={(e) => setManualWord(e.target.value)}
              placeholder="例如: wander"
              className="flex-1 rounded-xl bg-black/30 px-3 py-2 text-sm font-semibold text-white outline-none ring-1 ring-white/10 placeholder:text-white/40 focus:ring-[#6D28D9]/50"
            />
            <button
              type="button"
              onClick={onGenerateByWord}
              className="rounded-xl bg-[#6D28D9] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_30px_rgba(109,40,217,0.35)] transition active:scale-[0.98] hover:brightness-110"
            >
              生成词卡
            </button>
          </div>
          {manualError ? (
            <div className="mt-2 text-xs font-semibold text-[#E9D5FF]">
              {manualError}
            </div>
          ) : null}
        </div>

        {lastViewedWordId ? (
          <div className="mt-4 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm text-white/60">最近查看</div>
                <div className="mt-1 text-xl font-extrabold text-white">
                  {word || lastViewedWordId}
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/reading/${lastViewedWordId}`)}
                className="rounded-xl bg-[#6D28D9] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_30px_rgba(109,40,217,0.35)] transition active:scale-[0.98] hover:brightness-110"
              >
                进入详情
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
            <div className="text-sm font-semibold text-white/70">
              还没有识别记录。
            </div>
            <button
              type="button"
              onClick={() => router.push("/scan")}
              className="mt-3 rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 ring-1 ring-white/10 transition active:scale-[0.98] hover:ring-[#6D28D9]/40"
            >
              去扫描
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

