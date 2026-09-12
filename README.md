# Grilles de nombres

Jeu de concentration : trouvez le nombre mystère dans une grille mélangée.

Stack : React + Vite + Tailwind CSS v4 (pur, sans dépendance UI kit), lucide-react pour les icônes, framer-motion pour les animations.

## Démarrer

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Fonctionnalités
- Grille configurable (préréglages 5×5 à 12×12, ou dimensions libres 2–20)
- 3 niveaux visuels (taille/contraste des chiffres)
- Chronomètre avec démarrer/pause/arrêter/réinitialiser
- Marquage de cases, détection automatique du nombre mystère
- Export PNG de la grille, impression PDF, mode plein écran
- Thème clair/sombre persistant (localStorage)
