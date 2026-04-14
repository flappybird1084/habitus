import dynamic from "next/dynamic";

// ssr: false prevents the server from rendering state that depends on
// localStorage (via zustand persist), which would mismatch the client's
// hydrated state and throw a React hydration error.
const HomePageClient = dynamic(
  () => import("@/components/HomePageClient"),
  { ssr: false }
);

export default function HomePage() {
  return <HomePageClient />;
}
