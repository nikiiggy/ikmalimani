// Menggunakan endpoint nPoint kamu
const NPOINT_API_URL = "https://api.npoint.io/e35343aa3cea91c283ec";

let VALID_USERS = {};
let TOPUP_PIN_LIST = [];
let currentSessionUser = null;
let uploadedData = { logoContainer: [], produkContainer: [], refContainer: [] };

window.onload = async () => {
  await fetchDatabaseFromNPoint();
  checkSession();
};

// Fetch data pengguna & kode redeem dari nPoint
async function fetchDatabaseFromNPoint() {
  try {
    const res = await fetch(NPOINT_API_URL);
    const data = await res.json();
    VALID_USERS = data.valid_users || {};
    TOPUP_PIN_LIST = data.topup_pins || [];
  } catch (err) {
    console.error("Gagal mengambil data dari nPoint:", err);
  }
}

function movePinFocus(current, index) {
  if (current.value.length >= 1 && index < 4) {
    document.querySelectorAll('.pin-input')[index].focus();
  }
}

function getFullPin() {
  const inputs = document.querySelectorAll('.pin-input');
  let pin = '';
  inputs.forEach(inp => pin += inp.value);
  return pin;
}

function checkSession() {
  const savedUser = localStorage.getItem('ps_active_user');
  if (savedUser && VALID_USERS[savedUser]) {
    currentSessionUser = savedUser;
    document.getElementById('loginModal').classList.add('hidden');
    
    const savedCredit = localStorage.getItem('ps_credit_' + currentSessionUser);
    if (savedCredit !== null) {
      VALID_USERS[currentSessionUser].credit = parseInt(savedCredit);
    }

    updateUI();
  } else {
    document.getElementById('loginModal').classList.remove('hidden');
  }
}

function processLogin() {
  const phone = document.getElementById('loginPhone').value.trim();
  const pin = getFullPin();
  const errBox = document.getElementById('loginError');

  if (VALID_USERS[phone] && VALID_USERS[phone].pin === pin) {
    errBox.style.display = 'none';
    currentSessionUser = phone;
    localStorage.setItem('ps_active_user', phone);
    
    const savedCredit = localStorage.getItem('ps_credit_' + phone);
    if (savedCredit !== null) {
      VALID_USERS[phone].credit = parseInt(savedCredit);
    } else {
      localStorage.setItem('ps_credit_' + phone, VALID_USERS[phone].credit);
    }

    document.getElementById('loginModal').classList.add('hidden');
    updateUI();
  } else {
    errBox.style.display = 'block';
  }
}

function logout() {
  localStorage.removeItem('ps_active_user');
  currentSessionUser = null;
  location.reload();
}

function updateUI() {
  if (!currentSessionUser) return;
  document.getElementById('displayUserPhone').innerText = currentSessionUser;
  const credit = VALID_USERS[currentSessionUser].credit;
  document.getElementById('creditCount').innerText = credit;

  const btnGenerate = document.getElementById('btnGenerate');
  if (credit <= 0) {
    btnGenerate.disabled = true;
    btnGenerate.innerText = 'Kredit Habis (Isi Ulang Dulu)';
  } else {
    btnGenerate.disabled = false;
    btnGenerate.innerText = 'Generate Structured Prompt';
  }
}

function openTopUpModal() {
  document.getElementById('topupModal').classList.remove('hidden');
}

function closeTopUpModal() {
  document.getElementById('topupModal').classList.add('hidden');
}

function processTopUp() {
  const code = document.getElementById('topupCodeInput').value.trim();
  const errBox = document.getElementById('topupError');

  if (TOPUP_PIN_LIST.includes(code)) {
    errBox.style.display = 'none';
    VALID_USERS[currentSessionUser].credit += 100;
    localStorage.setItem('ps_credit_' + currentSessionUser, VALID_USERS[currentSessionUser].credit);
    
    document.getElementById('topupCodeInput').value = '';
    closeTopUpModal();
    updateUI();
  } else {
    errBox.style.display = 'block';
  }
}

