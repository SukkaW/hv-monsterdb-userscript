import { HVMonsterDatabase } from '../types';
import { MONSTER_INFO_BOX_POSITION } from './store';
import styles from '../style/style.module.css';

export function createMonsterInfoBox(): void {
  // Monsterbation tends to completely wipe out DOM when changing round
  // However we still have to make sure the info box won't be added again & again
  if (document.getElementById('monsterdb_info')) return;

  const boxEl = document.createElement('div');
  boxEl.id = 'monsterdb_info';
  boxEl.className = styles.monsterdb_info;

  // Use saved position information
  boxEl.style.left = `${MONSTER_INFO_BOX_POSITION.x}px`;
  boxEl.style.top = `${MONSTER_INFO_BOX_POSITION.y}px`;

  const headerEl = boxEl.appendChild(document.createElement('div'));
  headerEl.classList.add(styles.header);
  if (SETTINGS.compactMonsterInfoBox) {
    headerEl.classList.add(styles.compact);
  }
  headerEl.textContent = 'drag\'n\'drop';

  const containerEl = document.createElement('div');
  containerEl.id = 'monsterdb_container';
  boxEl.appendChild(containerEl);

  document.body.appendChild(boxEl);
  makeMonsterInfoBoxDraggable(boxEl, headerEl);
}

export function makeMonsterInfoTable(monsterInfo?: HVMonsterDatabase.MonsterInfo | null): HTMLDivElement {
  const padStr = (num: number) => String(num).padStart(2, ' ');
  // eslint-disable-next-line no-nested-ternary
  const symbolNum = (num: number) => (num === 0 ? ' ' : num > 0 ? '+' : '');
  const tableContainerEl = document.createElement('div');
  tableContainerEl.className = styles.table_container;

  if (monsterInfo) {
    const tableEl = tableContainerEl.appendChild(document.createElement('table'));
    tableEl.className = styles.table; // 'monsterdb_table';

    let tableHtml = '';
    tableHtml += '<tr>';
    if (!SETTINGS.compactMonsterInfoBox) {
      tableHtml += `
      <td class="${styles.fire}">f:${symbolNum(monsterInfo.fire)}${padStr(monsterInfo.fire)}</td>
      <td class="${styles.cold}">c:${symbolNum(monsterInfo.cold)}${padStr(monsterInfo.cold)}</td>
      <td class="${styles.elec}">e:${symbolNum(monsterInfo.elec)}${padStr(monsterInfo.elec)}</td>`;
    }
    tableHtml += `<td>${monsterInfo.monsterClass?.toLocaleLowerCase()?.substring(0, 5)}(${monsterInfo.attack?.toLocaleLowerCase()?.substring(0, 4)})</td>`;
    tableHtml += '</tr><tr>';
    if (!SETTINGS.compactMonsterInfoBox) {
      tableHtml += `
      <td class="${styles.wind}">w:${symbolNum(monsterInfo.wind)}${padStr(monsterInfo.wind)}</td>
      <td class="${styles.holy}">h:${symbolNum(monsterInfo.holy)}${padStr(monsterInfo.holy)}</td>
      <td class="${styles.dark}">d:${symbolNum(monsterInfo.dark)}${padStr(monsterInfo.dark)}</td>`;
    }
    tableHtml += `<td>PL: ${monsterInfo.plvl}</td>`;
    tableHtml += '</tr><tr>';
    if (!SETTINGS.compactMonsterInfoBox) {
      tableHtml += `
      <td>C:${symbolNum(monsterInfo.crushing)}${padStr(monsterInfo.crushing)}</td>
      <td>S:${symbolNum(monsterInfo.slashing)}${padStr(monsterInfo.slashing)}</td>
      <td>P:${symbolNum(monsterInfo.piercing)}${padStr(monsterInfo.piercing)}</td>`;
    }
    const cuttedTrainerName = monsterInfo.trainer.substring(0, 11);
    tableHtml += `<td>${cuttedTrainerName === '' ? 'System' : cuttedTrainerName}</td>`;
    tableHtml += '</tr>';

    tableEl.appendChild(document.createElement('tbody')).innerHTML = tableHtml;
  }

  return tableContainerEl;
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
