const nav = document.querySelector(".nav-links");
const toggle = document.querySelector(".menu-toggle");

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", nav.classList.contains("open") ? "true" : "false");
  });
}

const pumpLinks = document.querySelectorAll("[data-pump-link]");
const configuredPumpUrl = window.SOLAI_PUMP_URL || "https://pump.fun/coin/Hy9XZ4Ae4oKtXYfuFzWkoNV18teCTpvWWu5PFD9Bpump";

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

const modelTarget = document.querySelector("[data-ollama-models]");
const modelStatus = document.querySelector("[data-model-status]");

const fallbackModels = [
  {
    name: "30BCoder",
    description: "SOLAI Coder 30B is an AI coding model designed for the SOLAI ecosystem, built to power intelligent software development, code generation, reasoning, and AI agent workflows through local and decentralized compute.",
    capability: "tools",
    pulls: "591.4K",
    tags: "1",
    updated: "yesterday",
  },
  {
    name: "80BCoder",
    description: "SOLAI Coder 80B is an AI coding model designed for the SOLAI ecosystem, built to power intelligent software development, code generation, reasoning, and AI agent workflows through local and decentralized compute.",
    capability: "tools",
    pulls: "553.2K",
    tags: "1",
    updated: "yesterday",
  },
];

function renderModels(models, loadedFromRemote) {
  if (!modelTarget) return;

  modelTarget.innerHTML = models.map((model) => `
    <article class="model-card">
      <div class="model-topline"><span class="model-name">${escapeHtml(model.name)}</span><span class="model-tag">${escapeHtml(model.capability || "tools")}</span></div>
      <p>${escapeHtml(model.description)}</p>
      <div class="model-meta"><span>${escapeHtml(model.pulls || "-")} Pulls</span><span>${escapeHtml(model.tags || "1")} Tag</span><span>Updated ${escapeHtml(model.updated || "recently")}</span></div>
      <a class="btn" href="https://ollama.com/solaiai/${encodeURIComponent(model.name)}" target="_blank" rel="noopener noreferrer">Open model</a>
    </article>
  `).join("");

  if (modelStatus) {
    modelStatus.textContent = loadedFromRemote
      ? "Loaded automatically from the solaiai profile on Ollama."
      : "Showing local fallback data because the remote model list could not be loaded from the browser.";
  }
}

function parseOllamaModels(text) {
  const htmlModels = [...text.matchAll(/<a\s+href="\/solaiai\/([^"]+)"[\s\S]*?<\/a>/gi)]
    .map((match) => {
      const name = match[1];
      const block = match[0];
      if (!/Coder/i.test(name)) return null;

      const description = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1]?.replace(/<[^>]*>/g, "").trim();
      const capability = block.match(/>(tools)<\/span>/i)?.[1] || "tools";
      const pulls = block.match(/<span\s*>\s*([^<]+)\s*<\/span>\s*<span[^>]*>\s*&nbsp;Pulls/i)?.[1]?.trim();
      const tags = block.match(/<span\s*>\s*(\d+)\s*<\/span>\s*<span[^>]*>\s*&nbsp;Tag/i)?.[1]?.trim();
      const updated = block.match(/Updated&nbsp;<\/span>\s*<span\s*>\s*([^<]+)\s*<\/span>/i)?.[1]?.trim();

      return {
        name,
        description: description || fallbackModels.find((model) => model.name === name)?.description || "SOLAI Coder model for software development and AI agent workflows.",
        capability,
        pulls,
        tags,
        updated,
      };
    })
    .filter(Boolean);

  if (htmlModels.length) {
    return htmlModels;
  }

  const clean = text.replace(/\s+/g, " ").trim();
  const names = [...clean.matchAll(/\b(\d+B(?:Coder)?)\b/g)].map((match) => match[1]);
  const uniqueNames = [...new Set(names)].filter((name) => /Coder/i.test(name));

  return uniqueNames.map((name) => {
    const start = clean.indexOf(name);
    const nextName = uniqueNames.find((other) => clean.indexOf(other, start + name.length) > start);
    const end = nextName ? clean.indexOf(nextName, start + name.length) : clean.length;
    const segment = clean.slice(start + name.length, end);
    const pulls = segment.match(/(\d+(?:\.\d+)?[KMB]?)\s+Pulls?/i)?.[1] || segment.match(/\b(\d+(?:\.\d+)?[KMB]?)\s+1\s+(?:Tag|yesterday|today)/i)?.[1];
    const tags = segment.match(/(\d+)\s+Tags?/i)?.[1] || segment.match(/\b(\d+)\s+(?:Tag|yesterday|today)/i)?.[1] || "1";
    const updated = segment.match(/Updated\s+([A-Za-z0-9 ,.-]+)/i)?.[1]?.trim() || segment.match(/\b(yesterday|today|\d+\s+\w+\s+ago)\b/i)?.[1] || "recently";
    const description = segment
      .replace(/\btools\b.*$/i, "")
      .replace(/\b\d+(?:\.\d+)?[KMB]?\b.*$/i, "")
      .trim() || fallbackModels.find((model) => model.name === name)?.description || "SOLAI Coder model for software development and AI agent workflows.";

    return { name, description, capability: /tools/i.test(segment) ? "tools" : "tools", pulls, tags, updated };
  });
}

async function loadOllamaModels() {
  if (!modelTarget) return;

  const sources = [
    "https://ollama.com/solaiai",
    "https://r.jina.ai/https://ollama.com/solaiai",
  ];

  for (const source of sources) {
    try {
      const response = await fetch(source);
      if (!response.ok) continue;
      const text = await response.text();
      const models = parseOllamaModels(text);
      if (models.length) {
        renderModels(models, true);
        return;
      }
    } catch (error) {
      continue;
    }
  }

  renderModels(fallbackModels, false);
}

loadOllamaModels();
