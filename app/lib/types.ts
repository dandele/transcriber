export type Utterance = {
  speaker: string;
  start: number;
  end: number;
  text: string;
};

export type TranscriptResult = {
  text: string;
  utterances: Utterance[];
  duration: number;
};

export type HistoryItem = {
  id: string;
  filename: string;
  date: string;
  fileSize: number;
  result: TranscriptResult;
};
