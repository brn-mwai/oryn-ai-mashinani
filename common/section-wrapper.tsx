import { cva, type VariantProps } from "class-variance-authority";

export const $section = cva("py-14 md:py-[72px] flex flex-col items-center gap-10 relative", {
  variants: {
    container: {
      default: "w-full px-4 md:px-[calc(clamp(28px,10vw,120px)+16px)]",
      full: "",
    },
  },
  defaultVariants: {
    container: "default",
  },
});

type SectionProps = React.AllHTMLAttributes<HTMLDivElement> & VariantProps<typeof $section>;

export function Section({ className, container, ...props }: SectionProps) {
  return <section className={$section({ className, container })} {...props} />;
}
