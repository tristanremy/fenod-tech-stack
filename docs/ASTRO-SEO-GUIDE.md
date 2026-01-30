# SEO for Astro: Making the Fastest Framework Also the Smartest

[Disponible en français](./fr/ASTRO-SEO-GUIDE.md)

> **Philosophy**: Astro's "content-first, JavaScript-last" approach gives you a massive SEO advantage. But to turn that raw performance into actual organic visibility, you need to wire structured data, routing, metadata, and caching correctly.

---

## 🎯 Why Astro Excels at SEO

### Core Advantages

1. **Zero JavaScript by Default** - Googlebot receives full, clean HTML with no hydration delay or broken metadata
2. **Performance Out of the Box** - Fast page loads directly impact SEO rankings
3. **Clean HTML Output** - Search engines reward clarity and proper semantic markup
4. **Edge-Ready** - Deploy globally with minimal latency

### The SEO Reality

Performance alone doesn't guarantee SEO success. Search engines reward:
- **Clean HTML** with proper semantic structure
- **Accurate metadata** that describes your content
- **Structured relationships** between pages
- **Structured data** that helps search engines understand your content
- **Proper caching** and canonical URLs

In 2025, reaching the top of search results no longer guarantees site visits, but laying the foundation for structured content benefits both search engines and LLMs.

---

## 📋 Essential SEO Components

### 1. Meta Tags & Metadata

Meta tags are the foundation of on-page SEO. Every page should have:

```astro
---
// src/pages/example.astro
const title = "Your Page Title - Brand Name";
const description = "Compelling description that appears in search results (150-160 characters)";
const canonical = new URL(Astro.url.pathname, Astro.site).href;
---

<html lang="en">
<head>
  <!-- Essential Meta Tags -->
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- Primary Meta Tags -->
  <title>{title}</title>
  <meta name="title" content={title} />
  <meta name="description" content={description} />

  <!-- Canonical URL (prevents duplicate content issues) -->
  <link rel="canonical" href={canonical} />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonical} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content="/og-image.jpg" />

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content={canonical} />
  <meta property="twitter:title" content={title} />
  <meta property="twitter:description" content={description} />
  <meta property="twitter:image" content="/twitter-image.jpg" />
</head>
<body>
  <!-- Your content -->
</body>
</html>
```

#### Best Practices for Meta Tags

- **Title**: 50-60 characters, include primary keyword, add brand name
- **Description**: 150-160 characters, compelling, include call-to-action
- **Canonical URL**: Always use absolute URLs, be consistent across pages
- **Images**: Use dedicated social media images (OG: 1200×630px, Twitter: 1200×675px)

---

### 2. Sitemap Generation

A sitemap helps search engines discover and index your content efficiently.

#### Installation

```bash
npm install @astrojs/sitemap
```

#### Configuration

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://yourdomain.com', // Required for sitemap
  integrations: [
    sitemap({
      // Optional: Customize URLs
      filter: (page) => !page.includes('/admin/'),
      // Optional: Change frequency hints
      changefreq: 'weekly',
      priority: 0.7,
      // Optional: Add last modification date
      lastmod: new Date(),
    }),
  ],
});
```

#### What You Get

After building your site, Astro automatically generates `/sitemap-index.xml` containing all your pages. This file should be referenced in your `robots.txt`.

#### Dynamic Sitemap (for large sites)

```astro
---
// src/pages/sitemap.xml.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ site }) => {
  const pages = [
    { url: '/', lastmod: '2025-01-01', priority: 1.0 },
    { url: '/about/', lastmod: '2025-01-01', priority: 0.8 },
    // Fetch dynamic routes from CMS/database
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(({ url, lastmod, priority }) => `
  <url>
    <loc>${site}${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>${priority}</priority>
  </url>
`).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
```

---

### 3. Robots.txt

The `robots.txt` file guides search engine crawlers on which pages to crawl and which to ignore.

#### Using astro-robots-txt Plugin

```bash
npm install astro-robots-txt
```

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import robotsTxt from 'astro-robots-txt';

export default defineConfig({
  site: 'https://yourdomain.com',
  integrations: [
    robotsTxt({
      sitemap: true, // Automatically includes sitemap URL
      policy: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/admin/', '/api/private/'],
        },
      ],
    }),
  ],
});
```

#### Manual Implementation

```astro
---
// src/pages/robots.txt.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const robotsTxt = `
User-agent: *
Allow: /

# Block admin areas
Disallow: /admin/
Disallow: /api/private/

# Sitemap
Sitemap: ${site}sitemap-index.xml
`.trim();

  return new Response(robotsTxt, {
    headers: { 'Content-Type': 'text/plain' },
  });
};
```

#### Best Practices

- Always include your sitemap URL
- Block sensitive areas (`/admin/`, `/api/private/`)
- Use specific rules for different user agents if needed
- Test with Google Search Console

---

### 4. Structured Data (JSON-LD)

Structured data helps search engines understand your content and can result in rich snippets in search results.

#### Organization Schema

```astro
---
// src/components/schemas/Organization.astro
const schema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Company Name",
  "url": "https://yourdomain.com",
  "logo": "https://yourdomain.com/logo.png",
  "description": "Your company description",
  "sameAs": [
    "https://twitter.com/yourhandle",
    "https://linkedin.com/company/yourcompany",
    "https://github.com/yourorg"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-555-555-5555",
    "contactType": "customer service"
  }
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

#### Article Schema (for blog posts)

```astro
---
// src/layouts/BlogPost.astro
interface Props {
  title: string;
  description: string;
  publishDate: Date;
  author: string;
  image: string;
}

const { title, description, publishDate, author, image } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site).href;

