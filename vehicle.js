// ========================================
// CLASSE VEHICLE - STEERING BEHAVIORS
// ========================================
// Cette classe regroupe les comportements de steering (seek, flee, wander, etc.).
// Pourquoi: ces règles déterminent comment chaque entité se déplace et réagit dans le jeu.
// Utilisation: Player, Zombie, PowerUp héritent de Vehicle et réutilisent ces mouvements.

class Vehicle {
  // ========================================
  // VARIABLES STATIQUES
  // ========================================
  // Flag global pour activer les dessins de debug (lignes, cercles) et visualiser les forces.
  static debug = false;

  // ========================================
  // CONSTRUCTEUR
  // ========================================
  // Initialise un véhicule à la position (x,y) avec toutes ses propriétés de mouvement.
  // Pourquoi: chaque entité démarre avec une vitesse nulle et des limites de vitesse/force identiques.
  constructor(x, y) {
    // Position actuelle dans le monde du jeu.
    this.pos = createVector(x, y);
    // Vitesse courante (commence à 0 pour éviter les mouvements instantanés).
    this.vel = createVector(0, 0);
    // Accumulation des forces appliquées avant l'update (sert à cumuler plusieurs comportements).
    this.acc = createVector(0, 0);
    // Vitesse maximale autorisée pour garder un contrôle sur les déplacements.
    this.maxSpeed = 4;
    // Force maximale appliquée par frame pour éviter des changements de direction trop brusques.
    this.maxForce = 0.3;
    // Rayon visuel/collision utilisé pour le dessin et certaines détections simples.
    this.r = 16;
    
    // Wander
    // Angle initial du point d'errance pour donner une direction de départ.
    this.wanderTheta = PI / 2;
    // Rayon du cercle de wander: plus il est grand, plus l'errance est large.
    this.wanderRadius = 50;
    // Distance du cercle de wander devant le véhicule pour que l'errance soit lissée.
    this.wanderDistance = 80;
    // Amplitude de variation aléatoire de l'angle à chaque frame pour changer la direction doucement.
    this.displaceRange = 0.3;
  }

  // ========================================
  // BEHAVIOR 1 : SEEK
  // ========================================
  // Cherche une cible
  // Pourquoi: déplacer l'entité vers un point précis (ex: le joueur suit un power-up).
  // Comment: calcule un vecteur désiré vers la cible, puis applique une force limitée.
  seek(target) {
    // Vecteur désiré pointant de la position actuelle vers la cible.
    let desired = p5.Vector.sub(target, this.pos);
    // On impose la vitesse max pour éviter d'accélérer indéfiniment.
    desired.setMag(this.maxSpeed);
    // Steering = différence entre la vitesse désirée et la vitesse actuelle.
    let steer = p5.Vector.sub(desired, this.vel);
    // On limite la force pour éviter un virage trop brusque.
    steer.limit(this.maxForce);
    // Dessins de debug pour visualiser la direction de la cible.
    if (Vehicle.debug) {
    push();
    stroke(0, 255, 0);
    strokeWeight(2);
    line(this.pos.x, this.pos.y, target.x, target.y);
    fill(0, 255, 0);
    noStroke();
    circle(target.x, target.y, 10);
    pop();
  }
    // On retourne la force à appliquer (utilisée par applyForce avant update).
    return steer;
  }

  // ========================================
  // BEHAVIOR 2 : FLEE
  // ========================================
  // Fuit une cible
  // Pourquoi: éloigner l'entité d'une menace (ex: le joueur s'éloigne d'un zombie).
  // Comment: similaire à seek mais inversé pour pointer à l'opposé de la cible.
  flee(target) {
    // Vecteur désiré pointe de la menace vers nous, donc on s'éloigne.
    let desired = p5.Vector.sub(this.pos, target);
    // On garde la vitesse maximale pour fuir rapidement.
    desired.setMag(this.maxSpeed);
    // Steering pour corriger la vitesse actuelle vers la direction opposée.
    let steer = p5.Vector.sub(desired, this.vel);
    // Limitation pour éviter des changements instantanés trop forts.
    steer.limit(this.maxForce);

      if (Vehicle.debug) {
    push();
    stroke(255, 0, 0);
    strokeWeight(2);
    line(this.pos.x, this.pos.y, target.x, target.y);
    fill(255, 0, 0, 100);
    noStroke();
    circle(target.x, target.y, 30);
    pop();
  }
    // Force de fuite renvoyée au système d'accumulation.
    return steer;
  }

