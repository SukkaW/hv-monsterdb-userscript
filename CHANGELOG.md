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
