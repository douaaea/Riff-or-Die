// ========================================
// FICHIER PRINCIPAL (SKETCH) - BOUCLE DE JEU
// ========================================
// Coordonne le cycle de vie du jeu: preload des assets, setup, boucle draw, spawns et UI.
// Pourquoi: centralise la logique temps réel (spawn, difficulté, collisions, affichage global).
// Utilisation: p5.js appelle automatiquement preload(), setup(), draw(), et les handlers d'input.

// ========================================
// VARIABLES GLOBALES
// ========================================
// Entités dynamiques
let player;
let zombies = [];
let notes = [];
let powerups = [];
let obstacles = [];
let zones = [];
let particles = [];

// Assets visuels
let grassImg;
let buffaImg;
let zombie1Img, zombie2Img, zombieDangereuxImg;
let note2Img, note5Img, note6Img;
let guitarImg, dashImg, chronoImg; // Images pour les power-ups
let arbre1Img, arbre2Img, pierre1Img;

// Musique de fond
let song;

// États du jeu
let gameState = 'menu'; // 'menu', 'playing', 'gameover', 'victory'
let startTime;
let gameTime = 0;

// Gestion de la difficulté et du spawn
let difficultyMultiplier = 1; // Monte avec le temps pour rendre les zombies plus dangereux.
let zombieSpawnTimer = 0; // Compteur avant le prochain spawn.
let zombieSpawnInterval = 140; // Intervalle de base (diminue avec le temps).

// Objectif de victoire
const NOTES_TO_WIN = 30; // Nombre de notes à collecter pour gagner.

// ========================================
// PRELOAD - CHARGEMENT DES IMAGES
// ========================================
// Charge tous les assets avant le début du jeu pour éviter les lags pendant la partie.
function preload() {
  // Background (herbe de base pour le tiling du terrain).
  grassImg = loadImage('assets/grass.png');
  
  // Player
  buffaImg = loadImage('assets/buffaplayer.png');
  
  // Zombies (variantes pour varier visuellement la menace).
  zombie1Img = loadImage('assets/zombi1.png');
  zombie2Img = loadImage('assets/zombi2.png');
  zombieDangereuxImg = loadImage('assets/zombiDangereux.png');
  
  // Notes (collectibles visuels).
  note2Img = loadImage('assets/note2.png');
  note5Img = loadImage('assets/note5.png');
  note6Img = loadImage('assets/note6.png');
  
  // Power-ups (icônes distinctes pour chaque effet).
  guitarImg = loadImage('assets/guitarerouge.png');
  dashImg = loadImage('assets/thunder.png');
  chronoImg = loadImage('assets/chrono.png');
  
  // Obstacles (arbres/pierres pour l'évitement).
  arbre1Img = loadImage('assets/arbre1.png');
  arbre2Img = loadImage('assets/arbre2.png');
  pierre1Img = loadImage('assets/pierre1.png');

  // Charger la musique de fond
  song = loadSound('assets/ACDC - Back In Black (Instrumental).mp3');
}

// ========================================
// SETUP
// ========================================
// Prépare le canvas plein écran et laisse le jeu au menu jusqu'à startGameFromMenu().
function setup() {
  let canvas = createCanvas(windowWidth, windowHeight); // Canvas dimensionné à la fenêtre.
  canvas.parent('game-wrapper'); // Attache au conteneur HTML pour l'overlay UI.
}

// Redimensionne le canvas quand la fenêtre change pour garder le plein écran réactif.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ========================================
// FONCTION POUR DÉMARRER LE JEU
// ========================================
// Appelée depuis le menu (bouton). Prépare l'UI et lance l'initialisation.
function startGameFromMenu() {
  // Vérifie que le canvas est prêt (évite un démarrage prématuré).
  if (!width || !height) {
    console.error('Canvas not ready!');
    return;
  }
  
  // Cache le panneau des règles pour libérer l'écran de jeu.
  let rulesPanel = document.querySelector('.frame-rules');
  if (rulesPanel) {
    rulesPanel.style.display = 'none';
  }
  
  // Affiche l'overlay UI (score, temps, power-ups).
  document.getElementById('ui-overlay').style.display = 'block';
  
  // Démarrer la musique en boucle
  if (!song.isPlaying()) {
    song.loop();
    song.setVolume(0.5);
  }
  
  // Initialise la partie.
  initGame();
  
  // Passe l'état à "playing" pour activer draw().
  gameState = 'playing';
}



