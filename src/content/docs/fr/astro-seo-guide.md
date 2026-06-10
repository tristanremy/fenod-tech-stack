---
title: "Guide SEO Astro"
verified: 2026-06
---

[Available in English](/fr/astro-seo-guide/)

> **Philosophie** : L'approche d'Astro « le contenu d'abord, JavaScript-dernier » vous offre un énorme avantage en matière de référencement. Mais pour transformer ces performances brutes en une véritable visibilité organique, vous devez câbler correctement les données structurées, le routage, les métadonnées et la mise en cache.

---

## Pourquoi Astro excelle en SEO

### Avantages principaux

1. **Zéro JavaScript par défaut** - Googlebot reçoit du HTML complet et propre, sans délai d'hydratation ni métadonnées brisées.
2. **Performances prêtes à l'emploi** – Les chargements rapides des pages ont un impact direct sur les classements SEO
3. **Sortie HTML propre** – Les moteurs de recherche récompensent la clarté et un balisage sémantique approprié
4. **Edge-Ready** - Déployez à l'échelle mondiale avec une latence minimale

### La réalité du référencement

Les performances à elles seules ne garantissent pas le succès du référencement. Récompense des moteurs de recherche :
- **HTML propre** avec une structure sémantique appropriée
- **Métadonnées précises** qui décrivent votre contenu
- **Relations structurées** entre les pages
- **Données structurées** qui aident les moteurs de recherche à comprendre votre contenu
- **Mise en cache appropriée** et URL canoniques

En 2025, atteindre le sommet des résultats de recherche ne garantit plus les visites du site, mais poser les bases d'un contenu structuré profite à la fois aux moteurs de recherche et aux LLM.

---

## Composants SEO essentiels

### 1. Balises méta et métadonnées

Les balises méta sont la base du référencement sur la page. Chaque page doit avoir :

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

#### Bonnes pratiques pour les balises méta

- **Titre** : 50 à 60 caractères, inclure le mot-clé principal, ajouter le nom de la marque
- **Description** : 150 à 160 caractères, convaincante, incluant une incitation à l'action
- **URL canonique** : utilisez toujours des URL absolues et soyez cohérent d'une page à l'autre.
- **Images** : utilisez des images dédiées aux réseaux sociaux (OG : 1 200 × 630 px, Twitter : 1 200 × 675 px)

---

### 2. Génération de plan de site

Un plan de site aide les moteurs de recherche à découvrir et à indexer efficacement votre contenu.

####Installation

```bash
pnpm add @astrojs/sitemap
```

####Configuration

```

js
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

#### Ce que vous obtenez

Après avoir construit votre site, Astro génère automatiquement des `/sitemap-index.xml` contenant toutes vos pages. Ce dossier doit être référencé dans votre `robots.txt`.

#### Plan de site dynamique (pour les grands sites)

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

Le fichier `robots.txt` guide les robots des moteurs de recherche sur les pages à explorer et celles à ignorer.

#### Utilisation du plugin astro-robots-txt

```bash
pnpm add astro-robots-txt
```

```

js
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

#### Implémentation manuelle

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

#### Bonnes pratiques

- Incluez toujours l'URL de votre plan de site
- Bloquer les zones sensibles (`/admin/`, `/api/private/`)
- Utiliser des règles spécifiques pour différents agents utilisateurs si nécessaire
- Testez avec Google Search Console

---

### 4. Données structurées (JSON-LD)

Les données structurées aident les moteurs de recherche à comprendre votre contenu et peuvent générer des extraits enrichis dans les résultats de recherche.

#### Schéma d'organisation

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

#### Schéma de l'article (pour les articles de blog)

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

#### Schéma du produit (pour le commerce électronique)

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

#### Schéma du fil d'Ariane

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

