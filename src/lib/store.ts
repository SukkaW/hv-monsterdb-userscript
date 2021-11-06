import { HVMonsterDatabase } from '../types';
import { isIsekai } from '../util/common';
import { getStoredValue, setStoredValue } from '../util/store';
import { IDBKV } from './idbkv';

const DBNAME = 'hv-monster-database-script';

/** Monster Name => Monster Id */
export let LOCAL_MONSTER_DATABASE: HVMonsterDatabase.LocalDatabaseVersion2 = {};
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

  static set(monsterName: string, monsterId: number): Promise<void> {
    return MONSTER_NAME_ID_MAP.store.set(monsterName, monsterId);
  }
}

/**
 * According to MDN:
 * > (Map) performs better in scenarios involving frequent additions and removals of key-value pairs.
 *
 * And in modern V8 javascript engine, Map is about 40% faster than Object literal.
 *
 * However, as Map can not be serialized, it can not be stored using either localStorage or GM.setValue,
 * so it is required to convert Map to Object literal before storing, and convert it back after retrieving.
 */

export async function storeTmpValue(): Promise<void> {
  return isIsekai() ? setStoredValue('databaseIsekaiV2', LOCAL_MONSTER_DATABASE) : setStoredValue('databaseV2', LOCAL_MONSTER_DATABASE);
}

export async function retrieveTmpValue(): Promise<void> {
  MONSTER_INFO_BOX_POSITION = await getStoredValue('monsterInfoBoxPosition') || { x: 10, y: 10 };

  if (isIsekai()) {
    LOCAL_MONSTER_DATABASE = await getStoredValue('databaseIsekaiV2') || {};
  } else {
    LOCAL_MONSTER_DATABASE = await getStoredValue('databaseV2') || {};
  }
}

export function setLocalDatabaseTmpValue(db: HVMonsterDatabase.LocalDatabaseVersion2): void {
  LOCAL_MONSTER_DATABASE = db;
}
