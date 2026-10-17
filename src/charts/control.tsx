import type { ReactNode } from "react";

interface ControlProps {
  children: ReactNode;
  className?: string;
  /** Accessible name when the visible text is not enough. */
  label?: string;
  onClick: () => void;
  /** Set for a toggle or one of a set of views; omit for a plain action. */
  pressed?: boolean;
}

const faceTone = (pressed: boolean | undefined) =>
  pressed === true
    ? "border-ink bg-ink text-paper"
    : "border-rule bg-paper text-text group-hover:border-faint";

/**
 * The one chart control: a 28px pill (sentence case, the label
 * role) inside a 44px-tall transparent hit area. Used for Play / Pause /
 * Replay / Live and for view pickers.
 */
export const Control = (props: ControlProps) => (
  <button
    type="button"
    aria-label={props.label}
    aria-pressed={props.pressed}
    onClick={() => {
      props.onClick();
    }}
    className={`group inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center border-0 bg-transparent p-0 focus-visible:outline-none ${props.className ?? ""}`}
  >
    <span
      className={`group-focus-visible:outline-muted text-tick inline-flex h-7 items-center gap-1.5 rounded-full border px-3 font-medium transition-colors group-focus-visible:outline-1 group-focus-visible:outline-offset-2 ${faceTone(props.pressed)}`}
    >
      {props.children}
    </span>
  </button>
);
