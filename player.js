// ========================================
// CLASSE PLAYER - MR. BUFFA
// ========================================
// Représente le joueur contrôlé qui doit collecter les notes et éviter les zombies.
// Pourquoi: centralise les stats (score, combo), les power-ups et les comportements de steering.
// Fonctionnement: hérite de Vehicle pour le mouvement, ajoute gestion des combos, power-ups, dash et affichage.

class Player extends Vehicle {
  constructor(x, y) {
    super(x, y); // Initialise pos/vel/acc via Vehicle.
    this.maxSpeed = 7; // Vitesse de base du joueur (modulée par zones et power-ups).
    this.maxForce = 0.5; // Force de steering pour réactivité du contrôle.
    this.r = 30; // CHANGÉ : 20 → 30 (50% plus grand) pour une hitbox/visibilité plus large.
    
    // Stats du joueur
    this.notesCollected = 0; // Compteur de notes ramassées.
    this.score = 0; // Score total affiché.
    this.combo = 1; // Multiplicateur courant.
    this.maxCombo = 1; // Record du meilleur combo atteint.
    this.comboTimer = 0; // Temps restant avant de perdre du combo.
    
    // Power-ups
    this.hasDash = true; // Dash disponible dès le début.
    this.dashCooldown = 0; // Temps avant de pouvoir re-dash.
    this.hasGuitar = false; // Bouclier guitare actif ou non.
    this.guitarTimer = 0; // Durée restante du bouclier guitare.
    this.slowMoActive = false; // Mode ralenti actif ?
    this.slowMoTimer = 0; // Durée restante du ralenti.
    
    // Trail (traînée)
    this.trail = []; // Historique des positions pour dessiner la traînée.
    this.maxTrailLength = 15; // Longueur maximale de la traînée (nombre de points).
  }

  applyBehaviors(target, zombies, notes, obstacles, zones) {
  // Calcul du niveau de danger : compte les zombies proches pour moduler la priorité de fuite vs collecte.
  let dangerLevel = 0;
  for (let zombie of zombies) {
    let d = p5.Vector.dist(this.pos, zombie.pos);
    if (d < 150) dangerLevel++; // Plus un zombie est proche, plus le danger est élevé.
  }

  // Fuit les zombies proches avec un poids plus fort si très près.
  let fleeForce = createVector(0, 0);
  for (let zombie of zombies) {
    let d = p5.Vector.dist(this.pos, zombie.pos);
    if (d < 150) {
      let flee = this.flee(zombie.pos); // Direction opposée au zombie.
      let weight = map(d, 0, 150, 3, 0.5); // Plus proche => poids de fuite plus grand.
      flee.mult(weight);
      fleeForce.add(flee);
    }
  }

  // Cherche la note la plus proche si la situation n'est pas trop dangereuse.
  let seekNoteForce = createVector(0, 0);
  if (dangerLevel < 2 && notes.length > 0) {
    let closest = this.findClosest(notes); // Trouve la note la plus proche.
    if (closest) {
      seekNoteForce = this.seek(closest.pos); // Vise cette note.
      seekNoteForce.mult(1.5); // Amplifie la motivation à collecter.
    }
  }

  // Suivi de la souris avec ralentissement à l'approche pour un contrôle précis.
  let arriveMouseForce = this.arrive(target, 80);
  arriveMouseForce.mult(2); // Plus de priorité pour que le joueur reste maniable.

  // Force d'évitement des obstacles détectés.
  let avoidForce = this.avoidObstacles(obstacles);
  avoidForce.mult(2.5); // On renforce pour éviter les collisions.

  // Maintient le joueur dans l'aire de jeu.
  let boundaryForce = this.boundaries(40);
  boundaryForce.mult(3); // Correction ferme pour rester dans la zone.

  // Accumule les forces (l'update appliquera la somme des accélérations).
  this.applyForce(fleeForce);
  this.applyForce(seekNoteForce);
  this.applyForce(arriveMouseForce);
  this.applyForce(avoidForce);
  this.applyForce(boundaryForce);

  // Zones modifient la vitesse max: boost ou ralentissement.
  let inAnyZone = false;  // FLAG

  for (let zone of zones) {
    let d = p5.Vector.dist(this.pos, zone.pos);
    if (d < zone.r) {
      inAnyZone = true;  // On est dans une zone
      if (zone.type === 'boost') {
        this.maxSpeed = 10; // Zone de boost: accélération.
      } else if (zone.type === 'slow') {
        this.maxSpeed = 3;  // RALENTIT ICI
      }
      break;  // Sortir après la première zone trouvée
    }
  }

  // Réinitialiser SEULEMENT si pas dans une zone
  if (!inAnyZone) {
    this.maxSpeed = 7;  // Vitesse normale
  }

  // Update
  this.update(); // Applique les forces cumulées et avance le joueur.

  // Update trail
  this.trail.push(this.pos.copy()); // Ajoute la position actuelle pour dessiner la traînée.
  if (this.trail.length > this.maxTrailLength) {
    this.trail.shift(); // Retire l'ancien point pour limiter la longueur.
  }

  // Update timers
  this.updateTimers(); // Gère combo, dash, guitare et slow-mo.
}

  // Renvoie l'élément le plus proche de la liste (utilisé pour les notes).
  findClosest(targets) {
    let closest = null;
    let closestDist = Infinity;
    
    for (let target of targets) {
      let d = p5.Vector.dist(this.pos, target.pos); // Distance joueur-cible.
      if (d < closestDist) {
        closestDist = d;
        closest = target; // On garde la cible la plus proche trouvée jusqu'ici.
      }
    }
    
    return closest; // Peut être null si aucun élément.
  }

