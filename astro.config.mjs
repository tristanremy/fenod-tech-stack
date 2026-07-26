import { defineConfig } from 'astro/config';
import UnoCSS from '@unocss/astro';
import Icons from 'starlight-plugin-icons';

export default defineConfig({
  site: 'https://stack.fenod.fr',
  integrations: [
    UnoCSS(),
    ...Icons({
      sidebar: true,
      extractSafelist: true,
      starlight: {
        title: 'Fenod Stack',
        description: 'The Fenod operating handbook for building Cloudflare-first apps with modern TypeScript and AI agents.',
        favicon: '/favicon.svg',
        components: {
          SiteTitle: './src/components/FenodSiteTitle.astro',
          ThemeProvider: './src/components/DarkThemeProvider.astro',
        },
        head: [
          { tag: 'script', attrs: { src: '/diagram-lightbox.js', defer: true } },
        ],

        locales: {
          root: {
            label: 'English',
            lang: 'en',
          },
          fr: {
            label: 'Français',
            lang: 'fr',
          },
        },
        social: [
          { icon: 'github', label: 'GitHub', href: 'https://github.com/tristanremy/fenod-tech-stack' },
        ],
        sidebar: [
          {
            label: 'Law',
            translations: { fr: 'Loi' },
            items: [
              { icon: 'i-ph:house-duotone', label: 'Hub', link: '/' },
              { icon: 'i-ph:scroll-duotone', label: 'Stack Contract', link: '/stack-contract/' },
              { icon: 'i-ph:map-pin-duotone', label: 'AI Index', link: '/ai-index/' },
              { icon: 'i-ph:robot-duotone', label: 'Agent Operating Contract', link: '/agent-operating-contract/' },
              { icon: 'i-ph:warning-duotone', label: 'Gotchas', link: '/gotchas/' },
              { icon: 'i-ph:cooking-pot-duotone', label: 'Recipes', link: '/recipes/' },
              { icon: 'i-ph:stack-duotone', label: 'Stack Overview', link: '/stack-overview/' },
            ],
          },
          {
            label: 'Build',
            translations: { fr: 'Construire' },
            items: [
              { icon: 'i-ph:toolbox-duotone', label: 'Tooling', link: '/tooling/' },
              { icon: 'i-ph:test-tube-duotone', label: 'Testing', link: '/testing/' },
              { icon: 'i-ph:flask-duotone', label: 'TDD with AI', link: '/tdd-with-ai/' },
              { icon: 'i-ph:react-logo-duotone', label: 'React Best Practices', link: '/react-best-practices/' },
              { icon: 'i-ph:bug-duotone', label: 'Debugging', link: '/debugging/' },
              { icon: 'i-ph:database-duotone', label: 'TanStack Data Fetching', link: '/tanstack-data-fetching/' },
            ],
          },
          {
            label: 'Ship',
            translations: { fr: 'Déployer' },
            items: [
              { icon: 'i-ph:rocket-launch-duotone', label: 'Deployment', link: '/deployment/' },
              { icon: 'i-ph:vault-duotone', label: 'Environment & Secrets', link: '/environment-secrets/' },
              { icon: 'i-ph:key-duotone', label: 'Cloudflare API Tokens', link: '/cloudflare-api-tokens/' },
              { icon: 'i-ph:heartbeat-duotone', label: 'Observability', link: '/observability/' },
              { icon: 'i-ph:shield-star-duotone', label: 'Security Model', link: '/security-model/' },
              { icon: 'i-ph:envelope-duotone', label: 'Email', link: '/email/' },
              { icon: 'i-ph:cpu-duotone', label: 'Cloudflare Compute', link: '/cloudflare-compute/' },
            ],
          },
          {
            label: 'AI & platform',
            translations: { fr: 'IA & plateforme' },
            items: [
              { icon: 'i-ph:git-branch-duotone', label: 'AI Development Workflow', link: '/ai-development-workflow/' },
              { icon: 'i-ph:brain-duotone', label: 'AI Providers', link: '/ai-providers/' },
              { icon: 'i-ph:plugs-connected-duotone', label: 'MCP Guide', link: '/mcp-guide/' },
              { icon: 'i-ph:sparkle-duotone', label: 'Cloudflare Enhancements', link: '/cloudflare-enhancements/' },
              { icon: 'i-ph:chart-line-up-duotone', label: 'Rybbit Analytics', link: '/rybbit-analytics/' },
              { icon: 'i-ph:magnifying-glass-duotone', label: 'Astro SEO Guide', link: '/astro-seo-guide/' },
              { icon: 'i-ph:book-bookmark-duotone', label: 'Decisions', link: '/decisions/' },
              { icon: 'i-ph:calendar-check-duotone', label: 'Freshness Policy', link: '/freshness/' },
              { icon: 'i-ph:terminal-window-duotone', label: 'Local Toolchain', link: '/local-toolchain/' },
            ],
          },
          {
            label: 'Depth (not law)',
            translations: { fr: 'Profondeur (pas la loi)' },
            collapsed: true,
            items: [
              { icon: 'i-ph:map-trifold-duotone', label: 'Development Strategy', link: '/development-strategy/' },
              { icon: 'i-ph:arrow-square-in-duotone', label: 'Migration Guide', link: '/migration/' },
              { icon: 'i-ph:code-duotone', label: 'Code Patterns', link: '/code-patterns/' },
              { icon: 'i-ph:trend-up-duotone', label: 'App Improvement Guide', link: '/app-improvement-guide/' },
              { icon: 'i-ph:wifi-slash-duotone', label: 'Offline-First Guide', link: '/offline-first-guide/' },
            ],
          },
        ],
        customCss: ['./src/styles/starlight.css'],
      },
    }),
  ],
});
