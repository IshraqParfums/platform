/**
 * The drifting colour field behind the whole home page.
 *
 * Three soft radial washes — brass, ink blue, and a warm mid-brown — fixed to
 * the viewport rather than the document, so the page slides over them instead
 * of carrying them along. That is the whole trick: it keeps the paper from ever
 * reading as a flat fill, because the hue under any given section shifts by a
 * degree or two as you scroll.
 *
 * Pure CSS (see `.paper-field*` in globals.css), so this stays a server
 * component and costs nothing at runtime. It sits at z-0; every band on the
 * page establishes its own stacking context above it.
 */
export function PaperField() {
  return (
    <div className="paper-field" aria-hidden="true">
      <span className="paper-field-a" />
      <span className="paper-field-b" />
      <span className="paper-field-c" />
    </div>
  );
}
