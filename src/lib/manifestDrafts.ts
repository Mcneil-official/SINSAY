import AsyncStorage from "@react-native-async-storage/async-storage";

// Local manifest drafts (per-operator, single device). Drafts are NEVER sent
// to the DB: unsubmitted forms must not consume passes, activate Eco-Dive
// IDs, or appear in the TO queue. step1 already echoes `params.draft` into
// its initial state — this store persists that same JSON shape.

export interface ManifestDraft {
  id: string;
  operatorId: string;
  updatedAt: number;
  form: Record<string, unknown>;
}

const KEY_PREFIX = "sinsay:manifest-draft:";

const keyFor = (operatorId: string) => `${KEY_PREFIX}${operatorId}`;

export async function listDrafts(operatorId: string): Promise<ManifestDraft[]> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(operatorId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ManifestDraft[];
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export async function saveDraft(operatorId: string, form: Record<string, unknown>, id?: string): Promise<ManifestDraft> {
  const drafts = await listDrafts(operatorId);
  const now = Date.now();
  if (id) {
    const next = drafts.map((d) => (d.id === id ? { ...d, form, updatedAt: now } : d));
    await AsyncStorage.setItem(keyFor(operatorId), JSON.stringify(next));
    return next.find((d) => d.id === id) ?? { id, operatorId, updatedAt: now, form };
  }
  const draft: ManifestDraft = { id: `draft-${now}`, operatorId, updatedAt: now, form };
  await AsyncStorage.setItem(keyFor(operatorId), JSON.stringify([draft, ...drafts]));
  return draft;
}

export async function deleteDraft(operatorId: string, id: string): Promise<void> {
  const drafts = await listDrafts(operatorId);
  await AsyncStorage.setItem(
    keyFor(operatorId),
    JSON.stringify(drafts.filter((d) => d.id !== id))
  );
}

export function draftTitle(d: ManifestDraft): string {
  const f = d.form as Record<string, string | undefined>;
  return (f.boatName as string) || "Untitled manifest";
}

export function draftSubtitle(d: ManifestDraft): string {
  const f = d.form as Record<string, string | unknown[] | undefined>;
  const date = typeof f.diveDate === "string" ? f.diveDate : "—";
  const loc = typeof f.location === "string" ? f.location : "";
  const n = Array.isArray(f.divers) ? f.divers.length : 0;
  return `${date} · ${n} diver${n === 1 ? "" : "s"}${loc ? ` · ${loc}` : ""}`;
}
