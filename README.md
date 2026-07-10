# Netix SIRH (Système d'Information des Ressources Humaines)

**Logiciel de gestion de paie algérienne et SIRH Complet** — conforme au CIDTA, à la loi n°90-11, à la loi n°83-11 et aux dernières Lois de Finances (LF 2024 / LF 2026).

Application web full-stack destinée aux entreprises et gestionnaires RH algériens pour gérer les collaborateurs, éditer la paie, suivre les carrières et permettre le self-service salarié.

🌐 **Démo en ligne :** [netix-paie.vercel.app](https://netix-paie.vercel.app)

---

## 🏛️ Les 7 Modules Fonctionnels

### 1. 🧮 Module Paie & Bulletins
- **Calcul en cascade** : salaire de base réel proratisé selon les absences, heures supplémentaires (3 paliers), IEP, nuisance, responsabilité, panier et ICR.
- **Cotisations et impôts** : Retenue CNAS 9% (base cotisable conforme à l'Art. 74 de la loi n°83-11) et IRG au barème progressif avec abattement de 40% (Art. 104 du CIDTA).
- **Catalogue Hydrocanal** : Gestion de 402 rubriques dynamiques de gains et retenues.
- **Export PDF** : Bulletins de paie individuels (variante Salarié et Variante Employeur).

### 2. 📂 Module Contrats & Dossier Collaborateur (HR Core)
- **Suivi des contrats** : Enregistrement des CDI, CDD, CTA, SIVP, périodes d'essai et avenants.
- **Dossier documentaire** : Téléversement sécurisé de pièces justificatives (CNI, diplôme, contrat physique signé) classées par catégorie.
- **Générateur PDF** : Édition automatique du **PV d'installation** à l'embauche et de l'**Attestation de travail** avec calcul d'ancienneté.

### 3. 📅 Module Absences & Congés (Time & Attendance)
- **Compteurs automatiques** : Calcul de l'acquisition des congés (2.5 jours par mois travaillé), congés pris, et reliquat de solde (loi algérienne).
- **Workflow d'approbation** : Soumission des demandes par le salarié et validation/rejet par la RH.
- **Liaison Paie** : Les absences maladie et sans solde approuvées s'injectent automatiquement sous forme d'heures d'absences dans la saisie mensuelle de la paie pour déduire le salaire.

### 4. ✈️ Module Déplacements & Missions
- **Ordres de mission** : Enregistrement de l'objet, de la destination, des dates de mission et du moyen de transport.
- **Édition PDF** : Génération en un clic de l'**Ordre de Mission** officiel.

### 5. 📈 Module Carrière & Discipline (Promotions & Sanctions)
- **Promotions** : Historique d'évolution de poste avec **mise à jour automatique synchrone** de la fonction et du salaire de base du salarié. PDF de Décision de Promotion.
- **Discipline** : Enregistrement des avertissements, blâmes et mises à pied. PDF de Lettre de Notification de Sanction.

### 6. 🎓 Module Formations & Évaluations (Talent)
- **Catalogue de formation** : Catalogue interne des cours, durée, coûts et inscriptions des salariés.
- **Évaluation annuelle** : Formulaire d'entretien de fin d'année et impression du document PDF de **Fiche d'Évaluation de Performance**.

### 7. 🔑 Module Portail Salarié (Employee Self-Service)
- Espace personnel sécurisé pour le collaborateur.
- L'employé peut suivre ses compteurs de congés, soumettre ses demandes de congé ou de mission, et télécharger lui-même l'historique de ses bulletins de paie en PDF.

---

## 🗄️ Initialisation de la Base de Données (Supabase)

Pour configurer votre base de données en ligne ou locale, exécutez le script SQL contenu dans le fichier [schema_sirh.sql](schema_sirh.sql) directement dans l'éditeur de requêtes SQL (SQL Editor) de votre console **Supabase**.

Ce script va créer et configurer automatiquement les tables de données suivantes :
- `contrats` (Contrats de travail)
- `documents_salaries` (Dossiers documentaires)
- `conges` (Suivi des absences)
- `missions` (Ordres de mission)
- `promotions` (Carrière)
- `sanctions` (Dossier disciplinaire)
- `formations` et `formations_inscriptions` (Compétences)

---

## 🛠️ Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions) |
| Langage | TypeScript 5 |
| Base de données | Supabase (PostgreSQL) |
| Moteur PDF | @react-pdf/renderer 4 |
| Styling | Vanilla CSS premium (Aesthetics Expert) |
| Déploiement | Vercel |

---

## 🛠️ Installation locale

**Prérequis :** Node.js 20+

```bash
git clone https://github.com/kheireddine178/netix-paie.git
cd netix-paie
npm install
cp .env.local.example .env.local
# Renseigner vos clés d'accès dans .env.local
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

---

*Netix SIRH — Solution complète de Gestion RH et de Paie conforme à la réglementation algérienne.*
