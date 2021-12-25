import { MONSTER_INFO_BOX_POSITION } from './store';
import styles from '../style/style.module.css';

import { HVMonsterDatabase } from '../types';

/** @jsxImportSource million */

export function createMonsterInfoBox() {
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
  // A fix to prevent the info box being drag into outer window
  const { width: screenWidth, height: screenHeight } = window.screen;

  let left = MONSTER_INFO_BOX_POSITION.x;
  let top = MONSTER_INFO_BOX_POSITION.y;
  if (left > screenWidth - 120) {
    left = screenWidth - 120;
  } else if (left < 0) {
    left = 0;
  }
  if (top > screenHeight - 590) {
    top = screenHeight - 590;
  } else if (top < 0) {
    top = 0;
  }
  boxEl.style.left = `${left}px`;
  boxEl.style.top = `${top}px`;

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
const padStr = (num?: number) => {
  if (typeof num !== 'number') return '';
  return String(num).padStart(2, ' ');
};
// eslint-disable-next-line no-nested-ternary
const symbolNum = (num?: number) => num ? (num === 0 ? ' ' : num > 0 ? '+' : '') : '';

const MonsterTable = (props: { monsterInfo?: HVMonsterDatabase.MonsterInfo }) => (
  <div className={styles.table_container}>
    <table className={[styles.table, props.monsterInfo ? false : styles.hidden].filter(Boolean).join(' ')}>
      <tbody>
        <tr>
          {isCompactMonsterInfoBox && (['fire', 'cold', 'elec'] as const).map(i => {
            const text = `${i[0]}:${symbolNum(props.monsterInfo?.[i])}${padStr(props.monsterInfo?.[i])}`;
            return (
              <td className={styles[i]}>{text}</td>
            );
          })}
          <td>
            {props.monsterInfo?.monsterClass?.toLocaleLowerCase()?.substring(0, 5)}
            ({props.monsterInfo?.attack?.toLocaleLowerCase()?.substring(0, 4)})
          </td>
        </tr>
        <tr>
          {isCompactMonsterInfoBox && (['wind', 'holy', 'dark'] as const).map(i => {
            const text = `${i[0]}:${symbolNum(props.monsterInfo?.[i])}${padStr(props.monsterInfo?.[i])}`;
            return (
              <td className={styles[i]}>{text}</td>
            );
          })}
          <td>
            PL: {props.monsterInfo?.plvl}
          </td>
        </tr>
        <tr>
          {isCompactMonsterInfoBox && (['crushing', 'slashing', 'piercing'] as const).map(i => {
            const text = `${i[0]}:${symbolNum(props.monsterInfo?.[i])}${padStr(props.monsterInfo?.[i])}`;
            return (
              <td>{text}</td>
            );
          })}
          <td>
            {props.monsterInfo?.trainer === '' ? 'System' : props.monsterInfo?.trainer}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);

export function MonsterInfo(allMonsterStatus: (HVMonsterDatabase.MonsterInfo | null)[]) {
  return (
    <div>{/* Million doesn't support root VNode to be a Fragment, see https://github.com/aidenybai/million/issues/160 */}
      {
        /* Provide all 10 MonsterTable and only toggle their display property, significantly improve virtual dom performance */
        [...Array(10).keys()].map(i => <MonsterTable monsterInfo={allMonsterStatus[i] ?? undefined} />)
      }
    </div>
  );
};

function makeMonsterInfoBoxDraggable(boxEl: HTMLDivElement, headerEl: HTMLDivElement): void {
  headerEl.addEventListener('mousedown', evt => {
    // Only respond to left click
    if (evt.buttons === 1) {
      // flag for if box being dragged, used to avoid some race condition
      let MOVE_FLAG = true;
      let rAFId: number;

      const shiftX = evt.clientX - boxEl.getBoundingClientRect().left;
      const shiftY = evt.clientY - boxEl.getBoundingClientRect().top;

      const moveTo = (pageX: number, pageY: number) => {
        // Always read innerHeight and innerWidth in realtime in case the browser window is resized
        const winHeight = window.innerHeight;
        const winWidth = window.innerWidth;

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
          if (rAFId) {
            // clear previous rAF
            window.cancelAnimationFrame(rAFId);
          }
          rAFId = window.requestAnimationFrame(() => {
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
