import { Icons } from "@bera/ui/icons";

export const Hero = () => {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex w-fit gap-2 text-center text-xl md:text-2xl font-bold leading-7">
        <Icons.hubFav className="h-8 w-8" /> BeraHub
      </div>
      <div className="leading-15 relative w-fit text-center text-4xl font-bold md:text-7xl md:leading-[80px]">
        For everything proof
        <br />
        of Liquidity
        <Icons.bgt className="absolute right-[13%] top-1/2 -translate-y-[20%] transform drop-shadow-[0_15px_15px_rgba(251,191,36,0.5)] md:h-16 md:w-16" />
      </div>
    </div>
  );
};
