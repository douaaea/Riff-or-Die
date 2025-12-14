// ========================================
// CLASSE NOTE - NOTES DE MUSIQUE
// ========================================
// Cette classe représente chaque note à collecter pour gagner des points dans le jeu.
// Pourquoi: les notes sont des cibles pacifiques qui incitent le joueur à se déplacer et explorer.
// Fonctionnement: hérite de Vehicle pour profiter des vecteurs pos/vel/acc mais bloque sa vitesse.

class Note extends Vehicle {
  // ========================================
  // CONSTRUCTEUR
  // ========================================
  // Initialise une note musicale stationnaire avec un style visuel animé.
  // Pourquoi: chaque note a une image aléatoire et des offsets pour désynchroniser les animations.
  constructor(x, y) {
    super(x, y); // Appelle Vehicle pour initialiser pos/vel/acc.
    this.r = 18; // Rayon visuel plus grand pour rendre la note plus visible et facile à collecter.
    this.maxSpeed = 0; // La note ne se déplace pas d'elle-même (reste flottante sur place).
    
    // 3 types de notes
    let rand = random(); // Tirage aléatoire pour varier le sprite et éviter la répétition visuelle.
    if (rand < 0.33) {
      this.img = note2Img; // Variante 1
    } else if (rand < 0.66) {
      this.img = note5Img; // Variante 2
    } else {
      this.img = note6Img; // Variante 3
    }
    
    this.color = color(138, 43, 226); // Violet principal pour l'aura lumineuse.
    this.pulseOffset = random(TWO_PI); // Décalage pour animer le pulsar indépendamment des autres notes.
    this.floatOffset = random(TWO_PI); // Décalage pour le flottement vertical, évite une synchro parfaite.
    this.rotationSpeed = random(0.02, 0.05); // Vitesse de rotation aléatoire pour dynamisme.
    this.angle = 0; // Angle initial de la note (commence sans rotation).
  }

  // ========================================
  // UPDATE
  // ========================================
  // ========================================
  // UPDATE
  // ========================================
  // Met à jour les animations visuelles (pulse, flottement, rotation) sans déplacer la note.
  // Pourquoi: rendre les notes vivantes et attractives pour le joueur.
  update() {
    // Pulse: variation de taille pour simuler une respiration lumineuse.
    this.pulse = sin(frameCount * 0.1 + this.pulseOffset) * 4;
    
    // Float: déplacement vertical doux pour donner un effet de flottement.
    this.float = sin(frameCount * 0.05 + this.floatOffset) * 5;
    
    // Rotation continue autour de son centre pour ajouter du dynamisme visuel.
    this.angle += this.rotationSpeed;
  }

  // ========================================
  // AFFICHAGE
  // ========================================
  // ========================================
  // AFFICHAGE
  // ========================================
  // Dessine la note avec une aura dégradée, un flottement et une rotation pour attirer le regard.
  // Pourquoi: rendre l'objet collectible évident et gratifiant visuellement.
  show() {
    push();
    translate(this.pos.x, this.pos.y + this.float); // Applique le flottement vertical animé.
    rotate(this.angle); // Applique la rotation accumulée.
    
    // Aura lumineuse
    noStroke(); // Pas de contour pour l'aura, juste un dégradé doux.
    drawingContext.save();
    let gradient = drawingContext.createRadialGradient(0, 0, 0, 0, 0, (this.r + this.pulse) * 2); // Dégradé radial centré.
    gradient.addColorStop(0, 'rgba(138, 43, 226, 0.4)'); // Centre lumineux violet.
    gradient.addColorStop(1, 'rgba(138, 43, 226, 0)'); // Bord transparent pour un halo doux.
    drawingContext.fillStyle = gradient; // Applique le dégradé comme couleur de remplissage.
    let size = (this.r + this.pulse) * 4; // Taille du carré qui contiendra l'aura.
    drawingContext.fillRect(-size/2, -size/2, size, size); // Dessine l'aura autour de l'origine locale.
    drawingContext.restore();
    
    // Image de la note PLUS GRANDE
    imageMode(CENTER); // Centre l'image sur l'origine pour qu'elle tourne autour de son centre.
    let noteSize = (this.r + this.pulse) * 2.5; // Taille dynamique: grossit avec le pulse.
    image(this.img, 0, 0, noteSize, noteSize); // Affiche la sprite choisie.
    
    pop();
  }
}
