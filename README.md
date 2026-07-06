# Netix Paie

**Logiciel de gestion de paie algérienne** — conforme CIDTA / LF 2024 / Loi n°90-11.

Application web full-stack destinée aux entreprises et gestionnaires RH algériens pour calculer, enregistrer et éditer des bulletins de paie mensuels en dinars algériens (DA).

🌐 **Démo en ligne :** [netix-paie.vercel.app](https://netix-paie.vercel.app)

---

## Fonctionnalités

### Calcul de paie
- Salaire de base réel après proratisation des absences (maladie, mise à pied, accident de travail, retard, absence irrégulière)
- Heures supplémentaires sur 3 paliers de majoration (×1.5 / ×1.75 / ×2.0)
- Primes et indemnités : I.E.P, Nuisance, Responsabilité, Disponibilité, P.R.I, P.R.C, I.C.R, Panier, prime fixe libre
- **402 rubriques du catalogue Hydrocanal** (gains et retenues) configurables par salarié

### Cotisations et impôt
- **CNAS salariale (9 %)** — base cotisable conforme à l'article 74 de la loi n°83-11 (panier et avantages non cotisables exclus)
- **IRG barème progressif** — 6 tranches mensuelles (Art. 104 CIDTA, LF 2022 / Art. 31) avec abattement légal de 40 % (plancher 1 000 DA / plafond 1 500 DA)
- Seuil d'exonération totale à 30 000 DA/mois
- Coût total employeur (cotisation patronale CNAS 26 %)

### Gestion des salariés
- Fiche salarié (matricule, fonction, salaire de base théorique)
- Activation / désactivation (soft delete — historique conservé)
- Rubriques du catalogue configurables par salarié (valeurs par défaut mémorisées)

### Bulletins et PDF
- Enregistrement mensuel avec upsert (recalcul non destructif)
- Historique complet par salarié
- **Export PDF** : bulletin salarié et variante employeur (avec charges patronales)
- Génération à la volée via `@react-pdf/renderer` — aucune dépendance système

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions) |
| Langage | TypeScript 5 |
| Base de données | Supabase (PostgreSQL) |
| PDF | @react-pdf/renderer 4 |
| Style | Tailwind CSS 4 |
| Déploiement | Vercel |

---

## Architecture

```
app/
├── salaries/
│   ├── [id]/
│   │   ├── bulletin/          # Formulaire de saisie mensuelle
│   │   │   └── pdf/           # Route API → PDF inline
│   │   ├── historique/        # Liste des bulletins passés
│   │   ├── modifier/          # Édition fiche salarié
│   │   └── rubriques/         # Sélection des rubriques catalogue
│   └── actions.ts             # Server Actions (CRUD + calcul + PDF)
├── rubriques/                 # Catalogue des 402 rubriques
├── parametres/                # SNMG, barème IRG, taux CNAS
└── historique/                # Vue globale tous salariés

lib/
├── paieCalcul.ts              # Moteur de calcul (pur, sans effets de bord)
├── pdfBulletin.tsx            # Composant @react-pdf/renderer
├── rubriquesDynamiques.ts     # Résolution des rubriques catalogue
└── supabaseClient.ts
```

Le moteur `lib/paieCalcul.ts` est **pur** : il ne touche pas à la base de données et peut être testé indépendamment. La cascade de calcul suit le schéma suivant :

```
Salaire de base théorique
  → proratisation absences → Salaire de base réel
  → + heures sup + primes + rubriques gains
  → Total brut
  → − éléments non cotisables → Base CNAS → Retenue CNAS (9 %)
  → Total brut − CNAS → Base IRG → IRG brut → − abattement 40 % → IRG net
  → Net à payer = Total brut − Total retenues
```

---

## Cadre légal

| Texte | Disposition couverte |
|:---|:---|
| CIDTA — Art. 104 | Barème IRG progressif + abattement salarial 40 % |
| Loi n°83-11 — Art. 52 | Taux CNAS salariale : 9 % |
| Loi n°83-11 — Art. 74 | Assiette cotisable (exclusions panier, transport…) |
| Loi n°90-11 | Code du travail (durée légale, contrat) |
| LF 2022 — Art. 31 | Barème IRG actuel (6 tranches) |
| Décret exécutif n°24-01 | SNMG 24 000 DA / seuil exonération IRG 30 000 DA |

---

## Installation locale

**Prérequis :** Node.js 20+, un projet Supabase avec les tables `salaries`, `bulletins`, `bulletin_rubriques`, `rubriques_catalogue`, `salarie_rubriques`, `parametres`.

```bash
git clone https://github.com/kheireddine178/netix-paie.git
cd netix-paie
npm install
cp .env.local.example .env.local
# Renseigner NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

---

## Variables d'environnement

```env
NEXT_PUBLIC_SUPABASE_URL=https://<projet>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clé_anon>
```

---

*Netix Paie — Calcul de paie algérienne conforme · Développé avec Next.js et Supabase*