  // ========================================
  // BEHAVIOR 3 : ARRIVE
  // ========================================
  // Arrive vers une cible en ralentissant
  // Pourquoi: éviter de dépasser la cible en freinant à l'approche (utile pour se poser sur un point précis).
  // Comment: plus on est proche, plus la vitesse désirée diminue en fonction de slowRadius.
  arrive(target, slowRadius = 100) {
    // Direction vers la cible.
    let desired = p5.Vector.sub(target, this.pos);
    // Distance actuelle pour savoir quand commencer à ralentir.
    let distance = desired.mag();
    // Vitesse par défaut = max tant qu'on est loin.
    let speed = this.maxSpeed;
    
    // Si on est dans le rayon de ralentissement, on réduit la vitesse proportionnellement.
    if (distance < slowRadius) {
      speed = map(distance, 0, slowRadius, 0, this.maxSpeed);
    }
    
    // Ajuste le vecteur désiré avec la vitesse calculée.
    desired.setMag(speed);
    // Force de steering basée sur l'écart entre vitesse désirée et vitesse actuelle.
    let steer = p5.Vector.sub(desired, this.vel);
    // On limite pour rester fluide.
    steer.limit(this.maxForce);

     if (Vehicle.debug) {
    push();
    // Cercle du slowRadius pour visualiser la zone de freinage.
    noFill();
    stroke(0, 255, 255);
    strokeWeight(1);
    circle(target.x, target.y, slowRadius * 2);
    // Ligne vers la cible.
    stroke(0, 255, 255);
    strokeWeight(2);
    line(this.pos.x, this.pos.y, target.x, target.y);
    // Point de la cible.
    fill(0, 255, 255);
    noStroke();
    circle(target.x, target.y, 10);
    pop();
  }
    // Force finale retournée pour être appliquée.
    return steer;
  }

  // ========================================
  // BEHAVIOR 4 : PURSUE
  // ========================================
  // Poursuit un véhicule en prédisant sa position
  // Pourquoi: si la cible bouge, viser sa position future évite de « tourner en rond » derrière elle.
  // Comment: on extrapole la position avec la vitesse actuelle de la cible, puis on réutilise seek.
  pursue(vehicle) {
    // Copie de la position actuelle de la cible.
    let target = vehicle.pos.copy();
    // Vecteur de prédiction basé sur la vitesse de la cible.
    let prediction = vehicle.vel.copy();
    // On multiplie pour regarder plusieurs frames en avant (6 = horizon de prédiction).
    prediction.mult(6);
    // Position prédite finale.
    target.add(prediction);
    
    if (Vehicle.debug) {
    push();
    // Ligne vers la position actuelle de la cible.
    stroke(255, 150, 0);
    strokeWeight(1);
    line(this.pos.x, this.pos.y, vehicle.pos.x, vehicle.pos.y);
    // Ligne vers la position prédite.
    stroke(255, 255, 0);
    strokeWeight(2);
    line(this.pos.x, this.pos.y, target.x, target.y);
    // Position prédite dessinée pour visualiser l'anticipation.
    fill(255, 255, 0);
    noStroke();
    circle(target.x, target.y, 12);
    pop();
  }

    // On réutilise le seek sur la position prédite pour poursuivre efficacement.
    return this.seek(target);
  }

