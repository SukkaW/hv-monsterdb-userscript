// ============= vvv SETTINGS vvv =============
const SETTINGS = {
  /**
   * Debug
   *
   * true - enable verbose output in console, and access to debug method
   * false - disable verbose output in console (default)
   */
  debug: false,
  /**
   * Scan Expire Date
   *
   * Monsters that haven't been scanned in this number of days will be considered expired.
   * In the Isekai, monsters will only expire once per season.
   */
  scanExpireDays: 45,
  /**
   * Scan Highlight Color
   *
   * Highlight expired monsters (haven't been scanned in "scanExpireDays").
   * Set to "false" (without quote) will disable the expired highlight feature.
   *
   * (In order to be compatible with Monsterbation's "monsterKeyword", only monster letters part will be highlighted)
   */
  scanHighlightColor: 'coral',
  /**
   * Monster Info Box
   *
   * Monster Database Script provides a draggable float box during battle. If you don't
   * like the ui, you can disable it here.
   */
  showMonsterInfoBox: true,
  /**
   * Compact Monster Info Box
   *
   * true - only show trainer, PL, monster class in the float box, mitigation data will be hidden
   * false - show all mitigation data along with trainer, PL, monster class in the float box (default)
   */
  compactMonsterInfoBox: false,
  /**
   * Highlight Monster
   *
   * Similar to Monsterbation's "monsterKeyword" feature, highlight monsters where the name, id, class, attack matches.
   * (In order to be compatible with Monsterbation's "monsterKeyword", only monster letters part will be highlighted)
   *
   * The configuration accepts an object. The key of the object accepts the color, supports any valid CSS color.
   * The value of the object accepts a RegExp (same syntax as Monsterbation 1.3.2.1) or a function that returns boolean value.
   */
  highlightMonster: {
    /* This matches monsters whose trainer is Noni */
    // '#66ccff': /"trainer":"Noni"/,

    /**
     * This matches monsters
     * whose name (or whose trainer name) contains Meiling,
     * OR whose PL is 2250,
     * OR whose monster id is 70699,
     * OR whose monster class is Undead AND attack type is Crushing
     */
    // 'red': /(Meiling|"plvl":2250|"monsterId":70699|Undead.*Crushing)/

    /**
     * If you are an advanced player who can write javascript, I promise you will love this
     *
     * You can find the type definition of monsterInfo here:
     * https://suka.js.org/hv-monsterdb-userscript/interfaces/hvmonsterdatabase.monsterinfo.html
     */
    // 'rgb(28, 46, 69)': (monsterInfo) => {
    //   if (monsterInfo.monsterName.includes('Meiling')) return true;
    //   if (monsterInfo.plvl > 1700) return true;
    //   if (monsterInfo.monsterClass !== 'Giant') return true;
    //   if (monsterInfo.attack === 'Piercing' || monsterInfo.attack === 'Crushing') return true;
    //   return false
    // }
  },
  /**
   * Dark Mode
   *
   * Made by @raraha (https://forums.e-hentai.org/index.php?showuser=4071895)
   * Enable Dark theme for the Monster Info Box
   */
  darkMode: false
};
// ============= ^^^ SETTINGS ^^^ =============
/*
 * The code below is generated by TypeScript Compiler (http://npm.im/typescript) and Rollup Bundler (https://rollupjs.org/guide/en/)
 * If you want to make some modifications, it is recommeneded to build your own script from the source code. The source code is
 * released on GitHub under MIT License: https://github.com/SukkaW/hv-monsterdb-userscript
 */
// -+-+-+ DO NOT EDIT THE CODE BELOW THE LINE BY HAND +-+-+-
