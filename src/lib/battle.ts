import { parseMonsterNameAndId, parseScanResult } from './parseLog';
import { MONSTER_NAME_ID_MAP, LOCAL_MONSTER_DATABASE } from './store';
import { createMonsterInfoBox, MonsterInfo } from './monsterInfoUI';
import { convertEncodedMonsterInfoToMonsterInfo, convertMonsterInfoToEncodedMonsterInfo, EncodedMonsterDatabase } from './monsterDataEncode';
import { logger } from '../util/logger';
import { submitScanResults } from './submitScan';

import { checkScanResultValidity } from './monster';
import { MonstersInCurrentRound, MonstersAndMkeysInCurrentRound, MonsterLastUpdate, MonsterNeedScan, MonsterNeedHighlight, StateSubscribed } from './states';
import { createElement, patch } from 'million';

let monsterInfoVElement: ReturnType<typeof createElement> | undefined;

import 'typed-query-selector';
import { HVMonsterDatabase } from '../types';

/** Will execute at per round start */
export async function inBattle(): Promise<void> {
  /**
   * The implementation is from Monsterbation, to prevent inBattle from calling twice
   * It is a comfirmed tampermonkey bug, see https://github.com/Tampermonkey/tampermonkey/issues/1218
   */
  // Check if #monsterdb_in_battle_invoked has been injected
  if (document.getElementById('monsterdb_in_battle_invoked')) {
    logger.debug('Race condition of inBattle has been detected and mitigated!');
    return;
  }
  // Inject #monsterdb_in_battle_invoked
  const invokedEl = document.createElement('div');
  invokedEl.id = 'monsterdb_in_battle_invoked';
  invokedEl.style.display = 'none';
  document.getElementById('battle_right')?.appendChild(invokedEl); // battle_right contains monster elements

  const logEl = document.getElementById('textlog');
  if (logEl && logEl.firstChild) {
    await tasksRunAtStartOfPerRound();
    const mo = new MutationObserver(tasksRunDuringTheBattle);
    mo.observe(logEl.firstChild, { childList: true });
  }

  if (StateSubscribed.get() === false) {
    // Highlight Need Scanned Monsters
    let highlightNeedScanMonsterRafId: number | null = null;
    const highlightScanColor = SETTINGS.scanHighlightColor === true ? 'coral' : SETTINGS.scanHighlightColor;
    if (highlightScanColor) {
      MonsterNeedScan.subscribe(needScanMonsters => {
        if (highlightNeedScanMonsterRafId) {
          window.cancelAnimationFrame(highlightNeedScanMonsterRafId);
        }
        highlightNeedScanMonsterRafId = window.requestAnimationFrame(() => {
          needScanMonsters.forEach(needScanMonster => {
            if (needScanMonster.mkey) {
              const monsterBtm2El = document.getElementById(needScanMonster.mkey)?.querySelector('div.btm2');
              if (monsterBtm2El) {
                monsterBtm2El.style.backgroundColor = highlightScanColor;
              }
            }
          });
        });
      });
    }

    // Highlight Monster
    let highlightMonsterRafId: number | null = null;
    MonsterNeedHighlight.subscribe(needHighlightMonsters => {
      if (highlightMonsterRafId) {
        window.cancelAnimationFrame(highlightMonsterRafId);
      }
      highlightMonsterRafId = window.requestAnimationFrame(() => {
        needHighlightMonsters.forEach(needHighlightMonster => {
          const { color, mkey } = needHighlightMonster;
          const monsterBtm2El = document.getElementById(mkey)?.querySelector('div.btm2');
          if (monsterBtm2El) {
            monsterBtm2El.style.backgroundColor = color;
          }
        });
      });
    });

    // Show monster info box
    let showMonsterInfoBoxRafId: number | null = null;
    if (SETTINGS.showMonsterInfoBox) {
      MonstersInCurrentRound.subscribe(monstersInCurrentRound => {
        // This to prevent rendering when new round starts and monsters data is still being fetching
        if (showMonsterInfoBoxRafId) {
          window.cancelAnimationFrame(showMonsterInfoBoxRafId);
        }

        showMonsterInfoBoxRafId = window.requestAnimationFrame(() => {
          const allMonsterStatus = Object.values(monstersInCurrentRound);

          if (!document.getElementById('monsterdb_info')) {
            createMonsterInfoBox();
            monsterInfoVElement = createElement(
              MonsterInfo(allMonsterStatus)
            );
            document.getElementById('monsterdb_container')?.appendChild(monsterInfoVElement);
          } else {
            const container = document.getElementById('monsterdb_container');
            if (container && monsterInfoVElement) {
              patch(monsterInfoVElement, MonsterInfo(allMonsterStatus));
            }
          }
        });
      });
    }
    StateSubscribed.set(true);
  }
}

