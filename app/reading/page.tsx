"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";

import { getLastViewedWordId } from "@/app/lib/vibeStore";

function loadWordIdToWordMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  return JSON.parse(
    window.localStorage.getItem("vibe_vocab:wordIdToWord") ?? "{}"
  ) as Record<string, string>;
}

export default function ReadingHomePage() {
  const router = useRouter();
  const lastViewedWordId = getLastViewedWordId();
  const wordIdToWord = useMemo(() => loadWordIdToWordMap(), []);

  const word = lastViewedWordId ? wordIdToWord[lastViewedWordId] : "";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-5">
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl shadow-[0_0_35px_rgba(109,40,217,0.14)]">
        <div className="text-sm font-semibold text-white/70">阅览</div>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-white">
          灵魂词卡
        </h2>

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

