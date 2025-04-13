export function otherDarkPatternDef() {
  return otherPatternDef('black')
}

export function otherLightPatternDef() {
  return otherPatternDef('white')
}

function otherPatternDef(color?: string) {
  const stripeColor = color ? color : "white";
  const svgNS = "http://www.w3.org/2000/svg";
  const defs = document.createElementNS(svgNS, "defs");
  const pattern = document.createElementNS(svgNS, "pattern");
  pattern.setAttribute("id", "hachures");
  pattern.setAttribute("patternUnits", "userSpaceOnUse");
  pattern.setAttribute("width", "4");
  pattern.setAttribute("height", "4");

  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("d", "M-1,1l2,-2M0,4l4,-4M3,5l2,-2");
  path.setAttribute(
    "style",
    `stroke: ${stripeColor}; stroke-width: 0.5; opacity: 0.75`
  );

  pattern.appendChild(path);
  defs.appendChild(pattern);
  return defs;
}
