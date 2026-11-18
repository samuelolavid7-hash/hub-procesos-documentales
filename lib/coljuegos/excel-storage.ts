import type { Aliases, Standards } from "./excel-model";

interface SavedConfiguration { standards: Standards; aliases: Aliases }
/** IndexedDB conserva los File; las URL de miniaturas se reconstruyen al abrir. */
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("hub-coljuegos-catalogo", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("configuration");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function readConfiguration(): Promise<SavedConfiguration> {
  const db = await database();
  try {
    const value = await new Promise<SavedConfiguration | undefined>((resolve, reject) => {
      const request = db.transaction("configuration").objectStore("configuration").get("current");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const configuration = value ?? { standards: {}, aliases: {} };
    for (const views of Object.values(configuration.standards)) {
      for (const photo of Object.values(views)) if (photo) photo.thumbnailUrl = URL.createObjectURL(photo.file);
    }
    return configuration;
  } finally { db.close(); }
}
export async function saveConfiguration(configuration: SavedConfiguration): Promise<void> {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("configuration", "readwrite");
      transaction.objectStore("configuration").put(configuration, "current");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { db.close(); }
}
