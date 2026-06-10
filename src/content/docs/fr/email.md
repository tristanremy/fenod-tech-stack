---
title: "Email"
verified: 2026-06
---

[Disponible en anglais](/fr/email/)

Utilisez les primitives email selon leur direction : routage entrant, livraison transactionnelle ou marketing de cycle de vie. Ne forcez pas un seul outil à faire les trois métiers.

## Décision par défaut

![Carte de decision email](/diagrams/email-decision-map-fr.svg)

| Besoin | Défaut | Pourquoi |
|------|---------|-----|
| Alias et routage entrants | Cloudflare Email Routing | Peu coûteux, natif au domaine, transfert simple |
| Workflows email entrants | Cloudflare Email Workers | Parser, valider et broker l’email vers les systèmes applicatifs |
| Sortant transactionnel | Resend ou Postmark | Meilleure délivrabilité, templates, webhooks et support |
| Cycle de vie/marketing | Loops, Customer.io ou similaire | Segments, campagnes, parcours, gestion du désabonnement |
| Email déclenché par agent | File app/broker + politique d’approbation | Empêche les agents d’envoyer directement des emails arbitraires |

## Cloudflare Email Routing

À utiliser pour :

- alias de contact comme `hello@domain.com`
- transfert de comptes de rôle vers une boîte humaine
- prise en charge support légère
- routage des messages entrants vers un Email Worker

À éviter pour :

- emails transactionnels produit
- newsletters
- automatisations marketing
- workflows de boîte/collaboration

## Pattern Email Workers

Les Email Workers sont la bonne primitive quand le courrier entrant doit devenir de la donnée applicative structurée.

![Workflow email avec agent](/diagrams/email-agent-workflow-fr.svg)

```txt
Inbound email
→ Cloudflare Email Worker
→ validate sender/domain/size/attachments
→ optionally store raw `.eml` in R2
→ write normalized event to Queue/D1
→ app or agent processes structured task
```

Garde-fous recommandés :

- rejeter tôt les expéditeurs ou domaines inattendus
- plafonner la taille des messages et le nombre de pièces jointes
- stocker l’email brut dans R2 seulement quand c’est nécessaire pour l’audit/débogage
- supprimer ou sandboxer le HTML avant affichage
- normaliser l’email en événement typé avant que les agents le voient
- ne jamais exposer d’identifiants de boîte mail aux agents

## Sortant transactionnel

Utilisez Resend ou Postmark pour :

- emails de vérification
- magic links
- réinitialisation de mot de passe
- factures/reçus
- notifications applicatives
- livraisons importantes côté utilisateur où les bounces/webhooks comptent

Gardez les clés fournisseur côté serveur uniquement. Préférez Cloudflare AI Gateway BYOK pour les clés de modèles, mais les fournisseurs email exigent généralement encore des secrets serveur ordinaires. Stockez-les dans Infisical/Bitwarden et synchronisez uniquement le secret runtime nécessaire vers le Worker.

```txt
RESEND_API_KEY=
EMAIL_FROM=noreply@example.com
```

## Sortant compatible agents

Les agents ne doivent pas appeler directement les fournisseurs email. Placez l’email derrière une politique applicative.

```txt
Agent proposes email
→ app validates recipient/template/purpose
→ optional human approval for external or high-risk recipients
→ Queue job
→ server-side sender uses Resend/Postmark
→ delivery result written to audit log
```

Gates de politique recommandés :

| Type d’email | Gate |
|------------|------|
| email de test interne | autoriser automatiquement en dev/staging |
| email transactionnel à l’utilisateur courant | autoriser si le template et le destinataire sont fixés par l’état applicatif |
| brouillon de réponse support | approbation humaine avant envoi |
| email marketing/en masse | workflow d’outil marketing, jamais envoi brut par agent |
| destinataire externe inconnu | approbation humaine |

## Défauts de délivrabilité

Pour tout domaine qui envoie des emails sortants :

- configurer SPF
- configurer DKIM
- configurer DMARC, d’abord `p=none`, puis durcir plus tard
- utiliser un sous-domaine d’envoi dédié quand c’est utile, par exemple `mail.example.com`
- surveiller les bounces et plaintes
- conserver la gestion du désabonnement pour tout email non transactionnel

## Cloudflare vs fournisseur email

Cloudflare doit posséder le routage entrant et les workflows edge. Resend/Postmark doivent posséder la délivrabilité sortante. Les outils marketing doivent posséder les campagnes et audiences. L’app coordonne entre eux.

## Guides liés

- [Environment and Secrets](/fr/environment-secrets/)
- [Cloudflare API Tokens](/fr/cloudflare-api-tokens/)
- [Security Model](/fr/security-model/)
