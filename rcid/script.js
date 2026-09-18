let currentImageUrl = "";
let currentGroupName = "";
let currentUsername = "";

// CORS Proxy untuk bypass proteksi CORS browser saat fetch API Roblox dari frontend
const CORS_PROXY = "https://corsproxy.io/?";

async function resolveUserId(query) {
    try {
        // 1. Cari via Username
        const userRes = await fetch(CORS_PROXY + encodeURIComponent("https://users.roblox.com/v1/namespaces/usernames/users"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usernames: [query], excludeBannedUsers: false })
        });
        const userData = await userRes.json();
        if (userData.data && userData.data.length > 0) {
            return { id: userData.data[0].id, name: userData.data[0].name };
        }

        // 2. Cari via Display Name / Search API
        const searchRes = await fetch(CORS_PROXY + encodeURIComponent(`https://users.roblox.com/v1/users/search?keyword=${query}&limit=10`));
        const searchData = await searchRes.json();
        if (searchData.data && searchData.data.length > 0) {
            return { id: searchData.data[0].id, name: searchData.data[0].name };
        }

        // 3. Jika input adalah angka User ID
        if (/^\d+$/.test(query)) {
            const checkRes = await fetch(CORS_PROXY + encodeURIComponent(`https://users.roblox.com/v1/users/${query}`));
            if (checkRes.ok) {
                const checkData = await checkRes.json();
                return { id: parseInt(query), name: checkData.name || query };
            }
        }
    } catch (e) {
        console.error("Error resolving User ID:", e);
    }
    return null;
}

async function fetchCommunityLogo() {
    const input = document.getElementById("username").value.trim();
    const status = document.getElementById("status");
    const searchBtn = document.getElementById("searchBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const previewImg = document.getElementById("previewImg");
    const previewText = document.getElementById("previewText");

    if (!input) {
        alert("Silakan masukkan Username / Display Name terlebih dahulu!");
        return;
    }

    searchBtn.disabled = true;
    downloadBtn.disabled = true;
    status.style.color = "#94a3b8";
    status.innerText = "Status: Mencari data pengguna...";

    const user = await resolveUserId(input);
    if (!user) {
        status.style.color = "#ef4444";
        status.innerText = `Status: Pengguna '${input}' tidak ditemukan!`;
        searchBtn.disabled = false;
        return;
    }

    currentUsername = user.name;
    status.innerText = `User ditemukan: ${user.name}. Memeriksa Primary Group...`;

    try {
        // Ambil data Primary Group
        const groupRes = await fetch(CORS_PROXY + encodeURIComponent(`https://groups.roblox.com/v1/users/${user.id}/groups/primary/role`));
        if (!groupRes.ok) {
            status.style.color = "#ef4444";
            status.innerText = "Status: Pengguna tidak punya Primary Group / Community!";
            searchBtn.disabled = false;
            return;
        }

        const groupData = await groupRes.json();
        if (!groupData || !groupData.group) {
            status.style.color = "#ef4444";
            status.innerText = "Status: Pengguna tidak memasang Primary Group di profilnya!";
            searchBtn.disabled = false;
            return;
        }

        const groupId = groupData.group.id;
        currentGroupName = groupData.group.name;

        // Ambil Thumbnail Logo Group
        const thumbRes = await fetch(CORS_PROXY + encodeURIComponent(`https://thumbnails.roblox.com/v1/groups/icons?groupIds=${groupId}&size=420x420&format=Png`));
        const thumbData = await thumbRes.json();

        if (!thumbData.data || !thumbData.data[0].imageUrl) {
            status.style.color = "#ef4444";
            status.innerText = "Status: Gagal mengambil logo grup!";
            searchBtn.disabled = false;
            return;
        }

        currentImageUrl = thumbData.data[0].imageUrl;

        // Render ke Preview
        previewImg.src = CORS_PROXY + encodeURIComponent(currentImageUrl);
        previewImg.style.display = "block";
        previewText.style.display = "none";

        status.style.color = "#22c55e";
        status.innerText = `Grup: ${currentGroupName}`;
        downloadBtn.disabled = false;

    } catch (err) {
        status.style.color = "#ef4444";
        status.innerText = "Status: Terjadi kesalahan jaringan!";
        console.error(err);
    } finally {
        searchBtn.disabled = false;
    }
}

async function downloadImage() {
    if (!currentImageUrl) return;

    try {
        const response = await fetch(CORS_PROXY + encodeURIComponent(currentImageUrl));
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
        alert("Gagal mengunduh gambar secara otomatis. Kamu bisa klik kanan gambar preview dan pilih Save Image As.");
    }
}

// Enter key support
document.getElementById("username").addEventListener("keypress", function(e) {
    if (e.key === "Enter") fetchCommunityLogo();
});
