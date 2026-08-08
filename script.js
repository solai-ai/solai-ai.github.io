const nav = document.querySelector(".nav-links");
const toggle = document.querySelector(".menu-toggle");

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", nav.classList.contains("open") ? "true" : "false");
  });
}

const pumpLinks = document.querySelectorAll("[data-pump-link]");
const configuredPumpUrl = window.SOLAI_PUMP_URL || "https://pump.fun/";

pumpLinks.forEach((link) => {
  link.href = configuredPumpUrl;
  link.target = "_blank";
  link.rel = "noreferrer";
});

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderMarkdown(md) {
  const lines = md.split(/\r?\n/);
  let html = "";
  let inCode = false;
  let inList = false;
  let inQuote = false;

  const closeBlocks = () => {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
    if (inQuote) {
      html += "</blockquote>";
      inQuote = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.startsWith("```")) {
      if (inCode) {
        html += "</code></pre>";
        inCode = false;
      } else {
        closeBlocks();
        html += "<pre><code>";
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      html += `${escapeHtml(raw)}\n`;
      continue;
    }

    if (!line.trim()) {
      closeBlocks();
      continue;
    }

    if (line.startsWith("> ")) {
      if (!inQuote) {
        closeBlocks();
        html += "<blockquote>";
        inQuote = true;
      }
      html += `<p>${escapeHtml(line.slice(2))}</p>`;
      continue;
    }

    if (line.startsWith("* ")) {
      if (!inList) {
        closeBlocks();
        html += "<ul>";
        inList = true;
      }
      html += `<li>${escapeHtml(line.slice(2))}</li>`;
      continue;
    }

    closeBlocks();

    if (line.startsWith("### ")) {
      html += `<h3>${escapeHtml(line.slice(4))}</h3>`;
    } else if (line.startsWith("## ")) {
      html += `<h2>${escapeHtml(line.slice(3))}</h2>`;
    } else if (line.startsWith("# ")) {
      html += `<h1>${escapeHtml(line.slice(2))}</h1>`;
    } else if (line === "---") {
      html += "<hr>";
    } else {
      html += `<p>${escapeHtml(line)}</p>`;
    }
  }

  closeBlocks();
  return html;
}

const whitepaperTarget = document.querySelector("[data-whitepaper]");

if (whitepaperTarget) {
  fetch("whitepaper.md")
    .then((response) => response.text())
    .then((text) => {
      whitepaperTarget.innerHTML = renderMarkdown(text);
    })
    .catch(() => {
      whitepaperTarget.innerHTML = "<p>Whitepaper loading requires serving this folder over HTTP. The complete Markdown file is available at <a href=\"whitepaper.md\">whitepaper.md</a>.</p>";
    });
}
