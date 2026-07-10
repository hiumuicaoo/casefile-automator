// Client-facing wrapper: gọi server functions thay vì Supabase.
import type { CaseInput, CaseRow } from "./types";
import { listCasesFn, insertCaseFn, updateCaseFn } from "./case-api.functions";

export async function insertCase(input: CaseInput, folderPath: string | null): Promise<CaseRow> {
  return await insertCaseFn({ data: { input, folderPath } });
}

export async function listCases(): Promise<CaseRow[]> {
  return await listCasesFn();
}

export async function updateCase(id: string, patch: Partial<CaseRow>): Promise<void> {
  await updateCaseFn({ data: { id, patch: patch as Record<string, unknown> } });
}