function handleFiles(input, containerId) {
  const container = document.getElementById(containerId);

  Array.from(input.files).forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result;
      const fileIndex = uploadedData[containerId].length;
      uploadedData[containerId].push({ name: file.name, data: base64Data });

      const card = document.createElement('div');
      card.className = 'preview-card';
      card.innerHTML = `
        <img src="${base64Data}" alt="preview">
        <div class="preview-overlay">
          <button class="btn-copy-img" onclick="copyImageBase64('${containerId}', ${fileIndex})">Copy Base64</button>
        </div>
      `;
      container.insertBefore(card, container.lastElementChild);
    };
    reader.readAsDataURL(file);
  });
}

function copyImageBase64(category, index) {
  const item = uploadedData[category][index];
  if (item) {
    navigator.clipboard.writeText(item.data);
  }
}

function generatePrompt() {
  if (!currentSessionUser) return;
  let credit = VALID_USERS[currentSessionUser].credit;
  if (credit <= 0) return openTopUpModal();

  credit--;
  VALID_USERS[currentSessionUser].credit = credit;
  localStorage.setItem('ps_credit_' + currentSessionUser, credit);
  updateUI();

  const structuredPrompt = {
    PROMPT_CONFIG: {
      SYSTEM_AUTHOR: "Prompt Studio Banner Unlimited by ikmalimani",
      USER_ACCOUNT: currentSessionUser,
      VERSION: "3.0-NPOINT"
    },
    DATA_INFORMASI: {
      JUDUL_UTAMA: document.getElementById('judulUtama').value || "-",
      SUB_JUDUL: document.getElementById('subJudul').value || "-",
      DESKRIPSI: document.getElementById('deskripsi').value || "-",
      SLOGAN: document.getElementById('slogan').value || "-",
      CALL_TO_ACTION: document.getElementById('cta').value || "-"
    },
    PANEL_KONTAK_ALAMAT: {
      WHATSAPP: document.getElementById('wa').value || "-",
      TIKTOK: document.getElementById('tiktok').value || "-",
      INSTAGRAM: document.getElementById('ig').value || "-",
      YOUTUBE: document.getElementById('yt').value || "-",
      FACEBOOK: document.getElementById('fb').value || "-",
      ALAMAT: document.getElementById('alamat').value || "-"
    },
    SPESIFIKASI_REFERENSI: {
      ORIENTASI: document.getElementById('orientasi').value,
      UKURAN: document.getElementById('ukuran').value || "-",
      WARNA_DOMINAN: document.getElementById('warna').value || "-",
      TEMA_DESAIN: document.getElementById('tema').value || "-",
      TOTAL_GAMBAR_REFERENSI: uploadedData.refContainer.length
    },
    RINGKASAN_ASSET_VISUAL: {
      TOTAL_LOGO: uploadedData.logoContainer.length,
      TOTAL_FOTO_PRODUK: uploadedData.produkContainer.length
    },
    PERINTAH_KHUSUS: document.getElementById('perintahKhusus').value || "-",
    AI_DIRECTIVE: "Generate visual banner desain profesional modern berbasis data terstruktur di atas. Susun komposisi hirarki visual yang seimbang antara Judul Utama, Foto Produk, dan Kontak."
  };

  const finalOutput = JSON.stringify(structuredPrompt, null, 2);
  document.getElementById('outputArea').value = finalOutput;
}

function copyOutput() {
  const output = document.getElementById('outputArea');
  if (!output.value) return;
  output.select();
  navigator.clipboard.writeText(output.value);
}

function resetForm() {
  document.getElementById('promptForm').reset();
  document.getElementById('outputArea').value = '';
  
  ['logoContainer', 'produkContainer', 'refContainer'].forEach(id => {
    const container = document.getElementById(id);
    const uploadBtn = container.querySelector('.upload-btn');
    container.innerHTML = '';
    container.appendChild(uploadBtn);
    uploadedData[id] = [];
  });
}
