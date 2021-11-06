import { EncodedMonsterDatabase } from './lib/monsterDataEncode';

export namespace HVMonsterDatabase {
  export type MonsterClass = 'Arthropod' | 'Avion' | 'Beast' | 'Celestial' | 'Daimon' | 'Dragonkin' | 'Elemental' | 'Giant' | 'Humanoid' | 'Mechanoid' | 'Reptilian' | 'Sprite' | 'Undead' | 'Rare' | 'Legendary' | 'Ultimate';
  export type MonsterAttack = 'Piercing' | 'Crushing' | 'Slashing' | 'Fire' | 'Cold' | 'Wind' | 'Elec' | 'Holy' | 'Dark' | 'Void';

  export interface MonsterInfo {
    monsterId: number
    monsterClass: MonsterClass
    monsterName: string
    /**
     * @description PL
     */
    plvl: number
    /**
     * @description Attack Mode
     */
    attack: MonsterAttack

    trainer: string
    piercing: number
    crushing: number
    slashing: number
    cold: number
    wind: number
    elec: number
    fire: number
    dark: number
    holy: number

    /**
     * @description Last time update (can be parsed through Date)
     */
    lastUpdate: string
  }

  export interface LocalDatabaseVersion2 {
    [key: number]: EncodedMonsterDatabase.MonsterInfo
  }

  export interface StoredValue {
    /** @deprecated - Last Update Date of version 1 database */
    lastUpdate?: string
    lastUpdateIsekai?: string
    /** @deprecated - Local Monsterbase version 1 */
    database?: unknown
    /** @deprecated - Local Isekai Monsterbase version 1 */
    databaseIsekai?: unknown

    /**
     * @description Last Update Date
     * @example "2021-03-17"
     */
    lastUpdateV2?: string
    lastUpdateIsekaiV2?: string

    databaseV2?: LocalDatabaseVersion2
    databaseIsekaiV2?: LocalDatabaseVersion2

    /** Isekai Level used to determine if isekai has been reset */
    isekaiLevel?: number
    /** Timestamp of last recorded isekai reset date */
    lastIsekaiReset?: number

    /** MonsterInfoBox position */
    monsterInfoBoxPosition?: { x: number, y: number }

    /** @deprecated - Monster ID Map. Monster ID are shared in both persistent and isekai */
    monsterIdMap?: {
      [key: string]: number
    }
  }

  export type MonsterMatcher = ((monsterInfo: MonsterInfo) => boolean) | RegExp;
}

export interface ISettings {
  debug: boolean,
  scanExpireDays: number,
  scanHighlightColor: string | boolean,
  showMonsterInfoBox: boolean,
  compactMonsterInfoBox: boolean,
  highlightMonster: {
    [key: string]: HVMonsterDatabase.MonsterMatcher
  } | false,
  darkMode: boolean
}
