import { EncodedMonsterDatabase } from './monsterDataEncode';
import { HVMonsterDatabase } from '../types';
import { isIsekai } from '../util/common';
import { getStoredValue, setStoredValue } from '../util/store';
import { IDBKV } from '../util/idbkv';

const DBNAME = 'hv-monster-database-script';

/** The position of monster info box */
export let MONSTER_INFO_BOX_POSITION = { x: 10, y: 10 };

// eslint-disable-next-line @typescript-eslint/naming-convention
export class MONSTER_NAME_ID_MAP {
  private static cache: Map<string, number> = new Map();
  private static store = new IDBKV<{ [key: string]: number }>(DBNAME, 'MONSTER_NAME_ID_MAP');

  static async has(monsterName: string): Promise<boolean> {
    if (MONSTER_NAME_ID_MAP.cache.has(monsterName)) return true;

    const monsterId = await MONSTER_NAME_ID_MAP.store.get(monsterName);
    if (monsterId) {
      MONSTER_NAME_ID_MAP.cache.set(monsterName, monsterId);
      return true;
    }
    return false;
  }

  static async get(monsterName: string): Promise<number | undefined> {
    if (MONSTER_NAME_ID_MAP.cache.has(monsterName)) return MONSTER_NAME_ID_MAP.cache.get(monsterName);
    const monsterId = await MONSTER_NAME_ID_MAP.store.get(monsterName);
    if (monsterId) {
      MONSTER_NAME_ID_MAP.cache.set(monsterName, monsterId);
    }
    return monsterId;
  }

  static getMany(monsterNames: string[]): Promise<(number | undefined)[]> {
    return MONSTER_NAME_ID_MAP.store.getMany(monsterNames);
  }

  static set(monsterName: string, monsterId: number): Promise<void> {
    return MONSTER_NAME_ID_MAP.store.set(monsterName, monsterId);
  }

  static setMany(entries: [string, number][]): Promise<void> {
    return MONSTER_NAME_ID_MAP.store.setMany(entries);
  }
}

class LocalMonsterDatabase {
  private cache: Map<number, EncodedMonsterDatabase.MonsterInfo> = new Map();
  private store: IDBKV<HVMonsterDatabase.LocalDatabaseVersion2>;

  constructor(storeName: string) {
    this.store = new IDBKV<HVMonsterDatabase.LocalDatabaseVersion2>(DBNAME, storeName);
  }

  async has(monsterId: number): Promise<boolean> {
    if (this.cache.has(monsterId)) return true;

    const encodedMonsterInfo = await this.store.get(monsterId);
    if (encodedMonsterInfo) {
      this.cache.set(monsterId, encodedMonsterInfo);
      return true;
    }
    return false;
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
    return this.store.set(monsterId, monsterInfo);
  }

  setMany(entries: [number, EncodedMonsterDatabase.MonsterInfo][]): Promise<void> {
    return this.store.setMany(entries);
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
  await IDBKV.createObjectStore(DBNAME, ['MONSTER_NAME_ID_MAP', 'databaseV2', 'databaseIsekaiV2']);

  MONSTER_INFO_BOX_POSITION = await getStoredValue('monsterInfoBoxPosition') || { x: 10, y: 10 };
}
