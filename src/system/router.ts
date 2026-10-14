import { useEffect, useState } from "react";

const readRoute = () =>
  window.location.hash
    .replace(/^#\/?/u, "")
    .split("/")
    .filter((segment) => segment !== "");

/** Current hash route split into segments: "#/chart/L13" → ["chart", "L13"]. */
export const useRoute = () => {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const onHash = () => {
      setRoute(readRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("hashchange", onHash);
    };
  }, []);
  return route;
};
