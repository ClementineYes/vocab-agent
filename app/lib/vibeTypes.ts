export type ScanWord = {
  id: string;
  word: string; // English noun
  phonetic?: string;
  meaningZhShort?: string;
};

export type WordDetails = {
  id: string;
  word: string;
  phonetic?: string;
  meaningZhFull?: string;
  exampleSentenceEn?: string;
  exampleSentenceZh?: string;
  etymology?: string;
  weirdMemoryQuote?: string; // "诡异记忆法"中文语录
};

export type Collection = {
  id: string;
  name: string;
  wordIds: string[];
};

