const ROOT_EN: Record<string, string> = {
  "error.title_404": "Page not found",
  "error.lead_404":
    "The page you requested is missing, or the link is incorrect. Use the link below to return to the home page.",
  "error.title_4xx": "Request could not be completed",
  "error.lead_4xx": "The server could not process this request as sent.",
  "error.title_5xx": "Something went wrong",
  "error.lead_5xx": "An unexpected error occurred. Please try again later.",
};

function keysForStatus(status: number) {
  if (status === 404) {
    return {
      titleKey: "error.title_404" as const,
      leadKey: "error.lead_404" as const,
    };
  }
  if (status >= 500) {
    return {
      titleKey: "error.title_5xx" as const,
      leadKey: "error.lead_5xx" as const,
    };
  }
  return {
    titleKey: "error.title_4xx" as const,
    leadKey: "error.lead_4xx" as const,
  };
}

export function resolveErrorCopy(
  status: number,
  translate: (key: string) => string,
) {
  const k = keysForStatus(status);
  return { title: translate(k.titleKey), lead: translate(k.leadKey) };
}

export function rootErrorCopy(status: number) {
  return resolveErrorCopy(status, (key) => ROOT_EN[key] ?? (key as string));
}
