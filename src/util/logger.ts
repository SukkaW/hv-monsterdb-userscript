/* eslint-disable @typescript-eslint/no-explicit-any -- logger */
/* eslint-disable no-console -- logger */
const nameStyle = 'background: #000; color: #fff';
const debugStyle = 'background: #7a7a7a; color: #fff';
const infoStyle = 'background: #257942; color: #fff';
const warnStyle = 'background: #947600; color: #fff';
const errorStyle = 'background: #cc0f35; color: #fff';
// const msgStyle = 'background: transparent; color: #000';

class Logger {
  private DEBUG = false;

  setDebugMode(debugMode = false) {
    this.DEBUG = debugMode;
  }

  debug(...msg: any[]): void {
    if (this.DEBUG) {
      console.debug('%c HVMDB %c DEBUG', nameStyle, debugStyle, ...msg);
      console.groupCollapsed();
      console.trace();
      console.groupEnd();
    }
  }

  info(...msg: any[]): void {
    console.info('%c HVMDB %c INFO', nameStyle, infoStyle, ...msg);
    if (this.DEBUG) {
      console.groupCollapsed();
      console.trace();
      console.groupEnd();
    }
  }

  warn(...msg: any[]): void {
    console.warn('%c HVMDB %c WARN', nameStyle, warnStyle, ...msg);
    if (this.DEBUG) {
      console.groupCollapsed();
      console.trace();
      console.groupEnd();
    }
  }

  error(...msg: any[]): void {
    console.error('%c HVMDB %c ERROR', nameStyle, errorStyle, ...msg);
    if (this.DEBUG) {
      console.groupCollapsed();
      console.trace();
      console.groupEnd();
    }
  }
}

export const logger = new Logger();
