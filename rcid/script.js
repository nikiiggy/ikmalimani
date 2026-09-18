let currentImageUrl = "";
let currentGroupName = "";
let currentUsername = "";

// Menggunakan Proxy GET yang stabil untuk browser
const PROXY = "https://api.allorigins.win/get?url=";

async function fetchJSON(url) {
    try {
        const response = await fetch(PROXY + encodeURIComponent(url));
        if (!response.ok) return null;
        const data = await response.json();
        return JSON.parse(data.contents);
    } catch (e) {
        console.error("Fetch error:", e);
        return null;
    }
}

async function resolveUserId(query) {
    const cleanQuery = query.trim();

    // 1. Jika pengguna langsung memasukkan angka User ID
    if (/^\d+$/.test(cleanQuery)) {
        const checkData = await fetchJSON(`https://users.roblox.com/v1/users/${cleanQuery}`);
        if (checkData && checkData.id) {
            return { id: checkData.id, name: checkData.name };
        }
    }

    // 2. Cari User ID berdasarkan Username / Display Name via API Search Publik
    const searchData = await fetchJSON(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(cleanQuery)}&limit=10`);
    if (searchData && searchData.data && searchData.data.length > 0) {
        // Cari match persis dengan username terlebih dahulu
        const exactMatch = searchData.data.find(u => u.name.toLowerCase() === cleanQuery.toLowerCase());
        if (exactMatch) {
            return { id: exactMatch.id, name: exactMatch.name };
        }
        // Jika tidak ada match persis, ambil hasil pencarian teratas (Display Name)
        return { id: searchData.data[0].id, name: searchData.data[0].name };
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

    // 3. Ambil data Primary Group pengguna
    const groupData = await fetchJSON(`https://groups.roblox.com/v1/users/${user.id}/groups/primary/role`);
    
    if (!groupData || !groupData.group) {
        status.style.color = "#f43f5e";
        status.innerText = "Status: Pengguna ini tidak memasang Primary Group di profilnya!";
        searchBtn.disabled = false;
        return;
    }

    const groupId = groupData.group.id;
    currentGroupName = groupData.group.name;

    // 4. Ambil URL Thumbnail Logo Group
    const thumbData = await fetchJSON(`https://thumbnails.roblox.com/v1/groups/icons?groupIds=${groupId}&size=420x420&format=Png`);

    if (!thumbData || !thumbData.data || !thumbData.data[0].imageUrl) {
        status.style.color = "#f43f5e";
        status.innerText = "Status: Gagal mengambil logo grup!";
        searchBtn.disabled = false;
        return;
    }

    currentImageUrl = thumbData.data[0].imageUrl;

    // 5. Render ke Tampilan Preview
    previewImg.src = currentImageUrl;
    previewImg.style.display = "block";
    previewText.style.display = "none";

    status.style.color = "#22c55e";
    status.innerText = `Grup: ${currentGroupName}`;
    downloadBtn.disabled = false;
    searchBtn.disabled = false;
}

async function downloadImage() {
    if (!currentImageUrl) return;

    try {
        const response = await fetch(PROXY + encodeURIComponent(currentImageUrl));
        const data = await response.json();
        
        // Convert base64 / blob ke link download
        const cleanGroupName = currentGroupName.replace(/[^a-zA-Z0-9_-]/g, "_");
        const fileName = `${currentUsername}_${cleanGroupName}.png`;

        const link = document.createElement("a");
        link.href = data.contents;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        window.open(currentImageUrl, '_blank');
    }
}

// Support tombol Enter
document.getElementById("username").addEventListener("keypress", function(e) {
    if (e.key === "Enter") fetchCommunityLogo();
});
