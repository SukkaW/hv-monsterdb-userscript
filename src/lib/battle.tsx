import { parseMonsterNameAndId, parseScanResult } from './parseLog';
import { MONSTER_NAME_ID_MAP, LOCAL_MONSTER_DATABASE } from './store';
import { createMonsterInfoBox, MonsterInfo } from './monsterInfoUI';
import { convertEncodedMonsterInfoToMonsterInfo, convertMonsterInfoToEncodedMonsterInfo, EncodedMonsterDatabase } from './monsterDataEncode';
import { isIsekai } from '../util/common';
import { logger } from '../util/logger';
import { submitScanResults } from './submitScan';

import { checkScanResultValidity } from './monster';
import { MonstersInCurrentRound, MonstersAndMkeysInCurrentRound, MonstersAndTheirRandomness, MonsterLastUpdate, MonsterNeedScan, MonsterNeedHighlight, MonstersHtmlStore } from './states';
import { render } from 'million';
import { requestIdleCallback } from 'foxact/request-idle-callback';

import 'typed-query-selector';
import type { HVMonsterDatabase } from '../types';

/** @jsxImportSource million */

let StateSubscribed = false;

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
  let logFirstChild;
  if (logEl && (logFirstChild = logEl.firstChild)) {
    await tasksRunAtStartOfPerRound();
    const mo = new MutationObserver(tasksRunDuringTheBattle);
    mo.observe(logFirstChild, { childList: true });
  }

  if (!StateSubscribed) {
    // Show monster info box
    if (SETTINGS.showMonsterInfoBox) {
      let showMonsterInfoBoxRafId: number | null = null;

      MonstersInCurrentRound.subscribe(monstersInCurrentRound => {
        // This to prevent rendering when new round starts and monsters data is still being fetching
        if (showMonsterInfoBoxRafId) {
          window.cancelAnimationFrame(showMonsterInfoBoxRafId);
        }

        showMonsterInfoBoxRafId = window.requestAnimationFrame(() => {
          const allMonsterStatus = Object.values(monstersInCurrentRound);

          // There is first monsterdb_info, then we have monsterdb_container
          if (!document.getElementById('monsterdb_info')) {
            createMonsterInfoBox();
          }

          const container = document.getElementById('monsterdb_container');
          if (container) {
            render(container, <MonsterInfo allMonsterStatus={allMonsterStatus} />);
          }
        });
      });
    }
    StateSubscribed = true;
  }
}

/** To prevent multiple users scan the same monster over and over again, some randomness has been added. Generate it once per monster */
function createRandomness() {
  return isIsekai()
    ? Math.floor(Math.random() * Math.floor(SETTINGS.scanExpireDays / 3))
    : Math.floor(Math.random() * Math.floor(SETTINGS.scanExpireDays / 5)) + 1;
}

/** Tasks like "get monster id and monster name" only have to run at the start of per round */
async function tasksRunAtStartOfPerRound(): Promise<void> {
  const monsterInTheRoundNameIdMap = new Map<string, number>();

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

  // Use Map to ensure the order of monsters
  const monsters = new Map<string, HVMonsterDatabase.MonsterInfo | null>();
  const mkeys: Record<string, string> = {};
  const monsterLastUpdates: Record<number, number> = {};
  const monstersRandomness: Record<string, number> = {};

  const monsterNamesOfMonstersInCurrentRound: Array<string | null> = [];

  const btm1 = document.getElementsByClassName('btm1');
  collectMonstersHtml(btm1);
  // Add a null monster info to monsters object first, to prevent race condition later on
  for (let i = 0, len = btm1.length; i < len; i++) {
    const el = btm1[i];
    const mkey = el.id;
    const monsterName = el.getElementsByClassName('btm3')[0].textContent?.trim();
    if (mkey && monsterName) {
      monsters.set(monsterName, null);

      mkeys[monsterName] = mkey;
      monstersRandomness[monsterName] = createRandomness();

      monsterNamesOfMonstersInCurrentRound.push(monsterName);
    } else {
      monsterNamesOfMonstersInCurrentRound.push(null);
    }
  }

  (await Promise.all(
    monsterNamesOfMonstersInCurrentRound.map(async monsterName => {
      if (monsterName) {
        const mid = monsterInTheRoundNameIdMap.get(monsterName) ?? await MONSTER_NAME_ID_MAP.get(monsterName);
        if (mid) {
          const encodedMonsterInfo = await LOCAL_MONSTER_DATABASE.get(mid);
          if (encodedMonsterInfo) {
            const monsterInfo = convertEncodedMonsterInfoToMonsterInfo(mid, encodedMonsterInfo);
            const lastUpdate = encodedMonsterInfo[EncodedMonsterDatabase.EMonsterInfo.lastUpdate];

            monsters.set(monsterName, monsterInfo);
            monsterLastUpdates[mid] = lastUpdate;

            return;
          }
        }

        monsters.set(monsterName, null);
      }
    })
  ));

  MonstersInCurrentRound.set(Object.fromEntries(monsters.entries()));
  MonstersAndMkeysInCurrentRound.set(mkeys);
  MonsterLastUpdate.set(monsterLastUpdates);
  MonstersAndTheirRandomness.set(monstersRandomness);

  logger.debug('MonstersInCurrentRound', MonstersInCurrentRound.get());

  highlightMonsters();
}

