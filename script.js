/* JavaScript sem dependências. Compatível também com a abertura local do HTML. */
(() => {
  "use strict";
  const config = window.PESCA_CONFIG || window.BRAVA_CONFIG || {};
  const brand = String(config.brandName || "Pesca Extrema").trim() || "Pesca Extrema";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const desktop = window.matchMedia("(min-width: 960px)");
  const finePointer = window.matchMedia("(pointer: fine)");
  const header = document.getElementById("site-header");
  const menuButton = document.getElementById("menu-toggle");
  const nav = document.getElementById("primary-nav");
  const form = document.getElementById("booking-form");
  const packageField = document.getElementById("booking-package");
  const speciesField = document.getElementById("booking-species");
  const dateField = document.getElementById("booking-date");
  const contactDialog = document.getElementById("contact-dialog");
  const galleryDialog = document.getElementById("gallery-dialog");
  let dialogTrigger = null;

  const normalizePhone = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    return /^55[1-9]\d\d{8,9}$/.test(digits) ? digits : "";
  };
  const phone = normalizePhone(config.whatsappNumber);
  const whatsappUrl = (number, message) => {
    const valid = normalizePhone(number);
    return valid ? `https://wa.me/${valid}?text=${encodeURIComponent(message)}` : "";
  };
  const formatDate = (date) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return "A combinar";
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  };
  const createMessage = ({ name, packageName, date, people, species }) => {
    const lines = [
      `Olá! Quero planejar uma pescaria no Ceará com a ${brand}.`, "",
      `Nome: ${String(name || "").trim()}`,
      `Experiência: ${packageName || "Ainda quero escolher"}`,
      `Data desejada: ${formatDate(date)}`,
      `Grupo: ${people || "A confirmar"}`
    ];
    if (species) lines.push(`Espécie de interesse: ${species}`);
    lines.push("", "Pode me informar disponibilidade, valores e o que está incluso?");
    return lines.join("\n");
  };
  // Helpers puros disponíveis para integração e verificação, sem expor dados pessoais.
  window.PescaBooking = Object.freeze({ normalizePhone, whatsappUrl, createMessage, formatDate });
  window.BravaBooking = window.PescaBooking; // Compatibilidade com a primeira versão.

  document.querySelectorAll("[data-brand]").forEach((el) => { el.textContent = brand; });
  document.title = `${brand} | Pesca esportiva no Ceará`;
  document.getElementById("current-year").textContent = String(new Date().getFullYear());
  document.querySelector('meta[property="og:title"]').content = document.title;
  const defaultMessage = `Olá! Quero conhecer os roteiros de pesca esportiva no Ceará com a ${brand}. Pode me informar datas, valores e o que está incluso?`;
  document.querySelectorAll(".direct-whatsapp").forEach((link) => {
    if (!phone) return; // Nenhum número fictício é usado como destino.
    link.href = whatsappUrl(phone, link.dataset.whatsappMessage || defaultMessage);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });
  document.querySelectorAll("[data-social]").forEach((link) => {
    const url = config[`${link.dataset.social}Url`];
    if (!url) return;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") return;
      link.href = parsed.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.hidden = false;
    } catch (_) { /* Um campo incompleto não interrompe o restante da página. */ }
  });

  function closeMenu(returnFocus = false) {
    header.classList.remove("nav-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Abrir menu");
    if (returnFocus) menuButton.focus();
  }
  menuButton.addEventListener("click", () => {
    const opened = header.classList.toggle("nav-open");
    menuButton.setAttribute("aria-expanded", String(opened));
    menuButton.setAttribute("aria-label", opened ? "Fechar menu" : "Abrir menu");
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header.classList.contains("nav-open")) closeMenu(true);
  });
  document.addEventListener("click", (event) => {
    if (header.classList.contains("nav-open") && !header.contains(event.target)) closeMenu();
  });
  desktop.addEventListener("change", () => { if (desktop.matches) closeMenu(); });

  // Rolagem suave, foco de teclado e fechamento do menu após navegar.
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      // Les CTA WhatsApp peuvent avoir été configurés après leur rendu initial.
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#") || href.length === 1) return;
      let target;
      try { target = document.getElementById(decodeURIComponent(href.slice(1))); } catch (_) { return; }
      if (!target) return;
      event.preventDefault();
      closeMenu();
      target.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      try { window.history.replaceState(null, "", href); } catch (_) { /* file:// */ }
    });
  });

  // Header toujours fixe; parallax désactivé sur mobile, mouvement réduit et Save-Data.
  const parallaxSections = [...document.querySelectorAll("[data-parallax]")];
  let scrollScheduled = false;
  function updateScroll() {
    scrollScheduled = false;
    header.classList.toggle("is-scrolled", window.scrollY > 30);
    const animate = desktop.matches && finePointer.matches && !reducedMotion.matches && !navigator.connection?.saveData;
    parallaxSections.forEach((section) => {
      const image = section.querySelector(".parallax-image");
      if (!animate) { image.style.setProperty("--parallax-y", "0px"); return; }
      const rect = section.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const offset = Math.max(-56, Math.min(56, -rect.top * Number(section.dataset.parallax || .1)));
      image.style.setProperty("--parallax-y", `${offset.toFixed(1)}px`);
    });
  }
  function scheduleScroll() {
    if (scrollScheduled) return;
    scrollScheduled = true;
    window.requestAnimationFrame(updateScroll);
  }
  window.addEventListener("scroll", scheduleScroll, { passive: true });
  window.addEventListener("resize", scheduleScroll, { passive: true });
  reducedMotion.addEventListener("change", scheduleScroll);
  finePointer.addEventListener("change", scheduleScroll);
  desktop.addEventListener("change", scheduleScroll);
  updateScroll();

  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  const speciesCards = [...document.querySelectorAll(".species-card")];
  const filterStatus = document.getElementById("filter-status");
  document.querySelectorAll("[data-filter-count]").forEach((count) => {
    const category = count.dataset.filterCount;
    const total = speciesCards.filter((card) => category === "all" || card.dataset.category === category).length;
    count.textContent = String(total).padStart(2, "0");
  });
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.dataset.filter;
      let count = 0;
      speciesCards.forEach((card) => {
        card.hidden = !(category === "all" || card.dataset.category === category);
        if (!card.hidden) count++;
      });
      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      filterStatus.textContent = `${count} ${count === 1 ? "espécie exibida" : "espécies exibidas"}.`;
    });
  });

  document.querySelectorAll("[data-package]").forEach((link) => {
    link.addEventListener("click", () => { packageField.value = link.dataset.package; });
  });
  document.querySelectorAll("[data-species]").forEach((link) => {
    link.addEventListener("click", () => {
      speciesField.value = link.dataset.species;
      document.getElementById("selected-species-name").textContent = link.dataset.species;
      document.getElementById("selected-species").hidden = false;
    });
  });
  document.getElementById("clear-species").addEventListener("click", () => {
    speciesField.value = "";
    document.getElementById("selected-species").hidden = true;
    packageField.focus();
  });
  const today = new Date();
  dateField.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  function openDialog(dialog, trigger) {
    dialogTrigger = trigger || document.activeElement;
    dialog.showModal();
    document.body.classList.add("dialog-open");
  }
  [contactDialog, galleryDialog].forEach((dialog) => {
    dialog.querySelector("[data-close-dialog]").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener("close", () => {
      document.body.classList.remove("dialog-open");
      if (dialogTrigger?.isConnected) dialogTrigger.focus({ preventScroll: true });
      dialogTrigger = null;
    });
  });
  document.querySelectorAll("[data-gallery-src]").forEach((button) => {
    button.addEventListener("click", () => {
      const lightboxImage = document.getElementById("lightbox-image");
      lightboxImage.src = button.dataset.gallerySrc;
      lightboxImage.alt = button.querySelector("img").alt;
      document.getElementById("lightbox-caption").textContent = button.dataset.caption;
      openDialog(galleryDialog, button);
    });
  });

  const nameField = document.getElementById("visitor-name");
  nameField.addEventListener("input", () => nameField.setCustomValidity(""));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    nameField.setCustomValidity(nameField.value.trim().length >= 2 ? "" : "Informe um nome com pelo menos duas letras.");
    if (!form.reportValidity()) return;
    const message = createMessage({
      name: nameField.value,
      packageName: packageField.value,
      date: dateField.value,
      people: document.getElementById("booking-people").value,
      species: speciesField.value
    });
    const url = whatsappUrl(phone, message);
    if (url) {
      const fallback = document.getElementById("whatsapp-fallback-link");
      fallback.href = url;
      fallback.target = "_blank";
      fallback.rel = "noopener noreferrer";
      document.getElementById("whatsapp-fallback").hidden = false;
      // Abertura iniciada pelo clique. A mensagem só é enviada pelo visitante.
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      // Alguns navegadores retornam null com noopener mesmo após abrir a janela.
      // O link de apoio permite tentar novamente sem navegação duplicada.
      void opened;
      return;
    }
    document.getElementById("pending-message").value = message;
    document.getElementById("copy-status").textContent = "";
    openDialog(contactDialog, form.querySelector('[type="submit"]'));
  });
  // Evita submissão GET se o navegador estiver com JavaScript desativado.
  form.querySelector('[type="submit"]').disabled = false;

  document.getElementById("copy-message").addEventListener("click", async () => {
    const textArea = document.getElementById("pending-message");
    const status = document.getElementById("copy-status");
    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textArea.value);
        copied = true;
      } else {
        textArea.focus();
        textArea.select();
        copied = document.execCommand("copy");
      }
    } catch (_) {
      textArea.focus();
      textArea.select();
      try { copied = document.execCommand("copy"); } catch (_) { copied = false; }
    }
    status.textContent = copied ? "Mensagem copiada. Agora é só enviar para a operação." : "Selecione a mensagem acima e copie usando o menu do seu dispositivo.";
  });

  if ("IntersectionObserver" in window) {
    if (!reducedMotion.matches) {
      const reveals = [...document.querySelectorAll(".reveal")];
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: .08 });
      reveals.forEach((el) => revealObserver.observe(el));
      document.documentElement.classList.add("has-reveal");
    }
    const links = [...nav.querySelectorAll('a[href^="#"]:not(.mobile-reserve)')];
    const activeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          const active = link.getAttribute("href") === `#${entry.target.id}`;
          link.classList.toggle("is-current", active);
          if (active) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-20% 0px -65% 0px", threshold: 0 });
    links.forEach((link) => {
      const section = document.getElementById(link.getAttribute("href").slice(1));
      if (section) activeObserver.observe(section);
    });
  }
})();

