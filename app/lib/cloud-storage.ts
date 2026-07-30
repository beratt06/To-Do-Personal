export const CLOUD_STORAGE_KEYS = [
  "focusflow-areas",
  "focusflow-password-hash",
  "focusflow-password",
  "focusflow-pin",
  "focusflow-backups",
  "focusflow-notes",
  "focusflow-applications",
  "focusflow-roadmaps-v2",
  "focusflow-roadmaps",
  "focusflow-shared-access",
] as const;

export type CloudData = Record<string, string>;

const isFocusFlowKey = (key: string) => key.startsWith("focusflow-");

export function readCloudData(): CloudData {
  const keys = new Set<string>(CLOUD_STORAGE_KEYS);
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && isFocusFlowKey(key)) keys.add(key);
  }
  return [...keys].reduce<CloudData>((data, key) => {
    const value = localStorage.getItem(key);
    if (value !== null) data[key] = value;
    return data;
  }, {});
}

export function applyCloudData(data: unknown) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return;
  const values = data as CloudData;
  const keys = new Set<string>([...CLOUD_STORAGE_KEYS, ...Object.keys(values)]);
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && isFocusFlowKey(key)) keys.add(key);
  }
  keys.forEach((key) => {
    const value = values[key];
    if (typeof value === "string") localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  });
}
