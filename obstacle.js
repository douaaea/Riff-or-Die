// ========================================
// CLASSE OBSTACLE
// ========================================
// Représente les obstacles immobiles (arbres, pierres) dans la forêt du jeu.
// Pourquoi: ils bloquent le chemin et forcent le joueur à naviguer intelligemment.
// Fonctionnement: stocke position, rayon de collision, type et image associée.

class Obstacle {
  constructor(x, y, r, type = 'arbre1') {
    this.pos = createVector(x, y); // Position de l'obstacle dans le monde.
    this.r = r; // Rayon utilisé pour l'affichage et les collisions (cercle simple).
    this.type = type; // 'arbre1', 'arbre2', 'pierre' (détermine le sprite et la taille d'affichage).
    
    // Définir l'image selon le type
    // Pourquoi: associer le bon sprite et une couleur représentative pour d'éventuels effets.
    if (type === 'arbre1') {
      this.img = arbre1Img; // Sprite arbre variante 1.
      this.color = color(34, 139, 34); // Vert (utile si besoin d'effets de teinte ou debug).
    } else if (type === 'arbre2') {
      this.img = arbre2Img; // Sprite arbre variante 2.
      this.color = color(46, 125, 50); // Vert foncé.
    } else if (type === 'pierre') {
      this.img = pierre1Img; // Sprite pierre.
      this.color = color(128, 128, 128); // Gris.
    }
  }

  // ========================================
  // AFFICHAGE
  // ========================================
  // Affiche l'obstacle avec ombre, image adaptée et option de debug collision.
  // Pourquoi: rendre lisible le relief (ombre) et différencier la taille des arbres/pierres.
  show() {
    push();
    translate(this.pos.x, this.pos.y); // Place l'origine sur la position de l'obstacle.
    
    // Ombre au sol pour donner du volume et indiquer la zone occupée.
    noStroke();
    fill(0, 0, 0, 80);
    ellipse(5, 5, this.r * 2, this.r * 1.5);
    
    // Afficher l'image de l'obstacle SANS ROTATION
    imageMode(CENTER); // Centre l'image pour que le rayon corresponde au milieu visuel.
    
    // Pour les arbres, afficher plus grand
    let displaySize = this.r * 2; // Taille de base pour une pierre.
    if (this.type === 'arbre1' || this.type === 'arbre2') {
      displaySize = this.r * 2.5; // Arbres plus grands pour paraître plus imposants.
    }
    
    image(this.img, 0, 0, displaySize, displaySize); // Dessine le sprite choisi.
    
    // Debug: collision circle
    if (Vehicle.debug) {
      noFill();
      stroke(255, 0, 0);
      strokeWeight(2);
      circle(0, 0, this.r * 2); // Cercle montrant la zone de collision utilisée par l'avoidance.
    }
    
    pop();
  }
}
