(function (global) {
  const { qs, qsa } = global.DOM || {
    qs: (s, c) => (c || document).querySelector(s),
    qsa: (s, c) => Array.from((c || document).querySelectorAll(s)),
  };
  const basePath = global.location.pathname.includes("/projects/") ? "../" : "";
  const SITE = {
    name: "Edoardo Vicentini",
    role: "Postdoctoral Researcher",
    affiliation: "CIC nanoGUNE, Nanooptics Group",
    location: "San Sebastian, Spain",
    email: "e.vicentini@nanogune.eu",
    orcid: "0000-0003-1850-2327",
    cvScientific: `${basePath}CV/CV_Edoardo%20Vicentini.pdf`,
    cvIndustry: `${basePath}CV/CV_EV.pdf`,
  };

  function applySiteConfig() {
    const setText = (key, value) => {
      qsa(`[data-site="${key}"]`).forEach((el) => {
        el.textContent = value;
        if (key === "email" && el.tagName === "A") {
          el.setAttribute("href", `mailto:${value}`);
        }
      });
    };

    setText("name", SITE.name);
    setText("role", SITE.role);
    setText("affiliation", SITE.affiliation);
    setText("location", SITE.location);
    setText("email", SITE.email);
    setText("orcid", SITE.orcid);

    qsa('[data-site="cv-scientific"]').forEach((el) => {
      el.setAttribute("href", SITE.cvScientific);
    });

    qsa('[data-site="cv-industry"]').forEach((el) => {
      el.setAttribute("href", SITE.cvIndustry);
    });

    qsa('[data-site="copy-email"]').forEach((el) => {
      el.setAttribute("data-copy-email", SITE.email);
    });
  }

  function initThemeToggle() {
    const root = document.documentElement;
    if (!root.getAttribute("data-theme")) {
      root.setAttribute("data-theme", "dark");
    }
  }

  function initHeaderOffset() {
    const root = document.documentElement;
    const update = () => {
      const header = qs(".site-header");
      if (!header) return;
      const height = Math.ceil(header.getBoundingClientRect().height);
      if (!height) return;
      root.style.setProperty("--site-header-height", `${height}px`);
    };
    update();
    global.addEventListener("resize", update, { passive: true });
    if (global.requestAnimationFrame) {
      global.requestAnimationFrame(update);
    }
  }

  function initActiveNav() {
    const navLinks = qsa(".nav a, .nav-list .nav-link");
    const currentPath = global.location.pathname.replace(/\/$/, "/index.html");
    navLinks.forEach((link) => {
      link.classList.remove("active");
      link.classList.remove("is-active");
      link.removeAttribute("aria-current");
      const href = link.getAttribute("href");
      if (!href) return;
      if (href.startsWith("#")) return;
      const linkPath = new URL(href, global.location.href).pathname;
      if (currentPath === linkPath) {
        link.classList.add("active");
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function initSelectedPublications() {
    const selectedList = qs("#selected-publications");
    if (!selectedList) return;

    const normalizeDoi = (doi) => {
      if (!doi) return "";
      return String(doi)
        .replace(/^https?:\/\/doi\.org\//i, "")
        .trim()
        .toLowerCase();
    };

    const formatAuthors = (pub) => {
      if (Array.isArray(pub.authors)) return pub.authors.join(", ");
      if (typeof pub.authors === "string") return pub.authors;
      return "";
    };

    Promise.all([
      fetch("assets/data/publications.json")
        .then((r) => r.json())
        .catch(() => []),
      fetch("assets/data/publications.selected.json")
        .then((r) => r.json())
        .catch(() => []),
    ])
      .then(([pubData, selectedData]) => {
        const publications = Array.isArray(pubData)
          ? pubData
          : pubData.publications || [];
        const selectedDois = Array.isArray(selectedData)
          ? selectedData.map((d) => normalizeDoi(d)).filter(Boolean)
          : [];
        const sorted = publications.slice().sort((a, b) => {
          const yearA = a.year || 0;
          const yearB = b.year || 0;
          if (yearA !== yearB) return yearB - yearA;
          return (a.title || "").localeCompare(b.title || "");
        });
        let items = [];
        if (selectedDois.length) {
          items = sorted.filter((pub) =>
            selectedDois.includes(normalizeDoi(pub.doi)),
          );
        } else {
          items = sorted.filter((pub) => pub.selected);
        }
        if (!items.length) {
          selectedList.innerHTML =
            "<p>Selected publications are not available yet.</p>";
          return;
        }
        selectedList.innerHTML = items
          .map((pub) => {
            const authors = formatAuthors(pub);
            const journal = pub.journal || pub.venue || "";
            return `
              <div class="list-item">
                <strong>${pub.title}</strong>
                ${authors ? `<div class="meta">${authors}</div>` : ""}
                <small>${journal}${pub.year ? ` (${pub.year})` : ""}</small>
              </div>`;
          })
          .join("");
      })
      .catch(() => {
        selectedList.innerHTML =
          "<p>Selected publications will appear here once the data file is available.</p>";
      });
  }

  function initCopyEmail() {
    const copyButton = qs("[data-copy-email]");
    if (!copyButton) return;
    copyButton.addEventListener("click", () => {
      const email = copyButton.getAttribute("data-copy-email");
      if (!email) return;
      const showCopied = () => {
        copyButton.textContent = "Copied";
        setTimeout(() => {
          copyButton.textContent = "Copy email";
        }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(email)
          .then(showCopied)
          .catch(() => {});
      } else {
        showCopied();
      }
    });
  }

  function initDemo() {
    const demoCanvas = qs("#demo-canvas");
    const demoSlider = qs("#demo-slider");
    if (!demoCanvas || !demoSlider) return;
    const ctx = demoCanvas.getContext("2d");
    const root = document.documentElement;

    const draw = (value) => {
      const width = demoCanvas.width;
      const height = demoCanvas.height;
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle =
        getComputedStyle(root).getPropertyValue("--accent").trim() || "#0f5c6e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < width; x += 4) {
        const t = x / width;
        const y =
          height / 2 -
          Math.sin(t * 6.28) * (value * 0.4) * height * (0.4 + 0.6 * t);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    const resize = () => {
      demoCanvas.width = demoCanvas.clientWidth;
      demoCanvas.height = demoCanvas.clientHeight;
      draw(parseFloat(demoSlider.value));
    };

    demoSlider.addEventListener("input", () =>
      draw(parseFloat(demoSlider.value)),
    );
    global.addEventListener("resize", resize);
    resize();
  }

  function initMarkdownBlocks() {
    if (!global.ContentLoader) return;
    const blocks = qsa(".md-block[data-md]");
    if (!blocks.length) return;
    blocks.forEach((block) => {
      const path = block.getAttribute("data-md");
      if (!path) return;
      global.ContentLoader.renderMarkdownInto(block, path);
    });
  }

  function initCvToggle() {
    const cvRoot = qs("#cv-page") || qs("main#main");
    if (!cvRoot) return;
    const cvToggle = qsa(
      '.view-toggle-btn[data-view="scientific"], .view-toggle-btn[data-view="industry"]',
      cvRoot,
    );
    if (!cvToggle.length) return;
    const storageKey = "cvView";
    const stored = global.StorageUtil
      ? global.StorageUtil.get(storageKey, "scientific")
      : "scientific";
    const initial = stored === "industry" ? "industry" : "scientific";

    const applyMode = (mode) => {
      document.body.classList.remove("mode-cv-scientific", "mode-cv-industry");
      document.body.classList.add(
        mode === "industry" ? "mode-cv-industry" : "mode-cv-scientific",
      );
      if (global.StorageUtil) {
        global.StorageUtil.set(storageKey, mode);
      } else {
        localStorage.setItem(storageKey, mode);
      }
      cvToggle.forEach((btn) => {
        const isActive = btn.dataset.view === mode;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    };

    cvToggle.forEach((btn) => {
      btn.addEventListener("click", () => applyMode(btn.dataset.view));
      btn.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const current = btn.dataset.view === "industry" ? 1 : 0;
        const nextIndex = event.key === "ArrowRight" ? Math.min(1, current + 1) : Math.max(0, current - 1);
        const next = cvToggle[nextIndex];
        if (!next) return;
        applyMode(next.dataset.view);
        next.focus();
      });
    });

    applyMode(initial);
  }

  function initPageModules() {
    const modules = global.PageModules || {};
    if (qs("#research-page") && modules.research) modules.research();
    if (qs("#awards-content") && modules.awards) modules.awards();
    if (qs("#funding-content") && modules.funding) modules.funding();
    if (qs("#projects-grid") && modules.projects) modules.projects();
    if (qs("#publications-list") && modules.publications)
      modules.publications();
    if (qs("#conference-content") && modules.conference) modules.conference();
    if (qs("#cv-page-body") && modules.cv) modules.cv();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (global.LayoutLoader && global.LayoutLoader.initLayout) {
      global.LayoutLoader.initLayout();
    }

    applySiteConfig();
    initThemeToggle();
    initHeaderOffset();
    initActiveNav();
    initSelectedPublications();
    initCopyEmail();
    initDemo();
    initMarkdownBlocks();
    initCvToggle();
    initPageModules();
  });

  document.addEventListener("layout:ready", () => {
    applySiteConfig();
    initHeaderOffset();
    initActiveNav();
  });
})(window);
