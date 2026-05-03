import type { ParamMatcher } from "@sveltejs/kit";

export const match: ParamMatcher = (param) => {
  return param === "de" || param === "ru" || param === "it" || param === "zh";
};
