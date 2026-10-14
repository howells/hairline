import { ChartGrid, SingleChart } from "./pages/gallery";
import { PaletteSwitcher } from "./system/palette";
import { useRoute } from "./system/router";

const TopBar = () => (
  <header className="border-ink bg-paper/90 grain after:bg-ink after:border-paper sticky top-0 z-40 flex items-center justify-between gap-6 border-b-2 px-4.5 py-2 backdrop-blur-md after:absolute after:inset-x-0 after:-bottom-1.25 after:h-0.75 after:border-t-2 md:px-10">
    <a
      className="text-text text-card inline-flex min-h-11 items-center font-extrabold tracking-tight no-underline"
      href="#/"
    >
      Hairline
    </a>
    <PaletteSwitcher />
  </header>
);

const RouteContent = (props: {
  arg: string | undefined;
  section: string | undefined;
}) => {
  if (props.section === "chart" && props.arg !== undefined) {
    return <SingleChart id={props.arg} />;
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
