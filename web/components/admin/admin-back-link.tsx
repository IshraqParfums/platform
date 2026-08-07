import { BackLink } from "@/components/ui/back-link";

/**
 * Admin back navigation — same chrome as shop `BackLink`
 * (“Back to orders” / “Back to account”).
 */
export function AdminBackLink({
  href,
  children,
  className,
}: {
  href: string;
  children: string;
  className?: string;
}) {
  return (
    <BackLink href={href} className={className}>
      {children}
    </BackLink>
  );
}