/* ========================================================
   CONTROLE DO POP-UP E MINIMAPA DOS 5 RIOS
   ======================================================== */
document.addEventListener("DOMContentLoaded", function () {
  const dadosRios = {
    jaguaribe: {
      nome: "Rio Jaguaribe",
      local: "Fortim / Aracati — CE",
      desc: "O maior e mais emblemático rio do Ceará. O encontro das suas águas com o mar gera uma rica zona de manguezais, camboas e troncos submersos. É o terreno ideal para o pincho com iscas de superfície e plugs de meia-água em busca do Robalo-Flecha (Camurim) e cardumes de Camurupins (Tarpons).",
      tags: ["Robalo Flecha", "Camurupim (Tarpon)", "Xaréu", "Pescada"],
      // Visão satélite da foz e manguezal do Fortim:
      mapa: "https://maps.google.com/maps?q=Barra+do+Rio+Jaguaribe,Fortim,Ceara&t=k&z=13&ie=UTF8&iwloc=&output=embed",
      fotos: [
        "fotos-rios/jaguaribe-1.jpg",
        "fotos-rios/jaguaribe-2.jpg",
        "fotos-rios/jaguaribe-3.jpg",
        "fotos-rios/jaguaribe-4.jpg"
      ]
    },
    Piranji: {
      nome: "Rio Piranji",
      local: "Parajuru — CE",
      desc: "Com sua foz delimitada por dunas móveis e densos manguezais preservados no litoral leste cearense, o Rio Piranji é um dos estuários mais técnicos e estratégicos da região. Suas águas abrigadas, canais de maré bem oxigenados e calhas rasas entre gamboas criam pontos perfeitos de emboscada para Robalos (Flecha e Peva) e cardumes de Camurupins (Tarpons), tornando o rio um cenário ideal para o pincho milimétrico com iscas de superfície e pequenos plugs de meia-água nas marés de vazante.",
      tags: ["Tucunaré Azul", "Tucunaré Amarelo", "Traíra", "Apaiari"],
      // Visão satélite do Castanhão em Jaguaribara:
      mapa: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d20198.955684021592!2d-37.83142024083679!3d-4.39639386546528!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7b85bdc5a9170cd%3A0xdc11bd0f3b43651a!2sFoz%20do%20rio%20Piranji!5e1!3m2!1spt-BR!2sus!4v1794985477633!5m2!1spt-BR!2sus",
      fotos: [
        "fotos-galeria/castanhao-1.jpg",
        "fotos-galeria/castanhao-2.jpg",
        "fotos-galeria/castanhao-3.jpg",
        "fotos-galeria/castanhao-4.jpg"
      ]
    },
    coreau: {
      nome: "Rio Coreaú",
      local: "Camocim — CE",
      desc: "Localizado no litoral oeste cearense, suas águas calmas serpenteiam entre dunas e vegetação densa de mangue. Destaca-se pela claridade da água nas marés secas, permitindo fisgar Robalos-Peva troféu e combater grandes Pescadas Amarelas em canais profundos.",
      tags: ["Robalo Peva", "Robalo Flecha", "Pescada Amarela", "Camurupim"],
      // Visão satélite do Rio Coreaú em Camocim:
      mapa: "https://maps.google.com/maps?q=Rio+Coreau,Camocim,Ceara&t=k&z=13&ie=UTF8&iwloc=&output=embed",
      fotos: [
        "fotos-galeria/coreau-1.jpg",
        "fotos-galeria/coreau-2.jpg",
        "fotos-galeria/coreau-3.jpg",
        "fotos-galeria/coreau-4.jpg"
      ]
    },
    mundau: {
      nome: "Rio Mundaú",
      local: "Trairi — CE",
      desc: "Um cenário preservado de águas verdes e marés limpas. Excelente para modalidades com linhas leves e iscas soft, onde o pescador encontra desde o ataque rápido dos pequenos xaréus até a briga bruta com robalos nas margens sombreadas.",
      tags: ["Camurim", "Xaréu", "Ubarana", "Carapau"],
      // Visão satélite da Barra do Mundaú em Trairi:
      mapa: "https://maps.google.com/maps?q=Barra+do+Rio+Mundau,Trairi,Ceara&t=k&z=13&ie=UTF8&iwloc=&output=embed",
      fotos: [
        "fotos-galeria/mundau-1.jpg",
        "fotos-galeria/mundau-2.jpg",
        "fotos-galeria/mundau-3.jpg",
        "fotos-galeria/mundau-4.jpg"
      ]
    },
    acarau: {
      nome: "Rio Acaraú",
      local: "Acaraú — CE",
      desc: "Extenso estuário de grande produtividade biológica. Famoso pela constância das pescarias durante quase todo o ano, é destino certo para quem busca linhas esticadas com robalos de porte e belos tarpons subindo a barra.",
      tags: ["Robalo Flecha", "Camurupim", "Caranha", "Baiacu"],
      // Visão satélite da foz do Acaraú:
      mapa: "https://maps.google.com/maps?q=Foz+do+Rio+Acarau,Acarau,Ceara&t=k&z=13&ie=UTF8&iwloc=&output=embed",
      fotos: [
        "fotos-galeria/acarau-1.jpg",
        "fotos-galeria/acarau-2.jpg",
        "fotos-galeria/acarau-3.jpg",
        "fotos-galeria/acarau-4.jpg"
      ]
    }
  };

  const overlay = document.getElementById("modal-rio-overlay");
  const btnFechar = document.getElementById("modal-rio-fechar");
  const mNome = document.getElementById("m-rio-nome");
  const mLoc = document.getElementById("m-rio-loc");
  const mDesc = document.getElementById("m-rio-desc");
  const mTags = document.getElementById("m-rio-tags");
  const mFotoPrincipal = document.getElementById("m-rio-foto-principal");
  const mThumbs = document.getElementById("m-rio-thumbs");
  const mBtnWpp = document.getElementById("m-rio-btn-wpp");
  const mMapa = document.getElementById("m-rio-mapa"); // Elemento do Mapa

  function abrirModal(chave) {
    const rio = dadosRios[chave];
    if (!rio) return;

    mNome.textContent = rio.nome;
    mLoc.textContent = rio.local;
    mDesc.textContent = rio.desc;

    // Atualiza o mapa via satélite do rio clicado
    if (mMapa) {
      mMapa.src = rio.mapa;
    }

    // Tags de peixes
    mTags.innerHTML = rio.tags.map(tag => `<span>${tag}</span>`).join("");

    // Foto Principal e Miniaturas
    mFotoPrincipal.src = rio.fotos[0];
    mThumbs.innerHTML = rio.fotos.map((src, idx) => `
      <div class="modal-rio-thumb-item ${idx === 0 ? 'active' : ''}" data-src="${src}">
        <img src="${src}" alt="Foto ${rio.nome}">
      </div>
    `).join("");

    mThumbs.querySelectorAll(".modal-rio-thumb-item").forEach(item => {
      item.addEventListener("click", function() {
        mThumbs.querySelectorAll(".modal-rio-thumb-item").forEach(t => t.classList.remove("active"));
        this.classList.add("active");
        mFotoPrincipal.src = this.dataset.src;
      });
    });

    mBtnWpp.href = "#contato";
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function fecharModal() {
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
    // Limpa o src ao fechar para parar o carregamento em segundo plano
    if (mMapa) {
      mMapa.src = "";
    }
  }

  document.querySelectorAll(".rio-card").forEach(card => {
    card.addEventListener("click", function () {
      const rioKey = this.getAttribute("data-rio");
      abrirModal(rioKey);
    });
  });

  btnFechar.addEventListener("click", fecharModal);

  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) fecharModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) {
      fecharModal();
    }
  });
});

