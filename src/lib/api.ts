import { HVMonsterDatabase } from '../types';
import { logger } from '../util/logger';
import { MONSTERS, MONSTERS_NEED_SCAN } from './battle';
import { updateLocalDatabase } from './localDataBase';
import { convertEncodedMonsterInfoToMonsterInfo } from './monsterDataEncode';
import { LOCAL_MONSTER_DATABASE, MONSTER_NAME_ID_MAP } from './store';

/**
 * Get Monster ID by Monster Name. Could be used in some highlight matcher?
 *
 * ```js
 * window.HVMonsterDB.getMonsterIdByName('Flying Spaghetti Monster	')
 * // 32
 * ```
 */
export function getMonsterIdByName(name: string): number | null {
  const monsterId = MONSTER_NAME_ID_MAP.get(name);

  if (monsterId) return monsterId;
  return null;
}

/**
 * Get all monsters' information in the round (in order)
 *
 * ```js
 * window.HVMonsterDB.getCurrentMonstersInformation();
 *
 * // {
 * //   mkey_1: { ... }
 * //   mkey_2: { ... }
 * //   mkey_3: { ... }
 * //   ...
 * // }
 * ```
 */
export function getCurrentMonstersInformation(): {
  [key: string]: HVMonsterDatabase.MonsterInfo | null
} {
  const results: Record<string, HVMonsterDatabase.MonsterInfo | null> = {};
  for (const [, monsterStatus] of MONSTERS) {
    results[monsterStatus.mkey] = monsterStatus.getInfo() || null;
  }

  return results;
}

/**
 * Get one monsters' information by its name
 *
 * ```js
 * window.HVMonsterDB.getMonsterInfoByName('Yggdrasil');
 * // { ... }
 * ```
 */
export function getMonsterInfoByName(name: string): HVMonsterDatabase.MonsterInfo | null {
  const compressedMonsterInfo = LOCAL_MONSTER_DATABASE[name];
  if (compressedMonsterInfo) {
    return convertEncodedMonsterInfoToMonsterInfo(name, compressedMonsterInfo);
  }
  return null;
}

/**
 * Get a list of the monsters that require scan
 *
 * ```js
 * window.HVMonsterDB.getCurrentMonstersInformation();
 *
 * []
 * ```
 */
export function getCurrentNeedScannedMonsters(): {
  name: string,
  mkey: string,
  mid?: number
}[] {
  return [...MONSTERS_NEED_SCAN];
}

/** DEBUG Method, force update local database from the server (only avaliable when "debug" setting is enabled) */
export function forceUpdateLocalDatabase(): Promise<void> {
  if (!SETTINGS.debug) {
    logger.error('"forceUpdateLocalDatabase" method is only avaliable when "debug" setting is enabled');
    return Promise.reject(new Error('"forceUpdateLocalDatabase" method is only avaliable when "debug" setting is enabled'));
  }
  return updateLocalDatabase(true);
}

/** DEBUG Method, dump raw local data base (only avaliable when "debug" setting is enabled) */
export function dumpRawLocalDataBase(): HVMonsterDatabase.LocalDatabase {
  if (!SETTINGS.debug) {
    logger.error('"dumpRawLocalDataBase" method is only avaliable when "debug" setting is enabled');
    throw new Error('"dumpRawLocalDataBase" method is only avaliable when "debug" setting is enabled');
  } else {
    return LOCAL_MONSTER_DATABASE;
  }
}
