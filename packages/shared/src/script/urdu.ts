/** Arabic-script block, covering Urdu/Nastaliq and its extended letterforms. */
const URDU_SCRIPT = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

export function isUrduScript(value: string | null | undefined): boolean {
  return typeof value === "string" && URDU_SCRIPT.test(value);
}
