import { Urdu } from "@/components/home-v2/ui/urdu";

const COPY = {
  phone: "Sign in to reach your saved addresses, past orders, and bespoke formulas.",
  code: "Almost there. The code just reached your messages.",
} as const;

/**
 * The desktop-only side panel — pure presentation, no state of its own.
 * `step` only ever changes its supporting line, never its structure, so the
 * panel can't drift out of sync with what `LoginForm` is actually doing.
 *
 * Tobacco + a breathing glow is the same "single atmospheric moment" the
 * home hero opens on (`.dawn-breathe`, defined once in globals.css and reused
 * here rather than duplicated) — Ishraq is radiance, dawn, so the door into
 * an account gets the same first light rather than a plain sign-in panel.
 */
export function LoginAtmosphere({ step }: { step: "phone" | "code" }) {
  return (
    <div className="relative hidden h-full min-h-[32rem] w-full overflow-hidden bg-tobacco lg:block">
      <span
        aria-hidden
        className="dawn-breathe pointer-events-none absolute -inset-x-[20%] -top-[15%] -bottom-[10%] bg-[radial-gradient(ellipse_55%_48%_at_50%_38%,rgba(197,151,84,0.4),rgba(197,151,84,0.08)_55%,transparent_75%)]"
      />

      <div className="relative z-[1] flex h-full flex-col items-center justify-center px-12 py-16 text-center">
        <span className="flex items-baseline gap-2.5">
          <span className="font-editorial text-[26px] tracking-[0.01em] text-paper">
            Ishraq
          </span>
          <span className="font-ui text-[9px] font-semibold uppercase tracking-[0.28em] text-brass/80">
            Parfums
          </span>
        </span>

        {/* URDU: "خوش آمدید" ("welcome") — a standard, widely-known greeting,
            lower mistranslation risk than the invented phrases elsewhere in
            this pass, but still worth a native read before shipping. */}
        <Urdu tone="on-dark" size="md" align="center" className="mt-8">
          {"خوش آمدید"}
        </Urdu>

        <p className="mt-6 max-w-[26ch] font-editorial text-[22px] italic leading-[1.3] text-paper">
          Ishraq · radiance, dawn.
        </p>

        <span aria-hidden className="mt-8 h-px w-10 bg-brass/40" />

        <p className="mt-8 max-w-[30ch] text-[14px] leading-relaxed text-paper/65">
          {COPY[step]}
        </p>
      </div>
    </div>
  );
}
