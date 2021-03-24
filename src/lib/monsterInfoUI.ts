import { HVMonsterDatabase } from '../types';
import { addStyle } from '../util/common';
import { MONSTER_INFO_BOX_POSITION } from './store';

const monsterInfoBoxStyle = `
#monsterdb_info {
  position: absolute;
  z-index: 3;
  border: 2px solid #5c0d11;
  background-color: #eeece1;
  width: 175px;
  height: 590px;
  opacity: 1;
}

#monsterdb_monsterInfo.drag {
  opacity: 0.6;
  border-style: dashed;
}

#monsterdb_info .monsterdb_header {
  cursor: move;
  height: 20px;
  text-align: center;
  background-color: #e5e2d5;
  line-height: 20px;
  font-weight: 600;
  border-bottom: 2px solid #5c0d11;
}

.monsterdb_table_container {
  height: 57.7px;
  font-weight: bold;
  font-family: Consolas,Monaco,SFMono-Regular,Andale Mono,Liberation Mono,Ubuntu Mono,Menlo,monospace;
}

.monsterdb_table_container .notify {
  font-size: 20px;
  color: red;
  line-height: 56px;
}

.monsterdb_table {
  line-height: 1;
  font-size: 12px;
  letter-spacing: -1px;
  border-spacing: 0;
  border-collapse: collapse;
  width: 100%;
  height: 100%;
}

.monsterdb_table td { padding: 0 1px; border: 1px solid #5c0d11; }
.monsterdb_table .fire { color: red }
.monsterdb_table .cold { color: blue }
.monsterdb_table .elec { color: mediumpurple }
.monsterdb_table .wind { color: limegreen }
.monsterdb_table .holy { color: rosybrown }
.monsterdb_table .dark { color: black }
`;

export function createMonsterInfoBox(): void {
  // Monsterbation tends to completely wipe out DOM when changing round
  // However we still have to make sure the info box won't be added again & again
  if (document.getElementById('monsterdb_info')) return;

  addStyle(monsterInfoBoxStyle);

  const boxEl = document.createElement('div');
  boxEl.id = 'monsterdb_info';
  // Use saved position information
  boxEl.style.left = `${MONSTER_INFO_BOX_POSITION.x}px`;
  boxEl.style.top = `${MONSTER_INFO_BOX_POSITION.y}px`;

  const headerEl = boxEl.appendChild(document.createElement('div'));
  headerEl.className = 'monsterdb_header';
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
  tableContainerEl.className = 'monsterdb_table_container';

  if (monsterInfo) {
    const tableEl = tableContainerEl.appendChild(document.createElement('table'));
    tableEl.className = 'monsterdb_table';
    tableEl.appendChild(document.createElement('tbody')).innerHTML = `
    <tr>
      <td class="fire">f:${symbolNum(monsterInfo.fire)}${padStr(monsterInfo.fire)}</td>
      <td class="cold">c:${symbolNum(monsterInfo.cold)}${padStr(monsterInfo.cold)}</td>
      <td class="elec">e:${symbolNum(monsterInfo.elec)}${padStr(monsterInfo.elec)}</td>
      <td>${monsterInfo.monsterClass?.toLocaleLowerCase()?.substring(0, 5)}(${monsterInfo.attack?.toLocaleLowerCase()?.substring(0, 4)})</td>
    </tr>
    <tr>
      <td class="wind">w:${symbolNum(monsterInfo.wind)}${padStr(monsterInfo.wind)}</td>
      <td class="holy">h:${symbolNum(monsterInfo.holy)}${padStr(monsterInfo.holy)}</td>
      <td class="dark">d:${symbolNum(monsterInfo.dark)}${padStr(monsterInfo.dark)}</td>
      <td>PL: ${monsterInfo.plvl}</td>
    </tr>
    <tr>
      <td>C:${symbolNum(monsterInfo.crushing)}${padStr(monsterInfo.crushing)}</td>
      <td>S:${symbolNum(monsterInfo.slashing)}${padStr(monsterInfo.slashing)}</td>
      <td>P:${symbolNum(monsterInfo.piercing)}${padStr(monsterInfo.piercing)}</td>
      <td>${monsterInfo.trainer.substring(0, 11)}</td>
    </tr>`;
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
            boxEl.classList.add('drag');
            moveTo(evt.pageX, evt.pageY);
          });
        }
      };

      const onReleaseMouse = () => {
        MOVE_FLAG = false;
        document.removeEventListener('mousemove', onMouseMove);
        headerEl.removeEventListener('mouseup', onReleaseMouse);
        window.removeEventListener('blur', onReleaseMouse);
        boxEl.classList.remove('drag');
      };

      document.addEventListener('mousemove', onMouseMove);
      headerEl.addEventListener('mouseup', onReleaseMouse);
      window.addEventListener('blur', onReleaseMouse);
    }
  });
}
