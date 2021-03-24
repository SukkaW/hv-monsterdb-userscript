/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
const nameStyle = 'background: #000; color: #fff';
const debugStyle = 'background: #7a7a7a; color: #fff';
const infoStyle = 'background: #257942; color: #fff';
const warnStyle = 'background: #947600; color: #fff';
const errorStyle = 'background: #cc0f35; color: #fff';
const msgStyle = 'background: transparent; color: #000';

class Logger {
  private DEBUG = false;

  setDebugMode(debugMode = false) {
    this.DEBUG = debugMode;
  }

  debug(...msg: any[]): void {
    if (this.DEBUG) {
      console.log('%c HVMDB %c DEBUG %c', nameStyle, debugStyle, msgStyle, ...msg);
    }
  }

  info(...msg: any[]): void {
    if (this.DEBUG) {
      console.info('%c HVMDB %c INFO %c', nameStyle, infoStyle, msgStyle, ...msg);
    }
  }

  warn(...msg: any[]): void {
    if (this.DEBUG) {
      console.warn('%c HVMDB %c WARN %c', nameStyle, warnStyle, msgStyle, ...msg);
    }
  }

  error(...msg: any[]): void {
    if (this.DEBUG) {
      console.error('%c HVMDB %c ERROR %c', nameStyle, errorStyle, msgStyle, ...msg);
    }
  }
}

export const logger = new Logger();
