import { HVMonsterDatabase } from '../types';
import { isIsekai } from '../util/common';
import { getStoredValue, setStoredValue } from '../util/store';

/** Monster Name => Monster Id */
export let MONSTER_NAME_ID_MAP: Map<string, number> = new Map();
export let LOCAL_MONSTER_DATABASE: HVMonsterDatabase.LocalDatabase = {};
/** The position of monster info box */
export let MONSTER_INFO_BOX_POSITION = { x: 10, y: 10 };

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
  setStoredValue('monsterIdMap', Object.fromEntries(MONSTER_NAME_ID_MAP));
  setStoredValue('monsterInfoBoxPosition', MONSTER_INFO_BOX_POSITION);

  if (isIsekai()) {
    setStoredValue('databaseIsekai', LOCAL_MONSTER_DATABASE);
  } else {
    setStoredValue('database', LOCAL_MONSTER_DATABASE);
  }
}

export async function retrieveTmpValue(): Promise<void> {
  MONSTER_NAME_ID_MAP = new Map(Object.entries(await getStoredValue('monsterIdMap') || {}));
  MONSTER_INFO_BOX_POSITION = await getStoredValue('monsterInfoBoxPosition') || { x: 10, y: 10 };

  if (isIsekai()) {
    LOCAL_MONSTER_DATABASE = await getStoredValue('databaseIsekai') || {};
  } else {
    LOCAL_MONSTER_DATABASE = await getStoredValue('database') || {};
  }
}

export function setLocalDatabaseTmpValue(db: HVMonsterDatabase.LocalDatabase): void {
  LOCAL_MONSTER_DATABASE = db;
}
