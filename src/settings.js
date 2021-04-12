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
   */
  scanExpireDays: 31,
  /**
   * Scan Highlight Color
   *
   * Expired monsters will be highlighted
   * Set to "false" (without quote) will disable the highlight.
   */
  scanHighlightColor: 'coral',
  /**
   * Monster Info Box
   *
   * Monster Database Script provides a draggable info box during battle. If you don't
   * like the ui, you can disable it here.
   */
  showMonsterInfoBox: true
};
// ============= ^^^ SETTINGS ^^^ =============
/* If you want to make some modifications, it is recommeneded to build your own script from
 * the source code. The source code is released on GitHub under MIT License:
 * https://github.com/SukkaW/hv-monsterdb-userscript
 */
// -+-+ DO NOT EDIT THE CODE BELOW THE LINE BY HAND +-+-
