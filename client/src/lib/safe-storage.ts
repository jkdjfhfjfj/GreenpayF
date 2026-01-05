export function getStorageSafe<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    return JSON.parse(data) as T;
  } catch (e) {
    console.warn(`Storage corruption for key "${key}":`, e);
    localStorage.removeItem(key);
    return defaultValue;
  }
}

export function setStorageSafe<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save to storage for key "${key}":`, e);
  }
}
