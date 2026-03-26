/**
 * Full Moon Ride — scroll-driven SVG viewBox zoom + text transitions
 *
 * Scroll height: 18662vh. Phase boundaries scaled ×5/6 from 15552vh.
 *
 * Phase 1  (0 – 2.4%):      zoom into the OO gap; subtitle fades in.
 * Phase 2  (2.4 – 3.5%):    subtitle slides up; body text 1 slides from left.
 * Phase 3  (3.5 – 4.3%):    body text 2 slides in from right.
 * Phase 4  (4.3 – 5.9%):    body texts 1+2 slide up & out;
 *                            body text 3 (centered) + chamber image fade in.
 * Phase 5  (5.9 – 6.7%):    body text 3 slides up & out;
 *                            chamber image moves to exact center of screen.
 * Phase 6  (6.7 – 8.3%):    chamber exits up; body text 4 fades in.
 * Phase 7  (8.3 – 9.1%):    body text 4 slides up & out.
 * Phase 8  (9.1 – 13.4%):   wine glass sequence (7 frames with rotation transitions).
 * Phase 9  (13.4 – 14.3%):  Glass7 slides down & fades out.
 * Phase 10 (14.3 – 16.1%):  body text 5 (left) + body text 6 (right) slide in.
 * Phase 11 (16.1 – 17.2%):  body text 5 + body text 6 slide up & out.
 * Phase 12 (17.2 – 18.7%):  subtitle 2 rises from bottom + fades in.
 * Phase 13 (18.7 – 19.8%):  subtitle 2 slides up & out.
 * Phase 14 (19.8 – 21.5%):  body text 7 (centered) fades in from below.
 * Phase 15 (21.5 – 22.5%):  body text 7 slides up & out.
 * Phase 16 (22.5 – 24.2%):  body text 8 (centered) fades in from below.
 * Phase 17 (24.2 – 24.9%):  body text 8 slides up & out.
 * Phase 18 (24.9 – 25.7%):  moon rises from bottom to center.
 * Phase 19 (25.7 – 26.8%):  scroll-driven ripple expands; moon fades out.
 * Phase 20 (26.8 – 28.0%):  ripple blur fades away; background returns to normal.
 * Phase 21 (28.0 – 29.6%):  body text 9 (left) slides in from left.
 * Phase 22 (29.6 – 30.8%):  body text 10 (right) slides in from right.
 * Phase 23 (30.8 – 32.2%):  body text 9 + body text 10 slide up & out.
 * Phase 24 (32.2 – 33.8%):  body text 11 (centered) fades in from below.
 * Phase 25 (33.8 – 36.6%):  body text 11 lens distortion + vanish.
 * Phase 26 (36.6 – 40.2%):  body text 12 reverse lens entrance (assembles from left).
 * Phase 27 (40.2 – 48.2%):  body text 12 font mutation + rise upward.
 * Phase 28 (48.2 – 57.8%):  body text 13 entrance from below with continuous font mutation.
 * Phase 29 (57.8 – 69.4%):  typographic collapse to blackout.
 * Phase 30 (69.4 – 72.5%):  blackout hold — bg black, glyphs removed.
 * Phase 31 (72.5 – 83.3%):  body text 14 (white on black) fades in from below.
 * Phase 32 (83.3 – 86.0%):  body text 14 exits upward; overlay ramps up.
 * Phase 33 (86.0 – 88.5%):  viewBox snaps to wine glass; overlay fades to reveal painting.
 * Phase 34 (88.5 – 95.0%):  zoom-out from wine glass to full homepage.
 * Phase 35 (95.0 – 100%):   zoom into OO (mirrors Phase 1); scroll resets for infinite loop.
 */

