// ========================================
// CLASSE ZONE
// ========================================
// Représente les zones d'effet sur le terrain (boost ou ralentissement de vitesse).
// Pourquoi: créer des zones stratégiques pour varier le gameplay et forcer le joueur à choisir ses déplacements.
// Fonctionnement: chaque zone a un type (boost/slow), une couleur, des particules et un label visuel.

class Zone {
  // Initialise une zone d'effet avec position, rayon et type.
  // Pourquoi: chaque zone démarre avec une identité visuelle claire (couleur, symbole).
  constructor(x, y, r, type) {
    this.pos = createVector(x, y); // Position centrale de la zone.
    this.r = r; // Rayon d'influence.
    this.type = type; // 'boost' ou 'slow'
    
    // Définir la couleur selon le type (différenciation visuelle immédiate).
    if (type === 'boost') {
      this.color = color(0, 150, 255); // Cyan pour évoquer la vitesse.
      this.label = '↑'; // Flèche montante pour signaler l'accélération.
    } else {
      this.color = color(255, 100, 0); // Orange-rouge pour avertir du ralentissement.
      this.label = '↓'; // Flèche descendante.
    }
    
    this.particles = []; // Particules décoratives pour l'effet visuel.
    this.particleTimer = 0; // Compteur pour générer périodiquement des particules.
  }

  // ========================================
  // UPDATE
  // ========================================
  // Met à jour les particules décoratives de la zone.
  // Pourquoi: donner un feedback visuel continu pour rendre la zone « vivante » et identifiable.
  update() {
    // Générer des particules qui s'élèvent périodiquement.
    this.particleTimer++;
    if (this.particleTimer > 5) {
      let angle = random(TWO_PI); // Position aléatoire autour du centre.
      let radius = random(this.r); // Distance aléatoire du centre.
      let x = this.pos.x + cos(angle) * radius;
      let y = this.pos.y + sin(angle) * radius;
      
      this.particles.push({
        pos: createVector(x, y),
        vel: createVector(random(-0.5, 0.5), random(-2, -1)), // Mouvement ascendant.
        life: 255 // Alpha de départ.
      });
      
      this.particleTimer = 0;
    }
    
    // Update particules: déplace et fade.
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.pos.add(p.vel); // Applique la vitesse.
      p.life -= 5; // Diminue l'alpha pour la disparition progressive.
      
      if (p.life <= 0) {
        this.particles.splice(i, 1); // Retire la particule morte.
      }
    }
  }

  // ========================================
  // AFFICHAGE
  // ========================================
  // Dessine la zone avec cercle de base, anneaux pulsants, label et particules.
  // Pourquoi: rendre la zone visible, reconnaissable (couleur+symbole) et attrayante visuellement.
  show() {
    push();
    
    // Cercle de zone (transparent) pour marquer la zone d'influence.
    noStroke();
    fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], 30);
    circle(this.pos.x, this.pos.y, this.r * 2);
    
    // Anneaux concentriques pulsants pour donner un effet dynamique.
    noFill();
    strokeWeight(2);
    for (let i = 1; i <= 3; i++) {
      let pulse = sin(frameCount * 0.05 + i) * 5; // Animation pulsante.
      stroke(this.color.levels[0], this.color.levels[1], this.color.levels[2], 100);
      circle(this.pos.x, this.pos.y, (this.r * 2 * i / 3) + pulse);
    }
    
    // Label au centre (flèche haut/bas) pour identifier l'effet immédiatement.
    fill(this.color);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(32);
    text(this.label, this.pos.x, this.pos.y);
    
    // Particules qui s'élèvent pour enrichir le feedback visuel.
    for (let p of this.particles) {
      fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], p.life);
      noStroke();
      circle(p.pos.x, p.pos.y, 4);
    }
    
    pop();
  }
}