const schema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": title,
  "description": description,
  "image": image,
  "datePublished": publishDate.toISOString(),
  "dateModified": publishDate.toISOString(),
  "author": {
    "@type": "Person",
    "name": author
  },
  "publisher": {
    "@type": "Organization",
    "name": "Your Site Name",
    "logo": {
      "@type": "ImageObject",
      "url": "https://yourdomain.com/logo.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": canonical
  }
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

#### Product Schema (for e-commerce)

```astro
---
interface Props {
  product: {
    name: string;
    description: string;
    image: string;
    price: number;
    currency: string;
    availability: 'InStock' | 'OutOfStock';
    rating?: number;
    reviewCount?: number;
  };
}

const { product } = Astro.props;

const schema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": product.name,
  "description": product.description,
  "image": product.image,
  "offers": {
    "@type": "Offer",
    "price": product.price,
    "priceCurrency": product.currency,
    "availability": `https://schema.org/${product.availability}`
  }
};

if (product.rating && product.reviewCount) {
  schema["aggregateRating"] = {
    "@type": "AggregateRating",
    "ratingValue": product.rating,
    "reviewCount": product.reviewCount
  };
}
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

#### Breadcrumb Schema

```astro
---
interface Breadcrumb {
  name: string;
  url: string;
}

interface Props {
  breadcrumbs: Breadcrumb[];
}

const { breadcrumbs } = Astro.props;

const schema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": breadcrumbs.map((crumb, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": crumb.name,
    "item": crumb.url
  }))
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

#### Validation

Always validate your structured data:
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)

---

### 5. Creating an SEO Component

Centralize your SEO metadata in a reusable component:

```astro
---
// src/components/SEO.astro
export interface Props {
  title: string;
  description: string;
  image?: string;
  article?: {
    publishDate: Date;
    author: string;
  };
  noindex?: boolean;
}

const {
  title,
  description,
  image = '/default-og.jpg',
  article,
  noindex = false,
} = Astro.props;

const canonical = new URL(Astro.url.pathname, Astro.site).href;
const imageUrl = new URL(image, Astro.site).href;
const siteName = "Your Site Name";
const fullTitle = `${title} | ${siteName}`;
---

<!-- Primary Meta Tags -->
<title>{fullTitle}</title>
<meta name="title" content={fullTitle} />
<meta name="description" content={description} />
{noindex && <meta name="robots" content="noindex, nofollow" />}

<!-- Canonical URL -->
<link rel="canonical" href={canonical} />

<!-- Open Graph -->
<meta property="og:type" content={article ? "article" : "website"} />
<meta property="og:url" content={canonical} />
<meta property="og:title" content={fullTitle} />
<meta property="og:description" content={description} />
<meta property="og:image" content={imageUrl} />
<meta property="og:site_name" content={siteName} />

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content={canonical} />
<meta property="twitter:title" content={fullTitle} />
<meta property="twitter:description" content={description} />
<meta property="twitter:image" content={imageUrl} />

