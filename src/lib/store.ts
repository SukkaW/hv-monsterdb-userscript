import { EncodedMonsterDatabase } from './monsterDataEncode';
import type { HVMonsterDatabase } from '../types';
import { isIsekai } from '../util/common';
import { getStoredValue, setStoredValue } from '../util/store';
import { IDBKV } from '../util/idbkv';

const DBNAME = 'hv-monster-database-script';

/** The position of monster info box */
export const MONSTER_INFO_BOX_POSITION = { x: 10, y: 10 };

const monsterNameIdCache = new Map<string, number>();
const monsterNameIdStore = new IDBKV<{ [key: string]: number }>(DBNAME, 'MONSTER_NAME_ID_MAP');
export const MONSTER_NAME_ID_MAP = {
  async get(monsterName: string): Promise<number | undefined> {
    if (monsterNameIdCache.has(monsterName)) return monsterNameIdCache.get(monsterName);

    const monsterId = await monsterNameIdStore.get(monsterName);
    if (monsterId) {
      monsterNameIdCache.set(monsterName, monsterId);
    }
    return monsterId;
  },
  async updateMany(entries: Array<[string, number] | null>): Promise<void> {
    if (entries.length > 0) {
      return monsterNameIdStore.performDatabaseOperation('readwrite', (store) => {
        entries.forEach((entry) => {
          if (entry) {
            const [monsterName, newMonsterId] = entry;

            if (monsterNameIdCache.get(monsterName) !== newMonsterId) {
              monsterNameIdCache.set(monsterName, newMonsterId);

              store.get(monsterName).onsuccess = function () {
                if (this.result !== newMonsterId) {
                  store.put(newMonsterId, monsterName);
                }
              };
            }
          }
        });
        return IDBKV.promisifyRequest(store.transaction);
      });
    }
  }
};

type UndefinedableEncodedMonsterInfo = EncodedMonsterDatabase.MonsterInfo | undefined;

class LocalMonsterDatabase {
  private cache = new Map<number, EncodedMonsterDatabase.MonsterInfo>();
  private store: IDBKV<HVMonsterDatabase.LocalDatabaseVersion2>;

  constructor(storeName: string) {
    this.store = new IDBKV<HVMonsterDatabase.LocalDatabaseVersion2>(DBNAME, storeName);
  }

  async get(monsterId: number): Promise<UndefinedableEncodedMonsterInfo> {
    if (this.cache.has(monsterId)) return this.cache.get(monsterId);

    const encodedMonsterInfo = await this.store.get(monsterId);
    if (encodedMonsterInfo) {
      this.cache.set(monsterId, encodedMonsterInfo);
      return encodedMonsterInfo;
    }
  }

  getAll() {
    return this.store.performDatabaseOperation('readonly', (store) => Promise.all([
      IDBKV.promisifyRequest(store.getAllKeys()),
      IDBKV.promisifyRequest(store.getAll() as IDBRequest<UndefinedableEncodedMonsterInfo[]>)
    ]).then(([keys, values]) => keys.map((key, i) => [key, values[i]] as const)));
  }

  getMany(monsterIds: Array<number | undefined>): Promise<UndefinedableEncodedMonsterInfo[]> {
    if (monsterIds.map(id => id && this.cache.has(id)).length === monsterIds.length) {
      return Promise.resolve(monsterIds.map(id => (id ? this.cache.get(id) : undefined)));
    }

    return this.store.performDatabaseOperation('readonly', (store) => {
      const resultPromises: Array<Promise<UndefinedableEncodedMonsterInfo> | UndefinedableEncodedMonsterInfo> = [];

      monsterIds.forEach(id => {
        if (id) {
          if (this.cache.has(id)) {
            resultPromises.push(this.cache.get(id));
          } else {
            resultPromises.push(IDBKV.promisifyRequest(store.get(id)));
          }
        } else {
          resultPromises.push(undefined);
        }
      });

      return Promise.all(resultPromises);
    });
  }

  set(monsterId: number, monsterInfo: EncodedMonsterDatabase.MonsterInfo): Promise<void> {
    this.cache.set(monsterId, monsterInfo);
    return this.store.set(monsterId, monsterInfo);
  }

  updateMany(entries: Array<[number, EncodedMonsterDatabase.MonsterInfo] | null>): Promise<void> {
    if (entries.length > 0) {
      this.cache.clear();

      return this.store.performDatabaseOperation('readwrite', (store) => {
        entries.forEach(entry => {
          if (entry) {
            const [monsterId, newMonsterInfo] = entry;
            store.get(monsterId).onsuccess = function () {
              if (!LocalMonsterDatabase.monsterInfoIsEquial(this.result as UndefinedableEncodedMonsterInfo, newMonsterInfo)) {
                store.put(newMonsterInfo, monsterId);
              }
            };
          }
        });
        return IDBKV.promisifyRequest(store.transaction);
      });
    }

    return Promise.resolve();
  }

  static monsterInfoIsEquial(this: void, monster1: UndefinedableEncodedMonsterInfo, monster2: EncodedMonsterDatabase.MonsterInfo): boolean {
    if (!monster1) return false;
    return ([
      EncodedMonsterDatabase.EMonsterInfo.monsterName,
      EncodedMonsterDatabase.EMonsterInfo.monsterClass,
      EncodedMonsterDatabase.EMonsterInfo.plvl,
      EncodedMonsterDatabase.EMonsterInfo.attack,
      EncodedMonsterDatabase.EMonsterInfo.trainer,
      EncodedMonsterDatabase.EMonsterInfo.piercing,
      EncodedMonsterDatabase.EMonsterInfo.crushing,
      EncodedMonsterDatabase.EMonsterInfo.slashing,
      EncodedMonsterDatabase.EMonsterInfo.cold,
      EncodedMonsterDatabase.EMonsterInfo.wind,
      EncodedMonsterDatabase.EMonsterInfo.elec,
      EncodedMonsterDatabase.EMonsterInfo.fire,
      EncodedMonsterDatabase.EMonsterInfo.dark,
      EncodedMonsterDatabase.EMonsterInfo.holy,
      EncodedMonsterDatabase.EMonsterInfo.lastUpdate
    ] as const).every(k => monster1[k] === monster2[k]);
  }
}

export const LOCAL_MONSTER_DATABASE_PERSISTENT = new LocalMonsterDatabase('databaseV2');
export const LOCAL_MONSTER_DATABASE_ISEKAI = new LocalMonsterDatabase('databaseIsekaiV2');
export const LOCAL_MONSTER_DATABASE = isIsekai() ? LOCAL_MONSTER_DATABASE_ISEKAI : LOCAL_MONSTER_DATABASE_PERSISTENT;

/**
 * According to MDN:
 * > (Map) performs better in scenarios involving frequent additions and removals of key-value pairs.
 *
 * And in modern V8 javascript engine, Map is about 40% faster than Object literal.
 *
 * However, as Map can not be serialized, it can not be stored using either localStorage or GM.setValue,
 * so it is required to convert Map to Object literal before storing, and convert it back after retrieving.
 */

export function storeTmpValue(): Promise<void> {
  return setStoredValue('monsterInfoBoxPosition', MONSTER_INFO_BOX_POSITION);
}

export async function retrieveTmpValue(): Promise<void> {
  const { x, y } = await getStoredValue('monsterInfoBoxPosition') || { x: 10, y: 10 };

  MONSTER_INFO_BOX_POSITION.x = x;
  MONSTER_INFO_BOX_POSITION.y = y;
}