Validez toujours vos données structurées :
- [Test des résultats enrichis Google](https://search.google.com/test/rich-results)
- [Validateur Schema.org](https://validator.schema.org/)

---

### 5. Création d'un composant SEO

Centralisez vos métadonnées SEO dans un composant réutilisable :

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

## Performances et référencement technique

### 1. En-têtes de cache

Une mise en cache appropriée améliore les performances et les classements SEO :

```

js
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

**Recommandations en matière de stratégie de cache :**
- **Pages statiques** : `max-age=3600, s-maxage=86400` (1 heure de navigateur, 1 jour de CDN)
- **Articles de blog** : `max-age=3600, s-maxage=604800` (1 heure de navigateur, 1 semaine de CDN)
- **Contenu dynamique** : `max-age=60, s-maxage=300` (1 min navigateur, 5 min CDN)
- **Réponses API** : `max-age=0, s-maxage=60` (pas de cache du navigateur, 1 min CDN)

### 2. Optimisation des images

Optimisez les images pour un chargement plus rapide et un meilleur référencement :

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

**Meilleures pratiques :**
- Toujours fournir un texte descriptif `alt`
- Utiliser des formats modernes (WebP, AVIF)
- Spécifiez les `width` et `height` pour éviter tout changement de mise en page
- Utilisez `loading="lazy"` pour les images sous la ligne de flottaison
- Optimiser la taille des fichiers (viser <100 Ko pour les images de héros)

### 3. Éléments essentiels du Web

Surveillez et optimisez les Core Web Vitals :

- **LCP (Largest Contentful Paint)** : < 2,5 s
  - Optimiser les images et les polices
  - Utiliser le rendu côté serveur
  - Réduire JavaScript

- **FID (Premier délai d'entrée)** : < 100 ms
  - Minimiser l'exécution de JavaScript
  - Utiliser le fractionnement du code
  - Différer les scripts non critiques

- **CLS (Cumulative Layout Shift)** : < 0,1
  - Définir les dimensions de l'image
  - Réserver de l'espace pour les annonces/intégrations
  - Évitez d'insérer du contenu au-dessus du contenu existant

---

## Stratégie de contenu

### 1. HTML sémantique

Utilisez les éléments sémantiques HTML5 appropriés :

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

### 2. Hiérarchie des titres

Maintenir une structure de titre appropriée :

```astro
<h1>Page Title (only one per page)</h1>
  <h2>Main Section</h2>
    <h3>Subsection</h3>
    <h3>Another Subsection</h3>
  <h2>Another Main Section</h2>
```

### 3. Liens internes

Construisez une structure de liens internes solide :

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

## Surveillance et analyses

### 1. Console de recherche Google

Configurez la Search Console pour surveiller :
- Couverture indicielle
- Performances de recherche
- Éléments essentiels du Web
- Utilisabilité mobile
- Problèmes de sécurité

### 2. Suivi des performances

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

## Liste de contrôle SEO

### Pré-lancement

- [ ] Définir l'URL `site` dans `astro.config.mjs`
- [ ] Installer et configurer `@astrojs/sitemap`
- [ ] Créer un fichier `robots.txt`
- [ ] Ajouter des balises méta à toutes les pages
- [ ] Implémenter les URL canoniques de manière cohérente
- [ ] Ajouter des données structurées (JSON-LD) le cas échéant
- [ ] Optimiser toutes les images (WebP, tailles appropriées, texte alternatif)
- [ ] Tester la réactivité mobile
- [ ] Valider les données structurées avec Google Rich Results Test
- [ ] Vérifier que tous les liens internes fonctionnent
- [ ] Configurer la page 404
- [ ] Configurer les en-têtes de cache appropriés

### Post-lancement

- [ ] Soumettre le plan du site à Google Search Console
- [ ] Soumettre le plan du site aux outils pour les webmasters Bing
- [ ] Surveiller les éléments essentiels du Web
- [ ] Vérifier la couverture de l'index dans la Search Console
- [ ] Mettre en place un suivi des performances
- [ ] Tester la vitesse des pages avec PageSpeed Insights
- [ ] Vérifier les aperçus des réseaux sociaux (Twitter, LinkedIn, Facebook)

### En cours

- [ ] Surveiller les classements de recherche
- [ ] Mettre à jour le contenu régulièrement
- [ ] Ajouter un nouveau contenu avec des métadonnées SEO appropriées
- [ ] Corriger les erreurs d'exploration
- [ ] Surveiller et améliorer Core Web Vitals
- [ ] Mettre à jour les données structurées si nécessaire
- [ ] Créer des backlinks de qualité
- [ ] Actualiser l'ancien contenu

---

## Outils et ressources

### Validation et tests
- [Test des résultats enrichis Google](https://search.google.com/test/rich-results)
- [Validateur Schema.org](https://validator.schema.org/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Test d'optimisation mobile](https://search.google.com/test/mobile-friendly)
- [Validateur de carte Twitter](https://cards-dev.twitter.com/validator)
- [Débogueur de partage Facebook](https://developers.facebook.com/tools/debug/)

### Surveillance
- [Google Search Console](https://search.google.com/search-console)
- [Outils Bing pour les webmasters](https://www.bing.com/webmasters)
- [Cloudflare Analytics](https://www.cloudflare.com/analytics/)

### Forfaits SEO
- [@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- [astro-robots-txt](https://www.npmjs.com/package/astro-robots-txt)
- [astro-seo](https://github.com/jonasmerlin/astro-seo) - Bibliothèque de composants SEO alternatifs

---

## Conseils de pro

1. **Utiliser la RSS/SSG de manière stratégique**
   - Statique (SSG) pour le contenu qui change rarement
   - Serveur (SSR) pour un contenu dynamique et personnalisé
   - Mode hybride pour mélanger les deux approches

2. **La cohérence canonique est essentielle**
   - Utilisez toujours des URL absolues
   - Assurer la cohérence des barres obliques finales
   - Testez toutes les pages pour les balises canoniques appropriées

3. **Spécifique au commerce électronique**
   - Utiliser des versions statiques pour les pages de catégories
   - Utiliser SSR pour la disponibilité des produits
   - Implémenter le schéma produit sur toutes les pages produits
   - Ajouter un schéma de révision lorsqu'il est disponible

4. **Approche axée sur le contenu**
   - Écrivez d'abord du contenu pour les humains
   - Structurer le contenu avec des titres appropriés
   - Utilisez un texte de lien descriptif (évitez « cliquez ici »)
   - Ajoutez un texte alternatif qui décrit l'image, pas seulement des mots-clés

5. **Le mobile d'abord**
   - Concevoir pour le mobile d'abord
   - Test sur des appareils réels
   - Optimiser pour les interactions tactiles
   - Assurez-vous que le texte est lisible sans zoomer

6. **La vitesse des pages compte**
   - Réduire JavaScript
   - Utilisez l'hydratation partielle d'Astro de manière stratégique
   - Optimiser les images de manière agressive
   - Tirez parti du CDN de Cloudflare

---

## Pièges courants à éviter

1. **URL canoniques manquantes** - Définissez toujours des URL canoniques pour éviter les pénalités de contenu en double
2. ** Barres obliques finales incohérentes ** - Choisissez une convention et respectez-la
3. **Texte alternatif manquant** - Chaque image doit avoir un texte alternatif descriptif
4. **Méta descriptions en double** - Rédigez des descriptions uniques pour chaque page
5. **Ignorer le mobile** - L'indexation axée sur le mobile signifie que l'expérience mobile compte le plus
6. **Vitesse lente des pages** – Les performances ont un impact direct sur les classements SEO
7. **Données structurées manquantes** – Ne manquez pas les extraits enrichis
8. **Pas de plan du site** – Faites en sorte que les moteurs de recherche découvrent facilement votre contenu
9. **Liens internes brisés** - Auditez et corrigez régulièrement les liens rompus
10. **Ne surveille pas la Search Console** - Restez au courant des erreurs et des problèmes d'exploration

---

## Prochaines étapes

1. **Auditez votre site actuel** : parcourez la liste de contrôle ci-dessus
2. **Implémenter les composants manquants** : commencez par les balises méta, le plan du site et le fichier robots.txt
3. **Ajouter des données structurées** : implémentez des schémas pertinents pour votre type de contenu
4. **Surveiller les performances** : configurer la Search Console et les analyses
5. **Itérer et améliorer** : le référencement est en cours – continuez à optimiser

---

**Documentation connexe :**
- [Fenod Stack README](./) - Documentation de la pile principale
- [Guide de stratégie de développement](/fr/development-strategy/) - Workflow axé sur l'interface utilisateur

**Dernière mise à jour :** janvier 2025
