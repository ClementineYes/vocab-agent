"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getCollections,
  getActiveCollectionId,
  setActiveCollectionId,
  createCollection,
  isWordInCollection,
  toggleWordInCollection,
  setLastViewedWordId,
} from "@/app/lib/vibeStore";
import { wordToId } from "@/app/lib/slug";
import { ArrowRightIcon } from "@/app/components/ActionIcons";
import { StarFilledIcon, StarOutlineIcon } from "@/app/components/ActionIcons";
import { ChevronDownIcon } from "@/app/components/ActionIcons";
import type { ScanWord } from "@/app/lib/vibeTypes";

async function resizeImageToJpegBase64(file: File, maxSide = 1024, quality = 0.82) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";
    img.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Image load failed"));
    });

    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    ctx.drawImage(img, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const base64 = dataUrl.split(",")[1] ?? "";
    return { base64, mimeType: "image/jpeg" };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function fileToBase64(file: File) {
  // Mobile 上传容易触发体积限制：先做压缩，再转 base64
  return resizeImageToJpegBase64(file);
}

export default function ScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeCollectionId, setActiveId] = useState<string>(() => getActiveCollectionId());
  const [collections, setCollections] = useState(() => getCollections());
  // activeCollectionName 暂未在 UI 展示（避免重复查询开销）

  const [isScanning, setIsScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanWords, setScanWords] = useState<ScanWord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onPickClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsScanning(true);
    setScanWords([]);

    // 预览图
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    try {
      const { base64, mimeType } = await fileToBase64(file);

      const resp = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });

      const data = (await resp.json()) as { words: ScanWord[] };
      const normalized = (data.words ?? []).map((w) => ({
        ...w,
        id: w.id || wordToId(w.word),
      }));

      setScanWords(normalized);

      const wordIds = normalized.map((w) => w.id);
      window.localStorage.setItem(
        "vibe_vocab:lastScanWordIds",
        JSON.stringify(wordIds)
      );

      // 为“收藏夹展开释义”和“阅览页显示单词”做本地缓存
      const wordIdToWord: Record<string, string> = {};
      const wordBriefMap: Record<string, string> = {};
      for (const w of normalized) {
        wordIdToWord[w.id] = w.word;
        if (w.meaningZhShort) wordBriefMap[w.id] = w.meaningZhShort;
      }

      window.localStorage.setItem(
        "vibe_vocab:wordIdToWord",
        JSON.stringify({
          ...(JSON.parse(window.localStorage.getItem("vibe_vocab:wordIdToWord") ?? "{}") as Record<
            string,
            string
          >),
          ...wordIdToWord,
        })
      );
      window.localStorage.setItem(
        "vibe_vocab:wordBriefMap",
        JSON.stringify({
          ...(JSON.parse(window.localStorage.getItem("vibe_vocab:wordBriefMap") ?? "{}") as Record<
            string,
            string
          >),
          ...wordBriefMap,
        })
      );
    } catch (err) {
      console.error(err);
      setError("识别失败：请稍后再试。");
    } finally {
      setIsScanning(false);
    }
  };

  const collectionOptions = collections;

  const handleToggleFavorite = (word: ScanWord) => {
    toggleWordInCollection(word.id, activeCollectionId);
  };

  const handleOpenDetail = (word: ScanWord) => {
    setLastViewedWordId(word.id);
    router.push(`/reading/${word.id}`);
  };

  const handleCreateCollection = () => {
    const name = window.prompt("新建收藏夹名称（例如：旅行词汇）");
    if (!name) return;
    createCollection(name);
    // 立即刷新本页状态
    const next = getActiveCollectionId();
    setCollections(getCollections());
    setActiveId(next);
    setActiveCollectionId(next);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white/70">视觉扫描</div>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-white">
            Vibe Vocab
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={activeCollectionId}
              onChange={(e) => {
                const id = e.target.value;
                setActiveId(id);
                setActiveCollectionId(id);
              }}
              className="appearance-none rounded-xl bg-white/5 px-3 py-2 pr-9 text-xs font-semibold text-white/80 ring-1 ring-white/10 focus:outline-none focus:ring-[#6D28D9]/60"
              aria-label="收藏夹选择"
            >
              {collectionOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/70">
              <ChevronDownIcon className="h-4 w-4" />
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateCollection}
            className="rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 ring-1 ring-white/10 transition active:scale-[0.98] hover:ring-[#6D28D9]/40"
          >
            新建
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl shadow-[0_0_35px_rgba(109,40,217,0.18)]">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onFileChange}
          />

          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={onPickClick}
              className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-10 text-center transition active:scale-[0.99] hover:border-[#6D28D9]/40"
            >
              <div className="text-sm font-semibold text-white/90">
                点击上传图片识别单词
              </div>
              <div className="text-xs text-white/60">
                支持相册或拍照（MVP：示例数据也可运行）
              </div>
            </button>

            {previewUrl ? (
              <div className="overflow-hidden rounded-xl bg-black/20 ring-1 ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="预览"
                  className="h-44 w-full object-cover"
                />
              </div>
            ) : null}

            {isScanning ? (
              <div className="rounded-xl bg-white/5 p-3 text-sm font-semibold text-white/80">
                正在识别中...
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl bg-[#6D28D9]/20 p-3 text-sm font-semibold text-[#E9D5FF]">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl shadow-[0_0_30px_rgba(109,40,217,0.12)]">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white/80">识别出的 5 个核心物体</div>
            <div className="text-xs font-semibold text-white/50">
              标签可收藏、查看详情
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {scanWords.map((w) => {
              const favorited = isWordInCollection(w.id, activeCollectionId);
              return (
                <div
                  key={w.id}
                  className="group flex items-center gap-2 rounded-2xl bg-[#6D28D9]/20 px-3 py-2 ring-1 ring-[#6D28D9]/30"
                >
                  <div className="rounded-xl bg-[#6D28D9] px-3 py-2 text-sm font-extrabold text-white shadow-[0_0_20px_rgba(109,40,217,0.35)]">
                    {w.word}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={favorited ? "取消收藏" : "收藏"}
                      onClick={() => handleToggleFavorite(w)}
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

                    <button
                      type="button"
                      aria-label="查看详情"
                      onClick={() => handleOpenDetail(w)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 text-white/70 transition active:scale-[0.98] hover:text-white hover:ring-[#6D28D9]/40"
                    >
                      <ArrowRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {!scanWords.length ? (
              <div className="w-full rounded-xl bg-white/5 p-4 text-sm font-semibold text-white/50">
                还没有识别结果。先上传一张图片开始。
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

