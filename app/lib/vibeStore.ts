"use client";

import { Collection, WordDetails } from "./vibeTypes";

const STORAGE = {
  collections: "vibe_vocab:collections",
  activeCollectionId: "vibe_vocab:activeCollectionId",
  wordDetailsMap: "vibe_vocab:wordDetailsMap",
  lastViewedWordId: "vibe_vocab:lastViewedWordId",
} as const;

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function wordDetailsMapGet(): Record<string, WordDetails> {
  if (typeof window === "undefined") return {};
  return safeParseJson<Record<string, WordDetails>>(
    window.localStorage.getItem(STORAGE.wordDetailsMap),
    {}
  );
}

export function wordDetailsMapSet(details: WordDetails) {
  if (typeof window === "undefined") return;
  const current = wordDetailsMapGet();
  current[details.id] = details;
  window.localStorage.setItem(STORAGE.wordDetailsMap, JSON.stringify(current));
}

export function getLastViewedWordId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE.lastViewedWordId);
}

export function setLastViewedWordId(wordId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE.lastViewedWordId, wordId);
}

export function getCollections(): Collection[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(STORAGE.collections);
  const list = safeParseJson<Collection[]>(raw, []);

  if (list.length === 0) {
    const created: Collection = { id: "default", name: "默认收藏夹", wordIds: [] };
    window.localStorage.setItem(STORAGE.collections, JSON.stringify([created]));
    return [created];
  }

  return list;
}

export function ensureActiveCollectionId(): string {
  if (typeof window === "undefined") return "default";

  const collections = getCollections();
  const rawActive = window.localStorage.getItem(STORAGE.activeCollectionId);
  const exists = rawActive && collections.some((c) => c.id === rawActive);

  if (exists && rawActive) return rawActive;
  window.localStorage.setItem(STORAGE.activeCollectionId, collections[0].id);
  return collections[0].id;
}

export function getActiveCollectionId(): string {
  if (typeof window === "undefined") return "default";
  return ensureActiveCollectionId();
}

export function setActiveCollectionId(collectionId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE.activeCollectionId, collectionId);
}

export function getCollectionById(collectionId: string): Collection | null {
  const collections = getCollections();
  return collections.find((c) => c.id === collectionId) ?? null;
}

export function createCollection(name: string) {
  if (typeof window === "undefined") return;

  const trimmed = name.trim();
  if (!trimmed) return;

  const collections = getCollections();
  const exists = collections.some((c) => c.name === trimmed);
  if (exists) return;

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Date.now());

  const newCol: Collection = { id, name: trimmed, wordIds: [] };
  const next = [newCol, ...collections];
  window.localStorage.setItem(STORAGE.collections, JSON.stringify(next));
  window.localStorage.setItem(STORAGE.activeCollectionId, id);
}

export function toggleWordInCollection(wordId: string, collectionId?: string) {
  if (typeof window === "undefined") return;

  const colId = collectionId ?? ensureActiveCollectionId();
  const collections = getCollections();
  const next = collections.map((c) => {
    if (c.id !== colId) return c;
    const has = c.wordIds.includes(wordId);
    return { ...c, wordIds: has ? c.wordIds.filter((id) => id !== wordId) : [wordId, ...c.wordIds] };
  });

  window.localStorage.setItem(STORAGE.collections, JSON.stringify(next));
}

export function isWordInCollection(wordId: string, collectionId?: string) {
  if (typeof window === "undefined") return false;
  const colId = collectionId ?? ensureActiveCollectionId();
  const col = getCollectionById(colId);
  return !!col?.wordIds.includes(wordId);
}

