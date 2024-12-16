"use client";

import { HoneyMachine } from "~/components/honey-machine";
import Hero from "./hero";
import { SwapCard } from "./swap-card";

export default function HoneyPage({ arcade = false }: { arcade?: boolean }) {
  return (
    <section>
      {arcade ? (
        <div className="m-auto block max-w-[1200px]">
          <HoneyMachine />
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-[1000px] flex-col items-center justify-between gap-8 px-4 py-16">
          <Hero />
          <SwapCard />
        </div>
      )}
    </section>
  );
}