{article && (
  <>
    <meta property="article:published_time" content={article.publishDate.toISOString()} />
    <meta property="article:author" content={article.author} />
  </>
)}
```

Usage:

```astro
---
// src/pages/blog/my-post.astro
import SEO from '@/components/SEO.astro';
---

<html>
<head>
  <SEO
    title="My Amazing Blog Post"
    description="Learn how to do something amazing"
    image="/blog/my-post-cover.jpg"
    article={{
      publishDate: new Date('2025-01-15'),
      author: 'John Doe'
    }}
  />
</head>
</html>
```

---

## 🚀 Performance & Technical SEO

### 1. Cache Headers

Proper caching improves performance and SEO rankings:

```js
// astro.config.mjs
export default defineConfig({
  // For Cloudflare Pages
  adapter: cloudflare({
    mode: 'directory',
  }),
  output: 'server', // or 'hybrid'
});
```

```astro
---
// src/pages/api/example.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  return new Response('content', {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'CDN-Cache-Control': 'public, max-age=86400',
    },
  });
};
```

**Cache Strategy Recommendations:**
- **Static pages**: `max-age=3600, s-maxage=86400` (1 hour browser, 1 day CDN)
- **Blog posts**: `max-age=3600, s-maxage=604800` (1 hour browser, 1 week CDN)
- **Dynamic content**: `max-age=60, s-maxage=300` (1 min browser, 5 min CDN)
- **API responses**: `max-age=0, s-maxage=60` (no browser cache, 1 min CDN)

### 2. Image Optimization

Optimize images for faster loading and better SEO:

```astro
---
import { Image } from 'astro:assets';
import myImage from '../assets/hero.jpg';
---

<Image
  src={myImage}
  alt="Descriptive alt text for SEO"
  width={1200}
  height={630}
  format="webp"
  loading="lazy"
  decoding="async"
/>
```

**Best Practices:**
- Always provide descriptive `alt` text
- Use modern formats (WebP, AVIF)
- Specify `width` and `height` to prevent layout shift
- Use `loading="lazy"` for below-the-fold images
- Optimize file sizes (aim for <100KB for hero images)

### 3. Core Web Vitals

Monitor and optimize for Core Web Vitals:

- **LCP (Largest Contentful Paint)**: < 2.5s
  - Optimize images and fonts
  - Use server-side rendering
  - Minimize JavaScript

- **FID (First Input Delay)**: < 100ms
  - Minimize JavaScript execution
  - Use code splitting
  - Defer non-critical scripts

- **CLS (Cumulative Layout Shift)**: < 0.1
  - Set image dimensions
  - Reserve space for ads/embeds
  - Avoid inserting content above existing content

---

## 🎨 Content Strategy

### 1. Semantic HTML

Use proper HTML5 semantic elements:

```astro
<article>
  <header>
    <h1>Article Title</h1>
    <time datetime="2025-01-15">January 15, 2025</time>
  </header>

  <section>
    <h2>Section Heading</h2>
    <p>Content...</p>
  </section>

  <footer>
    <p>Author information</p>
  </footer>
</article>
```

### 2. Heading Hierarchy

Maintain proper heading structure:

```astro
<h1>Page Title (only one per page)</h1>
  <h2>Main Section</h2>
    <h3>Subsection</h3>
    <h3>Another Subsection</h3>
  <h2>Another Main Section</h2>
```

### 3. Internal Linking

Build a strong internal linking structure:

```astro
<nav aria-label="Primary navigation">
  <a href="/">Home</a>
  <a href="/blog/">Blog</a>
  <a href="/about/">About</a>
</nav>

<!-- Contextual links in content -->
<p>
  Learn more about <a href="/guides/seo/">SEO best practices</a>
  and how to implement them.
</p>
```

---

## 📊 Monitoring & Analytics

### 1. Google Search Console

Set up Search Console to monitor:
- Index coverage
- Search performance
- Core Web Vitals
- Mobile usability
- Security issues

### 2. Performance Monitoring

```astro
---
// src/pages/index.astro
---