/** Tasks like "get monster id and monster name" only have to run at the start of per round */
async function tasksRunAtStartOfPerRound(): Promise<void> {
  const monsterInTheRoundNameIdMap: Map<string, number> = new Map();

  if (document.getElementById('textlog')?.textContent?.includes('Spawned')) {
    [...document.querySelectorAll('#textlog > tbody > tr')].forEach(logEl => {
      // Get Monster Name & ID
      if (logEl.textContent?.trim().startsWith('Spawned')) {
        const monsterNameAndId = parseMonsterNameAndId(logEl.textContent);
        if (monsterNameAndId) {
          monsterInTheRoundNameIdMap.set(monsterNameAndId.monsterName, monsterNameAndId.monsterId);
        }
      }
    });

    // Update Monsters's ID only when browser is idle
    window.requestIdleCallback(() => MONSTER_NAME_ID_MAP.updateMany([...monsterInTheRoundNameIdMap.entries()]), { timeout: 2000 });
  }

  // I am not sure the order that monster showed up in battle log
  // is consistent with actually in #battle_right. It is unstable
  // and unreliable method. So I will manually get monster info
  // directly from DOM.
  const monsters: Record<string, HVMonsterDatabase.MonsterInfo | null> = {};
  const mkeys: Record<string, string> = {};
  const monsterLastUpdates: Record<number, number> = {};
  (await Promise.all(
    [...document.getElementsByClassName('btm1')].map(async el => {
      const mkey = el.id;
      const monsterName = el.getElementsByClassName('btm3')[0].textContent?.trim();

      if (mkey && monsterName) {
        mkeys[monsterName] = mkey;

        const mid = monsterInTheRoundNameIdMap.get(monsterName) ?? await MONSTER_NAME_ID_MAP.get(monsterName);
        if (mid) {
          const encodedMonsterInfo = await LOCAL_MONSTER_DATABASE.get(mid);
          if (encodedMonsterInfo) {
            const monsterInfo = convertEncodedMonsterInfoToMonsterInfo(mid, encodedMonsterInfo);
            const lastUpdate = encodedMonsterInfo[EncodedMonsterDatabase.EMonsterInfo.lastUpdate];

            monsters[monsterName] = monsterInfo;
            monsterLastUpdates[mid] = lastUpdate;

            return;
          }
        }

        monsters[monsterName] = null;
      }
    })
  ));

  MonstersInCurrentRound.set(monsters);
  MonstersAndMkeysInCurrentRound.set(mkeys);
  MonsterLastUpdate.set(monsterLastUpdates);
  logger.debug('MonstersInCurrentRound', MonstersInCurrentRound.get());
  logger.debug('MonstersAndMkeysInCurrentRound', MonstersAndMkeysInCurrentRound.get());
  logger.debug('MonsterLastUpdate', MonsterLastUpdate.get());
}

async function tasksRunDuringTheBattle(): Promise<void> {
  // Handle batleLog
  const logEls = document.querySelectorAll('#textlog > tbody > tr');
  for (const logEl of logEls) {
    const logHtml = logEl.innerHTML;

    // This turn is over, do not proceed
    if (logHtml.includes('<td class="tls">')) break;

    // This turn scan a monster
    if (logHtml.includes('Scanning')) {
      // eslint-disable-next-line no-await-in-loop
      const scanResult = await parseScanResult(logHtml);
      if (scanResult) {
        const { monsterName } = scanResult;

        logger.info('Scanned a monster:', monsterName);
        logger.debug('Scan result', scanResult);

        const scannedMonsterMkey = MonstersAndMkeysInCurrentRound.get()[monsterName];
        if (scannedMonsterMkey && checkScanResultValidity(scannedMonsterMkey)) {
          logger.info(`Scan results for ${monsterName} is now queued to submit`);
          window.requestIdleCallback(() => submitScanResults(scanResult), { timeout: 3000 });

          // eslint-disable-next-line no-await-in-loop
          const mid = await MONSTER_NAME_ID_MAP.get(monsterName);
          if (mid) {
            LOCAL_MONSTER_DATABASE.set(mid, convertMonsterInfoToEncodedMonsterInfo(scanResult));
            MonsterLastUpdate.setKey(mid, Date.now());
          }
        } else {
          logger.warn(`${monsterName} is not legible for scan, ignoring the scan result!`);
        }
      }

      break;
    }
  }

  logger.debug('Monsters need to be highlighted', MonsterNeedHighlight.get());
  logger.debug('Monsters need to be scanned', MonsterNeedScan.get());
}
