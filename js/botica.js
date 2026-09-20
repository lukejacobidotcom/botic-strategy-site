/* =====================================================================
   Botica Clinic · configuração + comportamento compartilhado
   Todas as páginas leem daqui. Mudou número, CRO, endereço, horário,
   Instagram ou ID de rastreamento? Muda SÓ neste bloco.
   ===================================================================== */
window.BOTICA = {
  whatsapp: "5511970873407",
  rt:       "Dra. Amanda Marques",
  cro:      "CRO-SP 172448",
  endereco: "Rua Correia Dias, 97 · Cj 113 · Paraíso",
  cidade:   "São Paulo - SP · CEP 04006-050",
  horario:  "Seg, ter, qui e sex · 10h às 16h",

  // Horários oferecidos no pedido de agendamento (/agendar/). 0=dom, 1=seg ... 6=sáb.
  // É um PEDIDO: a Amanda confirma no WhatsApp e lança no Simples Dental.
  agenda: {
    diasAFrente: 21,
    dias: {
      1: ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00"],
      2: ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00"],
      4: ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00"],
      5: ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00"]
    }
  },

  instagram: { url: "https://instagram.com/odontoamandamarques", handle: "@odontoamandamarques" },

  // Google Business Profile. avaliarUrl = link "Pedir avaliações" do painel do Google
  // (g.page/r/.../review). Vazio = /avaliar/ abre o perfil, onde tem o botão Avaliar.
  google: {
    perfilUrl: "https://maps.google.com/?cid=12178510719012361318",
    avaliarUrl: ""
  },

  // Rastreamento. Tudo vazio = nada carrega (o aviso de cookies aparece do mesmo jeito).
  // Use GTM  OU  (GA4 + Pixel direto). Não os dois, senão conta em dobro.
  // Nada carrega sem autorização no aviso de cookies (LGPD): GA4 só com "Medição",
  // Pixel só com "Marketing". No GTM, a escolha vai como Consent Mode v2.
  // No GA4: desligue "Cliques de saída" em Medição otimizada. O link do WhatsApp
  // carrega a mensagem pronta (ex.: "Tenho medo de dentista") e ela não deve ir pro Google.
  tracking: {
    gtm:       "",   // "GTM-XXXXXXX"
    ga4:       "",   // "G-XXXXXXXXXX"
    metaPixel: ""    // "123456789012345"
  }
};

