const OLD_KEY = 'mood-sync-user-moods';
const NEW_KEY = 'sentio-user-moods';

// One-time migration: move anonymous mood IDs from old key to new key
if (typeof window !== 'undefined') {
  const oldData = localStorage.getItem(OLD_KEY);
  if (oldData) {
    const newData = localStorage.getItem(NEW_KEY);
    if (newData) {
      const merged = [
        ...new Set([...JSON.parse(oldData), ...JSON.parse(newData)]),
      ];
      localStorage.setItem(NEW_KEY, JSON.stringify(merged));
    } else {
      localStorage.setItem(NEW_KEY, oldData);
    }
    localStorage.removeItem(OLD_KEY);
  }
}

export const LOCAL_STORAGE_MOODS_KEY = NEW_KEY;
