import { HVMonsterDatabase } from '../types';
import { isFightingInBattle } from '../util/common';
import { logger } from '../util/logger';
import { MONSTERS, MONSTERS_NEED_SCAN, inBattle as inBattleFunc } from './battle';
import { updateLocalDatabase } from './localDataBase';
import { convertEncodedMonsterInfoToMonsterInfo } from './monsterDataEncode';
import { LOCAL_MONSTER_DATABASE, MONSTER_NAME_ID_MAP } from './store';

/**
 * Although Monster Database script have tried best to be compatible with Monsterbation's ajaxRound feature, in order to workaround TamperMonkey on Firefox cross userscript sandbox event handler issue (one userscript can't recevied a document Event event from another one), a fallback API is provided.
 * There is no need to worry about if "inBattle" will be called serveral time as it has a built-in race condition mitigation approach.
 *
 * ```js
 * window.HVMonsterDB?.inBattle();
 *
 * // If your prefer ES5 approach (no optional chain)
 * if (window.HVMonsterDB && window.HVMonsterDB.inBattle) {
 *   window.HVMonsterDB.inBattle();
 * }
 * ```
 */
export function inBattle(): void {
  if (!isFightingInBattle()) {
    logger.error('"inBattle" method is only avaliable during the battle!');
    throw new Error('"inBattle" method is only avaliable during the battle!');
  }

  inBattleFunc();
}

/**
 * Get Monster ID by Monster Name. Could be used in some highlight matcher?
 *
 * ```js
 * window.HVMonsterDB.getMonsterIdByName('Flying Spaghetti Monster')
 * // 32
 * ```
 */
export function getMonsterIdByName(name: string): number | null {
  const monsterId = MONSTER_NAME_ID_MAP.get(name);

  return monsterId || null;
}

/**
 * Get all monsters' information in the round (in order). Only avaliable during the battle
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
  if (!isFightingInBattle()) {
    logger.error('"getCurrentMonstersInformation" method is only avaliable during the battle!');
    throw new Error('"getCurrentMonstersInformation" method is only avaliable during the battle!');
  }

  const results: Record<string, HVMonsterDatabase.MonsterInfo | null> = {};
  for (const [, monsterStatus] of MONSTERS) {
    results[monsterStatus.mkey] = monsterStatus.info || null;
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
  const monsterId = MONSTER_NAME_ID_MAP.get(name);

  if (monsterId) {
    const encodedMonsterInfo = LOCAL_MONSTER_DATABASE[monsterId];
    if (encodedMonsterInfo) {
      return convertEncodedMonsterInfoToMonsterInfo(monsterId, encodedMonsterInfo);
    }
  }

  return null;
}

/**
 * Get a list of the monsters in the current round that require scan. Only avaliable during the battle.
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
  if (!isFightingInBattle()) {
    logger.error('"getCurrentNeedScannedMonsters" method is only avaliable during the battle!');
    throw new Error('"getCurrentNeedScannedMonsters" method is only avaliable during the battle!');
  }
  return [...MONSTERS_NEED_SCAN];
}

/**
 * DEBUG Method, force update local database from the server (only avaliable when "debug" setting is enabled)
 *
 * ```js
 * window.HVMonsterDB.forceUpdateLocalDatabase();
 * ```
 */
export function forceUpdateLocalDatabase(): Promise<void> {
  if (!SETTINGS.debug) {
    logger.error('"forceUpdateLocalDatabase" method is only avaliable when "debug" setting is enabled!');
    return Promise.reject(new Error('"forceUpdateLocalDatabase" method is only avaliable when "debug" setting is enabled!'));
  }
  return updateLocalDatabase(true);
}

/**
 * DEBUG Method, dump raw local data base (only avaliable when "debug" setting is enabled)
 *
 * ```js
 * window.HVMonsterDB.dumpRawLocalDataBase();
 * ```
 */
export function dumpRawLocalDataBase(): HVMonsterDatabase.LocalDatabaseVersion2 {
  if (!SETTINGS.debug) {
    logger.error('"dumpRawLocalDataBase" method is only avaliable when "debug" setting is enabled!');
    throw new Error('"dumpRawLocalDataBase" method is only avaliable when "debug" setting is enabled!');
  } else {
    return LOCAL_MONSTER_DATABASE;
  }
}