(function () {
  "use strict";
  var B = window.BOTICA;
  var CONSENT_KEY = "botica-consent-v2";
  var loaded = { gtm: false, ga4: false, pixel: false };
  window.dataLayer = window.dataLayer || [];

  function get(path) {
    var v = B;
    String(path).split(".").forEach(function (k) { v = v == null ? v : v[k]; });
    return v;
  }
  function uid() { return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10); }
  function loadScript(src) { var s = document.createElement("script"); s.async = true; s.src = src; document.head.appendChild(s); }

  /* ---------------- consentimento (LGPD) ---------------- */
  function getConsent() {
    try {
      var v = JSON.parse(localStorage.getItem(CONSENT_KEY));
      return v && typeof v === "object" ? v : null;
    } catch (e) { return null; }
  }
  function saveConsent(analytics, marketing) {
    var prev = getConsent();
    var v = { analytics: !!analytics, marketing: !!marketing, data: new Date().toISOString() };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(v)); } catch (e) {}
    // Se a pessoa retirou uma autorização que já tinha carregado ferramentas, recarrega limpo.
    if (prev && ((prev.analytics && !v.analytics) || (prev.marketing && !v.marketing)) && (loaded.gtm || loaded.ga4 || loaded.pixel)) {
      location.reload();
      return v;
    }
    loadTrackers(v);
    return v;
  }

  function gtagShim() {
    if (!window.gtag) window.gtag = function () { window.dataLayer.push(arguments); };
  }

  function loadTrackers(c) {
    var t = B.tracking || {};
    if (!c) return;
    if (t.gtm) {
      if (loaded.gtm || !(c.analytics || c.marketing)) return;
      loaded.gtm = true;
      gtagShim();
      window.gtag("consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
      window.gtag("consent", "update", {
        analytics_storage: c.analytics ? "granted" : "denied",
        ad_storage: c.marketing ? "granted" : "denied",
        ad_user_data: c.marketing ? "granted" : "denied",
        ad_personalization: c.marketing ? "granted" : "denied"
      });
      window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
      loadScript("https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(t.gtm));
      return;
    }
    if (t.ga4 && c.analytics && !loaded.ga4) {
      loaded.ga4 = true;
      gtagShim();
      window.gtag("js", new Date());
      window.gtag("config", t.ga4);
      loadScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(t.ga4));
    }
    if (t.metaPixel && c.marketing && !loaded.pixel) {
      loaded.pixel = true;
      /* snippet oficial do Pixel da Meta */
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");
      // autoConfig desligado: o Pixel não lê sozinho o texto dos botões ("Tenho medo" etc.)
      window.fbq("set", "autoConfig", false, t.metaPixel);
      window.fbq("init", t.metaPixel);
      window.fbq("track", "PageView");
    }
  }

  // Pra Meta vão só estes eventos, sem parâmetro nenhum de tratamento.
  var META_EVENTS = { whatsapp_click: "Contact", booking_request: "Schedule" };

  // Todo evento leva um event_id: é ele que deduplica quando a Conversions API (servidor) for ligada.
  function track(name, params) {
    params = params || {};
    params.event_id = params.event_id || uid();
    params.page_path = location.pathname;
    var c = getConsent();
    var t = B.tracking || {};
    if (!c) return params.event_id;
    if (t.gtm) {
      if (c.analytics || c.marketing) {
        var o = { event: name };
        for (var k in params) o[k] = params[k];
        window.dataLayer.push(o);
      }
      return params.event_id;
    }
    if (t.ga4 && c.analytics && window.gtag) window.gtag("event", name, params);
    if (t.metaPixel && c.marketing && window.fbq && META_EVENTS[name]) {
      window.fbq("track", META_EVENTS[name], {}, { eventID: params.event_id });
    }
    return params.event_id;
  }

  var CONSENT_CSS =
    "#bconsent{position:fixed;left:16px;bottom:16px;z-index:120;width:min(440px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow:auto;background:#1B1F17;color:#EFEFEA;border-radius:14px;padding:1.1rem 1.15rem;box-shadow:0 14px 40px rgba(0,0,0,.35);font:300 .84rem/1.5 Inter,-apple-system,system-ui,sans-serif}" +
    "#bconsent .bc-t{font-weight:700;font-size:.92rem;margin:0 0 .35rem}#bconsent p{margin:0 0 .8rem}#bconsent a{color:#E9A27F}" +
    "#bconsent .bc-prefs{display:grid;gap:.55rem;margin:0 0 .9rem;padding:.8rem 0;border-top:1px solid rgba(239,239,234,.2);border-bottom:1px solid rgba(239,239,234,.2)}" +
    "#bconsent .bc-prefs[hidden]{display:none}" +
    "#bconsent label{display:flex;gap:.6rem;align-items:flex-start;cursor:pointer}#bconsent label b{display:block;font-weight:600}" +
    "#bconsent input{margin-top:.25rem;width:17px;height:17px;flex-shrink:0;accent-color:#E9A27F}" +
    "#bconsent .bc-row{display:flex;gap:.5rem;flex-wrap:wrap}" +
    "#bconsent button{flex:1 1 auto;font:700 .68rem/1 Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase;border-radius:999px;padding:.8rem 1rem;cursor:pointer;border:1px solid #EFEFEA;background:transparent;color:#EFEFEA}" +
    "#bconsent button:hover{background:rgba(239,239,234,.12)}#bconsent button[hidden]{display:none}" +
    "#bconsent button:focus-visible,#bconsent input:focus-visible{outline:2px solid #E9A27F;outline-offset:2px}" +
    "@media(max-width:760px){#bconsent{left:10px;right:10px;width:auto;bottom:calc(80px + env(safe-area-inset-bottom))}}";

  function showConsent(openPrefs) {
    var old = document.getElementById("bconsent");
    if (old) old.remove();
    if (!document.getElementById("bconsent-css")) {
      var st = document.createElement("style");
      st.id = "bconsent-css";
      st.textContent = CONSENT_CSS;
      document.head.appendChild(st);
    }
    var c = getConsent() || { analytics: false, marketing: false };
    var el = document.createElement("div");
    el.id = "bconsent";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-labelledby", "bc-t");
    el.setAttribute("aria-describedby", "bc-d");
    el.innerHTML =
      '<p class="bc-t" id="bc-t">Cookies e privacidade</p>' +
      '<p id="bc-d">Usamos o armazenamento necessário pro site funcionar. Com a sua autorização, também usamos cookies de medição (Google) e de marketing (Meta) pra saber quais páginas e anúncios funcionam. Não enviamos seu nome, seu telefone nem as suas conversas. <a href="/politica-de-privacidade/#cookies">Política de privacidade</a></p>' +
      '<div class="bc-prefs"' + (openPrefs ? "" : " hidden") + '>' +
        '<label><input type="checkbox" checked disabled><span><b>Necessários</b>Guardam a sua escolha de cookies. Sempre ativos.</span></label>' +
        '<label><input type="checkbox" data-cat="analytics"' + (c.analytics ? " checked" : "") + '><span><b>Medição</b>Google Analytics: quais páginas e botões são usados, de forma agregada.</span></label>' +
        '<label><input type="checkbox" data-cat="marketing"' + (c.marketing ? " checked" : "") + '><span><b>Marketing</b>Pixel da Meta: se os anúncios trazem conversas no WhatsApp.</span></label>' +
      '</div>' +
      '<div class="bc-row">' +
        '<button type="button" data-c="all">Aceitar todos</button>' +
        '<button type="button" data-c="none">Recusar</button>' +
        '<button type="button" data-c="custom"' + (openPrefs ? " hidden" : "") + '>Personalizar</button>' +
        '<button type="button" data-c="save"' + (openPrefs ? "" : " hidden") + '>Salvar escolhas</button>' +
      '</div>';
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-c]");
      if (!b) return;
      var act = b.getAttribute("data-c");
      if (act === "custom") {
        el.querySelector(".bc-prefs").hidden = false;
        b.hidden = true;
        el.querySelector('[data-c="save"]').hidden = false;
        return;
      }
      if (act === "all") saveConsent(true, true);
      else if (act === "none") saveConsent(false, false);
      else if (act === "save") saveConsent(el.querySelector('[data-cat="analytics"]').checked, el.querySelector('[data-cat="marketing"]').checked);
      el.remove();
    });
    document.body.appendChild(el);
  }

  /* ---------------- WhatsApp com código de origem ----------------
     Cada botão tem:
       data-wa-tag="SITE-V2-AMANDA-SORRISO"   o código que chega na conversa
       data-wa-msg="SORRISO. Queria te contar o meu caso."
     Se o tag tiver {INTENT}, ele segue o chip escolhido no topo da home. */
  var INTENT_MSG = {
    SORRISO:     "SORRISO. Quero entender o meu caso.",
    LIMPEZA:     "Quero marcar limpeza e check-up.",
    CLAREAMENTO: "Tenho interesse em clareamento.",
    LENTES:      "Quero entender se lentes fazem sentido pra mim.",
    BOTOX:       "Tenho interesse em botox e harmonização.",
    MEDO:        "Tenho medo de dentista.",
    NOIVA:       "NOIVA. Meu casamento é em ____."
  };
  var state = { intent: null };

  function waParts(el) {
    var tag = el.getAttribute("data-wa-tag") || "SITE-V2-GERAL-SORRISO";
    var msg = el.getAttribute("data-wa-msg") || INTENT_MSG.SORRISO;
    if (tag.indexOf("{INTENT}") > -1) {
      var it = state.intent || "SORRISO";
      tag = tag.replace("{INTENT}", it);
      if (state.intent) msg = INTENT_MSG[it];
    }
    return { tag: tag, text: "Oi Amanda! Vim pelo site. " + msg + " [" + tag + "]" };
  }
  function waUrl(text) { return "https://wa.me/" + B.whatsapp + "?text=" + encodeURIComponent(text); }
  function refreshWa() {
    document.querySelectorAll("[data-wa-tag]").forEach(function (el) {
      el.href = waUrl(waParts(el).text);
      el.target = "_blank";
      el.rel = "noopener";
    });
  }
  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("[data-wa-tag]");
    if (el) {
      var p = waParts(el);
      el.href = waUrl(p.text);
      var bits = p.tag.split("-");
      track("whatsapp_click", { wa_tag: p.tag, wa_intent: bits[bits.length - 1] });
      return;
    }
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href");
    if (href.indexOf("/agendar/") === 0) track("agendar_click", { link: href });
    else if (a.hasAttribute("data-ig")) track("instagram_click", {});
  }, true);

  function setIntent(it) {
    state.intent = it && INTENT_MSG[it] ? it : null;
    refreshWa();
    if (state.intent) track("intent_select", { wa_intent: state.intent });
  }

  /* ---------------- preenchimento a partir da config ---------------- */
  function fill() {
    document.querySelectorAll("[data-fill]").forEach(function (el) {
      var v = get(el.getAttribute("data-fill"));
      if (typeof v === "string" && v) el.textContent = v;
    });
    document.querySelectorAll("[data-href]").forEach(function (el) {
      var v = get(el.getAttribute("data-href"));
      if (typeof v === "string" && v) el.href = v;
    });
  }

  /* ---------------- comportamento de página ---------------- */
  function reveal() {
    var els = document.querySelectorAll(".rv");
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("on"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("on"); io.unobserve(en.target); }
      });
    }, { threshold: 0.1 });
    els.forEach(function (e) { io.observe(e); });
  }

  function accordions() {
    document.querySelectorAll(".acc > button").forEach(function (b) {
      b.setAttribute("aria-expanded", "false");
      b.addEventListener("click", function () {
        var open = b.parentElement.classList.toggle("open");
        b.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) track("faq_open", { question: b.textContent.replace(/[▾\s]+$/, "").trim().slice(0, 90) });
      });
    });
  }

  function progress() {
    var bar = document.getElementById("prog");
    if (!bar) return;
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var h = document.documentElement;
        var max = h.scrollHeight - h.clientHeight;
        bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
        ticking = false;
      });
    }, { passive: true });
  }

  // Barra fixa do celular: some só enquanto os botões do topo estão na tela.
  function mobileBar() {
    var bar = document.querySelector(".mbar");
    if (!bar) return;
    var anchor = document.querySelector("[data-mbar-anchor]");
    if (!anchor || !("IntersectionObserver" in window)) { bar.classList.add("on"); return; }
    new IntersectionObserver(function (en) {
      bar.classList.toggle("on", !en[0].isIntersecting);
    }).observe(anchor);
  }

  window.Botica = {
    config: B,
    track: track,
    setIntent: setIntent,
    waUrl: waUrl,
    refreshWa: refreshWa,
    consent: getConsent,
    openCookiePreferences: function () { showConsent(true); }
  };

  function init() {
    fill();
    refreshWa();
    reveal();
    accordions();
    progress();
    mobileBar();
    var c = getConsent();
    if (c) loadTrackers(c);
    else showConsent(false);
    document.querySelectorAll("[data-consent-review]").forEach(function (b) {
      b.addEventListener("click", function () { showConsent(true); });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
