import { ChartGrid, SingleChart } from "./pages/gallery";
import { PaletteSwitcher } from "./system/palette";
import { useRoute } from "./system/router";

const TopBar = () => (
  <header className="border-rule bg-paper grain sticky top-0 z-40 flex items-center justify-between gap-6 border-b px-4.5 py-2 md:px-10">
    <a
      className="text-text text-small inline-flex min-h-11 items-center font-semibold no-underline"
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
