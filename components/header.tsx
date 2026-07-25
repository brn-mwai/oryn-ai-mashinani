import { ButtonLink } from "@/common/button";
import { DarkLightImageAutoscale } from "@/common/dark-light-image";
import { DesktopMenu, MobileMenu } from "./navigation-menu";
import { DarkLightImageFragment, HeaderFragment } from "@/lib/basehub/fragments";

export const Header = ({
  logo,
  header,
}: {
  logo: DarkLightImageFragment;
  header: HeaderFragment;
}) => {
  return (
    <header className="sticky left-0 top-0 z-[110] flex w-full flex-col">
      {/* Purple Hackathon Banner */}
      <div className="relative z-20 w-full bg-[#D2B4FA] md:grid md:grid-cols-[clamp(28px,10vw,120px)_auto_clamp(28px,10vw,120px)]">
        <div className="hidden md:block" />
        <div className="flex items-center justify-center gap-2 md:gap-4 py-2 px-4 text-center md:border-x md:border-[#c9a5f7]">
          <span className="text-xs font-medium text-[#1A2B32]">We're competing!</span>
          <span className="text-xs font-semibold text-[#1A2B32]">AI Mashinani 2026</span>
        </div>
        <div className="hidden md:block" />
      </div>
      {/* Vertical lines in header - hidden on mobile, visible on md+ */}
      <div className="pointer-events-none absolute inset-0 top-[var(--banner-height)] z-0 h-[calc(100%-var(--banner-height))] w-full">
        {/* Mobile: just bottom border, no vertical lines */}
        <div className="block h-full w-full border-b border-[--border] bg-[--surface-primary] dark:border-[#3a4f58] dark:bg-[#1A2B32] md:hidden" />
        {/* Desktop: grid with vertical lines */}
        <div className="hidden h-full w-full md:grid md:grid-cols-[clamp(28px,10vw,120px)_auto_clamp(28px,10vw,120px)]">
          <div className="col-span-1 border-b border-[--border] bg-[--surface-primary] dark:border-[#3a4f58] dark:bg-[#1A2B32]" />
          <div className="col-span-1 border-x border-b border-[--border] bg-[--surface-primary] dark:border-[#3a4f58] dark:bg-[#1A2B32]" />
          <div className="col-span-1 border-b border-[--border] bg-[--surface-primary] dark:border-[#3a4f58] dark:bg-[#1A2B32]" />
        </div>
      </div>
      <div className="relative z-10 flex h-[--header-height]">
        <div className="grid w-full grid-cols-[1fr_max-content_1fr] place-items-center content-center items-center px-4 md:px-[calc(clamp(28px,10vw,120px)+16px)] *:first:justify-self-start">
          <ButtonLink unstyled className="flex items-center ring-offset-2" href="/">
            <DarkLightImageAutoscale priority {...logo} />
          </ButtonLink>
          <DesktopMenu {...header} />
          <MobileMenu {...header} />
        </div>
      </div>
    </header>
  );
};
