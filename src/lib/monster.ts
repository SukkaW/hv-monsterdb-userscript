import { HVMonsterDatabase } from '../types';
import { isIsekai } from '../util/common';
import { HowManyDaysSinceLastIsekaiReset } from './isekaiReset';

const EFFECTS_AFFECTING_SCAN_REAULT = ['nbardead.png', 'imperil.png', 'firedot.png', 'coldslow.png', 'elecweak.png', 'windmiss.png', 'holybreach.png', 'darknerf.png'] as const;

const NOW = new Date().getTime();

export const checkScanResultValidity = (mkey: string) => {
  const monsterHtml = document.getElementById(mkey)?.innerHTML;
  if (monsterHtml) {
    return !EFFECTS_AFFECTING_SCAN_REAULT.some(effectImg => monsterHtml.includes(effectImg));
  }
  return false;
};

export const getMonsterHighlightColor = (monsterInfo: HVMonsterDatabase.MonsterInfo): string | false => {
  if (typeof SETTINGS.highlightMonster === 'object') {
    for (const [color, matcher] of Object.entries(SETTINGS.highlightMonster)) {
      if (matcher instanceof RegExp) {
        if (matcher.test(JSON.stringify(monsterInfo))) {
          return color;
        }
      } else if (typeof matcher === 'function') {
        if (matcher(monsterInfo)) {
          return color;
        }
      } else if (typeof matcher === 'string') {
        if (new RegExp(matcher).test(JSON.stringify(monsterInfo))) {
          return color;
        }
      }
    }
  }

  return false;
};

export const isMonsterNeedScan = (mkey: string | undefined, randomness: number | undefined, lastUpdate?: number): boolean => {
  const isDead = mkey && Boolean(document.getElementById(mkey)?.innerHTML.includes('nbardead.png'));
  if (isDead) return false;

  randomness ??= Math.floor(Math.random() * Math.floor(SETTINGS.scanExpireDays / 5)) + 1;

  if (lastUpdate) {
    // How many days since lastUpdate to now.
    const passedDays = Math.round((NOW - lastUpdate) / (24 * 60 * 60 * 1000));

    if (isIsekai()) {
      const howManyDaysSinceLastIsekaiReset = HowManyDaysSinceLastIsekaiReset.get();
      if (
        howManyDaysSinceLastIsekaiReset
        // There is an Isekai Reset between last scan and now.
        && passedDays > howManyDaysSinceLastIsekaiReset
        // Add some randomness to prevent everyone scan monsters at the day one of the Isekai Reset
        && howManyDaysSinceLastIsekaiReset > randomness
      ) {
        return true;
      }

      // In isekai monsters won't get update. If lastUpdate is not undefined,
      // it means the monster is already in the database, no need to scan it again
      return false;
    }

    if (passedDays < (SETTINGS.scanExpireDays + randomness)) {
      return false;
    }
  }

  // When lastUpdate is undefined / null, it means it is not in local database.
  // That also means it requires scan.
  return true;
};
