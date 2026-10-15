/**
 * Where every chart's numbers come from: one entry per source, in the words
 * and licence the publisher asks for. The charts carry no prose, so credit
 * lives here, on the Sources page, rather than under each chart. The list
 * itself is data, in sources.json; where no reuse licence was found, the
 * licence reads "Published figures; reuse terms not stated".
 */
import sources from "./sources.json";

export interface Source {
  /** Cell the source feeds, e.g. "L17". */
  id: string;
  /** Publisher as it asks to be credited, e.g. "Office for National Statistics". */
  publisher: string;
  /** Dataset or page title. */
  title: string;
  url: string;
  /** Licence or terms, e.g. "Open Government Licence v3.0". */
  licence: string;
}

export const SOURCES: Source[] = sources;