// ========================================
// INITIALISATION DU JEU
// ========================================
// Réinitialise tous les tableaux et place les entités initiales (joueur, obstacles, zones, notes, zombies).
function initGame() {
  // Reset des tableaux
  zombies = [];
  notes = [];
  powerups = [];
  obstacles = [];
  zones = [];
  particles = [];
  
  // Créer le joueur au centre (point de départ équitable).
  player = new Player(width / 2, height / 2);
  
  // Créer des obstacles (arbres et pierres) - 12 obstacles répartis aléatoirement.
  for (let i = 0; i < 12; i++) {
    let x = random(100, width - 100);
    let y = random(100, height - 100);
    let type = random(['arbre1', 'arbre2', 'pierre']);
    let size = (type === 'pierre') ? random(30, 40) : random(40, 60);
    obstacles.push(new Obstacle(x, y, size, type));
  }
  
  // Créer des zones (4 boost, 4 slow) pour varier la vitesse du joueur.
  for (let i = 0; i < 4; i++) {
    let x = random(150, width - 150);
    let y = random(150, height - 150);
    zones.push(new Zone(x, y, 80, 'boost'));
  }
  for (let i = 0; i < 4; i++) {
    let x = random(150, width - 150);
    let y = random(150, height - 150);
    zones.push(new Zone(x, y, 80, 'slow'));
  }
  
  // Créer des notes de musique initiales (10 notes pour démarrer la collecte).
  for (let i = 0; i < 10; i++) {
    spawnNote();
  }
  
  // Créer quelques zombies de départ (2 zombies) pour mettre une pression immédiate.
  for (let i = 0; i < 2; i++) {
    spawnZombie();
  }
  
  // Timer et difficulté
  startTime = millis();
  difficultyMultiplier = 1; // Repart à 1 à chaque partie.
  zombieSpawnTimer = 0; // Repart le compteur de spawn.
}

