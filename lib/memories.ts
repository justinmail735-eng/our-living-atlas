export const states = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
];
export type Photo = { id: string; name: string; caption: string; data: string };
export type Memory = {
  id: string;
  title: string;
  state: string;
  place: string;
  date: string;
  story: string;
  author: string;
  mood: string;
  photos: Photo[];
  audio: string;
  favorite: boolean;
  updated: number;
};
export const visited = [
  'Texas',
  'Florida',
  'Tennessee',
  'Illinois',
  'New York',
  'New Jersey',
  'Colorado',
  'Arizona',
  'Nevada',
  'California',
  'Hawaii',
  'Georgia',
  'Michigan',
  'Oklahoma',
  'Dubai',
  'Maldives',
  'Bahamas',
];
states.push('Dubai', 'Maldives', 'Bahamas');
export function destinationLabel(name: string) {
  return name === 'Texas'
    ? 'Texas · home'
    : name === 'Arizona'
      ? 'Arizona · Phoenix'
      : name;
}
export const moods = ['Afterglow', 'Ocean', 'Forest', 'City lights'];
export const MAX_FILE = 15 * 1024 * 1024;
export function blankMemory(state = 'California'): Memory {
  return {
    id: crypto.randomUUID(),
    title: '',
    state,
    place: '',
    date: '',
    story: '',
    author: 'Together',
    mood: 'Afterglow',
    photos: [],
    audio: '',
    favorite: false,
    updated: Date.now(),
  };
}
export function fileData(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(new Error('This file could not be read. Try selecting it again.'));
    reader.readAsDataURL(file);
  });
}
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wander-together', 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore('memories', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          'Browser storage is unavailable. Enable site storage and try again.',
        ),
      );
  });
}
export async function readMemories(): Promise<Memory[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('memories', 'readonly');
    const request = tx.objectStore('memories').getAll();
    tx.oncomplete = () => {
      db.close();
      resolve(request.result as Memory[]);
    };
    tx.onerror = () => {
      db.close();
      reject(
        new Error(
          'Your memories could not be loaded. Try reopening this page.',
        ),
      );
    };
  });
}
export async function saveMemories(items: Memory[]): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('memories', 'readwrite');
    items.forEach((item) => tx.objectStore('memories').put(item));
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onabort = () => {
      db.close();
      reject(
        new Error(
          'Could not save. Your browser may be out of storage. Export a backup before clearing any data.',
        ),
      );
    };
    tx.onerror = () => {};
  });
}
export async function removeMemory(id: string): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('memories', 'readwrite');
    tx.objectStore('memories').delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onabort = () => {
      db.close();
      reject(new Error('Could not remove this memory. Please try again.'));
    };
  });
}
export function validateBackup(value: unknown): Memory[] {
  const doc = value as { version?: number; memories?: unknown[] };
  if (
    !doc ||
    doc.version !== 1 ||
    !Array.isArray(doc.memories) ||
    doc.memories.length > 1000
  )
    throw new Error('Choose a Wander, Together backup file (version 1).');
  const image = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
  const audio =
    /^data:audio\/(webm|mp4|ogg|mpeg|wav|x-wav)(;codecs=[^;,]+)?;base64,[A-Za-z0-9+/=]+$/;
  const seen = new Set<string>();
  return doc.memories.map((raw) => {
    const m = raw as Memory;
    if (
      !m ||
      [
        'id',
        'title',
        'state',
        'place',
        'date',
        'story',
        'author',
        'mood',
        'audio',
      ].some((k) => typeof m[k as keyof Memory] !== 'string') ||
      !states.includes(m.state) ||
      !moods.includes(m.mood) ||
      !Array.isArray(m.photos) ||
      m.photos.length > 30 ||
      typeof m.favorite !== 'boolean' ||
      !Number.isFinite(m.updated) ||
      !m.id ||
      seen.has(m.id) ||
      !m.title.trim() ||
      (m.date !== '' &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(m.date) ||
          !Number.isFinite(Date.parse(m.date)))) ||
      (m.audio && !audio.test(m.audio)) ||
      m.audio.length > MAX_FILE * 1.4 ||
      m.title.length > 120 ||
      m.story.length > 30000 ||
      m.photos.some(
        (p) =>
          !p ||
          typeof p.id !== 'string' ||
          typeof p.name !== 'string' ||
          typeof p.caption !== 'string' ||
          typeof p.data !== 'string' ||
          !image.test(p.data) ||
          p.data.length > MAX_FILE * 1.4,
      )
    )
      throw new Error(
        'This backup contains invalid or unsupported memory data. Nothing was imported.',
      );
    seen.add(m.id);
    return { ...m };
  });
}
