import { HVMonsterDatabase } from '../types';
import { getUTCDate, isIsekai, showPopup } from '../util/common';
import { logger } from '../util/logger';
import { getStoredValue, removeStoredValue, setStoredValue } from '../util/store';
import { convertMonsterInfoToEncodedMonsterInfo, EncodedMonsterDatabase } from './monsterDataEncode';
import { MONSTER_NAME_ID_MAP, LOCAL_MONSTER_DATABASE_PERSISTENT, LOCAL_MONSTER_DATABASE_ISEKAI } from './store';

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
        MONSTER_NAME_ID_MAP.updateMany(data.monsters.map(monster => [monster.monsterName, monster.monsterId]));

        const db = data.monsters.map(monster => {
          const EncodedMonsterInfo = convertMonsterInfoToEncodedMonsterInfo(monster);
          return [monster.monsterId, EncodedMonsterInfo] as [number, EncodedMonsterDatabase.MonsterInfo];
        });

        logger.info(`${data.monsters.length} monsters' information processed.`);

        if (isIsekai()) {
          LOCAL_MONSTER_DATABASE_ISEKAI.updateMany(db);
          await setStoredValue('lastUpdateIsekaiV2', getUTCDate());
        } else {
          LOCAL_MONSTER_DATABASE_PERSISTENT.updateMany(db);
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
  // Migrate all old userscript storage to IndexedDB
  const [monsterIdMap, databaseV2, databaseIsekaiV2] = await Promise.all([getStoredValue('monsterIdMap'), getStoredValue('databaseV2'), getStoredValue('databaseIsekaiV2')]);
  if (monsterIdMap) {
    logger.debug('Migrating old monsterIdMap to IndexedDB');
    await MONSTER_NAME_ID_MAP.updateMany(Object.entries(monsterIdMap));
  }
  if (databaseV2) {
    logger.debug('Migrating old databaseV2 to IndexedDB');
    await LOCAL_MONSTER_DATABASE_PERSISTENT.updateMany(Object.entries(databaseV2).map(([k, v]) => [Number(k), v]));
  }
  if (databaseIsekaiV2) {
    logger.debug('Migrating old databaseIsekaiV2 to IndexedDB');
    await LOCAL_MONSTER_DATABASE_ISEKAI.updateMany(Object.entries(databaseIsekaiV2).map(([k, v]) => [Number(k), v]));
  }

  return Promise.all([
    // Remove version 2 from the userscript storage
    removeStoredValue('monsterIdMap'),
    removeStoredValue('databaseV2'),
    removeStoredValue('databaseIsekaiV2'),
    // Remove old version 1 database
    removeStoredValue('database'),
    removeStoredValue('databaseIsekai'),
    removeStoredValue('lastUpdate'),
    removeStoredValue('lastUpdateIsekai')
  ]);
}
