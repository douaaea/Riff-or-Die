# Riff or Die

Riff or Die est un jeu de survie dans lequel le joueur incarne Mr. Buffa, un personnage qui doit collecter des notes de musique tout en évitant une horde de zombies qui le poursuivent sans relâche. Le jeu se déroule dans une forêt parsemée d'obstacles (arbres et pierres) et de zones spéciales qui modifient la vitesse du joueur. L'objectif est de ramasser un certain nombre de notes avant de se faire attraper par les zombies. Le gameplay repose sur des comportements d'intelligence artificielle (steering behaviors) qui donnent aux zombies un comportement réaliste et imprévisible.

## Règles du jeu

L'objectif est de collecter 10 notes de musique. La victoire intervient lorsque ce quota est atteint, la défaite si un zombie touche le joueur. Un système de combo récompense les collectes rapides : le multiplicateur augmente jusqu'à 5x et diminue progressivement si le joueur met trop de temps entre deux notes.

La difficulté augmente avec le temps : les zombies apparaissent plus fréquemment et deviennent progressivement plus rapides. Le joueur peut ramasser des power-ups (dash, bouclier guitare, ralentissement du temps) pour faciliter sa survie.

## Contrôles du joueur

**Déplacement** : Déplacer la souris. Mr. Buffa suit automatiquement le curseur grâce au comportement de steering "arrive" qui le fait ralentir progressivement en s'approchant, offrant un contrôle fluide et précis.

**Dash** : Touche Espace ou clic gauche. Téléporte instantanément le joueur vers la position de la souris sur une distance maximale de 150 pixels. Temps de recharge : 3 secondes (180 frames). Génère 20 particules jaunes pour le feedback visuel. Disponible dès le début et rechargeable via power-up.

**Mode Debug** : Touche D. Active/désactive l'affichage des cercles de collision, des lignes de direction et des zones de détection pour tous les véhicules. Utile pour visualiser les comportements de steering en temps réel.

Affichage en mode debug :

| Behavior | Couleur | Affichage |
|----------|---------|-----------|
| Seek | Vert | Ligne + point vers la cible |
| Flee | Rouge | Ligne + cercle pour éviter |
| Arrive | Cyan | Ligne + cercle du slowRadius |
| Pursue | Jaune | Ligne vers position prédite |
| Evade | Rouge | Ligne vers position prédite (évitement) |
| Wander | Vert | Cercle + point de wander |
| Separation | Orange | Lignes entre véhicules + cercle |
| Obstacle Avoidance | Magenta | Point "ahead" + obstacle proche |
| Boundaries | Rouge pâle | Rectangle des limites |

**Power-ups** : Collecte automatique par collision.

- **Dash (Thunder jaune)** : Recharge instantanément le dash + 500 points
- **Guitare (Rouge)** : Active un bouclier protecteur pendant 5 secondes (300 frames). Trois orbes rouges tournent autour du joueur et le protègent des collisions avec les zombies + 500 points
- **Chrono (Magenta)** : Ralentit tous les zombies pendant 4 secondes (240 frames), réduisant leur vitesse pour faciliter la navigation + 500 points

## Architecture générale du projet

Le projet est organisé en plusieurs fichiers HTML et JavaScript qui gèrent respectivement les différents états du jeu et la logique de gameplay.

Le fichier **intro.html** est le point d'entrée du jeu. Il affiche l'écran d'accueil avec le titre, une description de l'univers et un bouton "Commencer" qui redirige vers rules.html.

Le fichier **rules.html** présente les règles détaillées du jeu (contrôles, objectif, zombies, power-ups, système de combo). Un bouton "Jouer" lance la partie en redirigeant vers le canvas p5.js principal.

Le fichier **sketch.js** est le cœur du jeu : il contient la boucle de jeu principale (fonction draw), la gestion des états (menu, playing, gameover, victory), le système de spawn des entités (zombies, notes, power-ups), la détection des collisions et la mise à jour de l'interface utilisateur. C'est également dans ce fichier que se trouve la fonction preload qui charge toutes les images du jeu.

Le fichier **vehicle.js** définit la classe Vehicle qui sert de classe de base pour toutes les entités mobiles. Elle contient l'implémentation des comportements de steering : seek, flee, arrive, pursue, wander, separation, obstacle avoidance et boundaries. Cette classe est héritée par Player, Zombie et PowerUp.

Le fichier **player.js** définit la classe Player qui hérite de Vehicle. Il gère les statistiques du joueur (score, combo, notes collectées), les power-ups actifs (dash, guitare, slow-motion), le système de traînée visuelle et l'affichage du sprite de Mr. Buffa avec son aura lumineuse.

