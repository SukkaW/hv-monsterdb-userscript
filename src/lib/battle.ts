import { MonsterStatus } from './monster';
import { parseMonsterNameAndId, parseScanResult } from './parseLog';
import { LOCAL_MONSTER_DATABASE, MONSTER_NAME_ID_MAP } from './store';
import { createMonsterInfoBox, makeMonsterInfoTable } from './monsterInfoUI';
import { convertMonsterInfoToEncodedMonsterInfo } from './monsterDataEncode';
import { logger } from '../util/logger';
import { submitScanResults } from './submitScan';
import { HVMonsterDatabase } from '../types';

import 'typed-query-selector';

export const MONSTERS: Map<string, MonsterStatus> = new Map();

export const MONSTERS_NEED_SCAN: Set<{
  name: string,
  /** Can be used with document#getElementById */
  mkey: string,
  mid?: number
}> = new Set();

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
    tasksRunAtStartOfPerRound();
    const mo = new MutationObserver(tasksRunDuringTheBattle);
    mo.observe(logEl.firstChild, { childList: true });
  }
}

/** Tasks like "get monster id and monster name" only have to run at the start of per round */
function tasksRunAtStartOfPerRound(): void {
  document.querySelectorAll('#textlog > tbody > tr').forEach(logEl => {
    const logHtml = logEl.innerHTML;

    // Get Monster Name & ID
    if (logHtml.includes('Spawned')) {
      const monsterNameAndId = parseMonsterNameAndId(logHtml);
      if (monsterNameAndId) {
        logger.debug('Monster Name & ID', monsterNameAndId.monsterId, monsterNameAndId.monsterName);
        MONSTER_NAME_ID_MAP.set(monsterNameAndId.monsterName, monsterNameAndId.monsterId);
      }
    }
  });

  MONSTERS.clear();
  // I am not sure the order that monster showed up in battle log
  // is consistent with actually in #battle_right. It is unstable
  // and unreliable method. So I will manually get monster info
  // directly from DOM.
  for (const el of document.getElementsByClassName('btm1')) {
    const mkey = el.getAttribute('id');
    const name = el.getElementsByClassName('btm3')[0].textContent?.trim();

    if (mkey && name) {
      const monster = new MonsterStatus(name, mkey);
      MONSTERS.set(name, monster);
    }
  }

  logger.debug('Monsters in the round', MONSTERS);

  // This function is related with API, so it can't be wrapped in requestAnimationFrame.
  showMonsterInfoAndHighlightMonster();
}

function tasksRunDuringTheBattle(): void {
  // Handle batleLog
  const logEls = document.querySelectorAll('#textlog > tbody > tr');
  for (const logEl of logEls) {
    const logHtml = logEl.innerHTML;

    // This turn is over, do not proceed
    if (logHtml.includes('<td class="tls">')) break;

    // This turn scan a monster
    if (logHtml.includes('Scanning')) {
      const scanResult = parseScanResult(logHtml);
      if (scanResult) {
        const { monsterName } = scanResult;

        logger.info('Scanned a monster:', monsterName);
        logger.debug('Scan result', scanResult);

        const monsterStatus = MONSTERS.get(monsterName);

        // Check if the monster is dead, being imperiled, or has spell effects
        if (monsterStatus?.checkScanResultValidity()) {
          logger.info(`Scan results for ${monsterName} is now queued to submit`);
          submitScanResults(scanResult);

          const simplifiedScanResult = convertMonsterInfoToEncodedMonsterInfo(scanResult);
          // Update local database first, it will be used to update UI
          if (monsterStatus.mid) {
            LOCAL_MONSTER_DATABASE[monsterStatus.mid] = simplifiedScanResult;
          }
        } else {
          logger.warn(`${monsterName} is not legible for scan, ignoring the scan result!`);
        }
      }
    }
  }

  showMonsterInfoAndHighlightMonster();
}

const clearMonsterInfoContainer = () => {
  const monsterInfoBoxEl = document.getElementById('monsterdb_container');
  if (monsterInfoBoxEl) {
    monsterInfoBoxEl.innerHTML = '';
  }
};
const appendMonsterInfo = (info: HVMonsterDatabase.MonsterInfo | null | undefined) => () => {
  document.getElementById('monsterdb_container')?.appendChild(makeMonsterInfoTable(info));
};
const highlightExpireMonster = (monsterElement: HTMLElement | null, color: string) => () => {
  const monsterBtm2El = monsterElement?.querySelector('div.btm2');
  if (monsterBtm2El) {
    monsterBtm2El.style.backgroundColor = color;
  }
};
const highlightMonster = (monsterStatus: MonsterStatus) => () => {
  const color = monsterStatus.highlightColor;
  if (color) {
    const monsterBtm2El = monsterStatus.element?.querySelector('div.btm2');
    if (monsterBtm2El) {
      monsterBtm2El.style.backgroundColor = color;
    }
  }
};

function showMonsterInfoAndHighlightMonster(): void {
  // A queue of function to be called, to avoid race condition
  // eslint-disable-next-line @typescript-eslint/ban-types
  const requestAnimationFrameCallbackQueue: Function[] = [];

  MONSTERS_NEED_SCAN.clear();

  if (SETTINGS.showMonsterInfoBox && !document.getElementById('monsterdb_info')) {
    requestAnimationFrameCallbackQueue.push(createMonsterInfoBox);
  }
  requestAnimationFrameCallbackQueue.push(clearMonsterInfoContainer);

  for (const [monsterName, monsterStatus] of MONSTERS) {
    // #geiInfo method always provide latest data (including scanned)
    if (SETTINGS.showMonsterInfoBox) {
      requestAnimationFrameCallbackQueue.push(appendMonsterInfo(monsterStatus.info));
    }

    // Highlight a monster based on SETTINGS.highlightMonster
    if (SETTINGS.highlightMonster && Object.keys(SETTINGS.highlightMonster).length > 0) {
      requestAnimationFrameCallbackQueue.push(highlightMonster(monsterStatus));
    }

    // Find monster needs to be scanned
    if (monsterStatus.isNeedScan && monsterStatus.checkScanResultValidity()) {
      MONSTERS_NEED_SCAN.add({
        name: monsterName,
        mkey: monsterStatus.mkey,
        mid: monsterStatus.mid
      });
      // Highlight a monster hasn't been scanned for a while
      if (SETTINGS.scanHighlightColor !== false) {
        const highlightColor = SETTINGS.scanHighlightColor === true ? 'coral' : SETTINGS.scanHighlightColor;
        requestAnimationFrameCallbackQueue.push(highlightExpireMonster(monsterStatus.element, highlightColor));
      }
    }
  }

  // Batch highlightExpireMonster to avoid race condition
  window.requestAnimationFrame(() => {
    for (const func of requestAnimationFrameCallbackQueue) {
      func();
    }
  });
}
