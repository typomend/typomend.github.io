// The guide pages, in the order the menus list them. The home page imports
// this too, so it stays free of anything the guides need to render.

export interface NavLink {
  path: string;
  name: string;
}

export const GUIDES: NavLink[] = [
  { path: "/how-it-works/", name: "運作原理" },
  { path: "/language-model/", name: "語言模型" },
  { path: "/faq/", name: "常見問題" },
];

export const ENGLISH: NavLink = { path: "/en/", name: "English" };