  // ========================================
  // BEHAVIOR 5 : EVADE
  // ========================================
  // Évite un véhicule en prédisant sa position
  // Pourquoi: anticiper où sera l'ennemi et s'éloigner avant la collision.
  // Comment: même logique que pursue mais en inversant via flee sur la position prédite.
  evade(vehicle) {
    // Position actuelle de la cible.
    let target = vehicle.pos.copy();
    // Vitesse de la cible pour estimer sa future position.
    let prediction = vehicle.vel.copy();
    // Multiplier la vitesse pour regarder plus loin dans le temps.
    prediction.mult(6);
    // Position prédite finale d'où on veut s'échapper.
    target.add(prediction);
    if (Vehicle.debug) {
    push();
    // Ligne vers la position actuelle.
    stroke(255, 100, 100);
    strokeWeight(1);
    line(this.pos.x, this.pos.y, vehicle.pos.x, vehicle.pos.y);
    // Ligne vers la position prédite (menace future).
    stroke(255, 0, 0);
    strokeWeight(2);
    line(this.pos.x, this.pos.y, target.x, target.y);
    // Position prédite montrée comme zone à éviter.
    fill(255, 0, 0, 100);
    noStroke();
    circle(target.x, target.y, 30);
    pop();
  }
    // On réutilise flee sur la position anticipée pour fuir efficacement.
    return this.flee(target);
  }

  // ========================================
  // BEHAVIOR 6 : WANDER
  // ========================================
  // Errance aléatoire
  // Pourquoi: donner un mouvement organique aux entités neutres (ex: power-up qui flotte).
  // Comment: on place un cercle devant le véhicule et on choisit un point aléatoire dessus à chaque frame.
  wander() {
    // Point de base placé devant le véhicule selon sa vitesse actuelle.
    let wanderPoint = this.vel.copy();
    wanderPoint.setMag(this.wanderDistance);
    wanderPoint.add(this.pos);

    // Angle actuel + orientation du véhicule pour placer le point sur le cercle.
    let theta = this.wanderTheta + this.vel.heading();
    // Coordonnées du point sur le cercle de wander.
    let x = this.wanderRadius * cos(theta);
    let y = this.wanderRadius * sin(theta);
    wanderPoint.add(x, y);

    // On fait varier légèrement l'angle pour changer la direction au fil du temps.
    this.wanderTheta += random(-this.displaceRange, this.displaceRange);

    // Steering pour aller vers le point choisi.
    let steer = p5.Vector.sub(wanderPoint, this.pos);
    // On fixe l'intensité à maxForce pour rester doux.
    steer.setMag(this.maxForce);
      if (Vehicle.debug) {
    let centerPoint = this.vel.copy();
    centerPoint.setMag(this.wanderDistance);
    centerPoint.add(this.pos);
    
    push();
    // Ligne vers le centre du cercle de wander.
    stroke(200);
    strokeWeight(1);
    line(this.pos.x, this.pos.y, centerPoint.x, centerPoint.y);
    // Cercle de wander (zone où on pioche le point).
    noFill();
    stroke(100);
    circle(centerPoint.x, centerPoint.y, this.wanderRadius * 2);
    // Point de wander choisi et ligne qui le relie.
    stroke(0, 255, 0);
    strokeWeight(2);
    line(this.pos.x, this.pos.y, wanderPoint.x, wanderPoint.y);
    fill(0, 255, 0);
    noStroke();
    circle(wanderPoint.x, wanderPoint.y, 8);
    pop();
  }
    // Force d'errance renvoyée pour être appliquée.
    return steer;
  }

