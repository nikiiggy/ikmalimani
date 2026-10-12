(() => {
  "use strict";

  /* =========================================================
     HELPER
  ========================================================= */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const vibrate = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

  const screens = $$(".screen");
  const LAST = screens.length - 1;
  const IDX = {
    opening: 0, welcome: 1, story: 2, gallery: 3, reasons: 4,
    game: 5, cake: 6, letter: 7, secret: 8, final: 9
  };
  let current = 0;

  const audio = $("#audio");
  const playBtn = $("#playBtn");
  const disc = $("#disc");
  const player = $("#player");

  /* =========================================================
     FX ENGINE (canvas): kembang api, confetti, emoji, sparkle
  ========================================================= */
  const cv = $("#fx");
  const ctx = cv.getContext("2d");
  let W = 0, H = 0, parts = [], running = false, last = 0;
  const MAX_PARTS = 2200;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  function add(p) {
    if (parts.length >= MAX_PARTS) return;
    p.age = 0;
    p.px = p.x;
    p.py = p.y;
    parts.push(p);
    if (!running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(tick);
    }
  }

  function tick(now) {
    const dt = Math.min((now - last) / 16.667, 3);
    last = now;
    ctx.clearRect(0, 0, W, H);

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.age += dt;
      if (p.age >= p.life) {
        parts[i] = parts[parts.length - 1];
        parts.pop();
        if (p.onEnd) p.onEnd(p);
        continue;
      }
      p.px = p.x;
      p.py = p.y;
      const d = Math.pow(p.drag, dt);
      p.vx *= d;
      p.vy *= d;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      draw(p, p.age / p.life);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    if (parts.length) {
      requestAnimationFrame(tick);
    } else {
      running = false;
      ctx.clearRect(0, 0, W, H);
    }
  }

  function draw(p, t) {
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = p.fade ? Math.max(1 - Math.pow(t, p.fadePow || 2), 0) : 1;

    switch (p.k) {
      case "spark":
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = p.c;
        ctx.lineWidth = p.s;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        break;

      case "dot":
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(p.s * (1 - t * 0.6), 0.5), 0, Math.PI * 2);
        ctx.fill();
        break;

      case "conf":
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.age * p.flip));
        ctx.fillStyle = p.c;
        if (p.round) {
          ctx.beginPath();
          ctx.arc(0, 0, p.s / 2.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.6);
        }
        ctx.restore();
        break;

      case "emoji":
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.font = `${p.s}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.ch, 0, 0);
        ctx.restore();
        break;
    }
  }

  function spark(x, y, vx, vy, c, life, s) {
    add({ k: "spark", x, y, vx, vy, g: 0.06, drag: 0.985, life, c, s, rot: 0, vr: 0, fade: true });
  }

  /* Ledakan kembang api: burst / ring / heart */
  function explode(x, y, hue, shape) {
    const n = shape === "heart" ? 100 : shape === "ring" ? 64 : 120;
    const mult = rand(4.2, 7.5);

    for (let i = 0; i < n; i++) {
      let vx, vy;
      if (shape === "heart") {
        const t = (i / n) * Math.PI * 2;
        vx = (16 * Math.pow(Math.sin(t), 3) / 16) * mult * 1.15;
        vy = (-(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16) * mult * 1.15;
      } else if (shape === "ring") {
        const a = (i / n) * Math.PI * 2;
        vx = Math.cos(a) * mult;
        vy = Math.sin(a) * mult;
      } else {
        const a = Math.random() * Math.PI * 2;
        const sp = Math.random() * mult;
        vx = Math.cos(a) * sp;
        vy = Math.sin(a) * sp;
      }
      const h = (hue + rand(-25, 25) + 360) % 360;
      spark(x, y, vx, vy, `hsl(${h} 100% ${rand(55, 78)}%)`, rand(55, 100), rand(1.5, 2.8));
    }

    // kilatan cahaya di pusat ledakan
    add({
      k: "dot", x, y, vx: 0, vy: 0, g: 0, drag: 1, life: 16,
      c: `hsl(${hue} 100% 80%)`, s: 46, rot: 0, vr: 0, fade: true
    });
  }

  function rocket(x, targetY, hue, shape) {
    const frames = 36;
    add({
      k: "spark", x, y: H, vx: rand(-0.5, 0.5), vy: -(H - targetY) / frames,
      g: 0, drag: 1, life: frames, c: "#fff", s: 3, rot: 0, vr: 0, fade: false,
      onEnd: (p) => explode(p.x, p.y, hue, shape)
    });
  }

  function salvo(n = 6, opts = {}) {
    const shapes = opts.shapes || ["burst", "burst", "ring", "heart"];
    const delay = opts.delay || 220;
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        rocket(rand(W * 0.1, W * 0.9), rand(H * 0.1, H * 0.5), rand(0, 360), pick(shapes));
      }, i * delay);
    }
  }

  const CONF_COLORS = ["#ff5c93", "#ff8db2", "#ffd166", "#7bdff2", "#b8f2a8", "#c77dff", "#ffffff", "#ff9f1c"];

  function cannon(side, n = 100) {
    const x = side === "l" ? -10 : W + 10;
    const y = H * 0.88;
    for (let i = 0; i < n; i++) {
      const deg = side === "l" ? rand(-85, -35) : rand(-145, -95);
      const ang = (deg * Math.PI) / 180;
      const sp = rand(11, 26);
      add({
        k: "conf", x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        g: 0.28, drag: 0.985, life: rand(120, 210), c: pick(CONF_COLORS),
        s: rand(6, 13), rot: rand(0, 6.28), vr: rand(-0.3, 0.3),
        flip: rand(0.1, 0.4), round: Math.random() < 0.3, fade: true, fadePow: 6
      });
    }
  }

  function confettiRain(n = 140) {
    for (let i = 0; i < n; i++) {
      add({
        k: "conf", x: rand(0, W), y: rand(-H * 0.4, -10), vx: rand(-1, 1), vy: rand(2, 5),
        g: 0.02, drag: 1, life: 420, c: pick(CONF_COLORS), s: rand(6, 12),
        rot: rand(0, 6.28), vr: rand(-0.2, 0.2), flip: rand(0.1, 0.35),
        round: Math.random() < 0.25, fade: true, fadePow: 8
      });
    }
  }

  function emojiRain(list, n = 40) {
    for (let i = 0; i < n; i++) {
      add({
        k: "emoji", ch: pick(list), x: rand(0, W), y: rand(-H * 0.5, -20),
        vx: rand(-0.8, 0.8), vy: rand(2, 5), g: 0.01, drag: 1, life: 460,
        s: rand(18, 42), rot: rand(-0.5, 0.5), vr: rand(-0.04, 0.04),
        fade: true, fadePow: 8
      });
    }
  }

  function heartBurst(x, y, n = 10) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(2, 7);
      add({
        k: "emoji", ch: pick(["♥", "💖", "💗", "✨", "💕"]), x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3, g: 0.15, drag: 0.98,
        life: rand(50, 90), s: rand(12, 28), rot: rand(-0.6, 0.6), vr: rand(-0.1, 0.1),
        fade: true, fadePow: 3
      });
    }
  }

  function sparkleTrail(x, y) {
    add({
      k: "dot", x: x + rand(-4, 4), y: y + rand(-4, 4), vx: rand(-0.6, 0.6), vy: rand(-0.4, 0.8),
      g: 0.03, drag: 0.98, life: 30, c: `hsl(${rand(320, 360)} 100% ${rand(65, 85)}%)`,
      s: rand(2.5, 6), rot: 0, vr: 0, fade: true
    });
  }

  /* Efek layar: shake & flash */
  function shake(ms = 550) {
    const s = screens[current];
    s.classList.remove("shake");
    void s.offsetWidth;
    s.classList.add("shake");
    setTimeout(() => s.classList.remove("shake"), ms);
  }

  const flashEl = $("#flash");
  function flash(color = "#fff") {
    if (!flashEl) return;
    flashEl.style.background = color;
    flashEl.classList.remove("on");
    void flashEl.offsetWidth;
    flashEl.classList.add("on");
  }

  /* =========================================================
     NAVIGASI HALAMAN
  ========================================================= */
  const STAGGER_SEL = [
    ".center>*:not(.big-heart):not(.secret-heart)",
    ".intro-content>*:not(.heart-orbit)",
    ".section-head", ".timeline article", ".reason", ".answer",
    ".photo-card", ".game-card>*", ".chapter"
  ].join(",");

  function stagger(screen) {
    $$(STAGGER_SEL, screen).forEach((el, i) => el.style.setProperty("--d", i * 70 + "ms"));
  }

  const progressBar = $("#progress i");

  function show(i) {
    const prev = current;
    current = Math.max(0, Math.min(i, LAST));

    screens.forEach((s, n) => s.classList.toggle("active", n === current));
    stagger(screens[current]);
    window.scrollTo({ top: 0 });

    if (progressBar) progressBar.style.width = (current / LAST) * 100 + "%";

    if (prev === IDX.final && current !== IDX.final) stopFinale();
    if (prev === IDX.cake && current !== IDX.cake) stopMic();

    onEnter(current);
  }

  function next() {
    show(current + 1);
  }

  $$(".next").forEach((b) => b.addEventListener("click", () => {
    vibrate(12);
    next();
  }));

  function onEnter(n) {
    switch (n) {
      case IDX.welcome:
        cannon("l", 90);
        cannon("r", 90);
        salvo(3, { delay: 260 });
        break;
      case IDX.story:
        emojiRain(["💞", "✨"], 14);
        break;
      case IDX.gallery:
        emojiRain(["📸", "💖", "✨"], 16);
        break;
      case IDX.cake:
        resetCandle();
        break;
      case IDX.letter:
        emojiRain(["💌", "💖", "💗"], 22);
        break;
      case IDX.final:
        startFinale();
        break;
    }
  }

  /* =========================================================
     MUSIK
  ========================================================= */
  function setPlaying(on) {
    if (playBtn) playBtn.textContent = on ? "❚❚" : "▶";
    if (disc) disc.classList.toggle("playing", on);
    if (player) player.classList.toggle("playing", on);
  }

  $("#startBtn").addEventListener("click", () => {
    if (audio) {
      audio.play().then(() => setPlaying(true)).catch((err) => {
        console.log("Autoplay ditolak browser / file lagu belum ada:", err);
      });
    }
    vibrate([40, 30, 80]);
    flash("#ff5c93");
    salvo(5, { delay: 200 });
    show(IDX.welcome);
  });

  if (playBtn && audio) {
    playBtn.addEventListener("click", () => {
      if (audio.paused) {
        audio.play().then(() => setPlaying(true)).catch(() => {});
      } else {
        audio.pause();
        setPlaying(false);
      }
    });
  }

  /* =========================================================
     HALAMAN 4: 10 ALASAN (tap untuk membuka)
  ========================================================= */
  const reasonBtns = $$(".reason");
  const reasonHint = $("#reasonHint");
  const openedReasons = new Set();
  let reasonsCelebrated = false;

  function updateReasonHint() {
    if (!reasonHint) return;
    reasonHint.textContent = openedReasons.size >= reasonBtns.length
      ? "Semua alasan sudah kamu buka 🥹💖"
      : `Tap setiap alasan untuk membukanya 👆 (${openedReasons.size}/${reasonBtns.length})`;
  }

  reasonBtns.forEach((b, i) => b.addEventListener("click", () => {
    const r = b.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    b.animate(
      [{ transform: "scale(1)" }, { transform: "scale(.94) rotate(-1deg)" }, { transform: "scale(1.04) rotate(1deg)" }, { transform: "scale(1)" }],
      { duration: 380 }
    );
    b.classList.add("tapped");
    openedReasons.add(i);
    heartBurst(cx, cy, b.classList.contains("special") ? 40 : 16);
    vibrate(15);
    updateReasonHint();

    if (b.classList.contains("special")) {
      explode(cx, cy, 340, "heart");
      flash("rgba(255,92,147,.5)");
    }

    if (openedReasons.size === reasonBtns.length && !reasonsCelebrated) {
      reasonsCelebrated = true;
      cannon("l", 90);
      cannon("r", 90);
      salvo(5, { delay: 200 });
      shake();
    }
  }));
  updateReasonHint();

  /* =========================================================
     HALAMAN 5: MINI GAME
  ========================================================= */
  const gameReplies = [
    "Hmm, terlalu kecil 😤 coba lagi!",
    "Masih kurang jauh dong 🥺",
    "Dikit lagi! Tapi masih kurang 😘",
    "Bahkan segitu pun masih kurang. Jawabannya: nggak bisa dihitung. ❤️"
  ];
  const answerBtns = $$(".answer");
  const gameResult = $("#gameResult");

  answerBtns.forEach((b, i) => b.addEventListener("click", () => {
    const r = b.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    answerBtns.forEach((x) => x.classList.remove("nope", "win"));
    void b.offsetWidth;
    if (gameResult) gameResult.textContent = gameReplies[i] || gameReplies[3];

    if (i === answerBtns.length - 1) {
      b.classList.add("win");
      vibrate([80, 40, 80, 40, 160]);
      flash("#ffd1e3");
      shake(700);
      cannon("l", 120);
      cannon("r", 120);
      salvo(7, { delay: 170 });
      emojiRain(["💖", "🫶", "🥹", "✨"], 50);
    } else {
      b.classList.add("nope");
      vibrate(30);
      heartBurst(cx, cy, 10 + i * 6);
      if (i === 2) explode(cx, cy - 40, rand(0, 360), "ring");
    }
  }));

  /* =========================================================
     HALAMAN 6: TIUP LILIN  ->  LANGSUNG KE HALAMAN 7 (letter)
  ========================================================= */
  const flame = $("#flame");
  const wishText = $("#wishText");
  const wishBtn = $("#wishBtn");
  const micBtn = $("#micBtn");
  const cakeWrap = $("#cakeWrap");
  const MIC_LABEL = "🎤 Atau tiup beneran pakai mic";
  let blown = false;
  let micStream = null;
  let micCtx = null;

  function resetCandle() {
    blown = false;
    if (flame) {
      flame.textContent = "🔥";
      flame.classList.remove("out");
      flame.style.opacity = "";
    }
    if (wishText) wishText.textContent = "Tekan tombolnya dan buat satu permintaan.";
    if (wishBtn) wishBtn.disabled = false;
    if (micBtn) { micBtn.disabled = false; micBtn.textContent = MIC_LABEL; }
    if (cakeWrap) {
      cakeWrap.classList.remove("dark");
      $$(".smoke", cakeWrap).forEach((e) => e.remove());
    }
  }

  function blowCandle() {
    if (blown) return;
    blown = true;
    stopMic();

    if (wishBtn) wishBtn.disabled = true;
    if (micBtn) micBtn.disabled = true;

    if (flame) {
      flame.textContent = "💨";
      flame.style.opacity = "";
      flame.classList.add("out");
    }
    if (cakeWrap) {
      cakeWrap.classList.add("dark");
      for (let i = 0; i < 7; i++) {
        const s = document.createElement("span");
        s.className = "smoke";
        s.style.setProperty("--x", rand(-40, 40) + "px");
        s.style.setProperty("--dl", i * 0.08 + "s");
        cakeWrap.appendChild(s);
      }
    }
    if (wishText) wishText.textContent = "Semoga semua doa baikmu menemukan jalannya. ❤️";

    vibrate([60, 40, 140]);
    flash("rgba(0,0,0,.9)");
    shake(500);

    // Setelah lilin padam: ledakan perayaan
    setTimeout(() => {
      flash("#ffd1e3");
      shake(800);
      cannon("l", 130);
      cannon("r", 130);
      salvo(7, { delay: 150 });
      emojiRain(["🎂", "🎉", "🎈", "💖", "✨", "🥳"], 55);
    }, 380);

    // Langsung lanjut ke halaman 7 (surat)
    setTimeout(() => {
      if (current === IDX.cake) show(IDX.letter);
    }, 1700);
  }

  if (wishBtn) wishBtn.addEventListener("click", blowCandle);
  if (cakeWrap) cakeWrap.addEventListener("click", blowCandle);

  async function startMic() {
    if (blown || micStream) return;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AC = window.AudioContext || window.webkitAudioContext;
      micCtx = new AC();
      const src = micCtx.createMediaStreamSource(micStream);
      const an = micCtx.createAnalyser();
      an.fftSize = 512;
      src.connect(an);
      const buf = new Uint8Array(an.fftSize);
      const t0 = performance.now();
      if (micBtn) micBtn.textContent = "🎤 Mendengarkan... tiup ke mic!";

      (function loop() {
        if (!micStream || blown) return;
        an.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const d = (buf[i] - 128) / 128;
          sum += d * d;
        }
        const rms = Math.sqrt(sum / buf.length);
        if (flame) flame.style.opacity = String(Math.max(1 - rms * 2.2, 0.35));

        if (rms > 0.3) { blowCandle(); return; }
        if (performance.now() - t0 > 15000) {
          stopMic();
          if (flame) flame.style.opacity = "";
          if (micBtn) micBtn.textContent = MIC_LABEL;
          return;
        }
        requestAnimationFrame(loop);
      })();
    } catch (e) {
      micStream = null;
      if (micBtn) micBtn.textContent = "Mic nggak bisa dipakai, pakai tombol aja ya 🙂";
    }
  }

  function stopMic() {
    if (micStream) {
      micStream.getTracks().forEach((t) => t.stop());
      micStream = null;
    }
    if (micCtx) {
      micCtx.close().catch(() => {});
      micCtx = null;
    }
  }

  if (micBtn) micBtn.addEventListener("click", startMic);

  /* =========================================================
     HALAMAN 7: SURAT
  ========================================================= */
  const envelope = $("#envelope");
  const openLetterBtn = $("#openLetter");
  const letterNextBtn = $("#letterNextBtn");

  if (openLetterBtn && envelope) {
    openLetterBtn.addEventListener("click", () => {
      envelope.classList.toggle("open");
      const isOpen = envelope.classList.contains("open");
      openLetterBtn.textContent = isOpen ? "Tutup Surat 💌" : "Buka Surat 💌";

      if (letterNextBtn) letterNextBtn.style.display = isOpen ? "inline-block" : "none";

      if (isOpen) {
        const r = envelope.getBoundingClientRect();
        vibrate([30, 30, 60]);
        flash("rgba(255,141,178,.55)");
        heartBurst(r.left + r.width / 2, r.top + r.height / 2, 45);
        emojiRain(["💌", "💖", "💗", "🌸"], 35);
        salvo(3, { shapes: ["heart"], delay: 300 });
      }
    });
  }

  /* =========================================================
     HALAMAN 8: RAHASIA
  ========================================================= */
  let secretCount = 0;
  const secretHeart = $("#secretHeart");
  const secretText = $("#secretText");
  const finalBtn = $("#finalBtn");

  if (secretHeart) {
    secretHeart.addEventListener("click", () => {
      secretCount++;
      const r = secretHeart.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;

      secretHeart.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.55) rotate(-8deg)" }, { transform: "scale(1)" }],
        { duration: 320 }
      );
      const level = Math.min(secretCount, 5);
      secretHeart.style.filter =
        `drop-shadow(0 0 ${level * 10}px #ff3d81) brightness(${1 + level * 0.12})`;
      heartBurst(cx, cy, 8 + secretCount * 6);
      vibrate(20 + secretCount * 10);

      if (secretCount < 5) {
        if (secretText) secretText.textContent = `Hmm... ${secretCount}/5 👀`;
        shake(250);
      } else if (secretCount === 5) {
        if (secretText) {
          secretText.textContent = "SECRET UNLOCKED: Kamu adalah salah satu alasan aku banyak tersenyum. ❤️";
          secretText.classList.add("unlocked");
        }
        if (finalBtn) finalBtn.disabled = false;
        flash("#fff");
        shake(800);
        explode(cx, cy, 340, "heart");
        cannon("l", 110);
        cannon("r", 110);
        salvo(6, { delay: 170 });
        emojiRain(["💖", "🔓", "✨"], 40);
      } else {
        explode(cx, cy - 60, rand(0, 360), pick(["burst", "ring", "heart"]));
      }
    });
  }

  if (finalBtn) {
    finalBtn.addEventListener("click", () => {
      vibrate([50, 30, 50, 30, 200]);
      show(IDX.final);
    });
  }

  /* =========================================================
     HALAMAN 9: FINAL (kembang api non-stop)
  ========================================================= */
  let finaleTimer = null;
  let finaleTick = 0;

  function startFinale() {
    stopFinale();
    finaleTick = 0;
    flash("#fff");
    cannon("l", 150);
    cannon("r", 150);
    salvo(9, { delay: 170 });
    emojiRain(["💖", "🎂", "🎉", "✨", "💗", "🥳"], 70);
    confettiRain(120);

    finaleTimer = setInterval(() => {
      if (document.hidden) return;
      finaleTick++;
      const shape = pick(["burst", "burst", "ring", "heart"]);
      rocket(rand(W * 0.1, W * 0.9), rand(H * 0.1, H * 0.5), rand(0, 360), shape);
      if (finaleTick % 2 === 0) {
        rocket(rand(W * 0.1, W * 0.9), rand(H * 0.1, H * 0.5), rand(0, 360), "heart");
      }
      if (finaleTick % 6 === 0) cannon(finaleTick % 12 === 0 ? "l" : "r", 60);
      if (finaleTick % 10 === 0) emojiRain(["💖", "✨", "🎉"], 22);
    }, 600);
  }

  function stopFinale() {
    clearInterval(finaleTimer);
    finaleTimer = null;
  }

  const restartBtn = $("#restartBtn");
  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      resetAll();
      show(IDX.opening);
    });
  }

  function resetAll() {
    stopFinale();
    stopMic();

    openedReasons.clear();
    reasonsCelebrated = false;
    reasonBtns.forEach((b) => b.classList.remove("tapped"));
    updateReasonHint();

    answerBtns.forEach((b) => b.classList.remove("nope", "win"));
    if (gameResult) gameResult.textContent = "";

    resetCandle();

    if (envelope) envelope.classList.remove("open");
    if (openLetterBtn) openLetterBtn.textContent = "Buka Surat 💌";
    if (letterNextBtn) letterNextBtn.style.display = "none";

    secretCount = 0;
    if (secretHeart) secretHeart.style.filter = "";
    if (secretText) {
      secretText.textContent = "Tekan hatinya 5 kali...";
      secretText.classList.remove("unlocked");
    }
    if (finalBtn) finalBtn.disabled = true;
  }

  /* =========================================================
     EFEK GLOBAL: hati melayang, tap = hati meledak, jejak kilau
  ========================================================= */
  function spawnHeart() {
    const layer = $("#hearts");
    if (!document.hidden && layer) {
      const h = document.createElement("span");
      h.className = "floating-heart";
      h.textContent = pick(["♥", "♡", "♥", "💗", "✨"]);
      h.style.left = rand(0, 100) + "vw";
      h.style.bottom = "-30px";
      h.style.fontSize = rand(10, 30) + "px";
      h.style.color = `hsl(${rand(325, 355)} 100% ${rand(60, 78)}%)`;
      h.style.setProperty("--sx", rand(-80, 80) + "px");
      h.style.setProperty("--rot", rand(-40, 40) + "deg");
      layer.appendChild(h);
      setTimeout(() => h.remove(), 4500);
    }
    setTimeout(spawnHeart, current === IDX.final ? 110 : 380);
  }
  spawnHeart();

  document.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".modal")) return;
    heartBurst(e.clientX, e.clientY, 7);
  }, { passive: true });

  let lastTrail = 0;
  document.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" && !e.buttons) return;
    const now = performance.now();
    if (now - lastTrail < 22) return;
    lastTrail = now;
    sparkleTrail(e.clientX, e.clientY);
  }, { passive: true });

  /* =========================================================
     GALERI + LIGHTBOX
  ========================================================= */
  const modal = $("#imageModal");
  const modalImgContainer = $("#modalImageContainer");
  const modalCaption = $("#modalCaption");
  const modalClose = $(".modal-close");

  $$(".photo-card").forEach((card) => {
    card.addEventListener("click", () => {
      const imgSrc = card.getAttribute("data-src");
      const captionText =
        card.getAttribute("data-caption") || card.querySelector("figcaption")?.textContent;

      if (imgSrc) {
        modalImgContainer.innerHTML = `<img src="${imgSrc}" alt="Gallery Image">`;
      } else {
        const placeholderContent = card.querySelector(".photo-placeholder")?.outerHTML || "FOTO";
        modalImgContainer.innerHTML =
          `<div style="width:100%; height:250px; display:grid; place-items:center;">${placeholderContent}</div>`;
      }

      modalCaption.textContent = captionText;
      modal.classList.add("show");

      const r = card.getBoundingClientRect();
      heartBurst(r.left + r.width / 2, r.top + r.height / 2, 18);
    });
  });

  const closeModal = () => modal.classList.remove("show");
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
})();
