import { isExternalLink } from "@/app/_utils/links";
import { ButtonLink } from "@/common/button";
import { DarkLightImageAutoscale } from "@/common/dark-light-image";
import { DarkLightImageFragment, FooterFragment } from "@/lib/basehub/fragments";
import { BaseHubImage } from "@/lib/basehub-stubs/next-image";
import NextLink from "next/link";
import { ThemeSwitcher } from "./theme-switcher";

// Social Icon Components
function SocialIcon({ type }: { type: string }) {
  const iconClass = "w-5 h-5";
  switch (type.toLowerCase()) {
    case "twitter":
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case "discord":
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
        </svg>
      );
    default:
      return null;
  }
}

export const Footer = ({
  footer,
  logo,
}: {
  footer: FooterFragment;
  logo: DarkLightImageFragment;
}) => {
  return (
    <footer className="border-t border-[--border] dark:border-[#3a4f58]">
      {/* Mobile: full width, no vertical lines */}
      <div className="block md:hidden">
        <div className="py-12 px-4">
          <div className="flex flex-col gap-8">
            {/* Logo */}
            <NextLink aria-label="Homepage" href="/">
              <img src="/logo-dark.svg" alt="Oryn" className="h-6 w-auto dark:hidden" />
              <img src="/logo-light.svg" alt="Oryn" className="h-6 w-auto hidden dark:block" />
            </NextLink>

            {/* Navigation */}
            <nav className="flex flex-col gap-3">
              {footer.navbar.items.map(({ _title, url }) => (
                <ButtonLink
                  key={_title}
                  unstyled
                  className="text-sm font-light tracking-tight text-[--text-tertiary] hover:text-[--text-primary] dark:text-[--dark-text-secondary] dark:hover:text-[--dark-text-primary]"
                  href={url ?? "#"}
                  target={isExternalLink(url) ? "_blank" : "_self"}
                >
                  {_title}
                </ButtonLink>
              ))}
            </nav>

            {/* Social Icons */}
            <ul className="flex items-center gap-4">
              {footer.socialLinks.map((link) => (
                <li key={link._title}>
                  <ButtonLink
                    unstyled
                    className="block text-[--text-tertiary] hover:text-[#D2B4FA] dark:text-[#7a9aa8] dark:hover:text-[#D2B4FA] transition-colors"
                    href={link.url}
                    target="_blank"
                  >
                    {typeof link.icon === 'string' ? (
                      <SocialIcon type={link.icon} />
                    ) : link.icon?.url ? (
                      <BaseHubImage alt={link._title} height={20} src={link.icon.url} width={20} />
                    ) : (
                      <SocialIcon type={link._title} />
                    )}
                  </ButtonLink>
                </li>
              ))}
            </ul>

            {/* Legal Links */}
            <div className="flex items-center gap-4 pt-4">
              <NextLink
                href="/privacy"
                className="text-xs text-[--text-tertiary] hover:text-[--text-primary] dark:text-[#7a9aa8] dark:hover:text-[--dark-text-primary] transition-colors"
              >
                Privacy
              </NextLink>
              <NextLink
                href="/terms"
                className="text-xs text-[--text-tertiary] hover:text-[--text-primary] dark:text-[#7a9aa8] dark:hover:text-[--dark-text-primary] transition-colors"
              >
                Terms
              </NextLink>
              <NextLink
                href="/cookies"
                className="text-xs text-[--text-tertiary] hover:text-[--text-primary] dark:text-[#7a9aa8] dark:hover:text-[--dark-text-primary] transition-colors"
              >
                Cookies
              </NextLink>
            </div>

            {/* Copyright & Theme */}
            <div className="flex items-center justify-between pt-6 border-t border-[--border] dark:border-[#3a4f58]">
              <p className="text-sm text-[--text-tertiary] dark:text-[--dark-text-tertiary]">
                © {footer.copyright}
              </p>
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: confined between vertical lines */}
      <div className="hidden md:grid md:grid-cols-[clamp(28px,10vw,120px)_auto_clamp(28px,10vw,120px)]">
        <div />
        <div className="border-x border-[--border] dark:border-[#3a4f58] py-12 px-6 lg:px-10">
          <div className="flex flex-col gap-10">
            {/* Top Row: Logo, Nav, Social + Theme */}
            <div className="flex items-center justify-between">
              {/* Logo */}
              <NextLink aria-label="Homepage" href="/">
                <img src="/logo-dark.svg" alt="Oryn" className="h-7 w-auto dark:hidden" />
                <img src="/logo-light.svg" alt="Oryn" className="h-7 w-auto hidden dark:block" />
              </NextLink>

              {/* Navigation */}
              <nav className="flex items-center gap-6 lg:gap-8">
                {footer.navbar.items.map(({ _title, url }) => (
                  <ButtonLink
                    key={_title}
                    unstyled
                    className="text-sm font-light tracking-tight text-[--text-tertiary] hover:text-[--text-primary] dark:text-[--dark-text-secondary] dark:hover:text-[--dark-text-primary]"
                    href={url ?? "#"}
                    target={isExternalLink(url) ? "_blank" : "_self"}
                  >
                    {_title}
                  </ButtonLink>
                ))}
              </nav>

              {/* Social Icons + Theme */}
              <div className="flex items-center gap-6">
                <ul className="flex items-center gap-4">
                  {footer.socialLinks.map((link) => (
                    <li key={link._title}>
                      <ButtonLink
                        unstyled
                        className="block text-[--text-tertiary] hover:text-[#D2B4FA] dark:text-[#7a9aa8] dark:hover:text-[#D2B4FA] transition-colors"
                        href={link.url}
                        target="_blank"
                      >
                        {typeof link.icon === 'string' ? (
                          <SocialIcon type={link.icon} />
                        ) : link.icon?.url ? (
                          <BaseHubImage alt={link._title} height={20} src={link.icon.url} width={20} />
                        ) : (
                          <SocialIcon type={link._title} />
                        )}
                      </ButtonLink>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-2 pl-4 border-l border-[--border] dark:border-[#3a4f58]">
                  <ThemeSwitcher />
                </div>
              </div>
            </div>

            {/* Bottom Row: Copyright & Legal Links */}
            <div className="pt-6 border-t border-[--border] dark:border-[#3a4f58] flex items-center justify-between">
              <p className="text-sm text-[--text-tertiary] dark:text-[--dark-text-tertiary]">
                © {footer.copyright}
              </p>
              <div className="flex items-center gap-4">
                <NextLink
                  href="/privacy"
                  className="text-xs text-[--text-tertiary] hover:text-[--text-primary] dark:text-[#7a9aa8] dark:hover:text-[--dark-text-primary] transition-colors"
                >
                  Privacy
                </NextLink>
                <NextLink
                  href="/terms"
                  className="text-xs text-[--text-tertiary] hover:text-[--text-primary] dark:text-[#7a9aa8] dark:hover:text-[--dark-text-primary] transition-colors"
                >
                  Terms
                </NextLink>
                <NextLink
                  href="/cookies"
                  className="text-xs text-[--text-tertiary] hover:text-[--text-primary] dark:text-[#7a9aa8] dark:hover:text-[--dark-text-primary] transition-colors"
                >
                  Cookies
                </NextLink>
              </div>
            </div>
          </div>
        </div>
        <div />
      </div>
    </footer>
  );
};
