import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { load } from "cheerio";
import sharp from "sharp";
import { describe, expect, test } from "vitest";
import { pages } from "../src/lib/pages";
import { publicOrigin } from "../src/lib/site";

function htmlAt(directory: string, path: string): string {
  return readFileSync(resolve(directory, `.${path}index.html`), "utf8");
}

function verifyPage(html: string, page: (typeof pages)[keyof typeof pages], preview: boolean) {
  const $ = load(html);
  const canonical = new URL(page.path, publicOrigin).href;
  expect($("title")).toHaveLength(1);
  expect($("title").text()).toBe(page.title);
  expect($("h1").text()).toBe(page.title);
  expect($("main > p").first().text()).toBe(page.description);
  const metadata: Record<string, string> = {
    'meta[name="description"]': page.description,
    'meta[name="robots"]': preview ? "noindex, nofollow" : "index, follow",
    'meta[property="og:title"]': page.title,
    'meta[property="og:description"]': page.description,
    'meta[property="og:url"]': canonical,
    'meta[property="og:type"]': "website",
    'meta[property="og:image:type"]': "image/png",
    'meta[property="og:image:width"]': "1200",
    'meta[property="og:image:height"]': "630",
    'meta[property="og:image:alt"]': "An original geometric landscape in blue and green",
  };
  for (const [selector, value] of Object.entries(metadata)) {
    expect($(selector), selector).toHaveLength(1);
    expect($(selector).attr("content"), selector).toBe(value);
  }
  expect($('link[rel="canonical"]')).toHaveLength(1);
  expect($('link[rel="canonical"]').attr("href")).toBe(canonical);
  expect($('meta[property="og:image"]')).toHaveLength(1);
  const image = new URL($('meta[property="og:image"]').attr("content")!);
  expect(image.origin).toBe(publicOrigin);
  expect(image.pathname).toMatch(/\.png$/);

  // Only non-executable JSON-LD is permitted: no hydration, handlers or module preloads.
  expect($("script")).toHaveLength(1);
  const script = $('script[type="application/ld+json"]');
  expect(script).toHaveLength(1);
  expect(script.attr("src")).toBeUndefined();
  const raw = script.html()!;
  expect(raw).not.toMatch(/[<>&\u2028\u2029]/);
  expect(JSON.parse(raw)).toEqual({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonical}#webpage`,
    url: canonical,
    name: page.title,
    description: page.description,
  });
  expect($("astro-island, link[rel=modulepreload], link[as=script]")).toHaveLength(0);
  $("*").each((_, element) => {
    if (element.type !== "tag") return;
    for (const [name, value] of Object.entries(element.attribs)) {
      expect(name).not.toMatch(/^on/i);
      expect(value).not.toMatch(/^javascript:/i);
    }
  });

  const img = $("main img");
  expect(img).toHaveLength(1);
  expect(img.attr("width")).toBe("1200");
  expect(img.attr("height")).toBe("630");
  expect(img.attr("alt")).toBeTruthy();
  expect(img.attr("sizes")).toBe("(min-width: 50rem) 48rem, calc(100vw - 2rem)");
  const variants = img
    .attr("srcset")!
    .split(",")
    .map((part) => part.trim().split(/\s+/));
  expect(variants.map(([, width]) => width)).toEqual(["360w", "720w", "1200w"]);
  expect(img.attr("loading")).toBe(page.path === "/" ? "eager" : "lazy");
  if (page.path === "/") expect(img.attr("fetchpriority")).toBe("high");
  else expect(img.attr("fetchpriority")).not.toBe("high");
  return { image, variants, source: img.attr("src")! };
}

function filesAt(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesAt(path) : [path];
  });
}

for (const [directory, preview] of [
  ["dist", false],
  ["dist-preview", true],
] as const) {
  describe(directory, () => {
    for (const page of Object.values(pages)) {
      test(`${page.path} has safe, unique metadata and native responsive images`, async () => {
        const { image, variants, source } = verifyPage(htmlAt(directory, page.path), page, preview);
        const png = readFileSync(resolve(directory, `.${image.pathname}`));
        expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
        expect(png.readUInt32BE(16)).toBe(1200);
        expect(png.readUInt32BE(20)).toBe(630);
        for (const url of [source, ...variants.map(([url]) => url!)]) {
          expect(url).toMatch(/^\/_astro\/.*\.webp$/);
          expect(statSync(resolve(directory, `.${url}`)).size).toBeGreaterThan(0);
        }
        for (const [url, descriptor] of variants) {
          const width = Number.parseInt(descriptor!, 10);
          const metadata = await sharp(resolve(directory, `.${url}`)).metadata();
          expect(metadata.format).toBe("webp");
          expect(metadata.width).toBe(width);
          expect(metadata.height).toBe(Math.round((width * 630) / 1200));
        }
      });
    }
    test("exactly two HTML routes and no browser JavaScript artifacts", () => {
      const files = filesAt(directory);
      expect(files.filter((file) => file.endsWith(".html")).sort()).toEqual([
        join(directory, "content/index.html"),
        join(directory, "index.html"),
      ]);
      expect(files.filter((file) => /\.(m?js)$/.test(file))).toEqual([]);
    });
  });
}

test("negative controls reject duplicate metadata, unsafe JSON-LD, image and indexing regressions", () => {
  const html = htmlAt("dist", "/");
  const mutations = [
    html.replace("</head>", "<title>Duplicate</title></head>"),
    html.replace("</head>", '<meta name="description" content="Duplicate"></head>'),
    html.replace("</head>", '<link rel="canonical" href="https://wrong.example"></head>'),
    html.replace("</head>", '<meta property="og:title" content="Duplicate"></head>'),
    html.replace("</head>", '<script>alert("injected")</script></head>'),
    html.replace("index, follow", "noindex, nofollow"),
    html.replace('loading="eager"', 'loading="lazy"'),
    html.replace('width="1200"', 'width="0"'),
  ];
  for (const mutated of mutations) {
    expect(mutated).not.toBe(html);
    expect(() => verifyPage(mutated, pages.home, false)).toThrow();
  }
  const hostile = htmlAt("dist", "/content/");
  const unsafe = hostile.replaceAll("\\u003c", "<");
  expect(unsafe).not.toBe(hostile);
  expect(() => verifyPage(unsafe, pages.content, false)).toThrow();
});
