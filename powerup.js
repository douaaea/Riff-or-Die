// ========================================
// CLASSE POWERUP
// ========================================
// Représente un bonus à collecter qui donne une capacité temporaire (dash, guitare, slowmo).
// Pourquoi: inciter le joueur à explorer et créer des pics de puissance ou de contrôle.
// Fonctionnement: hérite de Vehicle pour l'errance/évitation, ajoute une identité visuelle selon le type.

class PowerUp extends Vehicle {
  constructor(x, y, type) {
    super(x, y); // Initialise position/vecteurs via Vehicle.
    this.r = 20; // Plus grand pour meilleure visibilité et hitbox claire.
    this.maxSpeed = 1.5; // Vitesse d'errance modérée pour rester proche de la zone de spawn.
    this.maxForce = 0.2; // Steering doux pour ne pas zigzaguer brutalement.
    this.type = type; // 'dash', 'guitar', 'slowmo' -> détermine l'effet et l'apparence.
    
    //  Définir l'apparence selon le type AVEC LES IMAGES
    if (type === 'dash') {
      this.color = color(255, 255, 0); // Jaune pour évoquer la vitesse.
      this.img = dashImg; // Image thunder
    } else if (type === 'guitar') {
      this.color = color(255, 0, 0); // Rouge pour le bouclier offensif.
      this.img = guitarImg; // Image de la guitare
    } else if (type === 'slowmo') {
      this.color = color(255, 100, 255); // Magenta pour l'effet temporel.
      this.img = chronoImg; // Image chrono
    }
    
    this.pulseOffset = random(TWO_PI); // Décalage pour désynchroniser les pulsations entre power-ups.
    this.angle = 0; // Angle initial pour la rotation visuelle.
  }

  // Applique les comportements de mouvement simples (errance, évitement, limites).
  applyBehaviors(obstacles) {
    // WANDER (Errance aléatoire)
    let wanderForce = this.wander(); // Donne une trajectoire organique.
    wanderForce.mult(1); // Poids neutre (peut être ajusté si besoin).
    
    // OBSTACLE AVOIDANCE
    let avoidForce = this.avoidObstacles(obstacles); // Évite arbres/pierres.
    avoidForce.mult(1.5); // Force un peu plus forte pour contourner rapidement.
    
    // BOUNDARIES
    let boundaryForce = this.boundaries(50); // Ramène vers l'intérieur.
    boundaryForce.mult(2); // Correction ferme pour rester visible au joueur.
    
    this.applyForce(wanderForce);
    this.applyForce(avoidForce);
    this.applyForce(boundaryForce);
    
    this.update(); // Intègre les forces et avance la position.
  }

  // Affiche le power-up avec pulsation, rotation et aura colorée pour attirer l'œil.
  show() {
    let pulse = sin(frameCount * 0.1 + this.pulseOffset) * 3; // Pulsation pour effet vivant.
    this.angle += 0.03; // Rotation continue pour dynamisme.
    
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle); // Fait tourner l'icône et l'aura.
    
    // Aura colorée
    noStroke();
    drawingContext.save();
    let gradient = drawingContext.createRadialGradient(0, 0, 0, 0, 0, (this.r + pulse) * 3); // Halo centré.
    let col = this.color;
    gradient.addColorStop(0, `rgba(${red(col)}, ${green(col)}, ${blue(col)}, 0.6)`); // Centre lumineux.
    gradient.addColorStop(1, `rgba(${red(col)}, ${green(col)}, ${blue(col)}, 0)`); // Bord transparent.
    drawingContext.fillStyle = gradient;
    let size = (this.r + pulse) * 6; // Carré englobant l'aura.
    drawingContext.fillRect(-size/2, -size/2, size, size);
    drawingContext.restore();
    
    //  AFFICHER L'IMAGE (guitare, dash, ou chrono)
    imageMode(CENTER);
    let imgSize = (this.r + pulse) * 3; // Taille adaptée et pulsante.
    image(this.img, 0, 0, imgSize, imgSize);
    
    pop();
  }
}
