const s = (d: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`

export const Icons = {
  watchlist: s(
    '<path d="M3 5h.01"/><path d="M3 12h.01"/><path d="M3 19h.01"/><path d="M8 5h13"/><path d="M8 12h13"/><path d="M8 19h13"/>'
  ),
  alerts: s(
    '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'
  ),
  dataWindow: s(
    '<path d="M3 3h18v18H3z"/><path d="M7 16V8"/><path d="M11 16v-4"/><path d="M15 16v-2"/><path d="M19 16v-6"/>'
  ),
  cursor: s(
    '<path d="M3 3 12 21 15.5 15.5 21 12Z"/><path d="m15.5 15.5 5 5"/>'
  ),
  trendLine: s(
    '<path d="m21 6-7.5 7.5-3-3L3 18"/>'
  ),
  fibonacci: s(
    '<circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M3 12h18"/><path d="m8 4 8 16"/><path d="m16 4-8 16"/>'
  ),
  settings: s(
    '<circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>'
  ),
  close: s(
    '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
  ),
  remove: s(
    '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
  ),
  text: s(
    '<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>'
  ),
  rect: s(
    '<rect width="14" height="14" x="5" y="5" rx="2"/>'
  ),
  objects: s(
    '<path d="M4 6h16M4 12h16M4 18h12"/>'
  )
} as const

export type IconName = keyof typeof Icons
