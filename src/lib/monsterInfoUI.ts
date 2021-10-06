import { MONSTER_INFO_BOX_POSITION } from './store';
import styles from '../style/style.module.css';
import { m, VElement } from 'million';

import type { MonsterStatus } from './monster';

export function createMonsterInfoBox(): void {
  // Monsterbation tends to completely wipe out DOM when changing round
  // However we still have to make sure the info box won't be added again & again
  if (document.getElementById('monsterdb_info')) return;

  const boxEl = document.createElement('div');
  boxEl.id = 'monsterdb_info';
  boxEl.classList.add(styles.monsterdb_info);

  if (SETTINGS.darkMode) {
    boxEl.classList.add(styles.monsterdb_dark);
  }

  // Use saved position information
  boxEl.style.left = `${MONSTER_INFO_BOX_POSITION.x}px`;
  boxEl.style.top = `${MONSTER_INFO_BOX_POSITION.y}px`;

  const headerEl = boxEl.appendChild(document.createElement('div'));
  headerEl.classList.add(styles.header);
  if (SETTINGS.compactMonsterInfoBox) {
    boxEl.classList.add(styles.compact);
  }
  headerEl.textContent = 'drag\'n\'drop';

  const containerEl = document.createElement('div');
  containerEl.id = 'monsterdb_container';
  boxEl.appendChild(containerEl);

  document.body.appendChild(boxEl);
  makeMonsterInfoBoxDraggable(boxEl, headerEl);
}

const isCompactMonsterInfoBox = !SETTINGS.compactMonsterInfoBox;
const padStr = (num: number) => String(num).padStart(2, ' ');
// eslint-disable-next-line no-nested-ternary
const symbolNum = (num: number) => (num === 0 ? ' ' : num > 0 ? '+' : '');

export function monsterInfoVirtualNodeFactory(allMonsterStatus: MonsterStatus[]): VElement {
  return m('div', {}, allMonsterStatus.map(({ info: monsterInfo }) => m('div', {
    className: styles.table_container
  }, [
    monsterInfo
      ? m('table', {
        className: styles.table
      }, [
        m('tbody', {}, [
          m('tr', {}, (isCompactMonsterInfoBox
            ? (['fire', 'cold', 'elec'] as const).map(i => m('td', {
              className: styles[i]
            }, [`${i[0]}:${symbolNum(monsterInfo[i])}${padStr(monsterInfo[i])}`]))
            : []
          ).concat([
            m('td', {}, [`${monsterInfo.monsterClass?.toLocaleLowerCase()?.substring(0, 5)}(${monsterInfo.attack?.toLocaleLowerCase()?.substring(0, 4)})`])
          ])),
          m('tr', {}, (isCompactMonsterInfoBox
            ? (['wind', 'holy', 'dark'] as const).map(i => m('td', {
              className: styles[i]
            }, [`${i[0]}:${symbolNum(monsterInfo[i])}${padStr(monsterInfo[i])}`]))
            : []
          ).concat([
            m('td', {}, [`PL: ${monsterInfo.plvl}`])
          ])),
          m('tr', {}, (isCompactMonsterInfoBox
            ? (['crushing', 'slashing', 'piercing'] as const).map(i => m('td', {}, [`${i[0]}:${symbolNum(monsterInfo[i])}${padStr(monsterInfo[i])}`]))
            : []
          ).concat([
            m('td', {}, [`${monsterInfo.trainer === '' ? 'System' : monsterInfo.trainer}`])
          ]))
        ])
      ])
      : ''
  ])));
}

function makeMonsterInfoBoxDraggable(boxEl: HTMLDivElement, headerEl: HTMLDivElement): void {
  headerEl.addEventListener('mousedown', evt => {
    // Only respond to left click
    if (evt.buttons === 1) {
      const winHeight = window.innerHeight;
      const winWidth = window.innerWidth;

      let MOVE_FLAG = true;

      const shiftX = evt.clientX - boxEl.getBoundingClientRect().left;
      const shiftY = evt.clientY - boxEl.getBoundingClientRect().top;

      const moveTo = (pageX: number, pageY: number) => {
        let left = pageX - shiftX;
        if (left > winWidth - 120) {
          left = winWidth - 120;
        } else if (left < 0) {
          left = 0;
        }
        let top = pageY - shiftY;
        if (top > winHeight - 590) {
          top = winHeight - 590;
        } else if (top < 0) {
          top = 0;
        }

        boxEl.style.left = `${left}px`;
        MONSTER_INFO_BOX_POSITION.x = left;
        boxEl.style.top = `${top}px`;
        MONSTER_INFO_BOX_POSITION.y = top;
      };
      // Use window.requestAnimationFrame instead of throttle for better performance
      const onMouseMove = (evt: MouseEvent) => {
        if (MOVE_FLAG) {
          window.requestAnimationFrame(() => {
            boxEl.classList.add(styles.drag);
            moveTo(evt.pageX, evt.pageY);
          });
        }
      };

      const onReleaseMouse = () => {
        MOVE_FLAG = false;
        document.removeEventListener('mousemove', onMouseMove);
        headerEl.removeEventListener('mouseup', onReleaseMouse);
        window.removeEventListener('blur', onReleaseMouse);
        boxEl.classList.remove(styles.drag);
      };

      document.addEventListener('mousemove', onMouseMove);
      headerEl.addEventListener('mouseup', onReleaseMouse);
      window.addEventListener('blur', onReleaseMouse);
    }
  });
}
