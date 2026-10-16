/**
 * The site's theme: Western, or the hidden Roman one the footer's Easter egg switches to.
 * It's a preference for this browser only, so it lives in its own storage key, apart
 * from the class data and never in a backup. app.html applies it before the first paint.
 */
export type Theme = "western" | "roman";

const KEY = "tap-and-tally-theme";

class ThemeState {
  current = $state<Theme>(read());

  toggle() {
    this.current = this.current === "roman" ? "western" : "roman";
    apply(this.current);
    try {
      if (this.current === "roman") localStorage.setItem(KEY, "roman");
      else localStorage.removeItem(KEY);
    } catch {
      // Private windows may refuse; the theme still changes for this visit.
    }
  }
}

function read(): Theme {
  try {
    return typeof localStorage !== "undefined" &&
      localStorage.getItem(KEY) === "roman"
      ? "roman"
      : "western";
  } catch {
    return "western";
  }
}

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "roman") root.dataset.theme = "roman";
  else delete root.dataset.theme;
  const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (icon) icon.href = theme === "roman" ? "/icon-roman.svg" : "/icon.svg";
}

export const theme = new ThemeState();
