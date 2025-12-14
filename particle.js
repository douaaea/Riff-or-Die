// ========================================
// CLASSE PARTICLE
// ========================================
// Représente une particule visuelle utilisée pour les effets (explosions, feedbacks, poussières).
// Pourquoi: ajoute du dynamisme et de la lisibilité aux actions (collecte, impacts, etc.).
// Fonctionnement: chaque particule a une position, une vitesse aléatoire, une gravité légère et une durée de vie qui décroît.

class Particle {
  // ========================================
  // CONSTRUCTEUR
  // ========================================
  // Initialise une particule à une position donnée avec une couleur fournie.
  // Pourquoi: chaque particule démarre avec une direction/vitesse aléatoire pour un effet dispersé naturel.
  constructor(x, y, col) {
    this.pos = createVector(x, y); // Position initiale du point d'émission.
    this.vel = p5.Vector.random2D(); // Direction aléatoire pour disperser les particules.
    this.vel.mult(random(1, 3)); // Vitesse initiale aléatoire pour varier la portée.
    this.acc = createVector(0, 0.1); // Gravité légère pour faire retomber les particules.
    this.life = 255; // Durée de vie (alpha) démarrant à opaque et décroissant.
    this.color = col; // Couleur de base héritée de l'événement (explosion, power-up, etc.).
    this.size = random(3, 8); // Taille aléatoire pour rendre l'effet moins uniforme.
  }

  // ========================================
  // UPDATE
  // ========================================
  // ========================================
  // UPDATE
  // ========================================
  // Met à jour la physique simplifiée: applique la gravité, déplace la particule et réduit sa vie.
  // Pourquoi: simuler une chute progressive et une disparition naturelle.
  update() {
    this.vel.add(this.acc); // Intègre l'accélération (gravité) à la vitesse.
    this.pos.add(this.vel); // Déplace la particule selon la vitesse résultante.
    this.life -= 5; // Diminue l'alpha pour faire disparaître la particule au fil du temps.
  }

  // ========================================
  // AFFICHAGE
  // ========================================
  // ========================================
  // AFFICHAGE
  // ========================================
  // Dessine la particule avec sa couleur et une transparence liée à sa durée de vie.
  // Pourquoi: plus la particule vieillit, plus elle devient transparente jusqu'à disparaître.
  show() {
    push();
    noStroke(); // Pas de contour pour garder un rendu doux.
    fill(
      red(this.color), // Composante rouge de la couleur d'origine.
      green(this.color), // Composante verte.
      blue(this.color), // Composante bleue.
      this.life // Alpha basé sur la vie restante (détermine la transparence).
    );
    circle(this.pos.x, this.pos.y, this.size); // Dessine la particule à sa position actuelle.
    pop();
  }

  // ========================================
  // EST MORT ?
  // ========================================
  // ========================================
  // EST MORT ?
  // ========================================
  // Indique si la particule doit être retirée (plus de vie/alpha).
  // Pourquoi: permet de nettoyer les particules terminées et éviter d'encombrer la scène.
  isDead() {
    return this.life <= 0; // True si l'alpha est épuisé, la particule peut être supprimée.
  }
}
