// Facts about the site and the product that every page, the structured data
// and the sitemap repeat. Change them here and the whole site follows.

/** Where the site is published, without a trailing slash. */
export const SITE_URL = "https://typomend.github.io";

export const SITE_NAME = "Typomend";

/** The release the pages describe, and the day it came out. */
export const VERSION = "0.0.1";
export const RELEASED = "2026-10-11";

export const AUTHOR = {
  name: "boylin0",
  url: "https://github.com/boylin0",
};

export const LICENSE_URL = "https://www.mozilla.org/MPL/2.0/";

/**
 * Ownership tokens from Google Search Console and Bing Webmaster Tools, for
 * the HTML tag method. A tag is written only once its token is filled in.
 */
export const VERIFICATION = {
  google: "",
  bing: "",
};

/** The full address of a path on the site. */
export function absolute(path: string) {
  return new URL(path, `${SITE_URL}/`).href;
}
