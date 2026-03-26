/**
 * Font Mutation Effect — chaotic per-character font switching & typographic collapse
 *
 * Phase 27: text 12 rises upward while every character randomly switches fonts.
 * Phase 28: text 13 enters from below with continuous font mutation until centered.
 * Phase 29: text 13 freezes (2s real-time), then undergoes typographic collapse —
 *           random glyph substitution, extreme scaling, escalating chaos → total blackout.
 *
 * Exposes:
 *   window.updateFontMutation(progress)  — bt12 rise + mutate (Phase 27)
 *   window.updateBt13Entrance(progress)  — bt13 entrance + continuous mutate (Phase 28)
 *   window.updateBt13Collapse(progress)  — bt13 freeze + collapse → blackout (Phase 29)
 */

(function () {
  'use strict';

  /* ============================================================
   * CONFIGURATION
   * ============================================================ */
  var FONTS = [
    'VarB1', 'VarB2', 'VarB3', 'VarB4', 'VarB5',
    'VarV1', 'VarV2', 'VarV3', 'VarV4', 'VarV5'
  ];
  var FONT_COUNT     = FONTS.length;
  var RISE_AMOUNT    = 5;       // SVG units to rise upward (bt12)
  var SWITCHES_PER   = 3;       // font switches per scroll increment per char

  /* Glyph pool for collapse phase — any character can become any of these */
  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    + '!@#$%^&*(){}[]|/<>~`'
    + '\u00A7\u00B6\u2020\u2021\u00B0\u2022\u00B7\u2219\u221E\u2205'
    + '\u2206\u2207\u2202\u222B\u2211\u220F\u221A\u2248\u2260\u2261'
    + '\u2264\u2265\u00B1\u2297\u22A5\u2220\u2580\u2584\u2588\u258C'
    + '\u2590\u2591\u2592\u2593\u25A0\u25A1\u25B2\u25BC\u25C6\u25CB'
    + '\u25CF\u2605\u2606\u2660\u2663\u2665\u2666\u25CA\u25D0\u25D1'
    + '\u2318\u2302\u2310\u2126\u2135\u00D7\u00F7\u2234\u2235\u2282'
    + '\u2283\u2229\u222A\u2200\u2203\u00AC\u2227\u2228\u22C5\u2295';
  var GLYPH_COUNT = GLYPHS.length;

  /* ============================================================
   * BT12 STATE
   * ============================================================ */
  var bt12Chars     = null;
  var bt12OrigX     = null;
  var bt12OrigY     = null;
  var bt12Init      = false;
  var bt12LastP     = -1;

  /* ============================================================
   * BT13 STATE
   * ============================================================ */
  var bt13Chars     = null;
  var bt13OrigX     = null;
  var bt13OrigY     = null;
  var bt13OrigChars = null;   // original characters for reversibility
  var bt13Container = null;
  var bt13Init      = false;
  var bt13LastP     = -1;

  /* ============================================================
   * COLLAPSE STATE
   * ============================================================ */
  var collapseLastP     = -1;
  var collapseSeeds     = null;   // per-char random seeds for varied behavior
  var blackoutEl        = null;

  /* ============================================================
   * BT12 INIT
   * ============================================================ */
  function initBt12() {
    if (bt12Init) return !!bt12Chars;

    var container = document.getElementById('bodytext12-lens-chars');
    if (!container) return false;

    var els = container.querySelectorAll('text');
    if (els.length === 0) return false;

    bt12Chars = [];
    bt12OrigX = [];
    bt12OrigY = [];

    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      bt12Chars.push(el);
      bt12OrigX.push(parseFloat(el.getAttribute('data-orig-x')) || 0);
      bt12OrigY.push(parseFloat(el.getAttribute('data-orig-y')) || 0);
    }

    bt12Init = true;
    return true;
  }

  /* ============================================================
   * BT13 INIT: split bt13 text group into per-character elements
   * ============================================================ */
  function initBt13() {
    if (bt13Init) return !!bt13Chars;

    var group = document.getElementById('bodytext13');
    if (!group) return false;

    var textEl = group.querySelector('text');
    if (!textEl) return false;

    // Make visible to measure but invisible to user
    group.style.visibility = 'hidden';
    group.setAttribute('opacity', '1');

    var numChars;
    try {
      numChars = textEl.getNumberOfChars();
    } catch (e) {
      group.setAttribute('opacity', '0');
      group.style.visibility = '';
      return false;
    }
    if (numChars === 0) {
      group.setAttribute('opacity', '0');
      group.style.visibility = '';
      return false;
    }

    // Extract full text content
    var allText = '';
    var tspans = textEl.querySelectorAll('tspan');
    for (var t = 0; t < tspans.length; t++) {
      allText += tspans[t].textContent;
    }

    // Gather character data
    var charData = [];
    for (var i = 0; i < numChars; i++) {
      var pos, ext;
      try {
        pos = textEl.getStartPositionOfChar(i);
        ext = textEl.getExtentOfChar(i);
      } catch (e) { continue; }

      var character = allText[i];
      if (!character) continue;

      charData.push({
        char: character,
        x: pos.x,
        y: pos.y + ext.height * 0.8,
        w: ext.width
      });
    }

    // Hide original group and restore visibility
    group.setAttribute('opacity', '0');
    group.style.visibility = '';

    if (charData.length === 0) return false;

    // Create container for per-char elements
    var svg = document.getElementById('scene');
    bt13Container = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    bt13Container.setAttribute('id', 'bodytext13-mutation-chars');
    bt13Container.setAttribute('opacity', '0');
    svg.appendChild(bt13Container);

    bt13Chars = [];
    bt13OrigX = [];
    bt13OrigY = [];
    bt13OrigChars = [];

    var fontSize = textEl.getAttribute('font-size') || '0.18';
    var fill = textEl.getAttribute('fill') || '#000000';

    for (var j = 0; j < charData.length; j++) {
      var d = charData[j];
      var el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      el.setAttribute('font-family', 'BodyFont, Georgia, serif');
      el.setAttribute('font-size', fontSize);
      el.setAttribute('fill', fill);
      el.setAttribute('text-anchor', 'start');
      el.setAttribute('x', '0');
      el.setAttribute('y', '0');
      el.setAttribute('transform', 'translate(' + d.x + ',' + d.y + ')');
      el.textContent = d.char;
      bt13Container.appendChild(el);

      bt13Chars.push(el);
      bt13OrigX.push(d.x);
      bt13OrigY.push(d.y);
      bt13OrigChars.push(d.char);
    }

    // Pre-generate random seeds for collapse variation
    collapseSeeds = [];
    for (var k = 0; k < charData.length; k++) {
      collapseSeeds.push(Math.random());
    }

    bt13Init = true;
    return true;
  }

  /* ============================================================
   * BT12: PHASE 27 — font mutation + rise upward
   * ============================================================ */
  window.updateFontMutation = function (progress) {
    if (!bt12Init && !initBt12()) return;
    if (!bt12Chars || bt12Chars.length === 0) return;

    var p = Math.min(Math.max(progress, 0), 1);

    if (p <= 0) {
      var container = document.getElementById('bodytext12-lens-chars');
      if (container) container.setAttribute('opacity', '0');
      var bt12 = document.getElementById('bodytext12');
      if (bt12) {
        bt12.setAttribute('opacity', '1');
        bt12.removeAttribute('transform');
      }
      bt12LastP = p;
      return;
    }

    var bt12 = document.getElementById('bodytext12');
    if (bt12) bt12.setAttribute('opacity', '0');

    var container = document.getElementById('bodytext12-lens-chars');
    if (container) container.setAttribute('opacity', '1');

    var easeP = 1 - Math.pow(1 - p, 2);
    var riseY = -RISE_AMOUNT * easeP;
    var fadeOp = 1 - Math.max(0, (p - 0.7) / 0.3);
    var shouldMutate = (p !== bt12LastP && p > 0 && p < 1);

    for (var i = 0; i < bt12Chars.length; i++) {
      var el = bt12Chars[i];
      el.setAttribute('transform', 'translate(' + bt12OrigX[i] + ',' + (bt12OrigY[i] + riseY) + ')');
      el.setAttribute('x', '0');
      el.setAttribute('y', '0');
      el.setAttribute('opacity', String(Math.max(0, fadeOp)));
      el.removeAttribute('filter');

      if (shouldMutate) {
        for (var s = 0; s < SWITCHES_PER; s++) {
          el.setAttribute('font-family', FONTS[Math.floor(Math.random() * FONT_COUNT)] + ', Georgia, serif');
        }
      }
    }

    bt12LastP = p;
  };

  /* ============================================================
   * BT13: PHASE 28 — entrance from below + continuous font mutation
   * ============================================================ */
  window.updateBt13Entrance = function (progress) {
    if (!bt13Init && !initBt13()) return;
    if (!bt13Chars || bt13Chars.length === 0) return;

    var p = Math.min(Math.max(progress, 0), 1);

    if (p <= 0) {
      if (bt13Container) bt13Container.setAttribute('opacity', '0');
      // Full reset: undo any collapse-phase changes (font-size, glyph, fill)
      for (var r = 0; r < bt13Chars.length; r++) {
        bt13Chars[r].textContent = bt13OrigChars[r];
        bt13Chars[r].setAttribute('font-family', 'BodyFont, Georgia, serif');
        bt13Chars[r].setAttribute('font-size', '0.18');
        bt13Chars[r].setAttribute('transform', 'translate(' + bt13OrigX[r] + ',' + bt13OrigY[r] + ')');
        bt13Chars[r].setAttribute('opacity', '1');
        bt13Chars[r].setAttribute('fill', '#000000');
      }
      bt13LastP = p;
      return;
    }

    if (bt13Container) bt13Container.setAttribute('opacity', '1');

    var bt13Group = document.getElementById('bodytext13');
    if (bt13Group) bt13Group.setAttribute('opacity', '0');

    var easeP = 1 - Math.pow(1 - p, 2);
    var riseY = 4 * (1 - easeP);

    for (var i = 0; i < bt13Chars.length; i++) {
      var el = bt13Chars[i];
      el.textContent = bt13OrigChars[i];
      el.setAttribute('font-size', '0.18');
      el.setAttribute('fill', '#000000');
      el.setAttribute('transform', 'translate(' + bt13OrigX[i] + ',' + (bt13OrigY[i] + riseY) + ')');
      el.setAttribute('opacity', '1');
    }

    var shouldMutate = (p !== bt13LastP && p < 1);
    if (shouldMutate) {
      for (var j = 0; j < bt13Chars.length; j++) {
        for (var s = 0; s < SWITCHES_PER; s++) {
          bt13Chars[j].setAttribute('font-family', FONTS[Math.floor(Math.random() * FONT_COUNT)] + ', Georgia, serif');
        }
      }
    }

    // When fully centered, reset to normal font
    if (p >= 1) {
      for (var k = 0; k < bt13Chars.length; k++) {
        bt13Chars[k].setAttribute('font-family', 'BodyFont, Georgia, serif');
      }
    }

    bt13LastP = p;
  };

  /* ============================================================
   * BT13: PHASE 29 — freeze (2s) then typographic collapse → blackout
   *
   * progress: 0 → 1 (scroll-driven from main.js)
   *
   * Sub-phases within this function:
   *   1. Freeze: text stays still for 2 seconds (real-time timer, ignores scroll)
   *   2. Collapse: scroll resumes control —
   *      - Random glyph/character substitution
   *      - Aggressive font switching
   *      - Characters scale up wildly and irregularly
   *      - Position stays fixed (no vertical movement)
   *      - Escalates until entire screen is consumed by black
   * ============================================================ */
  window.updateBt13Collapse = function (progress) {
    if (!bt13Init && !initBt13()) return;
    if (!bt13Chars || bt13Chars.length === 0) return;

    var p = Math.min(Math.max(progress, 0), 1);

    // Ensure container is visible
    if (bt13Container) bt13Container.setAttribute('opacity', '1');
    var bt13Group = document.getElementById('bodytext13');
    if (bt13Group) bt13Group.setAttribute('opacity', '0');

    // Get blackout overlay
    if (!blackoutEl) {
      blackoutEl = document.getElementById('blackoutOverlay');
    }

    /* ---- FULLY RESET at p=0 ---- */
    if (p <= 0) {
      for (var r = 0; r < bt13Chars.length; r++) {
        bt13Chars[r].textContent = bt13OrigChars[r];
        bt13Chars[r].setAttribute('font-family', 'BodyFont, Georgia, serif');
        bt13Chars[r].setAttribute('font-size', '0.18');
        bt13Chars[r].setAttribute('transform', 'translate(' + bt13OrigX[r] + ',' + bt13OrigY[r] + ')');
        bt13Chars[r].setAttribute('opacity', '1');
        bt13Chars[r].setAttribute('fill', '#000000');
      }
      if (blackoutEl) blackoutEl.style.opacity = '0';
      collapseLastP = p;
      return;
    }

    /* ---- COLLAPSE / REVERSE COLLAPSE ---- */
    var chaos = p * p * p;           // cubic acceleration
    var intensity = p * p;           // quadratic for scaling
    var scrolling = (p !== collapseLastP);
    var reversing = (collapseLastP > 0 && p < collapseLastP);

    // ViewBox center for reference (where chars should cluster)
    var vcx = 876.9;
    var vcy = 933.355;

    for (var idx = 0; idx < bt13Chars.length; idx++) {
      var el = bt13Chars[idx];
      var seed = collapseSeeds[idx];

      if (scrolling) {
        if (reversing) {
          // ---- REVERSING: restore original chars probabilistically ----
          // The lower p gets, the more likely chars revert to original
          var restoreProb = 1 - Math.min(1, chaos * 3);
          if (Math.random() < restoreProb) {
            el.textContent = bt13OrigChars[idx];
          }
          // Still switch fonts (chaos is lower so fewer switches)
          var numSw = Math.floor(1 + chaos * 5);
          for (var s2 = 0; s2 < numSw; s2++) {
            el.setAttribute('font-family', FONTS[Math.floor(Math.random() * FONT_COUNT)] + ', Georgia, serif');
          }
          // At very low p, snap back to normal font
          if (p < 0.05) {
            el.textContent = bt13OrigChars[idx];
            el.setAttribute('font-family', 'BodyFont, Georgia, serif');
          }
        } else {
          // ---- FORWARD: glyph substitution + font switching ----
          var subProb = Math.min(1, chaos * 3);
          if (Math.random() < subProb) {
            el.textContent = GLYPHS[Math.floor(Math.random() * GLYPH_COUNT)];
          }
          var numSwitches = Math.floor(3 + chaos * 7);
          for (var s = 0; s < numSwitches; s++) {
            el.setAttribute('font-family', FONTS[Math.floor(Math.random() * FONT_COUNT)] + ', Georgia, serif');
          }
        }
      }

      // ---- SCALING (works both directions — shrinks on reverse) ----
      var baseScale = 1 + intensity * (15 + seed * 35);
      var jitterScale = 1 + (scrolling ? (Math.random() - 0.3) * intensity * 10 : 0);
      var finalScale = Math.max(0.5, baseScale * jitterScale);

      var fontSize = 0.18 * finalScale;
      el.setAttribute('font-size', String(fontSize));

      // ---- POSITION: scatter + drift (works both directions) ----
      var scatter = intensity * 2 * (1 + seed);
      var ox = bt13OrigX[idx] + (scrolling ? (Math.random() - 0.5) * scatter : 0);
      var oy = bt13OrigY[idx] + (scrolling ? (Math.random() - 0.5) * scatter : 0);

      var driftT = Math.min(1, intensity * 1.5);
      var cx = ox + (vcx - ox) * driftT * 0.3;
      var cy = oy + (vcy - oy) * driftT * 0.3;

      el.setAttribute('transform', 'translate(' + cx + ',' + cy + ')');
      el.setAttribute('opacity', '1');
      el.setAttribute('fill', '#000000');
    }

    // ---- BLACKOUT OVERLAY (works both directions) ----
    // Starts at p=0.75, reaches full at p=1.0. Steep ease-in curve
    // so chars stay visible longer and reappear sooner when reversing.
    if (blackoutEl) {
      var blackoutP = Math.max(0, (p - 0.75) / 0.25);
      blackoutP = blackoutP * blackoutP * blackoutP;  // cubic: chars visible until very late
      blackoutEl.style.opacity = String(Math.min(1, blackoutP));
    }

    collapseLastP = p;
  };

  /* ============================================================
   * BLACKOUT HOLD: Phase 30 — pure black, remove all glyphs
   *
   * Called when collapse is complete. Sets background to black,
   * removes all remaining glyph elements after 0.1s delay,
   * and keeps blackout overlay at full opacity.
   * ============================================================ */
  window.updateBlackoutHold = function (progress) {
    // Ensure blackout overlay stays at full opacity
    if (!blackoutEl) {
      blackoutEl = document.getElementById('blackoutOverlay');
    }
    if (blackoutEl) blackoutEl.style.opacity = '1';

    // Hide bt13 char container and original group
    if (bt13Container) bt13Container.setAttribute('opacity', '0');
    var bt13Group = document.getElementById('bodytext13');
    if (bt13Group) bt13Group.setAttribute('opacity', '0');
  };

  /* ============================================================
   * INIT after fonts load
   * ============================================================ */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      setTimeout(function () {
        initBt12();
        initBt13();
      }, 400);
    });
  } else {
    window.addEventListener('load', function () {
      setTimeout(function () {
        initBt12();
        initBt13();
      }, 600);
    });
  }

})();