async function tasksRunDuringTheBattle(): Promise<void> {
  collectMonstersHtml();
  highlightMonsters();

  // Handle batleLog
  const logEls = document.querySelectorAll('#textlog > tbody > tr');
  for (const { innerHTML: logHtml } of logEls) {
    // This turn is over, do not proceed
    if (logHtml.includes('<td class="tls">')) break;

    // This turn scan a monster
    if (logHtml.includes('Scanning')) {
      // Every turn you'd only scan one monster
      // eslint-disable-next-line no-await-in-loop -- sequential operation as we need to read IndexedDB
      const scanResult = await parseScanResult(logHtml);
      if (scanResult) {
        const { monsterName, monsterId } = scanResult;

        logger.info('Scanned a monster:', monsterName);
        logger.debug('Scan result', scanResult);

        const scannedMonsterMkey = MonstersAndMkeysInCurrentRound.get()[monsterName];
        if (scannedMonsterMkey) {
          const monsterHtml = MonstersHtmlStore.get()[scannedMonsterMkey];
          if (checkScanResultValidity(monsterHtml)) {
            logger.info(`Scan results for ${monsterName} is now queued to submit`);
            // eslint-disable-next-line sukka/prefer-timer-id -- hang
            requestIdleCallback(() => submitScanResults(scanResult), { timeout: 3000 });

            // We already fetch monsterId during parseScanResult
            LOCAL_MONSTER_DATABASE.set(monsterId, convertMonsterInfoToEncodedMonsterInfo(scanResult));
            MonsterLastUpdate.setKey(monsterId, Date.now());
            MonstersInCurrentRound.setKey(monsterName, scanResult);

            // Highlight monsters again with newly scanned monsters' state
            highlightMonsters();
          } else {
            logger.warn(`${monsterName} is not legible for scan, ignoring the scan result!`);
          }
        }

        break;
      }
    }
  }
}

function collectMonstersHtml(btm1?: HTMLCollectionOf<Element>) {
  btm1 ||= document.getElementsByClassName('btm1');
  const prevHtmls = MonstersHtmlStore.get();
  // Add a null monster info to monsters object first, to prevent race condition later on
  for (let i = 0, len = btm1.length; i < len; i++) {
    const el = btm1[i];
    const mkey = el.id;
    const prevHtml = prevHtmls[mkey];
    const html = el.innerHTML;
    if (prevHtml !== html) {
      MonstersHtmlStore.setKey(mkey, html);
    }
  }
}

let highlightNeedScanMonsterRafId: number | null = null;
let highlightMonsterRafId: number | null = null;
const highlightScanColor = SETTINGS.scanHighlightColor === true ? 'coral' : SETTINGS.scanHighlightColor;
const isHighlightMonsterEnabled = typeof SETTINGS.highlightMonster === 'object' && Object.keys(SETTINGS.highlightMonster).length > 0;

// HentaiVerse always completely replace monsters element, so we need to re-highlight monsters on every turn.
// Blame Tenboro for his lazily adapting new web technology.
function highlightMonsters() {
  // Highlight Need Scanned Monsters
  if (highlightNeedScanMonsterRafId) {
    window.cancelAnimationFrame(highlightNeedScanMonsterRafId);
  }

  if (highlightScanColor) {
    highlightNeedScanMonsterRafId = window.requestAnimationFrame(() => {
      MonsterNeedScan.get().forEach(needScanMonster => {
        if (needScanMonster?.mkey) {
          const monsterBtm2El = document.getElementById(needScanMonster.mkey)?.querySelector('div.btm2');
          if (monsterBtm2El) {
            monsterBtm2El.style.backgroundColor = highlightScanColor;
          }
        }
      });
    });
  }

  if (isHighlightMonsterEnabled) {
    // Highlight Monster
    if (highlightMonsterRafId) {
      window.cancelAnimationFrame(highlightMonsterRafId);
    }

    highlightMonsterRafId = window.requestAnimationFrame(() => {
      MonsterNeedHighlight.get().forEach(needHighlightMonster => {
        if (needHighlightMonster) {
          const { color, mkey } = needHighlightMonster;
          const monsterBtm2El = document.getElementById(mkey)?.querySelector('div.btm2');
          if (monsterBtm2El) {
            monsterBtm2El.style.backgroundColor = color;
          }
        }
      });
    });
  }
}
