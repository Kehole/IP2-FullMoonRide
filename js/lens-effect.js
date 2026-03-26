/**
 * Lens Distortion Effect — per-character ultra-wide-angle perspective
 *
 * Handles TWO text elements:
 *   bt11 — forward distortion: text distorts and vanishes toward left VP
 *   bt12 — reverse distortion: text assembles FROM left VP to normal
 *
 * Both share the same blur filters (never active simultaneously).
 *
 * Exposes:
 *   window.updateLensDistortion(progress)  — bt11: 0 = normal, 1 = fully vanished
 *   window.updateReverseLens(progress)     — bt12: 0 = at VP (hidden), 1 = fully assembled
 */

(function () {
  'use strict';

  /* ============================================================
   * CONFIGURATION
   * ============================================================ */
  var BLUR_LEVELS   = 12;
  var MAX_BLUR_STD  = 0.045;
  var VANISH_X      = 866;     // vanishing point X (far left, outside viewport)
  var CENTER_Y      = 933.355; // vertical center of zoomed viewport
  var MAX_SCALE_X   = 3.5;
  var MIN_SCALE_Y   = 0.6;
  var MIN_OPACITY   = 0.15;

  /* ============================================================
   * SHARED STATE
   * ============================================================ */
  var svg = document.getElementById('scene');
  var blurFilterEls = [];
  var filtersCreated = false;

  function clamp01(v) { return Math.min(Math.max(v, 0), 1); }

  /* ============================================================
   * CREATE SHARED BLUR FILTERS (once)
   * ============================================================ */
  function ensureBlurFilters() {
    if (filtersCreated) return;
    var defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.insertBefore(defs, svg.firstChild);
    }
    for (var b = 0; b < BLUR_LEVELS; b++) {
      var filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
      filter.id = 'lensBlur' + b;
      filter.setAttribute('x', '-200%');
      filter.setAttribute('y', '-50%');
      filter.setAttribute('width', '500%');
      filter.setAttribute('height', '200%');
      var feBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
      feBlur.setAttribute('in', 'SourceGraphic');
      feBlur.setAttribute('stdDeviation', '0');
      filter.appendChild(feBlur);
      defs.appendChild(filter);
      blurFilterEls.push(feBlur);
    }
    filtersCreated = true;
  }

  /* ============================================================
   * GENERIC: split any <g> text group into per-character elements
   * ============================================================ */
  function initTextChars(groupId) {
    var group = document.getElementById(groupId);
    if (!group) return null;
    var textEl = group.querySelector('text');
    if (!textEl) return null;

    var numChars;
    try { numChars = textEl.getNumberOfChars(); } catch (e) { return null; }
    if (numChars === 0) return null;

    ensureBlurFilters();

    var fullText = textEl.textContent;
    var minRightX = Infinity, maxRightX = -Infinity;
    var rawData = [];

    for (var i = 0; i < numChars; i++) {
      try {
        var pos    = textEl.getStartPositionOfChar(i);
        var extent = textEl.getExtentOfChar(i);
        var ch     = fullText.charAt(i);
        var rightX = pos.x + extent.width;
        rawData.push({ x: pos.x, y: pos.y, w: extent.width, rightX: rightX, char: ch });
        if (rightX < minRightX) minRightX = rightX;
        if (rightX > maxRightX) maxRightX = rightX;
      } catch (e) { continue; }
    }

    if (rawData.length < 2) return null;
    var rangeRX = maxRightX - minRightX;
    if (rangeRX < 0.01) rangeRX = 1;

    // Character container (sibling of the group)
    var container = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    container.id = groupId + '-lens-chars';
    container.setAttribute('opacity', '0');
    group.parentNode.insertBefore(container, group.nextSibling);

    var chars = [];
    var info  = [];

    for (var c = 0; c < rawData.length; c++) {
      var d = rawData[c];
      var normDist = (maxRightX - d.rightX) / rangeRX; // 0 right, 1 left

      var el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      el.setAttribute('font-family', 'BodyFont, Georgia, serif');
      el.setAttribute('font-size', '0.18');
      el.setAttribute('fill', '#000000');
      el.setAttribute('text-anchor', 'start');
      el.textContent = d.char;
      el.setAttribute('data-orig-x', d.x);
      el.setAttribute('data-orig-y', d.y);
      el.setAttribute('data-orig-w', d.w);
      container.appendChild(el);

      chars.push(el);
      info.push({
        origX:      d.x,
        origY:      d.y,
        width:      d.w,
        origRightX: d.rightX,
        normDist:   normDist
      });
    }

    return { group: group, container: container, chars: chars, info: info };
  }

  /* ============================================================
   * CORE: apply distortion to a set of characters
   *
   * distortionP: 0 = normal positions, 1 = fully at vanishing point
   * ============================================================ */
  function applyDistortion(data, distortionP) {
    var p = clamp01(distortionP);

    // Update shared blur filter levels
    for (var b = 0; b < BLUR_LEVELS; b++) {
      var blurFrac = b / (BLUR_LEVELS - 1);
      var std = blurFrac * MAX_BLUR_STD * Math.min(p * 1.5, 1);
      blurFilterEls[b].setAttribute('stdDeviation', std + ' ' + (std * 0.35));
    }

    // As p goes past 0.5, even right-side chars get pulled toward VP
    var pullAll = clamp01((p - 0.4) / 0.6);
    pullAll = pullAll * pullAll; // ease-in

    // Overall fade: all chars fade out in the last 30%
    var overallFade = 1 - clamp01((p - 0.7) / 0.3);

    for (var i = 0; i < data.chars.length; i++) {
      var info = data.info[i];
      var el   = data.chars[i];

      var t = info.normDist; // 0 right, 1 left

      // Adjust t: right-side chars get pulled too at high progress
      var adjustedT = t + (1 - t) * pullAll;

      // Effect intensity (quadratic ramp)
      var rawEffect = adjustedT * Math.min(p * 1.3, 1);
      var effect    = rawEffect * rawEffect;

      // Position: converge toward vanishing point
      var newRightX = info.origRightX + effect * (VANISH_X - info.origRightX);
      var newY      = info.origY + effect * (CENTER_Y - info.origY) * 0.35;

      // Scale
      var sx = 1 + effect * MAX_SCALE_X;
      var sy = 1 - effect * (1 - MIN_SCALE_Y);

      // Transform: anchor at right edge, stretch left
      el.setAttribute('transform',
        'translate(' + newRightX + ',' + newY + ') ' +
        'scale(' + sx + ',' + sy + ') ' +
        'translate(' + (-info.width) + ',0)');

      // Blur bucket
      var blurIdx = Math.min(Math.round(rawEffect * (BLUR_LEVELS - 1)), BLUR_LEVELS - 1);
      if (blurIdx > 0) {
        el.setAttribute('filter', 'url(#lensBlur' + blurIdx + ')');
      } else {
        el.removeAttribute('filter');
      }

      // Opacity: per-char fade + overall fade
      var charOp = 1 - effect * (1 - MIN_OPACITY);
      el.setAttribute('opacity', String(Math.max(0, charOp * overallFade)));
    }
  }

  /* ============================================================
   * BT11: forward distortion + vanish
   * ============================================================ */
  var bt11Data = null;
  var bt11Ready = false;

  function initBt11() {
    if (bt11Ready) return !!bt11Data;
    bt11Data = initTextChars('bodytext11');
    bt11Ready = true;
    return !!bt11Data;
  }

  window.updateLensDistortion = function (progress) {
    if (!bt11Ready && !initBt11()) return;
    if (!bt11Data) return;

    if (progress <= 0) {
      bt11Data.container.setAttribute('opacity', '0');
      return;
    }

    bt11Data.group.setAttribute('opacity', '0');
    bt11Data.container.setAttribute('opacity', '1');
    applyDistortion(bt11Data, progress);
  };

  /* ============================================================
   * BT12: reverse distortion (assemble from VP to normal)
   * ============================================================ */
  var bt12Data = null;
  var bt12Ready = false;

  function initBt12() {
    if (bt12Ready) return !!bt12Data;
    bt12Data = initTextChars('bodytext12');
    bt12Ready = true;
    return !!bt12Data;
  }

  window.updateReverseLens = function (progress) {
    if (!bt12Ready && !initBt12()) return;
    if (!bt12Data) return;

    if (progress <= 0) {
      // Fully at vanishing point — hide everything
      bt12Data.container.setAttribute('opacity', '0');
      bt12Data.group.setAttribute('opacity', '0');
      return;
    }

    if (progress >= 1) {
      // Fully assembled — show original text, hide chars
      bt12Data.container.setAttribute('opacity', '0');
      bt12Data.group.setAttribute('opacity', '1');
      bt12Data.group.removeAttribute('transform');
      return;
    }

    // In between: reverse distortion
    bt12Data.group.setAttribute('opacity', '0');
    bt12Data.container.setAttribute('opacity', '1');

    // Reverse: distortionP goes from 1 (fully distorted) to 0 (normal)
    var distortionP = 1 - progress;
    applyDistortion(bt12Data, distortionP);
  };

  /* ============================================================
   * INIT after fonts load
   * ============================================================ */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      setTimeout(function () { initBt11(); initBt12(); }, 200);
    });
  } else {
    window.addEventListener('load', function () {
      setTimeout(function () { initBt11(); initBt12(); }, 400);
    });
  }

})();
