"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
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
  const activeCollectionId = "default";

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

        const data = (await resp.json()) as {
          detail?: WordDetails;
          error?: string;
          content?: string;
        };
        if (!resp.ok) {
          const snippet =
            typeof data.content === "string"
              ? data.content.slice(0, 200)
              : "";
          throw new Error(
            [data.error, snippet].filter(Boolean).join(" ") ||
              `请求失败 ${resp.status}`
          );
        }
        if (!data.detail) {
          throw new Error("返回数据缺少 detail");
        }
        if (cancelled) return;
        setDetail(data.detail);
        wordDetailsMapSet(data.detail);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "请稍后再试";
        setError(`生成词卡失败：${msg}`);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [wordId]);

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
              {/* 首屏：放大记忆句（无模块标题）；仅该词为英文 */}
              <div className="rounded-2xl border border-[#6D28D9]/35 bg-gradient-to-b from-[#6D28D9]/15 to-black/40 px-4 py-8 text-center shadow-[0_0_48px_rgba(109,40,217,0.22)] sm:px-6 sm:py-10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  {detail.word}
                </p>
                <div className="mt-4 text-2xl font-semibold leading-snug text-white sm:text-3xl sm:leading-snug md:text-4xl md:leading-tight">
                  <HighlightedQuote
                    quote={detail.weirdMemoryQuote || "（暂无记忆句）"}
                    word={detail.word}
                  />
                </div>
              </div>

              <div className="mt-6 space-y-5 border-t border-white/10 pt-6">
                <div>
                  <div className="text-xs font-semibold text-white/50">释义</div>
                  <div className="mt-2 whitespace-pre-line text-base font-semibold leading-relaxed text-white/85">
                    {detail.meaningZhFull || "（暂无）"}
                  </div>
                </div>

                {detail.phonetic ? (
                  <div>
                    <div className="text-xs font-semibold text-white/50">音标</div>
                    <div className="mt-2 rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-[#E9D5FF] ring-1 ring-white/10">
                      /{detail.phonetic.replace(/^\/*|\/$/g, "")}/
                    </div>
                  </div>
                ) : null}

                <div>
                  <div className="text-xs font-semibold text-white/50">词源</div>
                  <div className="mt-2 whitespace-pre-line text-sm font-semibold leading-relaxed text-white/70">
                    {detail.etymology || "—"}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-white/50">例句与用法</div>
                  <div className="mt-2 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                    <div className="whitespace-pre-line text-sm font-semibold leading-relaxed text-white/85">
                      {detail.exampleSentenceEn || "—"}
                    </div>
                    {detail.exampleSentenceZh ? (
                      <div className="mt-2 whitespace-pre-line text-sm font-medium text-white/60">
                        {detail.exampleSentenceZh}
                      </div>
                    ) : null}
                  </div>
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
              未找到该单词的词卡。请从「阅览」页手动输入单词，或去「扫描」识别后再试。
            </div>
          ) : null}
        </div>
      </div>
      <div className="h-8" />
    </div>
  );
}

