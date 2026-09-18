let currentImageUrl = "";
let currentGroupName = "";
let currentUsername = "";

// Menggunakan RoProxy (Proxy khusus Roblox API yang mendukung GET & POST)
const ROPROXY_BASE = "https://users.roproxy.com";
const ROPROXY_GROUPS = "https://groups.roproxy.com";
const ROPROXY_THUMBNAILS = "https://thumbnails.roproxy.com";

async function resolveUserId(query) {
    const cleanQuery = query.trim();

    try {
        // Percobaan 1: Cari via Username (POST ke RoProxy)
        const userRes = await fetch(`${ROPROXY_BASE}/v1/namespaces/usernames/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usernames: [cleanQuery], excludeBannedUsers: false })
        });
        
        if (userRes.ok) {
            const userData = await userRes.json();
            if (userData.data && userData.data.length > 0) {
                return { id: userData.data[0].id, name: userData.data[0].name };
            }
        }

        // Percobaan 2: Jika input berupa angka langsung (User ID)
        if (/^\d+$/.test(cleanQuery)) {
            const checkRes = await fetch(`${ROPROXY_BASE}/v1/users/${cleanQuery}`);
            if (checkRes.ok) {
                const checkData = await checkRes.json();
                return { id: parseInt(cleanQuery), name: checkData.name || cleanQuery };
            }
        }

        // Percobaan 3: Search via Display Name
        const searchRes = await fetch(`${ROPROXY_BASE}/v1/users/search?keyword=${encodeURIComponent(cleanQuery)}&limit=10`);
        if (searchRes.ok) {
            const searchData = await searchRes.json();
            if (searchData.data && searchData.data.length > 0) {
                return { id: searchData.data[0].id, name: searchData.data[0].name };
            }
        }
    } catch (e) {
        console.error("Error resolving User ID:", e);
    }
    return null;
}

async function fetchCommunityLogo() {
    const input = document.getElementById("username").value;
    const status = document.getElementById("status");
    const searchBtn = document.getElementById("searchBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const previewImg = document.getElementById("previewImg");
    const previewText = document.getElementById("previewText");

    if (!input.trim()) {
        alert("Silakan masukkan Username / Display Name terlebih dahulu!");
        return;
    }

    searchBtn.disabled = true;
    downloadBtn.disabled = true;
    status.style.color = "#fbbf24";
    status.innerText = "Status: Mencari data pengguna...";

    const user = await resolveUserId(input);
    if (!user) {
        status.style.color = "#f43f5e";
        status.innerText = `Status: Pengguna '${input}' tidak ditemukan!`;
        searchBtn.disabled = false;
        return;
    }

    currentUsername = user.name;
    status.innerText = `User ditemukan: ${user.name}. Memeriksa Primary Group...`;

    try {
        // Ambil data Primary Group milik user
        const groupRes = await fetch(`${ROPROXY_GROUPS}/v1/users/${user.id}/groups/primary/role`);
        if (!groupRes.ok) {
            status.style.color = "#f43f5e";
            status.innerText = "Status: Gagal mengambil data Primary Group!";
            searchBtn.disabled = false;
            return;
        }

        const groupData = await groupRes.json();
        if (!groupData || !groupData.group) {
            status.style.color = "#f43f5e";
            status.innerText = "Status: Pengguna ini tidak memasang Primary Group di profilnya!";
            searchBtn.disabled = false;
            return;
        }

        const groupId = groupData.group.id;
        currentGroupName = groupData.group.name;

        // Ambil URL Thumbnail Logo Group
        const thumbRes = await fetch(`${ROPROXY_THUMBNAILS}/v1/groups/icons?groupIds=${groupId}&size=420x420&format=Png`);
        const thumbData = await thumbRes.json();

        if (!thumbData.data || !thumbData.data[0].imageUrl) {
            status.style.color = "#f43f5e";
            status.innerText = "Status: Gagal mengambil logo grup!";
            searchBtn.disabled = false;
            return;
        }

        currentImageUrl = thumbData.data[0].imageUrl;

        // Render ke Preview GUI
        previewImg.src = currentImageUrl;
        previewImg.style.display = "block";
        previewText.style.display = "none";

        status.style.color = "#22c55e";
        status.innerText = `Grup: ${currentGroupName}`;
        downloadBtn.disabled = false;

    } catch (err) {
        status.style.color = "#f43f5e";
        status.innerText = "Status: Terjadi kesalahan jaringan!";
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
        alert("Gagal mengunduh gambar secara otomatis. Silakan klik kanan gambar preview dan pilih 'Save Image As'.");
    }
}

// Support pencarian via tombol Enter
document.getElementById("username").addEventListener("keypress", function(e) {
    if (e.key === "Enter") fetchCommunityLogo();
});
