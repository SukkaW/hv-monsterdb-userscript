import { HVMonsterDatabase } from '../types';
import { getUTCDate, isIsekai, showPopup } from '../util/common';
import { logger } from '../util/logger';
import { getStoredValue, removeStoredValue, setStoredValue } from '../util/store';
import { convertMonsterInfoToEncodedMonsterInfo } from './monsterDataEncode';
import { setLocalDatabaseTmpValue, MONSTER_NAME_ID_MAP } from './store';

interface ApiResponse {
  monsters: (HVMonsterDatabase.MonsterInfo & {
    /**
     * @description Last time update (can be parsed through Date)
     */
    lastUpdate: string
  })[]
}

export async function updateLocalDatabase(force = false): Promise<void> {
  const currentDate = getUTCDate();
  const lastUpdateDate = await getStoredValue('lastUpdateV2');
  const lastUpdateIsekaiDate = await getStoredValue('lastUpdateIsekaiV2');

  if (isIsekai()) {
    logger.info(`Local database (isekai) last updated: ${lastUpdateIsekaiDate}`);
  } else {
    logger.info(`Local database last updated: ${lastUpdateDate}`);
  }

  const needUpdateLocalDatabaseFromRemoteServer = force
    || !(isIsekai()
      ? lastUpdateIsekaiDate === currentDate
      : lastUpdateDate === currentDate
    );

  if (needUpdateLocalDatabaseFromRemoteServer) {
    try {
      logger.info('Downloading Monster Database from the server...');

      const resp = isIsekai()
        // In Isekai
        ? await fetch('https://hvdata.lastmen.men/exportgzipisekaimonsterdata/')
        // In Persistent
        : await fetch('https://hvdata.lastmen.men/exportgzipmonsterdata/');

      const data: ApiResponse = await resp.json();

      // Use window.requestIdleCallback again since conevrt database is a CPU intensive task.
      window.requestIdleCallback(async () => {
        logger.info('Processing Monster Database...');

        const db = Object.fromEntries(data.monsters.map(monster => {
          MONSTER_NAME_ID_MAP.set(monster.monsterName, monster.monsterId);

          const EncodedMonsterInfo = convertMonsterInfoToEncodedMonsterInfo(monster);
          return [monster.monsterId, EncodedMonsterInfo];
        }));

        logger.info(`${data.monsters.length} monsters' information processed.`);

        // This fix an edge case: When try to update database during battle,
        // it is possible that storage will be overwritten by in-memory data
        // By foring update in-memory data the edge case can be bypassed.
        setLocalDatabaseTmpValue(db);

        if (isIsekai()) {
          await setStoredValue('databaseIsekaiV2', db);
          await setStoredValue('lastUpdateIsekaiV2', getUTCDate());
        } else {
          await setStoredValue('databaseV2', db);
          await setStoredValue('lastUpdateV2', getUTCDate());
        }
      }, { timeout: 10000 });
    } catch (e) {
      logger.error(e);

      showPopup('There is something wrong when trying to update the local database from the server!');
    }
  } else {
    logger.info('There is no need to update local database.');
  }

  /** Database Migration */
  databaseMigration();
}

async function databaseMigration() {
  // Remove old version 1 database
  await Promise.all([
    removeStoredValue('database'),
    removeStoredValue('databaseIsekai'),
    removeStoredValue('lastUpdate'),
    removeStoredValue('lastUpdateIsekai')
  ]);

  const monsterIdMap = await getStoredValue('monsterIdMap');
  if (monsterIdMap) {
    logger.debug('Migrating old monsterIdMap to IndexedDB');
    await Promise.all(Object.entries(monsterIdMap).map(([name, id]) => MONSTER_NAME_ID_MAP.set(name, id)));
  }
  return removeStoredValue('monsterIdMap');
}