<script>
  // Report Web Vitals
  import { getCLS, getFID, getLCP } from 'web-vitals';

  function sendToAnalytics(metric) {
    const body = JSON.stringify(metric);
    // Send to your analytics endpoint
    fetch('/api/analytics', { method: 'POST', body });
  }

  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getLCP(sendToAnalytics);
</script>
```

---

## ✅ SEO Checklist

### Pre-Launch

- [ ] Set `site` URL in `astro.config.mjs`
- [ ] Install and configure `@astrojs/sitemap`
- [ ] Create `robots.txt` file
- [ ] Add meta tags to all pages
- [ ] Implement canonical URLs consistently
- [ ] Add structured data (JSON-LD) where appropriate
- [ ] Optimize all images (WebP, proper sizes, alt text)
- [ ] Test mobile responsiveness
- [ ] Validate structured data with Google Rich Results Test
- [ ] Check all internal links work
- [ ] Set up 404 page
- [ ] Configure proper cache headers

### Post-Launch

- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Monitor Core Web Vitals
- [ ] Check index coverage in Search Console
- [ ] Set up performance monitoring
- [ ] Test page speed with PageSpeed Insights
- [ ] Verify social media previews (Twitter, LinkedIn, Facebook)

### Ongoing

- [ ] Monitor search rankings
- [ ] Update content regularly
- [ ] Add new content with proper SEO metadata
- [ ] Fix any crawl errors
- [ ] Monitor and improve Core Web Vitals
- [ ] Update structured data as needed
- [ ] Build quality backlinks
- [ ] Refresh old content

---

## 🛠️ Tools & Resources

### Validation & Testing
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)

### Monitoring
- [Google Search Console](https://search.google.com/search-console)
- [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [Cloudflare Analytics](https://www.cloudflare.com/analytics/)

### SEO Packages
- [@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- [astro-robots-txt](https://www.npmjs.com/package/astro-robots-txt)
- [astro-seo](https://github.com/jonasmerlin/astro-seo) - Alternative SEO component library

---

## 💡 Pro Tips

1. **Use SSR/SSG Strategically**
   - Static (SSG) for content that rarely changes
   - Server (SSR) for dynamic, personalized content
   - Hybrid mode for mixing both approaches

2. **Canonical Consistency is Critical**
   - Always use absolute URLs
   - Ensure trailing slash consistency
   - Test all pages for proper canonical tags

3. **E-commerce Specific**
   - Use static builds for category pages
   - Use SSR for product availability
   - Implement product schema on all product pages
   - Add review schema when available

4. **Content-First Approach**
   - Write content for humans first
   - Structure content with proper headings
   - Use descriptive link text (avoid "click here")
   - Add alt text that describes the image, not just keywords

5. **Mobile-First**
   - Design for mobile first
   - Test on real devices
   - Optimize for touch interactions
   - Ensure text is readable without zooming

6. **Page Speed Matters**
   - Minimize JavaScript
   - Use Astro's partial hydration strategically
   - Optimize images aggressively
   - Leverage Cloudflare's CDN

---

## 🎯 Common Pitfalls to Avoid

1. **Missing Canonical URLs** - Always set canonical URLs to avoid duplicate content penalties
2. **Inconsistent Trailing Slashes** - Choose one convention and stick to it
3. **Missing Alt Text** - Every image should have descriptive alt text
4. **Duplicate Meta Descriptions** - Write unique descriptions for each page
5. **Ignoring Mobile** - Mobile-first indexing means mobile experience matters most
6. **Slow Page Speed** - Performance directly impacts SEO rankings
7. **Missing Structured Data** - Don't miss out on rich snippets
8. **No Sitemap** - Make it easy for search engines to discover your content
9. **Broken Internal Links** - Regularly audit and fix broken links
10. **Not Monitoring Search Console** - Stay on top of crawl errors and issues

---

## 🚀 Next Steps

1. **Audit Your Current Site**: Run through the checklist above
2. **Implement Missing Components**: Start with meta tags, sitemap, and robots.txt
3. **Add Structured Data**: Implement relevant schemas for your content type
4. **Monitor Performance**: Set up Search Console and analytics
5. **Iterate and Improve**: SEO is ongoing - keep optimizing

---

**Related Documentation:**
- [Fenod Stack README](../README.md) - Main stack documentation
- [Development Strategy Guide](./development-strategy.md) - UI-first workflow

**Last Updated:** January 2025
