import { spline } from "@georgedoescode/spline";
import SimplexNoise from "simplex-noise";

let tmpl = document.createElement("template");
tmpl.innerHTML = `
  <div style="position: relative">
    <svg viewBox="0 0 600 200">
      <defs>
        <!-- Our gradient fill #gradient -->
        <linearGradient id="gradient" gradientTransform="rotate(90)">
          <!-- Use CSS custom properties for the start / stop colors of the gradient -->
          <stop id="gradientStop1" offset="0%" stop-color="var(--desktop-runtime-startColor)" />
          <stop id="gradientStop2 " offset="100%" stop-color="var(--desktop-runtime-stopColor)" />
        </linearGradient>
      </defs>
      <path d="" fill="url('#gradient')"></path>
      <text y="70" x="185" style="user-select: none; font-size: 2rem; font-weight: 200; font-family: var(--desktop-runtime-fonts)">Desktop</text>
      <text id="runtime" y="150" x="100" style="user-select: none; font-size: 8rem; font-family: var(--desktop-runtime-fonts)">Runtime</text>
      </svg>
  </div>
`;

export class RuntimeLogo extends HTMLElement {
  path = undefined;
  root = undefined;
  simplex = undefined;
  points = undefined;

  hueNoiseOffset = 0;
  noiseStep = 0.005;

  constructor() {
    super();

    this.animate = this.animate.bind(this);

    let shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.appendChild(tmpl.content.cloneNode(true));

    this.path = shadowRoot.querySelector("path");
    this.root = shadowRoot.querySelector("svg");
    this.simplex = new SimplexNoise();
    this.points = this.createPoints();
    this.root.style.setProperty(
      "--desktop-runtime-fonts",
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif'
    );

    // Handle Safari, Firefox, etc
    // If we're in Chromium, we can do more fancy effects
    // filter: invert(1); mix-blend-mode: difference;
    if (!!window.chrome) {
      shadowRoot.querySelectorAll("text").forEach((element) => {
        element.style.setProperty("filter", "invert(1)");
        element.style.setProperty("mix-blend-mode", "difference");
      });
    }

    this.animate();

    this.onmouseenter = () => (this.noiseStep = 0.002);
    this.onmouseleave = () => (this.noiseStep = 0.005);
    this.onclick = () => (this.hueNoiseOffset = this.hueNoiseOffset + 20);
    this.addEventListener("dblclick", () => {
      shadowRoot.querySelector("#runtime").innerHTML =
        shadowRoot.querySelector("#runtime").innerHTML === "Runtime"
          ? "Funtime"
          : "Runtime";
    });
  }

  animate() {
    this.path.setAttribute("d", spline(this.points, 1, true));

    // for every point...
    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i];

      // return a pseudo random value between -1 / 1 based on this point's current x, y positions in "time"
      const nX = this.noise(point.noiseOffsetX, point.noiseOffsetX);
      const nY = this.noise(point.noiseOffsetY, point.noiseOffsetY);

      // map this noise value to a new value, somewhere between it's original location -20 and it's original location + 20
      const x = this.map(nX, -1, 1, point.originX - 20, point.originX + 20);
      const y = this.map(nY, -1, 1, point.originY - 20, point.originY + 20);

      // update the point's current coordinates
      point.x = x;
      point.y = y;

      // progress the point's x, y values through "time"
      point.noiseOffsetX += this.noiseStep;
      point.noiseOffsetY += this.noiseStep;
    }

    const hueNoise = this.noise(this.hueNoiseOffset, this.hueNoiseOffset);
    const hue = this.map(hueNoise, -1, 1, 0, 360);

    this.root.style.setProperty(
      "--desktop-runtime-startColor",
      `hsl(${hue}, 100%, 75%)`
    );
    this.root.style.setProperty(
      "--desktop-runtime-stopColor",
      `hsl(${hue + 100}, 100%, 75%)`
    );
    this.hueNoiseOffset += this.noiseStep / 6;

    if (!window.RUNTIME_LOGO_PAUSE) {
      requestAnimationFrame(this.animate);
    }
  }

  map(n, start1, end1, start2, end2) {
    return ((n - start1) / (end1 - start1)) * (end2 - start2) + start2;
  }

  noise(x, y) {
    return this.simplex.noise2D(x, y);
  }

  createPoints() {
    const points = [];
    const numPoints = 7;
    // used to equally space each point around the circle
    const angleStep = (Math.PI * 2) / numPoints;
    // the radius of the circle
    const rad = 85;

    for (let i = 1; i <= numPoints; i++) {
      // x & y coordinates of the current point
      const theta = i * angleStep;

      const x = 100 + Math.cos(theta) * rad;
      const y = 100 + Math.sin(theta) * rad;

      points.push({
        x: x,
        y: y,
        originX: x,
        originY: y,
        noiseOffsetX: Math.random() * 1000,
        noiseOffsetY: Math.random() * 1000,
      });
    }

    return points;
  }
}
