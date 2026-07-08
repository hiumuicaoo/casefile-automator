import { supabase } from "@/integrations/supabase/client";
import type { CaseInput, CaseRow } from "./types";

export async function insertCase(input: CaseInput, folderPath: string | null): Promise<CaseRow> {
  const { data, error } = await supabase
    .from("cases" as never)
    .insert({ ...input, folder_path: folderPath } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as CaseRow;
}

export async function listCases(): Promise<CaseRow[]> {
  const { data, error } = await supabase
    .from("cases" as never)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as CaseRow[];
}

export async function updateCase(id: string, patch: Partial<CaseRow>): Promise<void> {
  const { error } = await supabase
    .from("cases" as never)
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}
