// Notes: where each stands beside its point, and the numbered discs.
import { describe, expect, it } from "vitest";

import { DISC_R, placeDiscs, placeNotes } from "../src/charts/note-layout";
import type { NoteRoom } from "../src/charts/note-layout";

/** A line that runs flat, then climbs steeply to the right of x = 200. */
const line = [
  { x: 0, y: 150 },
  { x: 200, y: 150 },
  { x: 220, y: 20 },
  { x: 400, y: 10 },
];

const room: NoteRoom = { bottom: 240, line, top: 0, x0: 0, x1: 400 };

describe("note placement", () => {
  it("goes below a point whose line runs high, off to the right", () => {
    // The point sits at the foot of a climb: above and to the right is the line.
    const [note] = placeNotes(
      [{ label: "Price change", x: 200, y: 150 }],
      room
    );

    expect(note.side).toBe("below");
  });

  it("goes above a point on a flat stretch with room over it", () => {
    const [note] = placeNotes([{ label: "Flat", x: 60, y: 150 }], room);
    expect(note.side).toBe("above");
    expect(note.anchor).toBe("start");
  });

  it("ends its words at the leader near the right edge", () => {
    const [note] = placeNotes(
      [{ detail: "A long second line", label: "Edge", x: 390, y: 200 }],
      room
    );

    expect(note.anchor).toBe("end");
  });

  it("stays inside the plot", () => {
    const [note] = placeNotes([{ label: "Edge", x: 395, y: 8 }], room);
    expect(note.side).toBe("below");
  });

  it("keeps two close notes off each other", () => {
    const [a, b] = placeNotes(
      [
        { detail: "First second line", label: "First", x: 40, y: 150 },
        { detail: "Second second line", label: "Second", x: 60, y: 150 },
      ],
      room
    );

    expect(`${a.side}-${a.anchor}`).not.toBe(`${b.side}-${b.anchor}`);
  });

  it("numbers the notes from 1 in the order given", () => {
    const out = placeNotes(
      [
        { label: "a", x: 10, y: 150 },
        { label: "b", x: 100, y: 150 },
      ],
      room
    );

    expect(out.map((n) => n.n)).toStrictEqual([1, 2]);
  });
});

describe("numbered discs", () => {
  it("puts a disc clear of the line, above when both sides are free", () => {
    const [disc] = placeDiscs([{ label: "a", x: 60, y: 150 }], room);
    expect(disc.cy).toBeLessThan(150);
    expect(150 - disc.cy).toBeGreaterThan(DISC_R);
  });

  it("flips a disc below when above is off the plot", () => {
    const [disc] = placeDiscs([{ label: "a", x: 60, y: 6 }], room);
    expect(disc.cy).toBeGreaterThan(6);
  });

  it("moves a second disc off the first", () => {
    const [a, b] = placeDiscs(
      [
        { label: "a", x: 60, y: 150 },
        { label: "b", x: 66, y: 150 },
      ],
      room
    );

    expect(b.cy).not.toBe(a.cy);
  });
});