  // Incrémente les stats quand une note est ramassée et gère le combo/score.
  collectNote() {
    this.notesCollected++; // Compteur brut de notes.
    
    // Augmenter combo
    this.combo = min(this.combo + 0.5, 5); // Incrémente avec plafond à 5.
    this.maxCombo = max(this.maxCombo, this.combo); // Mémorise le meilleur combo atteint.
    this.comboTimer = 180; // 3 secondes avant décroissance du combo.
    
    // Score avec combo
    this.score += floor(100 * this.combo); // Bonus proportionnel au combo actuel.
  }

  // Active un power-up donné et ajoute un bonus de score.
  activatePowerup(type) {
    if (type === 'dash') {
      this.hasDash = true; // Recharge le dash instantanément.
      this.score += 500; // Récompense pour la collecte.
    } else if (type === 'guitar') {
      this.hasGuitar = true; // Active le bouclier tournant.
      this.guitarTimer = 300; // 5 secondes
      this.score += 500;
    } else if (type === 'slowmo') {
      this.slowMoActive = true; // Active le ralentissement global.
      this.slowMoTimer = 240; // 4 secondes
      this.score += 500;
    }
  }

  // Téléporte le joueur vers la souris sur une courte distance si le dash est prêt.
  dash() {
    if (this.hasDash && this.dashCooldown === 0) {
      let direction = p5.Vector.sub(createVector(mouseX, mouseY), this.pos); // Vecteur vers la souris.
      direction.limit(150); // Distance maximale du dash pour éviter un saut trop long.
      this.pos.add(direction); // Applique le déplacement instantané.
      
      // Particules de dash (feedback visuel de vitesse).
      for (let i = 0; i < 20; i++) {
        particles.push(new Particle(this.pos.x, this.pos.y, color(255, 255, 0)));
      }
      
      this.dashCooldown = 180; // 3 secondes de cooldown
    }
  }

  // Met à jour tous les compteurs temporels (combo, dash, guitare, slow-mo).
  updateTimers() {
    // Combo timer
    if (this.comboTimer > 0) {
      this.comboTimer--; // Tant qu'il reste du temps, le combo est maintenu.
    } else {
      this.combo = max(1, this.combo - 0.1); // Sinon, on réduit progressivement jusqu'à 1.
    }
    
    // Dash cooldown
    if (this.dashCooldown > 0) {
      this.dashCooldown--; // Décompte avant prochaine utilisation.
    }
    
    // Guitar timer
    if (this.guitarTimer > 0) {
      this.guitarTimer--; // Durée du bouclier.
    } else {
      this.hasGuitar = false; // Bouclier expire.
    }
    
    // Slow-mo timer
    if (this.slowMoTimer > 0) {
      this.slowMoTimer--; // Durée du ralenti.
    } else {
      this.slowMoActive = false; // Fin du ralenti.
    }
  }

  // Gère tout l'affichage du joueur: traînée, bouclier guitare et sprite principal.
  show() {
    // TRAIL (Traînée)
    push();
    noFill();
    for (let i = 0; i < this.trail.length; i++) {
      let alpha = map(i, 0, this.trail.length, 0, 255); // Plus récent = plus opaque.
      stroke(139, 69, 19, alpha);
      strokeWeight(map(i, 0, this.trail.length, 1, 4)); // Épaisseur croît vers la position actuelle.
      if (i > 0) {
        line(this.trail[i-1].x, this.trail[i-1].y, this.trail[i].x, this.trail[i].y); // Relie les points pour une ligne fluide.
      }
    }
    pop();
    
    // GUITAR SHIELD
    if (this.hasGuitar) {
      push();
      translate(this.pos.x, this.pos.y);
      noFill();
      strokeWeight(3);
      
      for (let i = 0; i < 3; i++) {
        let angle = frameCount * 0.05 + i * TWO_PI / 3; // Fait tourner trois orbes autour du joueur.
        let x = cos(angle) * (this.r + 15);
        let y = sin(angle) * (this.r + 15);
        
        stroke(255, 0, 0, 200);
        circle(x, y, 10); // Orbe de bouclier.
      }
      pop();
    }
    
    // AFFICHAGE DE MR. BUFFA
    push();
    translate(this.pos.x, this.pos.y);
    
    // Image de Buffa
    imageMode(CENTER);
    let angle = this.vel.heading(); // Oriente le sprite selon la direction de déplacement.
    rotate(angle);
    
    // Aura
    noStroke();
    let glowSize = this.r * 3; // Rayon de l'aura pour souligner le joueur.
    drawingContext.save();
    let gradient = drawingContext.createRadialGradient(0, 0, 0, 0, 0, glowSize);
    gradient.addColorStop(0, 'rgba(139, 69, 19, 0.4)');
    gradient.addColorStop(1, 'rgba(139, 69, 19, 0)');
    drawingContext.fillStyle = gradient;
    drawingContext.fillRect(-glowSize, -glowSize, glowSize * 2, glowSize * 2); // Halo autour du centre.
    drawingContext.restore();
    
    // Image Buffa PLUS GRANDE
    image(buffaImg, 0, 0, this.r * 2.5, this.r * 2.5); // 2.5x au lieu de 2x
    
    pop();
  }
}
