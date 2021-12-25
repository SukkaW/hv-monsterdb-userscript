import { HVMonsterDatabase } from '../types';
import { isIsekai } from '../util/common';
import { getHowManyDaysSinceLastIsekaiReset } from './isekaiReset';
import { convertEncodedMonsterInfoToMonsterInfo, EncodedMonsterDatabase } from './monsterDataEncode';
import { LOCAL_MONSTER_DATABASE, MONSTER_NAME_ID_MAP } from './store';

const EFFECTS_AFFECTING_SCAN_REAULT = ['nbardead.png', 'imperil.png', 'firedot.png', 'coldslow.png', 'coldslow.png', 'windmiss.png', 'holybreach.png', 'darknerf.png'] as const;

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
        const regexp = new RegExp(matcher);
        if (regexp.test(JSON.stringify(monsterInfo))) {
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
      const howManyDaysSinceLastIsekaiReset = getHowManyDaysSinceLastIsekaiReset();
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

export class MonsterStatus {
  /** Monster Name */
  public name: string;
  /** Monster Mkey */
  public mkey: string;
  /** Monster MID */
  public mid?: number;
  /** randomness */
  private _randomness: number;

  public info?: HVMonsterDatabase.MonsterInfo;
  public lastUpdate?: number;

  constructor(name: string, mkey: string, mid: number | null) {
    this.name = name;
    this.mkey = mkey;
    if (mid) {
      this.mid = mid;
    }

    // To prevent multiple users scan the same monster over and over again, some randomness has been added.
    // Generate it once per monster
    if (isIsekai()) {
      this._randomness = Math.floor(Math.random() * Math.floor(SETTINGS.scanExpireDays / 3));
    } else {
      this._randomness = Math.floor(Math.random() * Math.floor(SETTINGS.scanExpireDays / 5)) + 1;
    }
  }

  async init(): Promise<this> {
    if (!this.mid) {
      this.mid = await MONSTER_NAME_ID_MAP.get(this.name);
    }
    if (this.mid) {
      const encodedMonsterInfo = await LOCAL_MONSTER_DATABASE.get(this.mid);
      if (encodedMonsterInfo) {
        this.info = convertEncodedMonsterInfoToMonsterInfo(this.mid, encodedMonsterInfo);
        this.lastUpdate = encodedMonsterInfo[EncodedMonsterDatabase.EMonsterInfo.lastUpdate];
      }
    }

    return this;
  }

  updateInfoFromScan(scanResult: HVMonsterDatabase.MonsterInfo): void {
    this.info = scanResult;
    this.lastUpdate = Date.now();
  }

  get element(): HTMLElement | null {
    return document.getElementById(this.mkey);
  }

  get isDead(): boolean {
    return Boolean(this.element?.innerHTML.includes('nbardead.png'));
  }

  checkScanResultValidity(): boolean {
    const monsterHtml = this.element?.innerHTML;
    if (monsterHtml) {
      return !EFFECTS_AFFECTING_SCAN_REAULT.some(effectImg => monsterHtml.includes(effectImg));
    }

    return false;
  }

  get isNeedScan(): boolean {
    if (this.isDead) return false;

    const { lastUpdate } = this;
    if (lastUpdate) {
      // How many days since lastUpdate to now.
      const passedDays = Math.round((NOW - lastUpdate) / (24 * 60 * 60 * 1000));

      if (isIsekai()) {
        const howManyDaysSinceLastIsekaiReset = getHowManyDaysSinceLastIsekaiReset();
        if (
          howManyDaysSinceLastIsekaiReset
          // There is an Isekai Reset between last scan and now.
          && passedDays > howManyDaysSinceLastIsekaiReset
          // Add some randomness to prevent everyone scan monsters at the day one of the Isekai Reset
          && howManyDaysSinceLastIsekaiReset > this._randomness
        ) {
          return true;
        }

        // In isekai monsters won't get update. If lastUpdate is not undefined,
        // it means the monster is already in the database, no need to scan it again
        return false;
      }

      if (passedDays < (SETTINGS.scanExpireDays + this._randomness)) {
        return false;
      }
    }
    // When lastUpdate is undefined / null, it means it is not in local database.
    // That also means it requires scan.
    return true;
  }

  get highlightColor(): string | false {
    if (typeof SETTINGS.highlightMonster === 'object' && this.info) {
      for (const [color, matcher] of Object.entries(SETTINGS.highlightMonster)) {
        if (matcher instanceof RegExp) {
          if (matcher.test(JSON.stringify(this.info))) {
            return color;
          }
        } else if (typeof matcher === 'function') {
          if (matcher(this.info)) {
            return color;
          }
        } else if (typeof matcher === 'string') {
          const regexp = new RegExp(matcher);
          if (regexp.test(JSON.stringify(this.info))) {
            return color;
          }
        }
      }
    }

    return false;
  }
}
