"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  getActiveCollectionId,
  isWordInCollection,
  setLastViewedWordId,
  toggleWordInCollection,
  wordDetailsMapGet,
  wordDetailsMapSet,
} from "@/app/lib/vibeStore";
import type { WordDetails } from "@/app/lib/vibeTypes";
import {
  ArrowRightIcon,
  StarFilledIcon,
  StarOutlineIcon,
} from "@/app/components/ActionIcons";

function loadWordIdToWordMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  return JSON.parse(
    window.localStorage.getItem("vibe_vocab:wordIdToWord") ?? "{}"
  ) as Record<string, string>;
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightedQuote({ quote, word }: { quote: string; word: string }) {
  const parts = useMemo(() => {
    if (!quote || !word) return [quote];
    const re = new RegExp(`(${escapeRegExp(word)})`, "gi");
    return quote.split(re);
  }, [quote, word]);

  return (
    <span className="text-white/90">
      {parts.map((p, idx) => {
        const isWord = p.toLowerCase() === word.toLowerCase();
        return isWord ? (
          <span
            key={`${idx}-${p}`}
            className="font-extrabold text-[#E9D5FF] [text-shadow:0_0_22px_rgba(109,40,217,0.55)]"
          >
            {p}
          </span>
        ) : (
          <span key={`${idx}-${p}`}>{p}</span>
        );
      })}
    </span>
  );
}

export default function ReadingDetailPage() {
  const router = useRouter();
  const params = useParams<{ wordId: string }>();
  const wordId = params.wordId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<WordDetails | null>(null);

  useEffect(() => {
    if (!wordId) return;

    setLastViewedWordId(wordId);

    const cache = wordDetailsMapGet();
    const cached = cache[wordId];
    const wordIdToWord = loadWordIdToWordMap();
    const word = wordIdToWord[wordId] ?? wordId;

    if (cached) {
      setDetail(cached);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await fetch("/api/word-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word }),
        });

        const data = (await resp.json()) as { detail: WordDetails };
        if (cancelled) return;
        setDetail(data.detail);
        wordDetailsMapSet(data.detail);
      } catch {
        if (cancelled) return;
        setError("生成词卡失败：请稍后再试。");
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [wordId]);

  const activeCollectionId = getActiveCollectionId();
  const favorited = wordId ? isWordInCollection(wordId, activeCollectionId) : false;

  const onToggleFavorite = () => {
    if (!detail) return;
    toggleWordInCollection(detail.id, activeCollectionId);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 ring-1 ring-white/10 transition active:scale-[0.98] hover:ring-[#6D28D9]/40"
        >
          返回
        </button>

        <button
          type="button"
          aria-label={favorited ? "取消收藏" : "收藏"}
          onClick={onToggleFavorite}
          className={[
            "inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 transition active:scale-[0.98]",
            favorited
              ? "bg-[#6D28D9]/20 ring-[#6D28D9]/40 text-white"
              : "bg-white/5 ring-white/10 text-white/70 hover:text-white hover:ring-[#6D28D9]/40",
          ].join(" ")}
        >
          {favorited ? (
            <StarFilledIcon className="h-4 w-4" />
          ) : (
            <StarOutlineIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="mt-4 grid gap-4">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl shadow-[0_0_40px_rgba(109,40,217,0.18)]">
          {loading && !detail ? (
            <div className="rounded-xl bg-white/5 p-4 text-sm font-semibold text-white/70">
              词卡正在生成...
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl bg-[#6D28D9]/20 p-4 text-sm font-semibold text-[#E9D5FF]">
              {error}
            </div>
          ) : null}

          {detail ? (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white/70">单词</div>
                  <div className="mt-1 flex items-center gap-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">
                      {detail.word}
                    </h1>
                    {detail.phonetic ? (
                      <span className="rounded-xl bg-white/5 px-2 py-1 text-xs font-semibold text-white/70 ring-1 ring-white/10">
                        /{detail.phonetic}/
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-[#6D28D9]/30 bg-[#6D28D9]/10 p-3">
                <div className="text-sm font-semibold text-[#E9D5FF]">
                  必背含义
                </div>
                <div className="mt-2 whitespace-pre-line text-sm font-semibold text-white/80">
                  {detail.meaningZhFull || "（暂无）"}
                </div>
              </div>

              <div className="mt-3">
                <div className="text-sm font-semibold text-white/70">
                  常用例句
                </div>
                <div className="mt-2 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                  <div className="text-sm font-extrabold text-white">
                    {detail.exampleSentenceEn || "—"}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white/70">
                    {detail.exampleSentenceZh || "—"}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="text-sm font-semibold text-white/70">词源</div>
                <div className="mt-2 rounded-xl bg-white/5 p-3 ring-1 ring-white/10 whitespace-pre-line text-sm font-semibold text-white/70">
                  {detail.etymology || "—"}
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-[#6D28D9]/40 bg-black/30 p-4 backdrop-blur-xl shadow-[0_0_55px rgba(109,40,217,0.28)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-extrabold text-[#E9D5FF]">
                    诡异记忆法
                  </div>
                </div>
                <div className="mt-2 rounded-xl bg-[#6D28D9]/10 p-3 ring-1 ring-[#6D28D9]/30 text-sm font-semibold text-white/90">
                  <HighlightedQuote
                    quote={detail.weirdMemoryQuote || ""}
                    word={detail.word}
                  />
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white/70">
                      下一步
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      去收藏夹继续复习
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/collections")}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#6D28D9] px-4 py-2 text-sm font-semibold text-[#050505] shadow-[0_0_30px_rgba(109,40,217,0.45)] transition active:scale-[0.98] hover:brightness-110"
                  >
                    收藏夹
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {!detail && !loading ? (
            <div className="rounded-xl bg-white/5 p-4 text-sm font-semibold text-white/70">
              未找到该单词的词卡，请回到扫描页重新生成。
            </div>
          ) : null}
        </div>
      </div>
      <div className="h-8" />
    </div>
  );
}

