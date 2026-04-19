import { createClient } from "./supabase/client";
import type { HistoryItem } from "./types";

function rowToItem(row: Record<string, unknown>): HistoryItem {
  return {
    id: row.id as string,
    filename: row.filename as string,
    date: row.date as string,
    fileSize: row.file_size as number,
    result: row.result as HistoryItem["result"],
  };
}

export async function loadHistory(): Promise<HistoryItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("transcriptions")
    .select("*")
    .order("date", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToItem);
}

export async function saveToHistory(item: HistoryItem): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("transcriptions").upsert({
    id: item.id,
    user_id: user.id,
    filename: item.filename,
    date: item.date,
    file_size: item.fileSize,
    result: item.result,
  });
}

export async function deleteFromHistory(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("transcriptions").delete().eq("id", id);
}

export async function getFromHistory(id: string): Promise<HistoryItem | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("transcriptions")
    .select("*")
    .eq("id", id)
    .single();
  if (!data) return null;
  return rowToItem(data);
}
