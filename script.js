// Copyright © Jacob DeHart 2018: http://jacobd.com/
// Inspired by Richard Poole: http://sycora.com/
// Algorithm by Craig Reynolds: http://www.red3d.com/cwr/boids/
// Licence for this file: http://creativecommons.org/licenses/MIT/

function boids() {
  var canvas = document.createElement('CANVAS'),
    context = canvas.getContext('2d'),
    mouse = {down: false},
    boidCount = 40,
    boidMinSpeed = 2,
    boidMaxSpeed = 4,
    boidMinSize = 1,
    boidMaxSize = 1,
    boidMaxTurn = 10 * Math.PI / 180,
    boidFOV = 270 * Math.PI / 180,
    boidCosFOVDiv2 = Math.cos(boidFOV / 2),
    boidDOF = 80,
    boidPositionHistoryLength = 6,
    separationPriority = 15,
    alignmentPriority = 2,
    cohesionPriority = 1,
    targetPriority = 3,
    mouse = {x: 0, y: 0, down: false},
    debug = false,
    backgroundAlpha = 0.5,
    allBoids = [];


  function white(alpha) {
    return 'RGBA(255, 255, 255, ' + alpha + ')';
  }
  function text(txt, x, y) {
    context.fillStyle = white(0.9);
    context.font = '14px Courier';
    context.fillText(txt, x, y);
  }
  function randBetween(a, b) {
    return a + Math.random() * (b - a);
  }

  function Boid() {
    var r = Math.floor(randBetween(50, 255)),
        g = Math.floor(randBetween(50, 255)),
        b = Math.floor(randBetween(50, 255));
    this._color = 'RGBA(' + r + ', ' + g + ', ' + b + ', 1)';
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.positionHistory = [];
    this.setDirection(6.28 * Math.random());
    this.speed = randBetween(boidMinSpeed, boidMaxSpeed);
    this.size = randBetween(boidMinSize, boidMaxSize);
    this.id = allBoids.length;
    this.first = this.id === 0;
    allBoids.push(this);
  }

  Boid.prototype = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    direction: 0,
    speed: 0,
    size: 0,
    color: function () {
      return this._color;
    },
    drawCenter: function () {
      context.fillStyle = white(0.8);
      context.beginPath();
      context.arc(this.x, this.y, this.first ? 5 : 1, 0, 2 * Math.PI);
      context.fill();
    },
    drawBody: function () {
      var i, x, y, offset = 2;
      if (debug) {
        context.strokeStyle = white(1);
        context.beginPath();
        context.arc(this.x, this.y, 10 + this.size, 0, 2 * Math.PI);
        context.stroke();
      } else {


        context.save();
        context.strokeStyle = 'RGBA(0, 0, 0, 0.3)';
        context.lineWidth = 30;
        context.lineCap = 'round';
        context.beginPath();
        context.moveTo(this.x, this.y + offset);
        x = this.x;
        y = this.y + offset;
        for (i = this.positionHistory.length - 1; i >= 0; i -- ) {
          x -= this.positionHistory[i][0];
          y -= this.positionHistory[i][1];

          context.lineTo(x, y);
        }
        context.stroke();
        context.closePath();
        context.restore();

        context.save();
        context.strokeStyle = this.color();
        context.lineWidth = 30 - offset;
        context.lineCap = 'round';
        context.beginPath();
        context.moveTo(this.x, this.y);
        x = this.x;
        y = this.y;
        for (i = this.positionHistory.length - 1; i >= 0; i -- ) {
          x -= this.positionHistory[i][0];
          y -= this.positionHistory[i][1];

          context.lineTo(x, y);
        }
        context.stroke();
        context.closePath();
        context.restore();

        context.save();
        context.strokeStyle = '#FFF';
        context.lineWidth = offset;
        context.lineCap = 'round';
        context.beginPath();
        context.moveTo(this.x, this.y - 10);
        x = this.x;
        y = this.y - 10;
        for (i = this.positionHistory.length - 1; i >= 0; i -- ) {
          x -= this.positionHistory[i][0];
          y -= this.positionHistory[i][1];

          context.lineTo(x, y);
        }
        context.stroke();
        context.closePath();
        context.restore();
      }
    },
    drawDirection: function () {
      var x = this.x + Math.cos(this.direction) * (this.size * 1),
          y = this.y + Math.sin(this.direction) * (this.size * 1);
      context.strokeStyle = white(0.2);
      context.beginPath();
      context.moveTo(this.x, this.y);
      context.lineTo(x, y);
      context.stroke();
      context.fillStyle = white(0.8);
      context.beginPath();
      context.arc(x, y, 1, 0, 2 * Math.PI);
      context.fill();
    },
    drawTarget: function () {
      var x = this.x + Math.cos(this.direction) * (this.size * 1),
          y = this.y + Math.sin(this.direction) * (this.size * 1);

      context.strokeStyle = white(1 / boidCount);
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(mouse.x, mouse.y);
      context.stroke();
    },
    drawVision() {
      var size = this.size + boidDOF,
        leftAngle = this.direction - boidFOV / 2,
        rightAngle = this.direction + boidFOV / 2;
      context.strokeStyle = white(0.2);
      context.beginPath();
      context.moveTo(this.x, this.y);
      context.arc(this.x, this.y, size, leftAngle, rightAngle);
      context.lineTo(this.x, this.y);
      context.stroke();
    },
    draw: function () {
      this.drawBody();
      if (debug) {
        this.drawCenter();
        this.drawDirection();
        this.drawTarget();
        this.drawVision();
      }
    },
    move: function () {
      var dx = this.vx * this.speed,
          dy = this.vy * this.speed;
      this.x += dx;
      this.y += dy;
      this.positionHistory.push([dx, dy]);
      if (this.positionHistory.length > boidPositionHistoryLength) {
        this.positionHistory.shift();
      }
    },
    setDirection: function (v) {
      this.direction = v;
      this.vx = Math.cos(this.direction);
      this.vy = Math.sin(this.direction);
    },
    analyzeNeighbors: function () {
      var neighborData = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        closestDistance: 999999999,
        count: 0
      };

      allBoids.forEach(function (boid, i) {

        if (boid === this) { return; }

        var dx = boid.x - this.x,
          dy = boid.y - this.y,
          distanceSq = dx * dx + dy * dy,
          distance = Math.sqrt(distanceSq) - this.size - boid.size,
          dxPercent = dx / (distance + this.size + boid.size),
          dyPercent = dy / (distance + this.size + boid.size),
          cosAngle = boid.vx * dxPercent + boid.vy * dyPercent;

        if (distance < neighborData.closestDistance) {
          neighborData.closestDistance = distance;
          neighborData.closestBoid = boid;
        }

        if (distance <= boidDOF + this.size && cosAngle >= boidCosFOVDiv2) {
          neighborData.x += boid.x;
          neighborData.y += boid.y;
          neighborData.vx += boid.vx;
          neighborData.vy += boid.vy;
          neighborData.count += 1;
        }
      }.bind(this));

      neighborData.x /= neighborData.count;
      neighborData.y /= neighborData.count;
      neighborData.direction = Math.atan2(neighborData.vy, neighborData.vx);

      this.neighborData = neighborData;
    },
    applySeparation: function () {
      var dx, dy, nd = this.neighborData;
      if (nd.closestBoid &&
          nd.closestDistance < boidDOF + this.size - nd.closestBoid.size) {
        dx = nd.closestBoid.x - this.x;
        dy = nd.closestBoid.y - this.y;
        this.targetAngleX -= dx / nd.closestDistance * separationPriority;
        this.targetAngleY -= dy / nd.closestDistance * separationPriority;
      }
    },
    applyAlignment: function () {
      var nd = this.neighborData;
      this.targetAngleX += Math.cos(nd.direction) * alignmentPriority;
      this.targetAngleY += Math.sin(nd.direction) * alignmentPriority;
    },
    applyCohesion: function () {
      var dx, dy, dxPercent, dyPercent, distance, nd = this.neighborData;
      if (nd.count > 0) {
        dx = nd.x - this.x;
        dy = nd.y - this.y;
        distance = Math.sqrt(dx * dx + dy * dy);
        dxPercent = dx / distance;
        dyPercent = dy / distance;
        this.targetAngleX += dxPercent * cohesionPriority;
        this.targetAngleY += dyPercent * cohesionPriority;
      }
    },
    applyPrimaryTarget: function () {
      var dx = mouse.x - this.x,
        dy = mouse.y - this.y,
        distance = Math.max(Math.sqrt(dx * dx + dy * dy), 50),
        dxPercent = dx / distance,
        dyPercent = dy / distance;

      this.targetAngleX += dxPercent * targetPriority;
      this.targetAngleY += dyPercent * targetPriority;

    },
    initTargetAngle: function () {
      this.targetAngleX = this.vx;
      this.targetAngleY = this.vy;
    },
    calcTargetAngle: function () {
      this.targetAngle = Math.atan2(this.targetAngleY, this.targetAngleX);
    },
    fixTargetAngle: function () {
      var deltaAngle = (this.targetAngle - this.direction + Math.PI * 4) % (Math.PI * 2),
        aDeltaAngle = (this.direction - this.targetAngle + Math.PI * 4) % (Math.PI * 2),
        delta = Math.abs(deltaAngle) < Math.abs(aDeltaAngle) ? deltaAngle : -aDeltaAngle;

      this.targetAngle = delta;
    },
    applyMaxTurn: function () {
      this.targetAngle = Math.min(Math.max(this.targetAngle, -boidMaxTurn), boidMaxTurn);
    },
    applyTargetAngle() {
      this.setDirection(this.direction + this.targetAngle);
    },
    updateDirection: function () {
      this.initTargetAngle();
      this.analyzeNeighbors();
      this.applySeparation();
      this.applyAlignment();
      this.applyCohesion()
      this.applyPrimaryTarget();
      this.calcTargetAngle();
      this.fixTargetAngle();
      this.applyMaxTurn();
      this.applyTargetAngle();
    },
    wrap: function () {
      if (this.x > canvas.width + this.size / 2) {
        this.x -= canvas.width + this.size;
      } else if (this.x < 0 - this.size / 2) {
        this.x += canvas.width + this.size;
      }
      if (this.y > canvas.height + this.size / 2) {
        this.y -= canvas.height + this.size;
      } else if (this.y < 0 - this.size / 2) {
        this.y += canvas.height + this.size;
      }
    },
    update: function () {
      this.move();
      this.updateDirection();
      this.wrap();
      this.draw();
    }
  };

  function updateWindow() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function handleMove(e) {
    e.preventDefault();
    mouse.x = e.pageX;
    mouse.y = e.pageY;
    backgroundAlpha = 0.3;
  }

  window.onmousedown = window.ontouchstart = function () {
    mouse.down = true;
    debug = !debug;
  };

  window.onmouseup = window.ontouchend = function () {
    mouse.down = false;
  };

  window.onresize = window.orientationchange = updateWindow;
  canvas.onmousemove = canvas.ontouchmove = handleMove;

  function renderLoop() {
    requestAnimationFrame(renderLoop);
    context.globalAlpha = 1;
    if (debug) {
      context.fillStyle = '#043F8C';
    } else {
      // context.fillStyle = 'RGBA(50, 50, 50, ' + 1 + ')';
      // context.fillStyle = 'RGBA(255, 255, 255, ' + 1 + ')';
      context.fillStyle = '#c70017';
    }
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalAlpha = 1;

    backgroundAlpha += (1 - backgroundAlpha) / 100;
    if (debug) {
      text('Click to toggle debug', 10, 20);
      context.strokeStyle = white(0.3);
      context.beginPath();
      context.arc(mouse.x, mouse.y, 50, 0, 2 * Math.PI);
      context.stroke();
    }
    allBoids.forEach(function (boid) {
      boid.update();
    });
  }

  document.body.appendChild(canvas);
  updateWindow();

  mouse.x = canvas.width / 2;
  mouse.y = canvas.height / 2;

  for (var i = 0; i < boidCount; i++) {
    new Boid();
  }

  renderLoop();
}

window.onload = boids;