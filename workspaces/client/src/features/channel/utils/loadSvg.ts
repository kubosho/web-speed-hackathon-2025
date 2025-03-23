const svgCache = new Map<string, string>();

export async function loadSvg(url: string): Promise<string> {
  if (svgCache.has(url)) {
    return svgCache.get(url)!;
  }

  const response = await fetch(url);
  const svg = await response.text();
  svgCache.set(url, svg);
  return svg;
}
