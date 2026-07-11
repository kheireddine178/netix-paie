# Netix SIRH (Systeme d'Information des Ressources Humaines)

**Logiciel de gestion de paie algerienne et SIRH Complet** — conforme au CIDTA, a la loi n°90-11, a la loi n°83-11 et aux dernieres Lois de Finances (LF 2024 / LF 2026).

Application web full-stack destinee aux entreprises et gestionnaires RH algeriens pour gerer les collaborateurs, editer la paie, suivre les carrieres et permettre le self-service salarie.

**Demo en ligne :** [netix-paie.vercel.app](https://netix-paie.vercel.app)

---

## Les 7 Modules Fonctionnels

### 1. Module Paie & Bulletins
- **Calcul en cascade** : salaire de base reel proratise selon les absences, heures supplementaires (3 paliers), IEP, nuisance, responsabilite, panier et ICR.
- **Cotisations et impots** : Retenue CNAS 9% (base cotisable conforme a l'Art. 74 de la loi n°83-11) et IRG au bareme progressif avec abattement de 40% (Art. 104 du CIDTA).
- **Catalogue Hydrocanal** : Gestion de 402 rubriques dynamiques de gains et retenues.
- **Export PDF** : Bulletins de paie individuels (variante Salarie et Variante Employeur).

### 2. Module Contrats & Dossier Collaborateur (HR Core)
- **Suivi des contrats** : Enregistrement des CDI, CDD, CTA, SIVP, periodes d'essai et avenants.
- **Dossier documentaire** : Televersement securise de pieces justificatives (CNI, diplome, contrat physique signe) classees par categorie.
- **Generateur PDF** : Edition automatique du **PV d'installation** a l'embauche et de l'**Attestation de travail** avec calcul d'anciennete.

### 3. Module Absences & Conges (Time & Attendance)
- **Compteurs automatiques** : Calcul de l'acquisition des conges (2.5 jours par mois travaille), conges pris, et reliquat de solde (loi algerienne).
- **Workflow d'approbation** : Soumission des demandes par le salarie et validation/rejet par la RH.
- **Liaison Paie** : Les absences maladie et sans solde approuvees s'injectent automatiquement sous forme d'heures d'absences dans la saisie mensuelle de la paie pour deduire le salaire.

### 4. Module Deplacements & Missions
- **Ordres de mission** : Enregistrement de l'objet, de la destination, des dates de mission et du moyen de transport.
- **Edition PDF** : Generation en un clic de l'**Ordre de Mission** officiel.

### 5. Module Carriere & Discipline (Promotions & Sanctions)
- **Promotions** : Historique d'evolution de poste avec **mise a jour automatique synchrone** de la fonction et du salaire de base du salarie. PDF de Decision de Promotion.
- **Discipline** : Enregistrement des avertissements, blames et mises a pied. PDF de Lettre de Notification de Sanction.

### 6. Module Formations & Evaluations (Talent)
- **Catalogue de formation** : Catalogue interne des cours, duree, couts et inscriptions des salaries.
- **Evaluation annuelle** : Formulaire d'entretien de fin d'annee et impression du document PDF de **Fiche d'Evaluation de Performance**.

### 7. Module Portail Salarie (Employee Self-Service)
- Espace personnel securise pour le collaborateur.
- L'employe peut suivre ses compteurs de conges, soumettre ses demandes de conge ou de mission, et telecharger lui-meme l'historique de ses bulletins de paie en PDF.

---

## Initialisation de la Base de Donnees (Supabase)

Pour configurer votre base de donnees en ligne ou locale, executez le script SQL contenu dans le fichier [schema_sirh.sql](schema_sirh.sql) directement dans l'editeur de requetes SQL (SQL Editor) de votre console **Supabase**.

Ce script va creer et configurer automatiquement les tables de donnees suivantes :
- `contrats` (Contrats de travail)
- `documents_salaries` (Dossiers documentaires)
- `conges` (Suivi des absences)
- `missions` (Ordres de mission)
- `promotions` (Carriere)
- `sanctions` (Dossier disciplinaire)
- `formations` et `formations_inscriptions` (Competences)

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions) |
| Langage | TypeScript 5 |
| Base de donnees | Supabase (PostgreSQL) |
| Moteur PDF | @react-pdf/renderer 4 |
| Styling | Vanilla CSS premium (Aesthetics Expert) |
| Deploiement | Vercel |

---

## Installation locale

**Prerequis :** Node.js 20+

```bash
git clone https://github.com/kheireddine178/netix-paie.git
cd netix-paie
npm install
cp .env.local.example .env.local
# Renseigner vos cles d'acces dans .env.local
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

---

*Netix SIRH — Solution complete de Gestion RH et de Paie conforme a la reglementation algerienne.*
