import { useState } from "react";
import type { ComponentType, ReactNode } from "react";

import philosophy from "../../docs/PHILOSOPHY.md?raw";
import { Control } from "../charts/control";
import { EXAMPLES, exampleCode } from "../docs/examples";
import { propsOf } from "../docs/props";
import { DumbbellQueue } from "../entries/dumbbell-queue";
import { HairlineArea } from "../entries/hairline-area";
import { HairlineLine } from "../entries/hairline-line";
import { PlumbScatter } from "../entries/plumb-scatter";
import { RungBars } from "../entries/rung-bars";
import { Slope } from "../entries/slope";
import { getChart, registry } from "../schema/registry";
import type { ChartKind } from "../schema/registry";

// The docs live on their own routes (`#/docs`), never in the gallery grid.

/** The live example for each kind: the chart, given the example payload. */
const LIVE: Record<ChartKind, ComponentType<Record<string, unknown>>> = {
  "dumbbell-queue": DumbbellQueue as ComponentType<Record<string, unknown>>,
  "hairline-area": HairlineArea as ComponentType<Record<string, unknown>>,
  "hairline-line": HairlineLine as ComponentType<Record<string, unknown>>,
  "plumb-scatter": PlumbScatter as ComponentType<Record<string, unknown>>,
  "rung-bars": RungBars as ComponentType<Record<string, unknown>>,
  slope: Slope as ComponentType<Record<string, unknown>>,
};

const isKind = (kind: string): kind is ChartKind =>
  Object.hasOwn(EXAMPLES, kind);

const Page = (props: { children: ReactNode }) => (
  <main className="bg-paper grain mx-auto flex max-w-[760px] flex-col gap-10 px-6 py-10 md:px-10">
    {props.children}
  </main>
);

const Section = (props: { children: ReactNode; title: string }) => (
  <section className="border-rule flex flex-col gap-3 border-t pt-4">
    <h2 className="text-small text-text m-0 font-semibold">{props.title}</h2>
    {props.children}
  </section>
);

const Prose = (props: { children: ReactNode }) => (
  <p className="text-small text-muted m-0">{props.children}</p>
);

const CopyButton = (props: { text: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <Control
      label="Copy the example"
      onClick={() => {
        void navigator.clipboard.writeText(props.text).then(() => {
          setCopied(true);
        });
      }}
    >
      {copied ? "Copied" : "Copy"}
    </Control>
  );
};

const Code = (props: { code: string }) => (
  <div className="flex flex-col items-start gap-1">
    <pre className="border-rule text-small text-text m-0 w-full overflow-x-auto border p-4 font-mono">
      <code>{props.code}</code>
    </pre>
    <CopyButton text={props.code} />
  </div>
);

