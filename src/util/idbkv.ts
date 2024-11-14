export type UseStore = <T>(
  txMode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => T | PromiseLike<T>,
) => Promise<T>;

const OBJECT_STORES = ['MONSTER_NAME_ID_MAP', 'databaseV2', 'databaseIsekaiV2'] as const;

export class IDBKV<T> {
  private databasePromise: Promise<IDBDatabase> | null = null;

  static promisifyRequest<T = undefined>(
    this: void,
    request: IDBRequest<T> | IDBTransaction
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // @ts-expect-error - file size hacks
      // eslint-disable-next-line no-multi-assign -- file size hacks
      request.oncomplete = request.onsuccess = () => resolve(request.result);
      // @ts-expect-error - file size hacks
      // eslint-disable-next-line no-multi-assign, @typescript-eslint/prefer-promise-reject-errors, sukka/unicorn/prefer-add-event-listener -- file size hacks
      request.onabort = request.onerror = () => reject(request.error);
    });
  }

  constructor(public dbName: string, public storeName: string, public dbVersion?: number) {
    this.initializeOpenDatabasePromise();
  }

  get<K extends IDBValidKey & keyof T>(key: K): Promise<T[K] | undefined> {
    return this.performDatabaseOperation('readonly', (store) => IDBKV.promisifyRequest(store.get(key)));
  }

  set<K extends IDBValidKey & keyof T>(key: K, value: T[K]): Promise<void> {
    return this.performDatabaseOperation('readwrite', (store) => {
      store.put(value, key);
      return IDBKV.promisifyRequest(store.transaction);
    });
  }

  setMany<K extends IDBValidKey & keyof T>(entries: Array<[K, T[K]]>): Promise<void> {
    return this.performDatabaseOperation('readwrite', (store) => {
      entries.forEach((entry) => store.put(entry[1], entry[0]));
      return IDBKV.promisifyRequest(store.transaction);
    });
  }

  getMany<K extends IDBValidKey & keyof T>(keys: K[]): Promise<Array<T[K]>> {
    return this.performDatabaseOperation('readonly', (store) => Promise.all(keys.map((key) => IDBKV.promisifyRequest(store.get(key)))));
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
            const newValue = updater(this.result);
            if (newValue === this.result) {
              resolve();
            } else {
              store.put(updater(this.result), key);
              resolve(IDBKV.promisifyRequest(store.transaction));
            }
          } catch (err) {
            reject(err as Error);
          }
        };
      })
    );
  }

  del<K extends IDBValidKey & keyof T>(key: K): Promise<void> {
    return this.performDatabaseOperation('readwrite', (store) => {
      store.delete(key);
      return IDBKV.promisifyRequest(store.transaction);
    });
  }

  delMany<K extends IDBValidKey & keyof T>(keys: K[]): Promise<void> {
    return this.performDatabaseOperation('readwrite', (store) => {
      keys.forEach(key => store.delete(key));
      return IDBKV.promisifyRequest(store.transaction);
    });
  }

  async clear(): Promise<void> {
    return this.performDatabaseOperation('readwrite', (store) => {
      store.clear();
      return IDBKV.promisifyRequest(store.transaction);
    });
  }

  keys<K extends IDBValidKey & keyof T>(): Promise<K[]> {
    const items: K[] = [];
    return this.eachCursor((cursor) => items.push(cursor.key as K)).then(() => items);
  }

  values<K extends IDBValidKey & keyof T>(): Promise<Array<T[K]>> {
    const items: Array<T[K]> = [];
    return this.eachCursor((cursor) => items.push(cursor.value)).then(() => items);
  }

  entries<K extends IDBValidKey & keyof T>(): Promise<Array<[K, T[K]]>> {
    const items: Array<[K, T[K]]> = [];
    return this.eachCursor((cursor) => items.push([cursor.key as K, cursor.value])).then(() => items);
  }

  private initializeOpenDatabasePromise() {
    if (this.databasePromise === null) {
      const promise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = self.indexedDB.open(this.dbName, this.dbVersion);
        request.onsuccess = () => {
          const database = request.result;

          database.addEventListener('close', () => { this.databasePromise = null; });
          database.onversionchange = () => {
            database.close();
            this.databasePromise = null;
          };
          resolve(database);
        };
        // eslint-disable-next-line sukka/unicorn/prefer-add-event-listener -- file size hacks
        request.onerror = () => reject(request.error as Error);
        request.onupgradeneeded = () => {
          try {
            // Whatever the KV instance is opened, always create all objectStore we needed
            OBJECT_STORES.forEach(storeName => request.result.createObjectStore(storeName));
          } catch (e) {
            reject(e as Error);
          }
        };
      });

      this.databasePromise = promise;
      return promise;
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
      return IDBKV.promisifyRequest(store.transaction);
    });
  }
}
