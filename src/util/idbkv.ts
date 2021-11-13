import { OBJECT_STORES } from '../lib/store';

export type UseStore = <T>(
  txMode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => T | PromiseLike<T>,
) => Promise<T>;

export class IDBKV<T> {
  dbName: string;
  storeName: string;
  dbVersion?: number;
  private databasePromise: Promise<IDBDatabase> | null = null;

  constructor(dbName: string, storeName: string, dbVersion?: number) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.dbVersion = dbVersion;
    this.initializeOpenDatabasePromise();
  }

  get<K extends IDBValidKey & keyof T>(key: K): Promise<T[K] | undefined> {
    return this.performDatabaseOperation('readonly', (store) => {
      return promisifyRequest(store.get(key));
    });
  }

  set<K extends IDBValidKey & keyof T>(key: K, value: T[K]): Promise<void> {
    return this.performDatabaseOperation('readwrite', (store) => {
      store.put(value, key);
      return promisifyRequest(store.transaction);
    });
  }

  setMany<K extends IDBValidKey & keyof T>(entries: [K, T[K]][]): Promise<void> {
    return this.performDatabaseOperation('readwrite', (store) => {
      entries.forEach((entry) => store.put(entry[1], entry[0]));
      return promisifyRequest(store.transaction);
    });
  }

  getMany<K extends IDBValidKey & keyof T>(keys: K[]): Promise<T[K][]> {
    return this.performDatabaseOperation('readonly', (store) => Promise.all(keys.map((key) => promisifyRequest(store.get(key)))));
  }

  /** Update a value. This lets you see the old value and update it as an atomic operation. */
  update<K extends IDBValidKey & keyof T, V extends T[K]>(key: K, updater: (oldValue?: V) => V): Promise<void> {
    return this.performDatabaseOperation(
      'readwrite',
      // Need to create the promise manually.
      // If I try to chain promises, the transaction closes in browsers
      // that use a promise polyfill (IE10/11).
      (store) => new Promise((resolve, reject) => {
        store.get(key).onsuccess = function () {
          try {
            store.put(updater(this.result), key);
            resolve(promisifyRequest(store.transaction));
          } catch (err) {
            reject(err);
          }
        };
      })
    );
  }

  del<K extends IDBValidKey & keyof T>(key: K): Promise<void> {
    return this.performDatabaseOperation('readwrite', (store) => {
      store.delete(key);
      return promisifyRequest(store.transaction);
    });
  }

  delMany<K extends IDBValidKey & keyof T>(keys: K[]): Promise<void> {
    return this.performDatabaseOperation('readwrite', (store) => {
      keys.forEach((key: IDBValidKey) => store.delete(key));
      return promisifyRequest(store.transaction);
    });
  }

  async clear(): Promise<void> {
    return this.performDatabaseOperation('readwrite', (store) => {
      store.clear();
      return promisifyRequest(store.transaction);
    });
  }

  keys<K extends IDBValidKey & keyof T>(): Promise<K[]> {
    const items: K[] = [];
    return this.eachCursor((cursor) => items.push(cursor.key as K)).then(() => items);
  }

  values<K extends IDBValidKey & keyof T>(): Promise<T[K][]> {
    const items: T[K][] = [];
    return this.eachCursor((cursor) => items.push(cursor.value)).then(() => items);
  }

  entries<K extends IDBValidKey & keyof T>(): Promise<[K, T[K]][]> {
    const items: [K, T[K]][] = [];
    return this.eachCursor((cursor) => items.push([cursor.key as K, cursor.value])).then(() => items);
  }

  private initializeOpenDatabasePromise() {
    if (this.databasePromise === null) {
      this.databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = self.indexedDB.open(this.dbName, this.dbVersion);
        request.onsuccess = () => {
          const database = request.result;

          database.onclose = () => { this.databasePromise = null; };
          database.onversionchange = () => {
            database.close();
            this.databasePromise = null;
          };
          resolve(database);
        };
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = () => {
          try {
            // Whatever the KV instance is opened, always create all objectStore we needed
            OBJECT_STORES.forEach(storeName => request.result.createObjectStore(storeName));
          } catch (e) {
            reject(e);
          }
        };
      });
    }
  }

  async performDatabaseOperation<T>(txMode: IDBTransactionMode, callback: (store: IDBObjectStore) => T | PromiseLike<T>): Promise<T> {
    if (!this.databasePromise) {
      this.initializeOpenDatabasePromise();
    }
    const db = await this.databasePromise;
    const store = db!.transaction(this.storeName, txMode).objectStore(this.storeName);
    return callback(store);
  }

  private eachCursor(callback: (cursor: IDBCursorWithValue) => void): Promise<void> {
    return this.performDatabaseOperation('readonly', (store) => {
      store.openCursor().onsuccess = function () {
        if (!this.result) return;
        callback(this.result);
        this.result.continue();
      };
      return promisifyRequest(store.transaction);
    });
  }
}

export function promisifyRequest<T = undefined>(
  request: IDBRequest<T> | IDBTransaction
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - file size hacks
    // eslint-disable-next-line no-multi-assign
    request.oncomplete = request.onsuccess = () => resolve(request.result);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - file size hacks
    // eslint-disable-next-line no-multi-assign
    request.onabort = request.onerror = () => reject(request.error);
  });
}
