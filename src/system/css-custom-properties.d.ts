import "react";

// CSS custom properties are valid inline styles (React passes `--*` keys
// through verbatim), so `style={{ "--i": 3 }}` needs no type assertion.
declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}