/* ========================================================
     TROCA DAS 3 FOTOS DA TRAJETÓRIA NO MOUSEOVER
     ======================================================== */
  const cardsPilares = document.querySelectorAll(".pilar-card");
  const img1 = document.getElementById("sobre-foto-1");
  const img2 = document.getElementById("sobre-foto-2");
  const img3 = document.getElementById("sobre-foto-3");

  if (cardsPilares.length && img1 && img2 && img3) {
    cardsPilares.forEach(card => {
      const alternar = () => {
        // Pega os 3 caminhos guardados no card
        const f1 = card.getAttribute("data-foto-1");
        const f2 = card.getAttribute("data-foto-2");
        const f3 = card.getAttribute("data-foto-3");

        // Se já está exibindo essa foto, não faz nada
        if (img1.getAttribute("src") === f1) return;

        // Marca o card atual como ativo (borda laranja)
        cardsPilares.forEach(c => c.classList.remove("active"));
        card.classList.add("active");

        // Aplica o efeito visual de saída nas 3 fotos
        [img1, img2, img3].forEach(img => img.classList.add("fade-out"));

        // Troca as 3 imagens após 160 milissegundos
        setTimeout(() => {
          if (f1) img1.src = f1;
          if (f2) img2.src = f2;
          if (f3) img3.src = f3;

          // Remove o efeito assim que carregarem
          [img1, img2, img3].forEach(img => {
            img.onload = () => img.classList.remove("fade-out");
            setTimeout(() => img.classList.remove("fade-out"), 60);
          });
        }, 160);
      };

      // Dispara ao passar o mouse ou ao tocar na tela
      card.addEventListener("mouseenter", alternar);
      card.addEventListener("click", alternar);
    });
  }

  // Clica em qualquer uma das fotos para expandir em tela cheia / clica de novo para fechar
  document.querySelectorAll(".foto-box").forEach(box => {
    box.addEventListener("click", () => box.classList.toggle("expandida"));
  });

  // Fecha no ESC se estiver aberta
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") document.querySelector(".foto-box.expandida")?.classList.remove("expandida");
  });

  /* ========================================================
   ANIMAÇÃO DE REVELAÇÃO SUAVE POR SEÇÃO (REVEAL ON SCROLL)
   ======================================================== */
