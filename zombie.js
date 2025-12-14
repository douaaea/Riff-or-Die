// ========================================
// CLASSE ZOMBIE
// ========================================
// Représente les ennemis qui traquent Mr. Buffa.
// Pourquoi: ils mettent la pression sur le joueur et incarnent la menace principale.
// Fonctionnement: hérite de Vehicle pour utiliser pursue/separation/avoid/boundaries,
// avec stats de vitesse/force aléatoires et variation de type (dangereux, type1, type2).

class Zombie extends Vehicle {
  constructor(x, y, speedMultiplier = 1) {
    super(x, y); // Position initiale et vecteurs via Vehicle.
    
    // ========================================
    // VITESSES RÉDUITES POUR MEILLEUR GAMEPLAY
    // ========================================
    this.maxSpeed = random(1.5, 2.5) * speedMultiplier; // Vitesse de base (modulée par la difficulté globale).
    this.maxForce = random(0.15, 0.25); // Steering raisonnable pour éviter des virages trop secs.
    this.r = 25; // Plus visible qu'avant pour mieux lire les collisions.
    
    // Types de zombies (3 types) avec probabilités distinctes.
    let rand = random();
    if (rand < 0.15) {
      this.type = 'dangereux'; // 15%: plus rapide, plus menaçant.
      this.maxSpeed *= 1.3; // Boost de vitesse pour ce type.
      this.r = 22; // Légèrement plus petit mais toujours visible.
      this.img = zombieDangereuxImg;
    } else if (rand < 0.575) {
      this.type = 'type1'; // 42.5%
      this.img = zombie1Img;
    } else {
      this.type = 'type2'; // 42.5%
      this.img = zombie2Img;
    }
    
    this.particleTimer = 0; // Chrono pour émettre périodiquement des particules de décomposition.
  }

  // ========================================
  // COMPORTEMENTS DU ZOMBIE
  // ========================================
  // Combine les comportements pour poursuivre le joueur, éviter les autres et les obstacles.
  // Pourquoi: créer une menace crédible qui ne se bloque pas et qui reste dans l'aire de jeu.
  applyBehaviors(player, zombies, obstacles) {
    // ----------------------------------------
    // BEHAVIOR 1 : PURSUE (poursuite avec prédiction)
    // ----------------------------------------
    let pursueForce = this.pursue(player); // Anticipe la position du joueur pour le rattraper.
    pursueForce.mult(1.5); // Poids principal pour rester agressif.
    
    // ----------------------------------------
    // BEHAVIOR 2 : SEPARATION (évite les autres)
    // ----------------------------------------
    let separationForce = this.separation(zombies, 50); // Répulsion pour éviter l'agglutination.
    separationForce.mult(2.0);
    
    // ----------------------------------------
    // BEHAVIOR 3 : OBSTACLE AVOIDANCE
    // ----------------------------------------
    let avoidForce = this.avoidObstacles(obstacles); // Contourne arbres/pierres.
    avoidForce.mult(2);
    
    // ----------------------------------------
    // BEHAVIOR 4 : BOUNDARIES
    // ----------------------------------------
    let boundaryForce = this.boundaries(30); // Reste dans la zone de jeu.
    boundaryForce.mult(1.5);
    
    // Application des forces cumulées.
    this.applyForce(pursueForce);
    this.applyForce(separationForce);
    this.applyForce(avoidForce);
    this.applyForce(boundaryForce);
    
    this.update(); // Met à jour position/vitesse après accumulation des forces.
    
    // Particules de décomposition (moins fréquentes) pour l'effet visuel.
    this.particleTimer++;
    if (this.particleTimer > 15) {
      particles.push(new Particle(
        this.pos.x + random(-5, 5),
        this.pos.y + random(-5, 5),
        color(34, 139, 34, 150)
      ));
      this.particleTimer = 0;
    }
  }

  // ========================================
  // AFFICHAGE
  // ========================================
  // Affiche le zombie orienté selon sa vitesse et un halo de danger près du joueur.
  // Pourquoi: donner une lecture claire de la direction de la menace et de sa proximité.
  show() {
    push();
    translate(this.pos.x, this.pos.y);
    
    let angle = this.vel.heading(); // Direction de déplacement.
    rotate(angle);
    
    imageMode(CENTER);
    image(this.img, 0, 0, this.r * 3, this.r * 3); // 3x pour plus de lisibilité.
    
    pop();
    
    // Cercle de danger si proche du joueur (feedback visuel de proximité).
    if (player) {
      let d = p5.Vector.dist(this.pos, player.pos);
      if (d < 100) {
        push();
        noFill();
        stroke(255, 0, 0, map(d, 0, 100, 200, 50));
        strokeWeight(2);
        circle(this.pos.x, this.pos.y, map(d, 0, 100, this.r * 3, this.r * 1.5));
        pop();
      }
    }
  }
}
