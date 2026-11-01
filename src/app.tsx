import { Docs } from "./pages/docs";
import { ChartGrid, KitGrid, SingleChart } from "./pages/gallery";
import { Credits } from "./pages/sources";
import { PaletteSwitcher } from "./system/palette";
import { useRoute } from "./system/router";

const TopBar = () => (
  <header className="border-rule bg-paper grain sticky top-0 z-40 flex items-start justify-between gap-x-3 border-b px-4.5 py-2 sm:gap-x-6 md:px-10">
    <a
      className="text-text text-small inline-flex min-h-11 items-center font-semibold no-underline"
      href="#/"
    >
      Hairline
    </a>
    <div className="flex flex-wrap items-center justify-end gap-x-2 sm:gap-x-6">
      <nav className="flex items-center gap-1 sm:gap-2.5">
        <a
          className="text-muted text-small inline-flex min-h-11 min-w-11 items-center justify-center no-underline"
          href="#/kit"
        >
          Kit
        </a>
        <a
          className="text-muted text-small inline-flex min-h-11 min-w-11 items-center justify-center no-underline"
          href="#/docs"
        >
          Docs
        </a>
        <a
          className="text-muted text-small inline-flex min-h-11 min-w-11 items-center justify-center no-underline"
          href="#/sources"
        >
          Sources
        </a>
      </nav>
      <PaletteSwitcher />
    </div>
  </header>
);

const RouteContent = (props: {
  arg: string | undefined;
  section: string | undefined;
}) => {
  if (props.section === "chart" && props.arg !== undefined) {
    return <SingleChart id={props.arg} />;
  }
  if (props.section === "kit") {
    return <KitGrid />;
  }
  if (props.section === "docs") {
    return <Docs arg={props.arg} />;
  }
  if (props.section === "sources") {
    return <Credits />;
  }
  return <ChartGrid />;
};

export const App = () => {
  const [section, arg] = useRoute();
  return (
    <>
      <TopBar />
      <RouteContent arg={arg} section={section} />
    </>
  );
};
