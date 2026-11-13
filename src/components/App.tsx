"use client";

import { StoreProvider, useStore } from "@/lib/store";
import { Landing } from "./Landing";
import { Workspace } from "./Workspace";

function Shell() {
  const { session } = useStore();
  if (!session.onboarded) return <Landing />;
  return <Workspace />;
}

export function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
