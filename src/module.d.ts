declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
declare function GM_notification(
  text: string,
  title: string,
  image?: string,
  onClick?: () => void
): void;
