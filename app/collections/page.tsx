"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import {
  createCollection,
  getActiveCollectionId,
  getCollectionById,
  getCollections,
  setActiveCollectionId,
} from "@/app/lib/vibeStore";
import type { Collection } from "@/app/lib/vibeTypes";
import { ArrowRightIcon } from "@/app/components/ActionIcons";

type WordBriefMap = Record<string, string>;
type WordIdToWordMap = Record<string, string>;

function loadWordBriefMap(): WordBriefMap {
  if (typeof window === "undefined") return {};
  return JSON.parse(
    window.localStorage.getItem("vibe_vocab:wordBriefMap") ?? "{}"
  ) as WordBriefMap;
}

function loadWordIdToWordMap(): WordIdToWordMap {
  if (typeof window === "undefined") return {};
  return JSON.parse(
    window.localStorage.getItem("vibe_vocab:wordIdToWord") ?? "{}"
  ) as WordIdToWordMap;
}

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function CollectionsPage() {
  const router = useRouter();

  const [collections, setCollections] = useState<Collection[]>(() => getCollections());
  const [activeCollectionId, setActiveId] = useState<string>(() =>
    getActiveCollectionId()
  );
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null);
  const [briefMap] = useState<WordBriefMap>(() => loadWordBriefMap());
  const [wordIdToWord] = useState<WordIdToWordMap>(() => loadWordIdToWordMap());

  const activeCollection = getCollectionById(activeCollectionId);

  const onCreate = () => {
    const name = window.prompt("新建收藏夹名称（例如：旅行词汇）");
    if (!name) return;
    createCollection(name);
    // 立即刷新本页状态
    setCollections(getCollections());
    const nextActive = getActiveCollectionId();
    setActiveId(nextActive);
    setActiveCollectionId(nextActive);
    setExpandedWordId(null);
  };

  const onSelectCollection = (id: string) => {
    setActiveId(id);
    setActiveCollectionId(id);
    setExpandedWordId(null);
  };

  const wordIds = activeCollection?.wordIds ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-5">
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl shadow-[0_0_35px_rgba(109,40,217,0.14)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white/70">收藏夹管理</div>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-white">
              Collection
            </h2>
          </div>

          <button
            type="button"
            onClick={onCreate}
            className="rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 ring-1 ring-white/10 transition active:scale-[0.98] hover:ring-[#6D28D9]/40"
          >
            新建
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {collections.map((c) => {
            const selected = c.id === activeCollectionId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCollection(c.id)}
                className={cx(
                  "shrink-0 rounded-full px-4 py-2 text-xs font-semibold ring-1 transition active:scale-[0.98]",
                  selected
                    ? "bg-[#6D28D9]/20 text-[#E9D5FF] ring-[#6D28D9]/40"
                    : "bg-white/5 text-white/70 ring-white/10 hover:text-white hover:ring-[#6D28D9]/30"
                )}
              >
                {c.name}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          {wordIds.length ? (
            <div className="grid gap-3">
              {wordIds.map((id) => {
                const expanded = expandedWordId === id;
                const word = wordIdToWord[id] ?? id;
                const brief = briefMap[id] ?? "";

                return (
                  <div key={id} className="rounded-2xl border border-white/10 bg-black/25 p-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (expanded) {
                          router.push(`/reading/${id}`);
                        } else {
                          setExpandedWordId(id);
                        }
                      }}
                      className="flex w-full flex-col items-stretch gap-0 px-4 py-3 text-left"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-extrabold text-white">
                            {word}
                          </div>
                          {!expanded ? (
                            <div className="mt-1 text-[11px] font-semibold text-white/50">
                              点击展开释义
                            </div>
                          ) : (
                            <div className="mt-1 text-[11px] font-semibold text-[#E9D5FF]/80">
                              再点一次进入词卡
                            </div>
                          )}
                        </div>
                        <div
                          className={cx(
                            "flex h-10 w-10 items-center justify-center rounded-xl ring-1 transition active:scale-[0.98]",
                            expanded
                              ? "bg-[#6D28D9]/20 ring-[#6D28D9]/40 text-[#E9D5FF]"
                              : "bg-white/5 ring-white/10 text-white/70"
                          )}
                        >
                          <ArrowRightIcon className="h-4 w-4" />
                        </div>
                      </div>

                      {expanded ? (
                        <div className="mt-3 rounded-xl bg-[#6D28D9]/10 px-3 py-2 ring-1 ring-[#6D28D9]/30">
                          <div className="text-[11px] font-semibold text-[#E9D5FF]/90">
                            简要中文释义
                          </div>
                          <div className="mt-1 text-sm font-semibold text-white/80">
                            {brief || "（暂无释义）"}
                          </div>
                        </div>
                      ) : null}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="text-sm font-semibold text-white/70">
                这个收藏夹还没有单词。
              </div>
              <div className="mt-2 text-sm font-semibold text-white/50">
                去“扫描”页面添加你的第一个词。
              </div>
              <button
                type="button"
                onClick={() => router.push("/scan")}
                className="mt-3 rounded-xl bg-[#6D28D9] px-4 py-2 text-sm font-semibold text-[#050505] shadow-[0_0_30px_rgba(109,40,217,0.35)] transition active:scale-[0.98] hover:brightness-110"
              >
                去扫描
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="h-6" />
    </div>
  );
}