document.addEventListener("DOMContentLoaded", () => {
  // Marca o corpo da página como pronto para revelar
  document.body.classList.add("has-reveal");

  const elementosParaAnimar = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const observador = new IntersectionObserver((entradas, obs) => {
      entradas.forEach(entrada => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("is-visible");
          obs.unobserve(entrada.target); // Anima uma única vez
        }
      });
    }, {
      rootMargin: "0px 0px -60px 0px", // Dispara pouco antes de aparecer completamente
      threshold: 0.15
    });

    elementosParaAnimar.forEach(el => observador.observe(el));
  } else {
    // Fallback para navegadores muito antigos
    elementosParaAnimar.forEach(el => el.classList.add("is-visible"));
  }
});

/* ========================================================
   TRANSIÇÃO FOTO <-> VÍDEO NO CABEÇALHO COM RETORNO NO SCROLL
   ======================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("heroVideo");
  if (!video) return;

  const tempoEsperaFoto = 7500; // 3.5 segundos na foto antes do vídeo
  let temporizadorPlay = null;

  function iniciarVideoComFade() {
    clearTimeout(temporizadorPlay);
    temporizadorPlay = setTimeout(() => {
      // Apenas inicia se o utilizador ainda estiver no topo da página
      if (window.scrollY < 80) {
        const promessaPlay = video.play();
        if (promessaPlay !== undefined) {
          promessaPlay
            .then(() => {
              video.classList.add("is-playing");
            })
            .catch((err) => console.log("Autoplay bloqueado:", err));
        }
      }
    }, tempoEsperaFoto);
  }

  function voltarParaFoto() {
    clearTimeout(temporizadorPlay);
    video.classList.remove("is-playing"); // Faz o fade-out suave de volta para a foto
    setTimeout(() => {
      if (!video.classList.contains("is-playing")) {
        video.pause(); // Pausa a reprodução para poupar desempenho
      }
    }, 1800); // Aguarda o tempo da transição do CSS antes de pausar
  }

  // 1. Inicia o ciclo da primeira vez que a página carrega
  iniciarVideoComFade();

  // 2. Monitoriza o movimento da barra de rolagem (scroll)
  window.addEventListener("scroll", () => {
    if (window.scrollY > 80) {
      // Desceu a página: volta para a foto
      voltarParaFoto();
    } else {
      // Voltou ao topo: aguarda os segundos e reativa o vídeo
      if (!video.classList.contains("is-playing") && !temporizadorPlay) {
        iniciarVideoComFade();
      }
    }
  }, { passive: true });
});