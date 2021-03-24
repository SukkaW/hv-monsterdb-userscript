import { MonsterStatus } from './monster';
import { parseMonsterNameAndId, parseScanResult } from './parseLog';
import { LOCAL_MONSTER_DATABASE, MONSTER_NAME_ID_MAP, retrieveTmpValue } from './store';
import { createMonsterInfoBox, makeMonsterInfoTable } from './monsterInfoUI';
import { convertMonsterInfoToEncodedMonsterInfo } from './localDataBase';
import { logger } from '../util/logger';
import { submitScanResults } from './submitScan';

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
  tasksRunAtStartOfPerRound();

  const logEl = document.getElementById('textlog');
  if (logEl && logEl.firstChild) {
    const mo = new MutationObserver(tasksRunDuringTheBattle);
    mo.observe(logEl.firstChild, { childList: true });
  }
}

/** Tasks like restore tmp value & rebuild monsterIdMao only have to run once */
export async function tasksRunOncePerPageLoad(): Promise<void> {
  await retrieveTmpValue();
}

/** Tasks like "get monster id and monster name" only have to run at the start of per round */
function tasksRunAtStartOfPerRound(): void {
  const logEls = document.querySelectorAll('#textlog > tbody > tr');

  logEls.forEach(logEl => {
    const logHtml = logEl.innerHTML;

    // Get Monster Name & ID
    if (logHtml.includes('Spawned')) {
      const monsterNameAndId = parseMonsterNameAndId(logHtml);
      if (monsterNameAndId) {
        MONSTER_NAME_ID_MAP.set(monsterNameAndId.monsterName, monsterNameAndId.monsterId);
      }
    }
  });

  MONSTERS.clear();
  // I am not sure the order that monster showed up in battle log
  // is consistent with actually in #battle_right. It is unstable
  // and unreliable method, So I will manually get monster info
  // directly from DOM.
  for (const el of document.getElementsByClassName('btm1')) {
    const mkey = el.getAttribute('id');
    const name = el.getElementsByClassName('btm3')[0].textContent?.trim();

    if (mkey && name) {
      const monster = new MonsterStatus(name, mkey);
      MONSTERS.set(name, monster);
    }
  }

  // Monsterbation tend to replace whole document.body when ajaxRound is enabled.
  // So it is necessary to re-add Monster Info Box back to DOM per round start.
  // Use window.requestAnimationFrame, hopefully it won't cause rendering performance issue.
  if (SETTINGS.showMonsterInfoBox) {
    window.requestAnimationFrame(createMonsterInfoBox);
  }
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
        logger.info('Scanned a monster:', scanResult);

        const { monsterName } = scanResult;
        const monsterStatus = MONSTERS.get(monsterName);

        // Check if the monster is dead, being imperiled, or has spell effects
        if (monsterStatus?.isScanResultGoingToBeLegit()) {
          logger.info(`Scan results for ${monsterName} is now queued to submit`);
          submitScanResults(scanResult);

          const simplifiedScanResult = convertMonsterInfoToEncodedMonsterInfo(scanResult);
          // Update local database first, it will be used to update UI
          LOCAL_MONSTER_DATABASE[monsterName] = simplifiedScanResult;
        } else {
          logger.warn(`${monsterName} is not legible for scan, ignoring the scan result!`);
        }
      }
    }
  }

  // Show monster info table
  const monsterInfoBoxEl = document.getElementById('monsterdb_container');
  if (monsterInfoBoxEl) {
    monsterInfoBoxEl.innerHTML = '';
  }

  MONSTERS_NEED_SCAN.clear();

  for (const [monsterName, monsterStatus] of MONSTERS) {
    // #geiInfo method always provide latest data (including scanned)
    if (SETTINGS.showMonsterInfoBox) {
      window.requestAnimationFrame(() => {
        monsterInfoBoxEl?.appendChild(makeMonsterInfoTable(monsterStatus.getInfo()));
      });
    }

    // Find monster needs to be scanned
    if (monsterStatus.isNeedScan() && monsterStatus.isScanResultGoingToBeLegit()) {
      MONSTERS_NEED_SCAN.add({
        name: monsterName,
        mkey: monsterStatus.mkey,
        mid: monsterStatus.mid
      });

      // Highlight a monster hasn't been scanned for a while
      if (SETTINGS.scanHighlightColor !== false) {
        const monsterBtm2El = monsterStatus.getElement()?.querySelector('div.btm2');
        if (monsterBtm2El) {
          monsterBtm2El.style.background = SETTINGS.scanHighlightColor === true ? 'coral' : SETTINGS.scanHighlightColor;
          // Monster elements will be replaced per turn start
          // so there is no need to restore the background color
        }
      }
    }
  }
}