const PropsTable = (props: { kind: ChartKind }) => {
  const rows = propsOf(getChart(props.kind).schema);
  return (
    <div className="overflow-x-auto">
      <table className="text-small w-full border-collapse text-left">
        <thead>
          <tr className="border-rule text-muted border-b">
            <th className="py-2 pr-4 font-medium">Prop</th>
            <th className="py-2 pr-4 font-medium">Type</th>
            <th className="py-2 font-medium">What it does</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-rule border-b align-top" key={row.name}>
              <td className="py-2 pr-4 whitespace-nowrap">
                <code className="text-text font-mono">{row.name}</code>
                {row.required ? <span className="text-muted"> required</span> : null}
                {row.deprecated ? <span className="text-muted"> deprecated</span> : null}
              </td>
              <td className="text-muted py-2 pr-4 font-mono">{row.type}</td>
              <td className="text-muted py-2">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/** `#/docs`: the six charts, and the philosophy. */
export const DocsIndex = () => (
  <Page>
    <h1 className="text-small text-text m-0 font-semibold">Docs</h1>
    <ul className="m-0 flex list-none flex-col p-0">
      {registry.map((chart) => (
        <li className="border-rule border-t" key={chart.kind}>
          <a
            className="text-small text-text flex min-h-11 items-center justify-between gap-4 no-underline"
            href={`#/docs/${chart.kind}`}
          >
            {chart.component}
            <span className="text-muted">{chart.jobs[0].replaceAll("-", " ")}</span>
          </a>
        </li>
      ))}
      <li className="border-rule border-t">
        <a
          className="text-small text-text flex min-h-11 items-center no-underline"
          href="#/docs/philosophy"
        >
          Philosophy
        </a>
      </li>
    </ul>
  </Page>
);

/** `#/docs/<kind>`: one chart's reference. */
export const DocsChart = (props: { kind: string }) => {
  if (!isKind(props.kind)) {
    return (
      <main className="text-small text-muted p-10">
        {`No chart called ${props.kind}`}
      </main>
    );
  }
  const chart = getChart(props.kind);
  const Live = LIVE[props.kind];
  const payload = EXAMPLES[props.kind];
  const { limits } = chart;
  return (
    <Page>
      <header className="flex flex-col gap-2">
        <a className="text-small text-muted no-underline" href="#/docs">
          Docs
        </a>
        <h1 className="text-small text-text m-0 font-semibold">
          {chart.component}
        </h1>
        <Prose>{chart.jobs.map((job) => job.replaceAll("-", " ")).join(", ")}</Prose>
      </header>
      <Section title="When to use it">
        <Prose>{chart.whenToUse}</Prose>
        <Prose>{chart.whenNotToUse}</Prose>
      </Section>
      <Section title="Data">
        <Prose>{chart.dataShape}</Prose>
        <Prose>
          {limits.categories === undefined
            ? null
            : `${limits.categories.min} to ${limits.categories.max} items. `}
          {limits.series.min === limits.series.max
            ? `${limits.series.max} series.`
            : `${limits.series.min} to ${limits.series.max} series.`}
        </Prose>
        <Prose>
          {`Check a payload with getChart("${chart.kind}").validate(payload) from @howells/hairline/schema. Its JSON Schema is @howells/hairline/json-schema/${chart.kind}.json.`}
        </Prose>
      </Section>
      <Section title="Example">
        <div className="flex min-w-0 flex-col justify-center">
          <Live {...payload} initialWidth={680} />
        </div>
        <Code code={exampleCode(chart.component, props.kind)} />
        <Prose>The figures are rounded, for illustration.</Prose>
      </Section>
      <Section title="Props">
        <PropsTable kind={props.kind} />
      </Section>
    </Page>
  );
};

/** One line of the philosophy note, which is plain markdown: headings, bullets, paragraphs. */
const inline = (text: string) =>
  text.split(/(`[^`]+`)/u).map((part, index) =>
    part.startsWith("`") ? (
      // oxlint-disable-next-line react/no-array-index-key -- a static split of one line
      <code className="font-mono" key={index}>
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    )
  );

/** `#/docs/philosophy`: docs/PHILOSOPHY.md, set in the site's type. */
export const Philosophy = () => (
  <Page>
    {philosophy
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => {
        if (line.startsWith("# ")) {
          return (
            <h1 className="text-small text-text m-0 font-semibold" key={line}>
              {line.slice(2)}
            </h1>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 className="text-small text-text border-rule m-0 border-t pt-4 font-semibold" key={line}>
              {line.slice(3)}
            </h2>
          );
        }
        return (
          <p className="text-small text-muted m-0" key={line}>
            {inline(line.startsWith("- ") ? line.slice(2) : line)}
          </p>
        );
      })}
  </Page>
);

/** The docs routes: `#/docs`, `#/docs/philosophy`, `#/docs/<kind>`. */
export const Docs = (props: { arg: string | undefined }) => {
  if (props.arg === undefined) {
    return <DocsIndex />;
  }
  if (props.arg === "philosophy") {
    return <Philosophy />;
  }
  return <DocsChart kind={props.arg} />;
};