  // ========================================
  // BEHAVIOR 7 : SEPARATION
  // ========================================
  // Évite les autres véhicules
  // Pourquoi: éviter les collisions et agglutinations entre entités (utile pour zombies ou alliés).
  // Comment: on calcule une force de répulsion moyenne inversement proportionnelle à la distance.
  separation(vehicles, radius = 50) {
    // Force cumulée de séparation.
    let steering = createVector();
    // Nombre de voisins pris en compte.
    let total = 0;
    
    for (let other of vehicles) {
      // Distance entre ce véhicule et l'autre.
      let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
      // On ignore soi-même et on ne considère que dans le rayon donné.
      if (other !== this && d < radius) {
        // Vecteur d'éloignement (de l'autre vers nous) pondéré par 1/d^2 pour repousser plus fort quand c'est proche.
        let diff = p5.Vector.sub(this.pos, other.pos);
        diff.div(d * d);
        // On accumule la force.
        steering.add(diff);
        total++;
      //  DEBUG
      if (Vehicle.debug) {
        push();
        stroke(255, 200, 0, 100);
        strokeWeight(1);
        line(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
        pop();
      }
    }
  }
  
  //  DEBUG - Cercle de séparation
  if (Vehicle.debug) {
    push();
    noFill();
    stroke(255, 200, 0, 100);
    strokeWeight(1);
    circle(this.pos.x, this.pos.y, radius * 2);
    pop();
  }
    
    // Si on a des voisins, on moyenne la force puis on la convertit en steering classique.
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.vel);
      steering.limit(this.maxForce);
    }
    
