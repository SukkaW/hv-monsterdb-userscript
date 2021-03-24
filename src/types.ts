export namespace HVMonsterDatabase {
  export type MonsterClass = 'Arthropod' | 'Avion' | 'Beast' | 'Celestial' | 'Daimon' | 'Dragonkin' | 'Elemental' | 'Giant' | 'Humanoid' | 'Mechanoid' | 'Reptilian' | 'Sprite' | 'Undead' | 'Rare' | 'Legendary' | 'Ultimate';
  export type MonsterAttack = 'Piercing' | 'Crushing' | 'Slashing' | 'Fire' | 'Cold' | 'Wind' | 'Elec' | 'Holy' | 'Dark' | 'Void';

  export interface MonsterInfo {
    monsterId: number
    monsterClass: MonsterClass
    monsterName: string
    /**
     * @description - PL
     */
    plvl: number
    /**
     * @description - Attack Mode
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
     * @description - Last time update (can be parsed through Date)
     */
    lastUpdate: string
  }

  /**
   * @description - Simplified data for saving storage and memory
   */
  export namespace Encoder {
    export const kMonsterClass = {
      a: 'Arthropod',
      av: 'Avion',
      b: 'Beast',
      c: 'Celestial',
      da: 'Daimon',
      d: 'Dragonkin',
      e: 'Elemental',
      g: 'Giant',
      h: 'Humanoid',
      m: 'Mechanoid',
      r: 'Reptilian',
      s: 'Sprite',
      u: 'Undead',
      ra: 'Rare',
      l: 'Legendary',
      ul: 'Ultimate'
    } as const;

    export const IMonsterClass = {
      Arthropod: 'a',
      Avion: 'av',
      Beast: 'b',
      Celestial: 'c',
      Daimon: 'da',
      Dragonkin: 'd',
      Elemental: 'e',
      Giant: 'g',
      Humanoid: 'h',
      Mechanoid: 'm',
      Reptilian: 'r',
      Sprite: 's',
      Undead: 'u',
      Rare: 'ra',
      Legendary: 'l',
      Ultimate: 'ul'
    } as const;

    export const kMonsterAttack = {
      p: 'Piercing',
      c: 'Crushing',
      s: 'Slashing',
      f: 'Fire',
      co: 'Cold',
      w: 'Wind',
      e: 'Elec',
      h: 'Holy',
      d: 'Dark',
      v: 'Void'
    } as const;

    export const IMonsterAttack = {
      Piercing: 'p',
      Crushing: 'c',
      Slashing: 's',
      Fire: 'f',
      Cold: 'co',
      Wind: 'w',
      Elec: 'e',
      Holy: 'h',
      Dark: 'd',
      Void: 'v'
    } as const;
  }

  export interface EncodedMonsterInfo {
    /** Monster ID */
    id: number
    /** Monster Class */
    cl: keyof typeof Encoder.kMonsterClass
    /** Monster PL */
    pl: number
    /** Attack Mode */
    a: keyof typeof Encoder.kMonsterAttack
    /** Trainer */
    tr: string
    /** Piercing */
    p: number
    /** Crushing */
    c: number
    /** Slashing */
    s: number
    /** Cold */
    co: number
    /** Wind */
    w: number
    /** Elec */
    e: number
    /** Fire */
    f: number
    /** Dark */
    d: number
    /** Holy */
    h: number
    /**
     * @description - Last time update timestamp
     */
    l: number
  }

  export interface LocalDatabase {
    [key: string]: EncodedMonsterInfo
  }

  export interface StoredValue {
    /**
     * @description - Last Update Date
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
     * @description - Monster ID Map. Monster ID are shared in both persistent and isekai
     */
    monsterIdMap?: {
      [key: string]: number
    }
    /**
     * @description - Queue scan results and only submit them out of battle
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
