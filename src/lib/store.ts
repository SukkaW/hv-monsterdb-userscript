import { EncodedMonsterDatabase } from './monsterDataEncode';
import { HVMonsterDatabase } from '../types';
import { isIsekai } from '../util/common';
import { getStoredValue, setStoredValue } from '../util/store';
import { IDBKV, promisifyRequest } from '../util/idbkv';
import { logger } from '../util/logger';

const DBNAME = 'hv-monster-database-script';
export const OBJECT_STORES = ['MONSTER_NAME_ID_MAP', 'databaseV2', 'databaseIsekaiV2'];

/** The position of monster info box */
export let MONSTER_INFO_BOX_POSITION = { x: 10, y: 10 };

// eslint-disable-next-line @typescript-eslint/naming-convention
export class MONSTER_NAME_ID_MAP {
  private static cache: Map<string, number> = new Map();
  private static store = new IDBKV<{ [key: string]: number }>(DBNAME, 'MONSTER_NAME_ID_MAP');

  static async get(monsterName: string): Promise<number | undefined> {
    if (MONSTER_NAME_ID_MAP.cache.has(monsterName)) return MONSTER_NAME_ID_MAP.cache.get(monsterName);

    const monsterId = await MONSTER_NAME_ID_MAP.store.get(monsterName);
    if (monsterId) {
      MONSTER_NAME_ID_MAP.cache.set(monsterName, monsterId);
    }
    return monsterId;
  }

  static async updateMany(entries: ([string, number] | null)[]): Promise<void> {
    return MONSTER_NAME_ID_MAP.store.performDatabaseOperation('readwrite', (store) => {
      entries.forEach((entry) => {
        if (entry) {
          const [monsterName, newMonsterId] = entry;

          if (this.cache.get(monsterName) !== newMonsterId) {
            this.cache.set(monsterName, newMonsterId);

            store.get(monsterName).onsuccess = function () {
              if (this.result !== newMonsterId) {
                store.put(newMonsterId, monsterName);
              }
            };
          }
        }
      });
      return promisifyRequest(store.transaction);
    });
  }
}

class LocalMonsterDatabase {
  private cache: Map<number, EncodedMonsterDatabase.MonsterInfo> = new Map();
  private store: IDBKV<HVMonsterDatabase.LocalDatabaseVersion2>;

  constructor(storeName: string) {
    this.store = new IDBKV<HVMonsterDatabase.LocalDatabaseVersion2>(DBNAME, storeName);
  }

  async get(monsterId: number): Promise<EncodedMonsterDatabase.MonsterInfo | undefined> {
    if (this.cache.has(monsterId)) return this.cache.get(monsterId);

    const encodedMonsterInfo = await this.store.get(monsterId);
    if (encodedMonsterInfo) {
      this.cache.set(monsterId, encodedMonsterInfo);
      return encodedMonsterInfo;
    }
  }

  set(monsterId: number, monsterInfo: EncodedMonsterDatabase.MonsterInfo): Promise<void> {
    this.cache.set(monsterId, monsterInfo);
    return this.store.set(monsterId, monsterInfo);
  }

  updateMany(entries: [number, EncodedMonsterDatabase.MonsterInfo][]): Promise<void> {
    let updatedMonsterCount = 0;

    this.cache.clear();

    return this.store.performDatabaseOperation('readwrite', (store) => {
      entries.forEach(([monsterId, monsterInfo]) => {
        store.get(monsterId).onsuccess = function () {
          if (!LocalMonsterDatabase.monsterInfoIsEquial(this.result as EncodedMonsterDatabase.MonsterInfo | undefined, monsterInfo)) {
            updatedMonsterCount++;
            store.put(monsterInfo, monsterId);
          }
        };
      });

      logger.debug('Updated (indexeddb) monsters count:', updatedMonsterCount);
      return promisifyRequest(store.transaction);
    });
  }

  static monsterInfoIsEquial(monster1: EncodedMonsterDatabase.MonsterInfo | undefined, monster2: EncodedMonsterDatabase.MonsterInfo): boolean {
    if (!monster1) return false;
    if (
      ([
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
      ] as const).every(k => monster1[k] === monster2[k])
    ) {
      return true;
    }

    return false;
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
  MONSTER_INFO_BOX_POSITION = await getStoredValue('monsterInfoBoxPosition') || { x: 10, y: 10 };
}