    return steering;
  }

  // ========================================
  // BEHAVIOR 8 : OBSTACLE AVOIDANCE
  // ========================================
  // Évite les obstacles
  // Pourquoi: empêcher le véhicule de percuter des éléments statiques (murs, arbres).
  // Comment: on projette un point "ahead" dans la direction actuelle et on dévie si un obstacle est proche.
  avoidObstacles(obstacles) {
    // Point projeté devant le véhicule selon sa direction et une distance fixe.
    let ahead = this.vel.copy();
    ahead.setMag(60);
    ahead.add(this.pos);
    
    // Force finale d'évitement (par défaut nulle).
    let avoidForce = createVector(0, 0);
    // On cherche l'obstacle le plus proche qui intersecte la projection.
    let closestObstacle = null;
    let closestDist = Infinity;
    
    for (let obstacle of obstacles) {
      // Distance entre le point ahead et le centre de l'obstacle.
      let d = p5.Vector.dist(ahead, obstacle.pos);
      // Si on est à portée de collision (rayons qui se touchent) et plus proche que les autres.
      if (d < obstacle.r + this.r && d < closestDist) {
        closestDist = d;
        closestObstacle = obstacle;
      }
    }
    
    if (closestObstacle) {
      // Force d'évitement = vecteur qui éloigne du centre de l'obstacle.
      avoidForce = p5.Vector.sub(ahead, closestObstacle.pos);
      // On lui donne une magnitude rapide pour dévier fermement.
      avoidForce.setMag(this.maxSpeed);
      // On autorise une force plus forte que d'habitude pour réagir vite.
      avoidForce.limit(this.maxForce * 2);
    }
    // DEBUG
  if (Vehicle.debug) {
    push();
    // Point "ahead"
    stroke(255, 0, 255);
    strokeWeight(2);
    line(this.pos.x, this.pos.y, ahead.x, ahead.y);
    fill(255, 0, 255);
    noStroke();
    circle(ahead.x, ahead.y, 10);
    
    // Obstacle le plus proche
    if (closestObstacle) {
      stroke(255, 0, 0);
      strokeWeight(2);
      noFill();
      circle(closestObstacle.pos.x, closestObstacle.pos.y, closestObstacle.r * 2);
    }
    pop();
  }
    // Force calculée renvoyée (ou zéro si rien devant).
    return avoidForce;
  }

  // ========================================
  // BEHAVIOR 9 : BOUNDARIES
  // ========================================
  // Reste dans les limites de l'écran
  // Pourquoi: empêcher les entités de sortir de la zone de jeu (utile pour le joueur et les ennemis).
  // Comment: si on s'approche des bords, on crée une vitesse désirée qui ramène vers l'intérieur.
  boundaries(distance = 50) {
    // Vitesse désirée quand on est proche d'un bord (null si on est au centre).
    let desired = null;
    
    // Bord gauche/droite: on pousse vers l'intérieur en inversant/ajustant la vitesse x.
    if (this.pos.x < distance) {
      desired = createVector(this.maxSpeed, this.vel.y);
    } else if (this.pos.x > width - distance) {
      desired = createVector(-this.maxSpeed, this.vel.y);
    }
    
    // Bord haut/bas: même principe sur l'axe y.
    if (this.pos.y < distance) {
      desired = createVector(this.vel.x, this.maxSpeed);
    } else if (this.pos.y > height - distance) {
      desired = createVector(this.vel.x, -this.maxSpeed);
    }
    if (Vehicle.debug) {
    push();
    // Rectangle de sécurité montrant la zone où le correctif s'applique.
    noFill();
    stroke(255, 100, 100, 50);
    strokeWeight(2);
    rect(distance, distance, width - distance * 2, height - distance * 2);
    pop();
  }
    if (desired !== null) {
      // On remet la magnitude à maxSpeed pour revenir vite dans l'aire jouable.
      desired.setMag(this.maxSpeed);
      // Steering classique pour corriger la vitesse actuelle.
      let steer = p5.Vector.sub(desired, this.vel);
      steer.limit(this.maxForce);
      return steer;
    }
    
    // Pas de correction si on est au centre.
    return createVector(0, 0);
  }

  // ========================================
  // APPLIQUE UNE FORCE
  // ========================================
  // Ajoute une force au véhicule (accumulée avant update).
  // Pourquoi: permet de combiner plusieurs comportements (seek + avoidance) avant de bouger.
  applyForce(force) {
    // Additionne la force à l'accélération qui sera appliquée à la prochaine mise à jour.
    this.acc.add(force);
  }

  // ========================================
  // UPDATE
  // ========================================
  // Met à jour la physique du véhicule à chaque frame.
  // Pourquoi: appliquer les forces accumulées et avancer la position.
  update() {
    // La vitesse prend en compte l'accumulation de forces.
    this.vel.add(this.acc);
    // Clamp pour ne jamais dépasser la vitesse maximale.
    this.vel.limit(this.maxSpeed);
    // La position avance selon la vitesse calculée.
    this.pos.add(this.vel);
    // On réinitialise l'accélération pour la prochaine frame.
    this.acc.mult(0);
  }

  // ========================================
  // SHOW (à override dans les sous-classes)
  // ========================================
  // Dessine le véhicule (triangle orienté par la vitesse).
  // Pourquoi: fournir un visuel simple par défaut; les sous-classes peuvent override.
  show() {
    push();
    // Place le dessin à la position actuelle.
    translate(this.pos.x, this.pos.y);
    // Oriente le triangle selon la direction de la vitesse.
    rotate(this.vel.heading());
    
    // Triangle blanc avec contour noir pour la lisibilité.
    fill(255);
    stroke(0);
    strokeWeight(2);
    triangle(-this.r, -this.r / 2, -this.r, this.r / 2, this.r, 0);
    
    pop();
  }

  // ========================================
  // EDGES (wrapping)
  // ========================================
  // Assure un wrapping écran: si on sort d'un côté, on réapparaît de l'autre.
  // Pourquoi: permet un monde torique, évite de perdre les entités en dehors du canvas.
  edges() {
    if (this.pos.x > width + this.r) {
      // Sort à droite -> réapparaît à gauche.
      this.pos.x = -this.r;
    } else if (this.pos.x < -this.r) {
      // Sort à gauche -> réapparaît à droite.
      this.pos.x = width + this.r;
    }
    if (this.pos.y > height + this.r) {
      // Sort en bas -> réapparaît en haut.
      this.pos.y = -this.r;
    } else if (this.pos.y < -this.r) {
      // Sort en haut -> réapparaît en bas.
      this.pos.y = height + this.r;
    }
  }
}