// ========================================
// DRAW
// ========================================
// Boucle principale appelée par p5.js: gère les états menu/jeu/fin, spawns et collisions.
function draw() {
  drawBackground(); // Texture d'herbe + overlay pour la lisibilité.
  
  if (gameState === 'menu') {
    drawMenuEffects(); // Effet de particules en fond pendant le menu.
    return;
  }
  
  if (gameState === 'playing') {
    // ========================================
    // MISE À JOUR DU TEMPS
    // ========================================
    gameTime = floor((millis() - startTime) / 1000);
    document.getElementById('time').textContent = gameTime + 's'; // UI timer.
    
    // ========================================
    // AUGMENTATION DE LA DIFFICULTÉ
    // ========================================
    difficultyMultiplier = 1 + gameTime / 30; // Plus le temps passe, plus les zombies sont forts.
    zombieSpawnInterval = max(70, 140 - gameTime * 1.5); // Intervalle réduit pour spawn plus fréquent.
    
    // ========================================
    // SPAWN ZOMBIES
    // ========================================
    zombieSpawnTimer++;
    if (zombieSpawnTimer > zombieSpawnInterval) {
      spawnZombie();
      zombieSpawnTimer = 0;
    }
    
    // ========================================
    // SPAWN NOTES
    // ========================================
    while (notes.length < 10) {
      spawnNote(); // Maintient 10 notes simultanées pour l'objectif de collecte.
    }
    
    // ========================================
    // SPAWN POWER-UPS (aléatoire)
    // ========================================
    if (random() < 0.003 && powerups.length < 3) {
      spawnPowerup();
    }
    
    // ========================================
    // UPDATE ZONES
    // ========================================
    for (let zone of zones) {
      zone.update();
      zone.show();
    }
    
    // ========================================
    // UPDATE OBSTACLES
    // ========================================
    for (let obstacle of obstacles) {
      obstacle.show();
    }
    
    // ========================================
    // UPDATE NOTES
    // ========================================
    for (let i = notes.length - 1; i >= 0; i--) {
      notes[i].update();
      notes[i].show();
      
      // Collision joueur-note -> collecte et particules.
      let d = p5.Vector.dist(player.pos, notes[i].pos);
      if (d < player.r + notes[i].r) {
        player.collectNote();
        
        for (let j = 0; j < 15; j++) {
          particles.push(new Particle(
            notes[i].pos.x,
            notes[i].pos.y,
            notes[i].color
          ));
        }
        
        notes.splice(i, 1);
        
        document.getElementById('notes').textContent = player.notesCollected;
        document.getElementById('score').textContent = player.score;
        document.getElementById('combo').textContent = 'x' + player.combo.toFixed(1);
        
        if (player.notesCollected >= NOTES_TO_WIN) {
          victory();
        }
      }
    }
    
    // ========================================
    // UPDATE POWER-UPS
    // ========================================
    for (let i = powerups.length - 1; i >= 0; i--) {
      powerups[i].applyBehaviors(obstacles);
      powerups[i].show();
      
      // Collision joueur-powerup -> activation + particules.
      let d = p5.Vector.dist(player.pos, powerups[i].pos);
      if (d < player.r + powerups[i].r) {
        player.activatePowerup(powerups[i].type);
        
        for (let j = 0; j < 20; j++) {
          particles.push(new Particle(
            powerups[i].pos.x,
            powerups[i].pos.y,
            powerups[i].color
          ));
        }
        
        powerups.splice(i, 1);
        
        document.getElementById('score').textContent = player.score;
      }
    }
    
    // ========================================
    // UPDATE ZOMBIES
    // ========================================
    let zombieSpeed = player.slowMoActive ? 0.3 : 1; // Slow-mo réduit la vitesse des zombies.
    
    for (let i = zombies.length - 1; i >= 0; i--) {
      let originalSpeed = zombies[i].maxSpeed; // Sauvegarde pour restaurer après le slow-mo.
      zombies[i].maxSpeed *= zombieSpeed;
      
      zombies[i].applyBehaviors(player, zombies, obstacles);
      zombies[i].show();
      
      zombies[i].maxSpeed = originalSpeed; // Restaure la vitesse réelle.
      
      if (!player.hasGuitar) {
        let d = p5.Vector.dist(player.pos, zombies[i].pos);
        if (d < player.r + zombies[i].r) {
          gameOver();
        }
      }
    }
    
    // ========================================
    // UPDATE JOUEUR
    // ========================================
    let mousePos = createVector(mouseX, mouseY);
    player.applyBehaviors(mousePos, zombies, notes, obstacles, zones);
    player.show();
    
    // ========================================
    // UPDATE PARTICULES
    // ========================================
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].show();
      if (particles[i].isDead()) {
        particles.splice(i, 1);
      }
    }
    
    // ========================================
    // UPDATE POWER-UPS UI
    // ========================================
    updatePowerupsUI();
    
    // ========================================
    // CURSEUR CUSTOM
    // ========================================
    drawCustomCursor();
    
  } else if (gameState === 'gameover' || gameState === 'victory') {
    // Affiche l'état figé: entités visibles mais non mises à jour (sauf particules).
    for (let zone of zones) {
      zone.show();
    }
    for (let obstacle of obstacles) {
      obstacle.show();
    }
    for (let note of notes) {
      note.show();
    }
    for (let zombie of zombies) {
      zombie.show();
    }
    player.show();
    
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].show();
      if (particles[i].isDead()) {
        particles.splice(i, 1);
      }
    }
    
    drawCustomCursor();
  }
}

// ========================================
// FONCTIONS DE SPAWN
// ========================================

// Fait apparaître un zombie en dehors de l'écran pour éviter les spawns sur le joueur.
function spawnZombie() {
  let side = floor(random(4)); // Choisit un côté de l'écran (haut/droite/bas/gauche).
  let x, y;
  let margin = 50; // Décalage pour être légèrement hors du cadre.
  
  switch(side) {
    case 0: x = random(width); y = -margin; break;
    case 1: x = width + margin; y = random(height); break;
    case 2: x = random(width); y = height + margin; break;
    case 3: x = -margin; y = random(height); break;
  }
  
  zombies.push(new Zombie(x, y, difficultyMultiplier)); // Spawn avec difficulté courante.
}

// Fait apparaître une note dans une zone sûre à l'intérieur de l'écran.
function spawnNote() {
  let x = random(80, width - 80);
  let y = random(80, height - 80);
  notes.push(new Note(x, y));
}

