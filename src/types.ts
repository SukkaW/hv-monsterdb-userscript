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

  export interface LocalDatabase {
    [key: string]: EncodedMonsterDatabase.MonsterInfo
  }

  export interface StoredValue {
    /**
     * @description Last Update Date
     * @example "2021-03-17"
     */
    lastUpdate?: string
    /** Local Monsterbase */
    database?: LocalDatabase
    /** Local Isekai Monsterbase */
    databaseIsekai?: LocalDatabase

    /** MonsterInfoBox position */
    monsterInfoBoxPosition?: { x: number, y: number }

    /**
     * @description Monster ID Map. Monster ID are shared in both persistent and isekai
     */
    monsterIdMap?: {
      [key: string]: number
    }
    /**
     * @description Queue scan results and only submit them out of battle
     */
    monsterScansSubmitQueue?: MonsterInfo[]
  }
}

export interface ISettings {
  debug: boolean,
  scanExpireDays: number,
  scanHighlightColor: string | boolean,
  showMonsterInfoBox: boolean
}
