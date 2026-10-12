(function () {
  "use strict";

  // Konfigurasi default (bisa diubah sesuai kebutuhan)
  const CONFIG = {
    whatsappNumber: "6285155091238",
    message: "Halo, aku tertarik mau order website",
    badgeText: "Birthday",
    titleText: "Suka website seperti ini?",
    btnText: "Order via WhatsApp",
  };

  // Buat style internal agar konsisten di semua website
  const style = document.createElement("style");
  style.textContent = `
    .wa-demo-bar-container {
      position: sticky;
      top: 0;
      left: 0;
      right: 0;
      z-index: 999999;
      background: #25D366;
      background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
      color: #ffffff;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      box-sizing: border-box;
    }

    .wa-demo-bar-container * {
      box-sizing: border-box;
    }

    .wa-demo-info {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .wa-demo-badge {
      background: rgba(0, 0, 0, 0.25);
      color: #ffffff;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.1em;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .wa-demo-text {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.2;
    }

    .wa-demo-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: #ffffff;
      color: #075E54;
      padding: 8px 16px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
    }

    .wa-demo-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      background-color: #f0fdf4;
    }

    .wa-demo-btn:active {
      transform: scale(0.96);
    }

    .wa-demo-btn svg {
      width: 16px;
      height: 16px;
      fill: #25D366;
    }

    @media (max-width: 480px) {
      .wa-demo-bar-container {
        padding: 8px 12px;
      }
      .wa-demo-badge {
        display: none; /* Sembunyikan badge di layar sangat kecil agar muat */
      }
      .wa-demo-text {
        font-size: 12px;
      }
      .wa-demo-btn {
        padding: 7px 12px;
        font-size: 12px;
      }
    }
  `;

  document.head.appendChild(style);

  // Buat URL WhatsApp dengan encode query
  const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(CONFIG.message)}`;

  // Elemen Bar
  const bar = document.createElement("div");
  bar.className = "wa-demo-bar-container";
  bar.innerHTML = `
    <div class="wa-demo-info">
      <span class="wa-demo-badge">${CONFIG.badgeText}</span>
      <p class="wa-demo-text">${CONFIG.titleText}</p>
    </div>
    <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="wa-demo-btn">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
        <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.644 1.928 6.56 6.56 0 0 1 1.928 4.644c-.004 3.639-2.961 6.597-6.57 6.597pt"/>
      </svg>
      <span>${CONFIG.btnText}</span>
    </a>
  `;

  // Sisipkan otomatis ke bagian atas `<body>` atau `.app`
  document.addEventListener("DOMContentLoaded", function () {
    const appContainer = document.querySelector(".app") || document.body;
    appContainer.insertBefore(bar, appContainer.firstChild);
  });
})();