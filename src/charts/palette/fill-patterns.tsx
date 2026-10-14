import { FILL_FAMILIES, FILL_LADDERS, toneClass } from "../fills";
import {
  Beads,
  CrossHatch,
  DotScreen,
  Hatch,
  Rules,
  Stipple,
} from "../texture";

type Family = (typeof FILL_FAMILIES)[number];
type Ladder = (typeof FILL_LADDERS)[number];

/** One engraved pattern for a family in a tone. */
const FamilyPattern = (props: { family: Family; id: string; tone: string }) => {
  const common = { ground: "fill-paper", id: props.id, tone: props.tone };
  const { family } = props;
  if (family.id === "hatch") {
    return <Hatch {...common} pitch={family.pitch} />;
  }
  if (family.id === "cross") {
    return <CrossHatch {...common} pitch={family.pitch} />;
  }
  if (family.id === "rules" || family.id === "upright") {
    return (
      <Rules
        {...common}
        angle={family.id === "rules" ? "level" : "upright"}
        pitch={family.pitch}
      />
    );
  }
  if (family.id === "stipple" || family.id === "dense") {
    return <Stipple {...common} pitch={family.pitch} />;
  }
  if (family.id === "beads") {
    return <Beads {...common} pitch={family.pitch} />;
  }
  // Solid needs no pattern.
  return null;
};

/** One step of a value ladder in a tone. */
const LadderPattern = (props: {
  id: string;
  ladder: Ladder;
  step: Ladder["steps"][number];
  tone: string;
}) => {
  const common = { ground: "fill-paper", id: props.id, tone: props.tone };
  return props.ladder.id === "halftone" ? (
    <DotScreen {...common} pitch={props.step.pitch} r={props.step.r} />
  ) : (
    <Hatch {...common} pitch={props.step.pitch} />
  );
};

/**
 * Every pattern in the taxonomy, for the sheet's `<defs>`: families as
 * `${family}-${tone}`, ladder steps as `${ladder}-${tone}-${step}`.
 */
export const FillPatterns = (props: { id: (name: string) => string }) => (
  <defs>
    {FILL_FAMILIES.flatMap((family) =>
      family.tones.map((tone) => (
        <FamilyPattern
          family={family}
          id={props.id(`${family.id}-${tone}`)}
          key={`${family.id}-${tone}`}
          tone={toneClass(tone)}
        />
      ))
    )}
    {FILL_LADDERS.flatMap((ladder) =>
      ladder.tones.flatMap((tone) =>
        ladder.steps.map((step, k) => (
          <LadderPattern
            id={props.id(`${ladder.id}-${tone}-${k}`)}
            key={`${ladder.id}-${tone}-${step.pitch}-${step.r}`}
            ladder={ladder}
            step={step}
            tone={toneClass(tone)}
          />
        ))
      )
    )}
  </defs>
);
