import { MonsterStatus } from './monster';
import { parseMonsterNameAndId, parseScanResult } from './parseLog';
import { MONSTER_NAME_ID_MAP, LOCAL_MONSTER_DATABASE } from './store';
import { createMonsterInfoBox, monsterInfoVirtualNodeFactory } from './monsterInfoUI';
import { convertMonsterInfoToEncodedMonsterInfo } from './monsterDataEncode';
import { logger } from '../util/logger';
import { submitScanResults } from './submitScan';
import { createElement, patch } from 'million';

let monsterInfoVElement: ReturnType<typeof createElement> | undefined;

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
    await tasksRunAtStartOfPerRound();
    const mo = new MutationObserver(tasksRunDuringTheBattle);
    mo.observe(logEl.firstChild, { childList: true });
  }
}

/** Tasks like "get monster id and monster name" only have to run at the start of per round */
async function tasksRunAtStartOfPerRound(): Promise<void> {
  const monsterInTheRoundNameIdMap: Map<string, number> = new Map();

  MONSTERS.clear();

  if (document.getElementById('textlog')?.textContent?.includes('Spawned')) {
    await Promise.all([...document.querySelectorAll('#textlog > tbody > tr')].reverse().map(async logEl => {
      // Get Monster Name & ID
      if (logEl.textContent?.trim().startsWith('Spawned')) {
        const monsterNameAndId = parseMonsterNameAndId(logEl.textContent);
        if (monsterNameAndId) {
          logger.debug('Monster Name & ID', monsterNameAndId.monsterId, monsterNameAndId.monsterName);
          monsterInTheRoundNameIdMap.set(monsterNameAndId.monsterName, monsterNameAndId.monsterId);
          return MONSTER_NAME_ID_MAP.update(monsterNameAndId.monsterName, monsterNameAndId.monsterId);
        }
      }
    }));
  }

  // I am not sure the order that monster showed up in battle log
  // is consistent with actually in #battle_right. It is unstable
  // and unreliable method. So I will manually get monster info
  // directly from DOM.
  (await Promise.all(
    [...document.getElementsByClassName('btm1')].map(el => {
      const mkey = el.id;
      const name = el.getElementsByClassName('btm3')[0].textContent?.trim();

      if (mkey && name) {
        const monster = new MonsterStatus(name, mkey, monsterInTheRoundNameIdMap.get(name) ?? null);
        return monster.init();
      }

      return null;
    })
  )).forEach(monster => {
    if (monster?.name) {
      MONSTERS.set(monster.name, monster);
    }
  });

  logger.debug('Monsters in the round', MONSTERS);

  // This function is related with API, so it can't be wrapped in requestAnimationFrame.
  showMonsterInfoAndHighlightMonster();
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

        const monsterStatus = MONSTERS.get(monsterName);

        // Check if the monster is dead, being imperiled, or has spell effects
        if (monsterStatus?.checkScanResultValidity()) {
          logger.info(`Scan results for ${monsterName} is now queued to submit`);
          submitScanResults(scanResult);

          // Update local database first, it will be used to update UI
          if (monsterStatus.mid) {
            LOCAL_MONSTER_DATABASE.set(monsterStatus.mid, convertMonsterInfoToEncodedMonsterInfo(scanResult));
            monsterStatus.updateInfoFromScan(scanResult);
          }
        } else {
          logger.warn(`${monsterName} is not legible for scan, ignoring the scan result!`);
        }
      }
    }
  }

  showMonsterInfoAndHighlightMonster();
}

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

let requestAnimationFrameId: ReturnType<typeof globalThis.requestAnimationFrame> | undefined;
const isHighlightMonsterEnabled = SETTINGS.highlightMonster && Object.keys(SETTINGS.highlightMonster).length > 0;
const highlightScanColor = SETTINGS.scanHighlightColor === true ? 'coral' : SETTINGS.scanHighlightColor;

function showMonsterInfoAndHighlightMonster(): void {
  // A queue of function to be called, to avoid race condition
  const requestAnimationFrameCallbackQueue: FrameRequestCallback[] = [];

  MONSTERS_NEED_SCAN.clear();

  if (SETTINGS.showMonsterInfoBox) {
    const monsterStatus = [...MONSTERS.values()];

    if (!document.getElementById('monsterdb_info')) {
      requestAnimationFrameCallbackQueue.push(() => {
        createMonsterInfoBox();
        monsterInfoVElement = createElement(
          monsterInfoVirtualNodeFactory(monsterStatus)
        );
        document.getElementById('monsterdb_container')?.appendChild(monsterInfoVElement);
      });
    } else {
      requestAnimationFrameCallbackQueue.push(() => {
        const container = document.getElementById('monsterdb_container');
        if (container && monsterInfoVElement) {
          patch(monsterInfoVElement, monsterInfoVirtualNodeFactory(monsterStatus));
        }
      });
    }
  }

  for (const [monsterName, monsterStatus] of MONSTERS) {
    // Highlight a monster based on SETTINGS.highlightMonster
    if (isHighlightMonsterEnabled) {
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
      if (highlightScanColor !== false) {
        requestAnimationFrameCallbackQueue.push(highlightExpireMonster(monsterStatus.element, highlightScanColor));
      }
    }
  }

  // Avoid stacking FrameRequestCallback causing memory leaks
  if (requestAnimationFrameId && typeof window.cancelAnimationFrame === 'function') {
    window.cancelAnimationFrame(requestAnimationFrameId);
  }
  requestAnimationFrameId = window.requestAnimationFrame((t) => {
    // Batch FrameRequestCallback to avoid race condition
    for (const func of requestAnimationFrameCallbackQueue) {
      func(t);
    }

    requestAnimationFrameId = undefined;
  });
}