Le fichier **zombie.js** définit la classe Zombie qui hérite également de Vehicle. Il gère les trois types de zombies (dangereux, type1, type2) avec des vitesses et apparences différentes, ainsi que la logique de poursuite du joueur combinée à l'évitement des autres zombies et des obstacles.

Le fichier **note.js** définit la classe Note qui représente les notes de musique à collecter. Chaque note possède des animations visuelles (pulsation, flottement, rotation) et une aura lumineuse violette pour attirer l'attention du joueur.

Le fichier **powerup.js** définit la classe PowerUp qui représente les bonus collectibles. Il gère trois types de power-ups (dash, guitare, chrono) avec des comportements d'errance et des animations visuelles distinctes pour chaque type.

Le fichier **obstacle.js** définit la classe Obstacle qui représente les éléments statiques du décor (arbres et pierres). Ces obstacles bloquent le passage et doivent être contournés par le joueur et les zombies grâce au comportement d'obstacle avoidance.

Le fichier **zone.js** définit la classe Zone qui représente les zones d'effet au sol. Il existe deux types de zones : les zones de boost (cyan, accélèrent le joueur) et les zones de ralentissement (orange, ralentissent le joueur). Chaque zone génère des particules décoratives qui s'élèvent du sol.

Le fichier **particle.js** définit la classe Particle utilisée pour créer des effets visuels (explosions lors de la collecte de notes, particules de décomposition des zombies, effets de dash). Les particules ont une durée de vie limitée et disparaissent progressivement grâce à un système d'opacité décroissante.

Les fichiers **win.html** et **gameover.html** affichent respectivement les écrans de victoire et de défaite avec les statistiques de la partie et un bouton pour rejouer.

Les fichiers **style.css** et **styles.css** contiennent les styles pour l'interface utilisateur, les écrans de menu et l'overlay de jeu (affichage du score, combo et power-ups en cours de partie).

## Les éléments du jeu

### Joueur (Player)

Le joueur contrôle Mr. Buffa, représenté par un sprite orienté selon sa direction de déplacement. Propriétés principales : position, vitesse maximale (7 par défaut, modulée par les zones), rayon de collision de 30 pixels, score, combo (1 à 5) et power-ups actifs.

La méthode applyBehaviors combine plusieurs forces : fuite des zombies proches (poids proportionnel à la distance), recherche de la note la plus proche si moins de 2 zombies à portée, suivi de la souris avec arrive, évitement des obstacles et boundaries. Une traînée visuelle de 15 points suit le joueur. Le bouclier guitare affiche trois orbes rouges tournants.

### Zombies

Trois types de zombies avec probabilités différentes : dangereux (15%, plus rapide, vitesse x1.3), type1 (42.5%, sprite vert standard) et type2 (42.5%, sprite alternatif). Tous héritent de Vehicle et utilisent les steering behaviors.

Quatre comportements simultanés : pursue (poids 1.5) pour traquer le joueur, separation (poids 2.0, rayon 50px) pour éviter l'agglutination, obstacle avoidance (poids 2) et boundaries (poids 1.5). Génèrent des particules vertes périodiquement. Un cercle rouge apparaît autour du zombie à moins de 100 pixels du joueur.

### Notes de musique

Objectifs principaux du jeu, trois sprites différents choisis aléatoirement (note2, note5, note6). Animations désynchronisées : pulsation de taille, flottement vertical, rotation continue à vitesse aléatoire.

À la collecte : compteur incrémenté, combo +0.5 (max 5), timer de combo réinitialisé à 180 frames (3 secondes), score +100 x combo actuel. La note disparaît et une nouvelle apparaît pour maintenir 10 notes disponibles.

### Power-ups

Trois types : dash (thunder jaune, recharge le dash + 500 points), guitare (rouge, bouclier 5 secondes + 500 points), chrono (magenta, ralenti 4 secondes + 500 points).

Apparaissent aléatoirement dans la zone centrale. Utilisent wander pour se déplacer lentement, combiné avec obstacle avoidance et boundaries. Aura colorée pulsante et rotation continue. Collecte par collision, effet immédiat, icône affichée dans l'UI.

### Obstacles

Éléments statiques bloquant le passage : arbre1, arbre2 (taille 2.5 x rayon) et pierre (taille 2 x rayon). Ombre au sol semi-transparente pour l'effet de relief. Sprite centré sans rotation.

Évités automatiquement via avoidObstacles : détection par projection d'un point "ahead" dans la direction du mouvement, calcul de l'obstacle le plus proche, force de répulsion perpendiculaire pour contournement fluide.

