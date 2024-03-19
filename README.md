# HentaiVerse Monster Database UserScript

A HentaiVerse in-battle userscript that displays monster information from the rebuilt hentaiVerse monster database.

![npm](https://img.shields.io/npm/v/hv-monsterdb-userscript?style=flat-square) [![GitHub license](https://img.shields.io/github/license/SukkaW/hv-monsterdb-userscript?style=flat-square)](https://github.com/SukkaW/hv-monsterdb-userscript/blob/master/LICENSE) [![GitHub Workflow Status](https://img.shields.io/github/workflow/status/sukkaw/hv-monsterdb-userscript/Test?label=GitHub%20Action&style=flat-square)](https://github.com/SukkaW/hv-monsterdb-userscript/actions/workflows/test.yml)

## Download

Download the script from [UNPKG](https://unpkg.com/browse/hv-monsterdb-userscript@latest/dist/):

- `hv-monsterdb.es2020.user.js` (Recommended for better performance): Only compatible with latest modern browsers.
- `hv-monsterdb.es5.user.js`: Compatible with old browsers as well.

> You can also download the "nightly" build from [GitHub Action](https://github.com/SukkaW/hv-monsterdb-userscript/actions).

## Installation

Install the script to your UserScript Manager.

> Recommended Browser:
> - Firefox
> - Chrome or Chromium based browsers (Brave, Vivaldi, Edge, etc.)
>
> Recommended UserScript Manager:
> - Tampermonkey
> - Violentmonkey
> - Greasemonkey

## Usage

There is nothing else you need to do! The script will handle everything for you!

- The script will update the local database from the server once a day, typically at the `Dawn of a New Day` and out of the battle.
- During the battle, the script will automatically show monster information on the page. All information comes from the local database, with no request to the server involved.
- Every time you scan a monster, the script will automatically parse Battle Log, update the local database, and send the scan result to the server.

> Please be aware that because the database is used for public purposes and because you probably appreciate seeing your own monsters appearing in it, it is everyone's duty to keep the monster database up to date by scanning them during battles (while using the script). If you intend to use the database without feeding it yourself, well... shame on you.

## API

If you are a script writer or an advanced player, you might be interested in the [API Documents](https://suka.js.org/hv-monsterdb-userscript/).

## Build

```bash
git clone https://github.com/sukkaw/hv-monsterdb-userscript && cd hv-monsterdb-userscript
npm i
npm run build
```

## Author

**HentaiVerse Monster Database UserScript** © [Sukka](https://github.com/SukkaW), Released under the [MIT](./LICENSE) License.<br>
Authored and maintained by Sukka with help from contributors ([list](https://github.com/SukkaW/hv-monsterdb-userscript/graphs/contributors)).

> [Personal Website](https://skk.moe) · [Blog](https://blog.skk.moe) · GitHub [@SukkaW](https://github.com/SukkaW) · Telegram Channel [@SukkaChannel](https://t.me/SukkaChannel) · Twitter [@isukkaw](https://twitter.com/isukkaw) · Keybase [@sukka](https://keybase.io/sukka)

<p align="center">
  <a href="https://github.com/sponsors/SukkaW/">
    <img src="https://sponsor.cdn.skk.moe/sponsors.svg"/>
  </a>
</p>
