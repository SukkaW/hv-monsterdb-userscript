## 2.0.0

A brand new version of the script!

- NOTICE: The script now drops the support for IE, Chrome <= 79, Firefox <= 60 (SeaMonkey is basically Firefox 64 so it is not affected), Safari <= 11
- The script is now compatible with the Pale Moon and SeaMonkey (you still have to use `es2016` version of the script)
- The script now perfectly supports GreaseMonkey 3, for those who are using Pale Moon / SeaMonkey which doesn't have the latest UserScript Manager available.
- The script now uses Browser's IndexedDB to store the monster data. It is slower, but it allows the script to perform "atomization" updates, which means less write to your disk, extending your precious SSD life span.
  - The script should do the migration automatically. If you encounter any issues, please report them to me.
- The old database server are fading away. I have completely rewritten the monster database server with brand new and much more lightweight architecture.
- Fixed a bug that the script will try to check if the Isekai has been reset even you are actually in the Persistent world.
- Fixed a bud that you can drag the floating information box out of your viewport. Now the information box will always stay in your viewport.
- Many performance improvements to keep your battle experience smooth. If you are interested in the technical details, here are the changes:
  * Uses a statement library to make the UI reactive, and to make sure only re-render the UI when the data actually changes
  * Rewritten UI in JSX, and use a brand new Virtual DOM library to further reduce the dom operations
  * Merge multiple async calls into `Promise.all`
  * Prefetching monster id from battle log whenever possible
  * Add more keywords to the encoding dictionary, to reduce the storage usage

## 1.2.0

- Change userscript `run-at` property to `document-idle` in order to fix some race condition caused by TamperMonkey & ViolentMonkey
- New feature `darkMode` which will use a dark theme for the float window.
- Some ui improvements made by @indefined.
- Fix the width of the float window when `compactMonsterInfoBox` is enabled.
- The script is now able to detect the Isekai has been reset or not. And monsters in the Isekai will expire only once per season.
- Some performance improvements:
  - Use virtual dom to minimize the dom operations
  - Fix some potential or rare memory leaks by preventing unnecessary object allocation

## 1.1.0

- New feature `highlightMonster` which will highlight monsters where the name, id, class, attack matches
- New feature `compactMonsterInfoBox`, which will hide mitigation data in float window (only show trainer, PL, monster class) when enabled.
- `scanExpireDays` configuration is now ignored in Isekai (Monster won't get update inside Isekai so there is no need to re-scan)
- Fix a bug that Isekai monster data collision with Persistent monster data.
- Fix the compatibility with Monsterbation's `ajaxRound` (Firefox + TamperMonkey is still not supported, seems to be a bug at TamperMonkey side, still investigating)
- Make some APIs avaliable out of battle
- Enhance compatibility with old versions of UserScript Managers (Add GreaseMonkey 4 API Polyfill)
- Reduce the size of `ES5` version (enable babel `loose` mode).

## 1.0.1

- `ES5` version of the script now has better compatibility with old browsers.

## 1.0.0

- The initial version.
