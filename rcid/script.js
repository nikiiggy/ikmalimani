let currentImageUrl = "";
let currentGroupName = "";
let currentUsername = "";

// URL Web App Google Apps Script kamu
const GAS_URL = "https://script.google.com/macros/s/AKfycbxCeHfsu9vpmPSAyCODpmdlyChyaTaCfeVQRBmVDiKuhUKpBQLD5UVmSPIbE2CeKoOV1Q/exec";

async function fetchCommunityLogo() {
    const input = document.getElementById("username").value.trim();
    const status = document.getElementById("status");
    const searchBtn = document.getElementById("searchBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const previewImg = document.getElementById("previewImg");
    const previewText = document.getElementById("previewText");

    if (!input) {
        alert("Silakan masukkan Username terlebih dahulu!");
        return;
    }

    searchBtn.disabled = true;
    downloadBtn.disabled = true;
    status.style.color = "#fbbf24";
    status.innerText = "Status: Memproses via Google Apps Script...";

    try {
        const response = await fetch(`${GAS_URL}?username=${encodeURIComponent(input)}`);
        const data = await response.json();

        if (data.error) {
            status.style.color = "#f43f5e";
            status.innerText = `Status: ${data.error}`;
            searchBtn.disabled = false;
            return;
        }

        currentUsername = data.username;
        currentGroupName = data.groupName;
        currentImageUrl = data.imageUrl;

        // Tampilkan Preview Gambar
        previewImg.src = currentImageUrl;
        previewImg.style.display = "block";
        previewText.style.display = "none";

        status.style.color = "#22c55e";
        status.innerText = `Grup: ${currentGroupName} (${currentUsername})`;
        downloadBtn.disabled = false;

    } catch (err) {
        status.style.color = "#f43f5e";
        status.innerText = "Status: Terjadi kesalahan koneksi!";
        console.error(err);
    } finally {
        searchBtn.disabled = false;
    }
}

async function downloadImage() {
    if (!currentImageUrl) return;

    try {
        const response = await fetch(currentImageUrl);
        const blob = await response.blob();
        
        const cleanGroupName = currentGroupName.replace(/[^a-zA-Z0-9_-]/g, "_");
        const fileName = `${currentUsername}_${cleanGroupName}.png`;

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        window.open(currentImageUrl, '_blank');
    }
}

// Fitur tekan tombol Enter untuk cari
document.getElementById("username").addEventListener("keypress", function(e) {
    if (e.key === "Enter") fetchCommunityLogo();
});
