/* Kindware Lab: animazioni (GSAP + ScrollTrigger + SplitText) e scorrimento fluido (Lenis).
   Tutto parte solo se chi visita NON ha chiesto "riduci movimento": in quel caso la pagina resta ferma e normale.
   Se questo file non si carica, la pagina si vede comunque tutta (le animazioni partono da stati impostati qui). */
(function () {
  if (!window.gsap || !window.ScrollTrigger) return
  var gsap = window.gsap, ST = window.ScrollTrigger
  gsap.registerPlugin(ST)
  if (window.SplitText) gsap.registerPlugin(window.SplitText)

  var mm = gsap.matchMedia()
  mm.add('(prefers-reduced-motion: no-preference)', function () {
    var cleanups = []

    // --- scorrimento fluido ---
    var lenis = null
    if (window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true })
      lenis.on('scroll', ST.update)
      var raf = function (t) { lenis.raf(t * 1000) }
      gsap.ticker.add(raf)
      gsap.ticker.lagSmoothing(0)
      // link interni (#app, #guide...): scorrimento fluido, ma il focus della tastiera si sposta lo stesso
      var onClick = function (e) {
        var a = e.target.closest && e.target.closest('a[href^="#"]')
        if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return
        var id = a.getAttribute('href').slice(1)
        var el = id ? document.getElementById(id) : document.body
        if (!el) return
        e.preventDefault()
        lenis.scrollTo(id === 'top' ? 0 : el, { offset: -24 })
        if (id) history.pushState(null, '', '#' + id)
        if (!el.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) el.setAttribute('tabindex', '-1')
        el.focus({ preventScroll: true })
      }
      document.addEventListener('click', onClick)
      cleanups.push(function () {
        document.removeEventListener('click', onClick)
        gsap.ticker.remove(raf)
        lenis.destroy()
      })
    }

    var su = { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out' }
    var unaVolta = function (trigger, start) { return { trigger: trigger, start: start || 'top 82%', toggleActions: 'play none none none' } }

    // --- in alto: titolo riga per riga, poi testo, bottone e "regole" ---
    var hero = gsap.timeline({ defaults: { ease: 'power4.out' } })
    hero.from('.hero h1 .riga', { yPercent: 70, opacity: 0, rotate: 2, duration: 1, stagger: 0.12 })
      .from('.hero p, .hero .cta', { y: 24, opacity: 0, duration: 0.8, stagger: 0.1 }, '-=0.6')
      .from('.patto li', { y: 14, opacity: 0, duration: 0.5, stagger: 0.08 }, '-=0.4')
    // le carte salgono un po' più lente della pagina
    gsap.to('.fan', { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })

    // --- scene delle app: nome lettera per lettera (effetto "SplitText" di React Bits), resto che sale ---
    document.querySelectorAll('.scena').forEach(function (sc) {
      var h2 = sc.querySelector('h2')
      var testo = sc.querySelector('.wrap > div:not(.gioco)')
      var gioco = sc.querySelector('.gioco')
      var tl = gsap.timeline({ scrollTrigger: unaVolta(sc, 'top 70%') })
      if (window.SplitText && h2) {
        var split = window.SplitText.create(h2, { type: 'words,chars', aria: 'auto' })
        cleanups.push(function () { split.revert() })
        tl.from(split.chars, { yPercent: 110, opacity: 0, rotate: 8, duration: 0.7, ease: 'back.out(1.6)', stagger: 0.04 })
      }
      if (testo) tl.from(testo.querySelectorAll('.dom, p, li'), { y: 26, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.06 }, '-=0.4')
      if (gioco) {
        var daSinistra = gioco === sc.querySelector('.wrap').firstElementChild
        tl.from(gioco, { x: daSinistra ? -60 : 60, rotate: daSinistra ? -4 : 4, opacity: 0, duration: 1, ease: 'power3.out' }, 0.1)
        gsap.to(gioco, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: sc, start: 'top bottom', end: 'bottom top', scrub: true } })
      }
    })

    // SpeseAuto: la cifra conta fino al totale la prima volta che si vede (si ferma se tocchi il cursore)
    var anno = document.getElementById('anno'), km = document.getElementById('km')
    if (anno && km) {
      var finale = anno.textContent, n = parseInt(finale.replace(/\D/g, ''), 10) || 0, cont = { v: 0 }
      var conta = gsap.to(cont, {
        v: n, duration: 1.4, ease: 'power2.out', paused: true,
        onUpdate: function () { anno.textContent = Math.round(cont.v).toLocaleString('it-IT') + ' €' },
        onComplete: function () { anno.textContent = finale }
      })
      ST.create({ trigger: anno, start: 'top 85%', once: true, onEnter: function () { finale = anno.textContent; conta.restart() } })
      var ferma = function () { conta.kill() }
      km.addEventListener('input', ferma)
      cleanups.push(function () { km.removeEventListener('input', ferma) })
    }

    // --- guide, promesse, chi siamo: entrano a gruppi ---
    gsap.from('.guide h2, .guide > .wrap > p', Object.assign({}, su, { stagger: 0.1, scrollTrigger: unaVolta('.guide') }))
    ST.batch('.guide-col > div, .promesse li', {
      start: 'top 88%', once: true,
      onEnter: function (els) { gsap.fromTo(els, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.1, overwrite: true }) }
    })
    gsap.set('.guide-col > div, .promesse li', { opacity: 0 })
    gsap.from('.noi h2, .noi p', Object.assign({}, su, { stagger: 0.12, scrollTrigger: unaVolta('.noi') }))

    // --- caffè: il riquadro si allarga, il cuore gira piano ---
    gsap.from('.caffe', { scale: 0.92, borderRadius: 60, opacity: 0.4, ease: 'power2.out', scrollTrigger: { trigger: '.caffe', start: 'top 95%', end: 'top 55%', scrub: true } })
    gsap.to('.caffe .tazza', { rotate: 25, yPercent: -20, ease: 'none', scrollTrigger: { trigger: '.caffe', start: 'top bottom', end: 'bottom top', scrub: true } })

    // i font e la sezione Instagram (si riempie dopo) cambiano le altezze: ricalcola
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh() })
    window.addEventListener('kw:altezze', function () { ST.refresh() })

    return function () { cleanups.forEach(function (f) { f() }) }
  })

  // rete di sicurezza: se il browser non fa girare le animazioni (scheda in background, robot, anteprime)
  // dopo 2,5 secondi si toglie tutto, così niente resta invisibile e la rotella torna quella normale
  setTimeout(function () { if (gsap.ticker.frame < 3) mm.revert() }, 2500)
})()