(function () {
  'use strict';

  /* ---- configuration ---- */

  var FULL = { x: 0, y: 0, w: 1728, h: 1117 };
  var ZOOM = { x: 869.7, y: 928.7, w: 14.4, h: 9.31 };
  var WINE = { x: 763.8, y: 564.3, w: 14.4, h: 9.31 };

  /* centers (precomputed) */
  var FC = { x: FULL.w / 2, y: FULL.h / 2 };
  var ZC = { x: ZOOM.x + ZOOM.w / 2, y: ZOOM.y + ZOOM.h / 2 };
  var WC = { x: WINE.x + WINE.w / 2, y: WINE.y + WINE.h / 2 };

  /* ---- phase boundaries (×5/6 from 15552vh era) ---- */

  var P1  = 0.024;   // end zoom
  var P2  = 0.035;   // end bt1 entrance
  var P3  = 0.043;   // end bt2 entrance
  var P4  = 0.059;   // end bt3+chamber entrance
  var P5  = 0.067;   // end bt3 exit + chamber centering
  var P6  = 0.083;   // end chamber exit + bt4 entrance
  var P7  = 0.091;   // end bt4 exit
  var P8  = 0.134;   // end glass sequence (Glass7 fully visible)
  var P9  = 0.143;   // end Glass7 exit downward
  var P10 = 0.161;   // end bt5+bt6 entrance
  var P11 = 0.172;   // end bt5+bt6 exit
  var P12 = 0.187;   // end subtitle2 entrance
  var P13 = 0.198;   // end subtitle2 exit
  var P14 = 0.215;   // end bt7 entrance
  var P15 = 0.225;   // end bt7 exit
  var P16 = 0.242;   // end bt8 entrance
  var P17 = 0.249;   // end bt8 exit
  var P18 = 0.257;   // end moon rise (moon centered)
  var P19 = 0.268;   // end ripple expand + moon fadeout
  var P20 = 0.280;   // end blur fadeout (background normal)
  var P21 = 0.296;   // end bt9 entrance (from left)
  var P22 = 0.308;   // end bt10 entrance (from right)
  var P23 = 0.322;   // end bt9+bt10 exit
  var P24 = 0.338;   // end bt11 entrance
  var P25 = 0.366;   // end bt11 distortion + vanish
  var P26 = 0.402;   // end bt12 reverse lens entrance
  var P27 = 0.482;   // end bt12 font mutation + rise
  var P28 = 0.578;   // end bt13 entrance + font mutation
  var P29 = 0.694;   // end typographic collapse → blackout
  var P30 = 0.725;   // end blackout hold (pure black)
  var P31 = 0.833;   // end bt14 entrance (white on black)
  var P32 = 0.860;   // end bt14 exit upward
  var P33 = 0.885;   // end wine glass reveal
  var P34 = 0.950;   // end zoom-out to full homepage
  // Phase 35: zoom FULL → ZOOM runs P34 → 1.0

  /* ---- glass sequence config ---- */
  var GLASS_COUNT       = 7;
  var ROTATION_ANGLE    = 10;
  var GLASS_TRANSITIONS = GLASS_COUNT - 1;

  /* ---- glass center for rotation ---- */
  var glassCX = 876.9;
  var glassCY = 933.36;

  /* ---- moon config ---- */
  var moonStartY  = 932;     // top of moon starts near viewport center (partially visible from below)
  var moonCenterY = 926.355; // top of moon when centered (933.355 - 14/2)

  /* ---- elements ---- */

  var svg       = document.getElementById('scene');
  var indicator = document.getElementById('scrollIndicator');
  var subtitle  = document.getElementById('subtitle');
  var subtitle2 = document.getElementById('subtitle2');
  var bt1       = document.getElementById('bodytext1');
  var bt2       = document.getElementById('bodytext2');
  var bt3       = document.getElementById('bodytext3');
  var bt4       = document.getElementById('bodytext4');
  var bt5       = document.getElementById('bodytext5');
  var bt6       = document.getElementById('bodytext6');
  var bt7       = document.getElementById('bodytext7');
  var bt8       = document.getElementById('bodytext8');
  var bt9       = document.getElementById('bodytext9');
  var bt10      = document.getElementById('bodytext10');
  var bt11      = document.getElementById('bodytext11');
  var bt12      = document.getElementById('bodytext12');
  var bt13      = document.getElementById('bodytext13');
  var bt14      = document.getElementById('bodytext14');
  var chamber   = document.getElementById('chamber');
  var moon      = document.getElementById('moon');

  /* glass image elements */
  var glasses = [];
  for (var i = 1; i <= GLASS_COUNT; i++) {
    glasses.push(document.getElementById('glass' + i));
  }

  /* ---- chamber centering target ---- */
  var zoomCY = ZOOM.y + ZOOM.h / 2;
  var chH = 5.98;
  var chBaseY = 932.0;
  var chCenterY = zoomCY - chH / 2;

  /* ---- subtitle2 base position ---- */
  var sub2BaseX = 872.77;
  var sub2BaseY = 933.5315;
  var sub2Scale = 0.0003735;

  /* ---- helpers ---- */

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(v) { return Math.min(Math.max(v, 0), 1); }
  function easeIO(t) {
    return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
  }

  /* ---- infinite loop lock ---- */
  var loopLock = false;

  /* ---- scroll handler ---- */

  var ticking = false;

  function update() {
    var scrollY   = window.scrollY;
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    var raw       = clamp01(scrollY / maxScroll);

    /* ===== PHASE 1: zoom ===== */
    var z = clamp01(raw / P1);

    var vbW = FULL.w * Math.pow(ZOOM.w / FULL.w, z);
    var vbH = FULL.h * Math.pow(ZOOM.h / FULL.h, z);
    var tc = Math.pow(z, 0.3);
    var cx = lerp(FC.x, ZC.x, tc);
    var cy = lerp(FC.y, ZC.y, tc);
    svg.setAttribute('viewBox',
      (cx-vbW/2)+' '+(cy-vbH/2)+' '+vbW+' '+vbH);

    /* ===== Subtitle 1 ===== */
    var subIn  = clamp01((raw - 0.0175) / 0.00417);
    var p2     = clamp01((raw - P1) / (P2 - P1));
    var subOut = 1 - p2;
    subtitle.setAttribute('opacity', Math.min(subIn, subOut));
    subtitle.setAttribute('transform',
      'translate(871.86,'+(933.5315 - p2*4)+') scale(0.0003735,-0.0003735)');

    /* ===== Body text 1 (left-aligned, from left) ===== */
    var bt1e = easeIO(p2);
    var bt1X = lerp(-8, 0, bt1e);
    var bt1Op = clamp01(p2 / 0.4);

    var p4 = clamp01((raw - P3) / (P4 - P3));
    var bt1UpY = -p4 * 5;
    var bt1FadeOut = 1 - clamp01(p4 / 0.5);

    bt1.setAttribute('opacity', Math.min(bt1Op, bt1FadeOut));
    bt1.setAttribute('transform', 'translate('+bt1X+','+bt1UpY+')');

    /* ===== Body text 2 (right-aligned, from right) ===== */
    var p3t = clamp01((raw - P2) / (P3 - P2));
    var bt2e = easeIO(p3t);
    var bt2X = lerp(8, 0, bt2e);
    var bt2Op = clamp01(p3t / 0.4);

    var bt2UpY = -p4 * 5;
    var bt2FadeOut = 1 - clamp01(p4 / 0.5);

    bt2.setAttribute('opacity', Math.min(bt2Op, bt2FadeOut));
    bt2.setAttribute('transform', 'translate('+bt2X+','+bt2UpY+')');

    /* ===== Phase 4: body text 3 + chamber image ===== */
    var p4late = clamp01((p4 - 0.5) / 0.5);
    var bt3e = easeIO(p4late);
    var bt3OpIn = clamp01(p4late / 0.4);

    var chDelay = clamp01((p4 - 0.65) / 0.35);
    var chOpIn = clamp01(chDelay / 0.4);
    var chYEntrance = lerp(2, 0, easeIO(chDelay));

    /* ===== Phase 5: bt3 exits up, chamber centers ===== */
    var p5 = clamp01((raw - P4) / (P5 - P4));
    var p5e = easeIO(p5);

    var bt3UpY = lerp(0, -5, p5e);
    var bt3FadeOut = 1 - clamp01(p5 / 0.5);
    var bt3Y = lerp(2, 0, bt3e) + bt3UpY;

    bt3.setAttribute('opacity', Math.min(bt3OpIn, bt3FadeOut));
    bt3.setAttribute('transform', 'translate(0,'+bt3Y+')');

    var chFinalY = lerp(chBaseY + chYEntrance, chCenterY, p5e);

    /* ===== Phase 6: chamber exits up, body text 4 fades in ===== */
    var p6 = clamp01((raw - P5) / (P6 - P5));
    var p6e = easeIO(p6);

    var chUpY = lerp(0, -5, p6e);
    var chFadeOut = 1 - clamp01(p6 / 0.5);
    chamber.setAttribute('opacity', Math.min(chOpIn, chFadeOut));
    chamber.setAttribute('y', chFinalY + chUpY);

    var bt4e = easeIO(p6);
    var bt4OpIn = clamp01(p6 / 0.4);
    var bt4Y = lerp(2, 0, bt4e);

    /* ===== Phase 7: bt4 exits up ===== */
    var p7 = clamp01((raw - P6) / (P7 - P6));
    var p7e = easeIO(p7);

    var bt4UpY = lerp(0, -5, p7e);
    var bt4FadeOut = 1 - clamp01(p7 / 0.5);

    bt4.setAttribute('opacity', Math.min(bt4OpIn, bt4FadeOut));
    bt4.setAttribute('transform', 'translate(0,'+(bt4Y + bt4UpY)+')');

    /* ===== Phase 8: wine glass sequence ===== */
    var p8 = clamp01((raw - P7) / (P8 - P7));

    var FADE_IN_END = 0.06;
    var transRaw = clamp01((p8 - FADE_IN_END) / (1 - FADE_IN_END)) * GLASS_TRANSITIONS;
    var transIdx = Math.min(Math.floor(transRaw), GLASS_TRANSITIONS - 1);
    var tLocal   = transRaw - transIdx;

    var glass7FullyVisible = (p8 >= 1);

    for (var g = 0; g < GLASS_COUNT; g++) {
      glasses[g].setAttribute('opacity', '0');
      glasses[g].removeAttribute('transform');
    }

    if (p8 <= 0) {
      // all hidden
    } else if (p8 <= FADE_IN_END) {
      var fadeIn = clamp01(p8 / FADE_IN_END);
      glasses[0].setAttribute('opacity', fadeIn);
    } else if (transRaw >= GLASS_TRANSITIONS) {
      glass7FullyVisible = true;
    } else {
      var curIdx  = transIdx;
      var nextIdx = transIdx + 1;

      if (tLocal < 0.4) {
        var rotP = easeIO(tLocal / 0.4);
        var angle = rotP * ROTATION_ANGLE;
        glasses[curIdx].setAttribute('opacity', '1');
        glasses[curIdx].setAttribute('transform',
          'rotate('+angle+','+glassCX+','+glassCY+')');
      } else if (tLocal < 0.6) {
        var fadeP = easeIO((tLocal - 0.4) / 0.2);
        glasses[curIdx].setAttribute('opacity', 1 - fadeP);
        glasses[curIdx].setAttribute('transform',
          'rotate('+ROTATION_ANGLE+','+glassCX+','+glassCY+')');
        glasses[nextIdx].setAttribute('opacity', fadeP);
      } else {
        glasses[nextIdx].setAttribute('opacity', '1');
      }
    }

    /* ===== Phase 9: Glass7 slides DOWN & fades out ===== */
    var p9 = clamp01((raw - P8) / (P9 - P8));
    var p9e = easeIO(p9);

    if (glass7FullyVisible) {
      var g7DownY = lerp(0, 5, p9e);
      var g7FadeOut = 1 - clamp01(p9 / 0.5);
      glasses[GLASS_COUNT - 1].setAttribute('opacity', g7FadeOut);
      glasses[GLASS_COUNT - 1].setAttribute('transform',
        'translate(0,'+g7DownY+')');
    }

    /* ===== Phase 10: bt5 (from left) + bt6 (from right) ===== */
    var p10 = clamp01((raw - P9) / (P10 - P9));
    var p10e = easeIO(p10);

    var bt5X = lerp(-8, 0, p10e);
    var bt5OpIn = clamp01(p10 / 0.4);

    var bt6X = lerp(8, 0, p10e);
    var bt6OpIn = clamp01(p10 / 0.4);

    /* ===== Phase 11: bt5 + bt6 exit up ===== */
    var p11 = clamp01((raw - P10) / (P11 - P10));
    var p11e = easeIO(p11);

    var bt5UpY = lerp(0, -5, p11e);
    var bt5FadeOut = 1 - clamp01(p11 / 0.5);
    bt5.setAttribute('opacity', Math.min(bt5OpIn, bt5FadeOut));
    bt5.setAttribute('transform', 'translate('+bt5X+','+bt5UpY+')');

    var bt6UpY = lerp(0, -5, p11e);
    var bt6FadeOut = 1 - clamp01(p11 / 0.5);
    bt6.setAttribute('opacity', Math.min(bt6OpIn, bt6FadeOut));
    bt6.setAttribute('transform', 'translate('+bt6X+','+bt6UpY+')');

    /* ===== Phase 12: subtitle 2 rises from bottom + fades in ===== */
    var p12 = clamp01((raw - P11) / (P12 - P11));
    var p12e = easeIO(p12);
    var sub2OpIn = clamp01(p12 / 0.5);
    var sub2Y = sub2BaseY + lerp(2, 0, p12e);

    /* ===== Phase 13: subtitle 2 slides up & out ===== */
    var p13 = clamp01((raw - P12) / (P13 - P12));
    var p13e = easeIO(p13);
    var sub2FadeOut = 1 - clamp01(p13 / 0.5);
    var sub2ExitY = sub2Y - p13e * 4;

    subtitle2.setAttribute('opacity', Math.min(sub2OpIn, sub2FadeOut));
    subtitle2.setAttribute('transform',
      'translate('+sub2BaseX+','+sub2ExitY+') scale('+sub2Scale+',-'+sub2Scale+')');

    /* ===== Phase 14: bt7 (centered) fades in from below ===== */
    var p14 = clamp01((raw - P13) / (P14 - P13));
    var bt7e = easeIO(p14);
    var bt7OpIn = clamp01(p14 / 0.4);
    var bt7Y = lerp(2, 0, bt7e);

    /* ===== Phase 15: bt7 exits up ===== */
    var p15 = clamp01((raw - P14) / (P15 - P14));
    var p15e = easeIO(p15);
    var bt7UpY = lerp(0, -5, p15e);
    var bt7FadeOut = 1 - clamp01(p15 / 0.5);

    bt7.setAttribute('opacity', Math.min(bt7OpIn, bt7FadeOut));
    bt7.setAttribute('transform', 'translate(0,'+(bt7Y + bt7UpY)+')');

    /* ===== Phase 16: bt8 (centered) fades in from below ===== */
    var p16 = clamp01((raw - P15) / (P16 - P15));
    var bt8e = easeIO(p16);
    var bt8OpIn = clamp01(p16 / 0.4);
    var bt8Y = lerp(2, 0, bt8e);

    /* ===== Phase 17: bt8 exits up ===== */
    var p17 = clamp01((raw - P16) / (P17 - P16));
    var p17e = easeIO(p17);
    var bt8UpY = lerp(0, -5, p17e);
    var bt8FadeOut = 1 - clamp01(p17 / 0.5);

    bt8.setAttribute('opacity', Math.min(bt8OpIn, bt8FadeOut));
    bt8.setAttribute('transform', 'translate(0,'+(bt8Y + bt8UpY)+')');

    /* ===== Phase 18: moon rises from bottom to center ===== */
    var p18 = clamp01((raw - P17) / (P18 - P17));
    var p18e = easeIO(p18);

    // Moon fades in quickly, then rises from below to centered
    var moonOp = clamp01(p18 / 0.15);
    var moonY  = lerp(moonStartY, moonCenterY, p18e);

    /* ===== Phase 19: scroll-driven ripple expand + moon fadeout ===== */
    var p19 = clamp01((raw - P18) / (P19 - P18));

    /* ===== Phase 20: ripple blur fades away ===== */
    var p20 = clamp01((raw - P19) / (P20 - P19));

    // Drive ripple expand OR dismiss, never both at once
    if (p20 > 0 && window.dismissRipple) {
      window.dismissRipple(p20);
    } else if (window.updateRipple) {
      window.updateRipple(p19);
    }

    // Moon fades out in the last 40% of the ripple phase
    if (p19 > 0.6) {
      var moonFade = 1 - clamp01((p19 - 0.6) / 0.4);
      moonOp = Math.min(moonOp, moonFade);
    }

    moon.setAttribute('opacity', moonOp);
    moon.setAttribute('y', moonY);

    /* ===== Phase 21: bt9 (left-aligned) slides in from left ===== */
    var p21 = clamp01((raw - P20) / (P21 - P20));
    var p21e = easeIO(p21);
    var bt9X = lerp(-8, 0, p21e);
    var bt9OpIn = clamp01(p21 / 0.4);

    /* ===== Phase 22: bt10 (right-aligned) slides in from right ===== */
    var p22 = clamp01((raw - P21) / (P22 - P21));
    var p22e = easeIO(p22);
    var bt10X = lerp(8, 0, p22e);
    var bt10OpIn = clamp01(p22 / 0.4);

    /* ===== Phase 23: bt9 + bt10 slide up & out ===== */
    var p23 = clamp01((raw - P22) / (P23 - P22));
    var p23e = easeIO(p23);
    var btExitY = lerp(0, -5, p23e);
    var btExitFade = 1 - clamp01(p23 / 0.5);

    bt9.setAttribute('opacity', Math.min(bt9OpIn, btExitFade));
    bt9.setAttribute('transform', 'translate('+bt9X+','+btExitY+')');

    bt10.setAttribute('opacity', Math.min(bt10OpIn, btExitFade));
    bt10.setAttribute('transform', 'translate('+bt10X+','+btExitY+')');

    /* ===== Phase 24: bt11 (centered) fades in from below ===== */
    var p24 = clamp01((raw - P23) / (P24 - P23));
    var bt11e = easeIO(p24);
    var bt11OpIn = clamp01(p24 / 0.4);
    var bt11Y = lerp(2, 0, bt11e);

    /* ===== Phase 25: bt11 lens distortion + vanish (P24 → P25) ===== */
    var p25 = clamp01((raw - P24) / (P25 - P24));

    if (p25 > 0 && window.updateLensDistortion) {
      window.updateLensDistortion(p25);
    } else {
      if (window.updateLensDistortion) {
        window.updateLensDistortion(0);
      }
      bt11.setAttribute('opacity', bt11OpIn);
      bt11.setAttribute('transform', 'translate(0,'+bt11Y+')');
    }

    /* ===== Phase 26: bt12 reverse lens entrance (P25 → P26) ===== */
    var p26 = clamp01((raw - P25) / (P26 - P25));

    if (p26 > 0 && window.updateReverseLens) {
      window.updateReverseLens(p26);
    } else if (window.updateReverseLens) {
      window.updateReverseLens(0);
    }

    /* ===== Phase 27: bt12 font mutation + rise (P26 → P27) ===== */
    var p27 = clamp01((raw - P26) / (P27 - P26));

    if (p27 > 0 && window.updateFontMutation) {
      window.updateFontMutation(p27);
    }

    /* ===== Phase 28: bt13 entrance from below + continuous font mutation (P27 → P28) ===== */
    var p28 = clamp01((raw - P27) / (P28 - P27));

    if (p28 > 0 && window.updateBt13Entrance) {
      window.updateBt13Entrance(p28);
    } else if (window.updateBt13Entrance) {
      window.updateBt13Entrance(0);
    } else {
      bt13.setAttribute('opacity', '0');
    }

    /* ===== Phase 29: typographic collapse → blackout (P28 → P29) ===== */
    var p29 = clamp01((raw - P28) / (P29 - P28));
    var blackout = document.getElementById('blackoutOverlay');
    var bgRectEl = document.getElementById('bgRect');

    if (p29 > 0 && window.updateBt13Collapse) {
      window.updateBt13Collapse(p29);
    } else {
      // Scrolled back before collapse: reset blackout + background
      if (blackout) blackout.style.opacity = '0';
      if (bgRectEl) bgRectEl.setAttribute('fill', '#D8CAB6');
    }

    /* ===== Phase 30: blackout hold — bg black, glyphs hidden (P29 → P30) ===== */
    var p30 = clamp01((raw - P29) / (P30 - P29));

    if (p30 > 0 && window.updateBlackoutHold) {
      window.updateBlackoutHold(p30);
    }

    /* ===== Phase 31: bt14 (white on black) fades in from below (P30 → P31) ===== */
    var p31 = clamp01((raw - P30) / (P31 - P30));

    if (p31 > 0) {
      // SVG background stays black
      if (bgRectEl) bgRectEl.setAttribute('fill', '#000000');

      var bt14e = easeIO(p31);
      var bt14OpIn = clamp01(p31 / 0.4);
      var bt14Y = lerp(2, 0, bt14e);

      bt14.setAttribute('opacity', bt14OpIn);
      bt14.setAttribute('transform', 'translate(0,' + bt14Y + ')');

      // Fade out blackout overlay so SVG (black bg + white text) shows through
      if (blackout) {
        var overlayFade = 1 - clamp01(p31 / 0.3);
        blackout.style.opacity = String(overlayFade);
      }
    } else {
      bt14.setAttribute('opacity', '0');
      // Scrolled back before bt14: restore original background
      if (bgRectEl) bgRectEl.setAttribute('fill', '#D8CAB6');
    }

    /* ===== Phase 32: bt14 exits upward + overlay ramps back up (P31 → P32) ===== */
    var p32 = clamp01((raw - P31) / (P32 - P31));

    if (p32 > 0) {
      var p32e = easeIO(p32);
      var bt14ExitFade = 1 - clamp01(p32 / 0.5);
      var bt14ExitY = lerp(0, -5, p32e);

      bt14.setAttribute('opacity', String(bt14ExitFade));
      bt14.setAttribute('transform', 'translate(0,' + bt14ExitY + ')');

      // bgRect stays black
      if (bgRectEl) bgRectEl.setAttribute('fill', '#000000');

      // In last 30%, ramp overlay from 0 → 1 to hide viewBox transition
      if (blackout) {
        var overlayRamp = clamp01((p32 - 0.7) / 0.3);
        blackout.style.opacity = String(overlayRamp);
      }
    }

    /* ===== Phase 33: wine glass reveal — snap viewBox + fade overlay (P32 → P33) ===== */
    var p33 = clamp01((raw - P32) / (P33 - P32));

    if (p33 > 0) {
      // Hide bt14 completely
      bt14.setAttribute('opacity', '0');

      // Set background to beige so painting is framed properly
      if (bgRectEl) bgRectEl.setAttribute('fill', '#D8CAB6');

      // Snap viewBox to wine glass zoom (painting area)
      svg.setAttribute('viewBox',
        WINE.x + ' ' + WINE.y + ' ' + WINE.w + ' ' + WINE.h);

      // Fade overlay from 1 → 0 to reveal painting
      if (blackout) {
        var revealP = easeIO(p33);
        blackout.style.opacity = String(1 - revealP);
      }
    }

    /* ===== Phase 34: zoom-out from wine glass to full homepage (P33 → P34) ===== */
    var p34 = clamp01((raw - P33) / (P34 - P33));

    if (p34 > 0) {
      // z34: 1 = fully zoomed (wine glass), 0 = full view
      var z34 = 1 - p34;
      var vbW34 = FULL.w * Math.pow(WINE.w / FULL.w, z34);
      var vbH34 = FULL.h * Math.pow(WINE.h / FULL.h, z34);
      var tc34 = Math.pow(z34, 0.3);
      var cx34 = lerp(FC.x, WC.x, tc34);
      var cy34 = lerp(FC.y, WC.y, tc34);
      svg.setAttribute('viewBox',
        (cx34 - vbW34/2) + ' ' + (cy34 - vbH34/2) + ' ' + vbW34 + ' ' + vbH34);

      if (bgRectEl) bgRectEl.setAttribute('fill', '#D8CAB6');
      if (blackout) blackout.style.opacity = '0';
    }

    /* ===== Phase 35: zoom FULL → ZOOM (mirrors Phase 1) + scroll reset (P34 → 1.0) ===== */
    var p35 = clamp01((raw - P34) / (1 - P34));

    if (p35 > 0) {
      // Same exponential zoom as Phase 1
      var z35 = p35;
      var vbW35 = FULL.w * Math.pow(ZOOM.w / FULL.w, z35);
      var vbH35 = FULL.h * Math.pow(ZOOM.h / FULL.h, z35);
      var tc35 = Math.pow(z35, 0.3);
      var cx35 = lerp(FC.x, ZC.x, tc35);
      var cy35 = lerp(FC.y, ZC.y, tc35);
      svg.setAttribute('viewBox',
        (cx35 - vbW35/2) + ' ' + (cy35 - vbH35/2) + ' ' + vbW35 + ' ' + vbH35);

      if (bgRectEl) bgRectEl.setAttribute('fill', '#D8CAB6');
      if (blackout) blackout.style.opacity = '0';

      // Subtitle fades in during the last portion of the zoom (matching Phase 1 timing)
      // In Phase 1: subtitle starts at ~73% through the zoom and reaches full at ~90%
      var subInLoop = clamp01((z35 - 0.73) / 0.17);
      subtitle.setAttribute('opacity', String(subInLoop));
      subtitle.setAttribute('transform',
        'translate(871.86,' + 933.5315 + ') scale(0.0003735,-0.0003735)');

      // Infinite loop: when zoom is nearly complete, reset scroll to Phase 1 end
      if (raw >= 0.998 && !loopLock) {
        loopLock = true;
        var targetScrollY = Math.round(P1 * maxScroll);
        requestAnimationFrame(function () {
          window.scrollTo(0, targetScrollY);
          setTimeout(function () { loopLock = false; }, 200);
        });
      }
    }

    /* ===== Scroll indicator ===== */
    if (raw > 0.01) indicator.classList.add('hidden');
    else indicator.classList.remove('hidden');

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
