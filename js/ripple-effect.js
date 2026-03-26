/**
 * Ripple Distortion Effect — scroll-driven single expanding blur
 *
 * A single huge ripple ring expands slowly from the center of the viewport,
 * blurring everything behind it. Fully controlled by scroll position.
 * When the ripple finishes, the moon fades away behind the blur.
 *
 * Exposes:  window.updateRipple(progress)   where progress is 0 → 1
 */

(function () {
  'use strict';

  /* ============================================================
   * CONFIGURATION
   * ============================================================ */
  var MAX_BLUR     = 24;   // maximum backdrop blur (px)
  var RING_WIDTH   = 100;  // visual width of the leading ring edge (px)

  /* ============================================================
   * PixiJS SETUP — transparent overlay canvas for the ring visual
   * ============================================================ */
  var app = new PIXI.Application({
    width:           window.innerWidth,
    height:          window.innerHeight,
    backgroundAlpha: 0,
    antialias:       true,
    resolution:      window.devicePixelRatio || 1,
    autoDensity:     true,
  });

  var canvas = app.view;
  canvas.id = 'ripple-canvas';
  canvas.style.position       = 'fixed';
  canvas.style.top            = '0';
  canvas.style.left           = '0';
  canvas.style.width          = '100vw';
  canvas.style.height         = '100vh';
  canvas.style.zIndex         = '1000';
  canvas.style.pointerEvents  = 'none';
  canvas.style.mixBlendMode   = 'screen';
  document.body.appendChild(canvas);

  var ring = new PIXI.Graphics();
  app.stage.addChild(ring);

  /* ============================================================
   * BACKDROP BLUR OVERLAY (CSS) — real content distortion
   * A filled circle mask grows from the center, blurring
   * everything inside the expanding wavefront.
   * ============================================================ */
  var blurOverlay = document.createElement('div');
  blurOverlay.id = 'ripple-blur-overlay';
  blurOverlay.style.cssText = [
    'position:fixed',
    'top:0', 'left:0',
    'width:100vw', 'height:100vh',
    'z-index:999',
    'pointer-events:none',
    'opacity:0',
  ].join(';') + ';';
  document.body.appendChild(blurOverlay);

  /* ============================================================
   * SCROLL-DRIVEN UPDATE  —  called from main.js
   * progress: 0 = ripple hasn't started, 1 = fully expanded
   * ============================================================ */
  window.updateRipple = function (progress) {
    if (progress <= 0) {
      blurOverlay.style.opacity = '0';
      blurOverlay.style.backdropFilter = 'none';
      blurOverlay.style.webkitBackdropFilter = 'none';
      blurOverlay.style.maskImage = 'none';
      blurOverlay.style.webkitMaskImage = 'none';
      ring.clear();
      return;
    }

    var w  = window.innerWidth;
    var h  = window.innerHeight;
    var cx = w / 2;
    var cy = h / 2;
    var diagonal = Math.sqrt(w * w + h * h);
    var maxRadius = diagonal * 0.75;

    /* Ease-out quadratic — fast start, gentle slowdown */
    var ease = 1 - Math.pow(1 - progress, 2);
    var radius = ease * maxRadius;

    /* ---- Backdrop blur: filled circle that grows ---- */
    var blurAmount = Math.min(progress * 1.5, 1) * MAX_BLUR;
    blurOverlay.style.opacity = '1';
    blurOverlay.style.backdropFilter = 'blur(' + blurAmount + 'px)';
    blurOverlay.style.webkitBackdropFilter = 'blur(' + blurAmount + 'px)';

    // Circular mask — blur only inside the expanding circle
    var maskPct = (radius / (Math.max(w, h) * 0.5)) * 50;
    var maskGrad = 'radial-gradient(circle at 50% 50%, ' +
      'black ' + Math.min(maskPct, 100) + '%, ' +
      'transparent ' + Math.min(maskPct + 3, 100) + '%)';
    blurOverlay.style.maskImage = maskGrad;
    blurOverlay.style.webkitMaskImage = maskGrad;

    /* ---- PixiJS ring at the leading edge of the blur ---- */
    ring.clear();

    // Ring fades in quickly, then fades out once blur covers most of screen
    var ringAlpha = Math.min(progress * 4, 1) * (1 - Math.max(0, (progress - 0.6) / 0.4));
    ringAlpha = Math.max(0, ringAlpha);

    if (ringAlpha > 0.005 && radius > RING_WIDTH * 0.5) {
      // Wide soft glow
      ring.lineStyle({ width: RING_WIDTH * 3, color: 0xFFFFFF, alpha: ringAlpha * 0.06, alignment: 0.5 });
      ring.drawCircle(cx, cy, radius);

      // Main bright ring
      ring.lineStyle({ width: RING_WIDTH, color: 0xFFFFFF, alpha: ringAlpha * 0.25, alignment: 0.5 });
      ring.drawCircle(cx, cy, radius);

      // Inner bright core
      ring.lineStyle({ width: RING_WIDTH * 0.3, color: 0xFFFFFF, alpha: ringAlpha * 0.4, alignment: 0.5 });
      ring.drawCircle(cx, cy, radius);
    }
  };

  /* ============================================================
   * DISMISS / FADE-OUT  —  called from main.js after ripple is fully expanded
   * progress: 0 = full blur still visible, 1 = completely clear
   * ============================================================ */
  window.dismissRipple = function (progress) {
    ring.clear();   // ring is already gone by this point

    if (progress <= 0) {
      // Still fully blurred (end of expand phase)
      blurOverlay.style.opacity = '1';
      blurOverlay.style.backdropFilter = 'blur(' + MAX_BLUR + 'px)';
      blurOverlay.style.webkitBackdropFilter = 'blur(' + MAX_BLUR + 'px)';
      blurOverlay.style.maskImage = 'none';
      blurOverlay.style.webkitMaskImage = 'none';
      return;
    }

    if (progress >= 1) {
      // Fully dismissed
      blurOverlay.style.opacity = '0';
      blurOverlay.style.backdropFilter = 'none';
      blurOverlay.style.webkitBackdropFilter = 'none';
      return;
    }

    // Ease-in: blur lingers, then clears quickly at the end
    var ease = progress * progress;
    var blurAmount = MAX_BLUR * (1 - ease);
    var opacity = 1 - ease;

    blurOverlay.style.opacity = String(opacity);
    blurOverlay.style.backdropFilter = 'blur(' + blurAmount + 'px)';
    blurOverlay.style.webkitBackdropFilter = 'blur(' + blurAmount + 'px)';
    blurOverlay.style.maskImage = 'none';
    blurOverlay.style.webkitMaskImage = 'none';
  };

  /* ============================================================
   * RESIZE HANDLING
   * ============================================================ */
  window.addEventListener('resize', function () {
    app.renderer.resize(window.innerWidth, window.innerHeight);
  });

})();
