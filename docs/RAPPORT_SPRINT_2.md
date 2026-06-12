# Rapport d'implémentation — Sprint 2 | MAFATEC Solar

Ce document résume les fonctionnalités implémentées dans le cadre du **Sprint 2** pour l'application d'étude de production photovoltaïque.

## 1. Système de "Gating" (MAFA-201)
Un mécanisme de restriction d'accès aux données sensibles a été mis en place pour encourager la conversion des prospects.
- **KPIs Masqués :** Les trois chiffres clés (Production annuelle, Irradiation, Variabilité) sont floutés par défaut. Un bouton "Voir cette information" déclenche la popup de capture de lead.
- **Tableau Mensuel Limité :** Le tableau de production est restreint aux 3 premiers mois. Un bouton de déverrouillage est présent au bas du tableau.
- **Éléments Visuels Floutés :** Le calepinage, les courbes de production et le diagramme solaire sont protégés par un filtre de flou et un overlay explicatif.
- **Persistance :** Une fois déverrouillée, l'étude reste accessible pour l'utilisateur durant sa session (via `localStorage`).

## 2. Popup de Capture de Lead en 3 Étapes (MAFA-202)
Une nouvelle modal interactive gère le processus d'identification :
- **Étape 1 (Profil) :** Choix entre l'univers "Particulier" (résidence) et "Professionnel" (entreprise).
- **Étape 2 (Formulaire) :** Collecte du prénom, nom, email et nom de l'entreprise (uniquement pour le profil Pro). Validation en temps réel des champs.
- **Étape 3 (Confirmation) :** Message de succès confirmant l'envoi de l'étude par email.

## 3. Confirmation et Nouvelle Étude (MAFA-203)
- **Message de Succès :** Après validation, l'utilisateur voit un écran de confirmation clair.
- **Bouton "Nouvelle étude" :** Permet de réinitialiser complètement l'interface pour lancer une nouvelle simulation.
- **Action de Téléchargement :** Le bouton de téléchargement du rapport PDF déclenche désormais automatiquement la popup si l'étude n'est pas encore déverrouillée.

## 4. Outils de Configuration (MAFA-204)
- **Calculateur de Chute de Tension :** Intégration complète avec affichage clair des résultats (V, %, Ω) et option "Modifier le calcul".
- **Outil de Calepinage :** Intégration de l'interface de planification de toiture.
- **Gestion des Obstacles :** Section dédiée pour définir manuellement les masques d'ombrage.

## 5. Identité de Marque et Design (MAFA-205)
- **Badges de Profil :** Affichage du badge "Particulier" ou "Professionnel" avec icône dédiée dans l'en-tête des résultats une fois déverrouillés.
- **Typographie et Couleurs :** Alignement avec la charte graphique MAFATEC (utilisation du rouge #c93b18, police Spectral pour les titres).
- **Épuration Visuelle :** Suppression des ombres portées inutiles sur les cartes de configuration pour un aspect plus moderne et "flat".

---
*L'ensemble de ces fonctionnalités respecte les spécifications fournies dans la maquette MVP et la roadmap du projet.*