### Zones (Zone)

Cercles semi-transparents modifiant la vitesse du joueur : boost (cyan, flèche ↑, vitesse 10) et ralentissement (orange, flèche ↓, vitesse 3). Vitesse normale : 7.

Génèrent des particules décoratives ascendantes. Trois anneaux concentriques pulsants. Détection par rayon : si le joueur entre, vitesse modifiée immédiatement. Retour à la vitesse normale en sortant.

### Particules (Particle)

Éléments visuels purs. Propriétés : position, vitesse aléatoire, gravité légère, durée de vie (alpha 255 → 0 par -5/frame), couleur héritée, taille 3-8 pixels.

Générées lors : collecte de note (particules violettes), dash du joueur (20 particules jaunes), décomposition des zombies (particules vertes continues). Supprimées quand isDead retourne true (alpha ≤ 0).

## Behaviors et intelligence artificielle

La classe Vehicle contient tous les steering behaviors implémentés dans le jeu. Ces comportements permettent aux entités de se déplacer de manière autonome et réaliste en calculant des forces de déplacement appliquées à l'accélération. Voici les behaviors utilisés et leur application concrète :

### Seek

Le joueur utilise seek pour se diriger vers la note la plus proche lorsque moins de 2 zombies sont à portée (rayon de 150 pixels). Force pondérée à 1.5 pour une approche directe et efficace. Ce comportement calcule un vecteur désiré vers la cible à vitesse maximale.

### Flee

Le joueur utilise flee pour s'éloigner des zombies proches (détection dans un rayon de 150 pixels). Chaque zombie génère une force de fuite inversement proportionnelle à sa distance : poids variant de 3 (très proche) à 0.5 (150 pixels). Toutes les forces de fuite sont cumulées pour créer un mouvement d'évitement naturel.

### Arrive

Le joueur utilise arrive pour suivre la souris avec un rayon de ralentissement de 80 pixels et un poids de 2. Ce comportement calcule une vitesse désirée qui diminue progressivement en s'approchant de la cible, évitant les oscillations. Résultat : contrôle précis et fluide du personnage.

### Pursue

Les zombies utilisent pursue pour traquer le joueur en anticipant sa position future (poids 1.5). Le temps de prédiction est proportionnel à la distance : plus le joueur est loin, plus la prédiction regarde loin. Au lieu de viser la position actuelle, les zombies visent où sera le joueur dans quelques instants, rendant leur poursuite intelligente et menaçante.

### Wander

Les power-ups utilisent wander comme comportement principal (poids 1). Un cercle imaginaire est placé devant l'entité, un point aléatoire est choisi sur ce cercle en variant un angle à chaque frame. Résultat : mouvement organique qui change constamment de direction, rendant les power-ups vivants sans être statiques.

### Separation

Les zombies utilisent separation pour éviter de s'agglutiner (rayon 50 pixels, poids 2.0). Pour chaque zombie voisin, une force de répulsion est calculée inversement proportionnelle à la distance. Toutes ces forces sont moyennées pour obtenir une direction de fuite globale. Résultat : horde dispersée plus difficile à éviter et visuellement réaliste.

### Obstacle Avoidance

Le joueur (poids 2.5) et les zombies (poids 2) utilisent ce behavior pour naviguer dans la forêt. Un point "ahead" est projeté devant l'entité dans sa direction de déplacement, la distance de projection est proportionnelle à la vitesse. Un second point "ahead2" est calculé à mi-distance. Si ces points entrent dans le rayon d'un obstacle, une force de répulsion perpendiculaire à la trajectoire est appliquée pour contourner l'obstacle en douceur.

### Boundaries

Tous les véhicules utilisent boundaries pour rester confinés dans l'aire de jeu. Le joueur (poids 3), les zombies (poids 1.5) et les power-ups (poids 2) appliquent une force de rappel lorsqu'ils s'approchent des bords de l'écran (distance de détection : 40-50 pixels selon l'entité). Une vitesse désirée pointe vers l'intérieur de la zone de jeu, empêchant les entités de sortir.

## Outils et ressources utilisés

**Perplexity AI (version gratuite)** a été utilisé pour obtenir de l'aide sur la mise en page CSS et le style de l'interface utilisateur. Cet outil a permis de résoudre des problèmes de positionnement et d'améliorer l'apparence visuelle des écrans de menu et de l'overlay de jeu.

**Assets graphiques** : Tous les sprites du jeu (personnages, notes, power-ups, obstacles) sont des images pixelisées créées dans un style rétro pour donner une esthétique cohérente au projet.