// Fait apparaître un power-up aléatoire dans une zone centrale.
function spawnPowerup() {
  let x = random(100, width - 100);
  let y = random(100, height - 100);
  let types = ['dash', 'guitar', 'slowmo'];
  let type = random(types);
  powerups.push(new PowerUp(x, y, type));
}

// ========================================
// FONCTIONS DE FIN DE JEU
// ========================================

// Passe en état gameover, enregistre les scores et redirige vers la page dédiée.
function gameOver() {
  gameState = 'gameover';
  
  sessionStorage.setItem('finalNotes', player.notesCollected);
  sessionStorage.setItem('finalScore', player.score);
  sessionStorage.setItem('finalTime', gameTime);
  sessionStorage.setItem('finalCombo', player.maxCombo.toFixed(1));
  
  window.location.href = 'gameover.html';
}

// Passe en état victory, enregistre les scores et redirige vers la page de victoire.
function victory() {
  gameState = 'victory';
  
  sessionStorage.setItem('finalNotes', player.notesCollected);
  sessionStorage.setItem('finalScore', player.score);
  sessionStorage.setItem('finalTime', gameTime);
  sessionStorage.setItem('finalCombo', player.maxCombo.toFixed(1));
  
  window.location.href = 'win.html';
}

// Relance une partie depuis l'écran de game over.
function restartGame() {
  document.getElementById('game-over').classList.remove('show');
  initGame();
  gameState = 'playing';
}

// ========================================
// FONCTIONS VISUELLES
// ========================================

function drawBackground() {
  // Affiche l'image d'herbe en mosaïque pour couvrir tout le canvas.
  push();
  imageMode(CORNER);
  for (let x = 0; x < width; x += grassImg.width) {
    for (let y = 0; y < height; y += grassImg.height) {
      image(grassImg, x, y);
    }
  }
  pop();
  
  // Overlay sombre pour améliorer la lisibilité des éléments au-dessus.
  push();
  fill(0, 0, 0, 50);
  rect(0, 0, width, height);
  pop();
}

function drawMenuEffects() {
  // Particules qui bougent en arrière-plan du menu pour donner de la vie à l'écran d'attente.
  for (let i = 0; i < 3; i++) {
    particles.push(new Particle(
      random(width),
      random(height),
      color(random([139, 255]), random([69, 215]), random([19, 0]))
    ));
  }
  
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
    if (particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }
}

function drawCustomCursor() {
  // Curseur personnalisé pour un feedback visuel clair.
  push();
  stroke(255, 215, 0);
  strokeWeight(2);
  noFill();
  
  let pulse = sin(frameCount * 0.1) * 3;
  circle(mouseX, mouseY, 25 + pulse);
  
  // Croix
  line(mouseX - 12, mouseY, mouseX - 4, mouseY);
  line(mouseX + 12, mouseY, mouseX + 4, mouseY);
  line(mouseX, mouseY - 12, mouseX, mouseY - 4);
  line(mouseX, mouseY + 12, mouseX, mouseY + 4);
  
  // Point central
  fill(255, 215, 0);
  noStroke();
  circle(mouseX, mouseY, 3);
  
  pop();
  
  noCursor();
}

function updatePowerupsUI() {
  // Indique dans l'UI quels power-ups sont actifs/disponibles.
  if (player.hasDash && player.dashCooldown === 0) {
    document.getElementById('dash-icon').classList.add('active');
  } else {
    document.getElementById('dash-icon').classList.remove('active');
  }
  
  if (player.hasGuitar) {
    document.getElementById('guitar-icon').classList.add('active');
  } else {
    document.getElementById('guitar-icon').classList.remove('active');
  }
  
  if (player.slowMoActive) {
    document.getElementById('slowmo-icon').classList.add('active');
  } else {
    document.getElementById('slowmo-icon').classList.remove('active');
  }
}

// ========================================
// CONTRÔLES
// ========================================

function keyPressed() {
  // Debug mode
  if (key === 'd' || key === 'D') {
    Vehicle.debug = !Vehicle.debug;
  }
  
  // Dash avec ESPACE
  if (key === ' ') {
    player.dash();
  }
}

function mousePressed() {
  // Dash au clic
  if (gameState === 'playing') {
    player.dash();
  }
}
