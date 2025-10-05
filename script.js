/* =========================
   Knoovynox SPA - script.js
   (Tür + Alt Tür sistemi / Filtre entegrasyonu / Hero kategori genişletici)
   ========================= */

/* ----- Kalıcı DOM Referansları ----- */
const mainContent = document.getElementById("mainContent");
const navLinks = document.querySelectorAll(".nav-links a");

/* Profil kontrolleri (header) */
const profileContainer = document.getElementById("profileContainer");
const profileAvatar = document.getElementById("profileAvatar");
const profileMenuBtn = document.getElementById("profileMenuBtn");
const profileMenu = document.getElementById("profileMenu");
const profileViewBtn = document.getElementById("profileViewBtn");
const logoutBtn = document.getElementById("logoutBtn");
const profileModal = document.getElementById("profileModal");
const closeModal = document.getElementById("closeModal");

/* Proje detay & ödeme modalları */
const projectDetailModal = document.getElementById("projectDetailModal");
const closeProjectModal = document.getElementById("closeProjectModal");
const paymentModal = document.getElementById("paymentModal");
const closePaymentModal = document.getElementById("closePaymentModal");

/* Satın alınan projeler (profil menü) */
const purchasedProjectsBtn = document.getElementById("purchasedProjectsBtn");
const purchasedProjectDetailModal = document.getElementById("purchasedProjectDetailModal");
const closePurchasedProjectDetailModal = document.getElementById("closePurchasedProjectDetailModal");

/* ----- Tür & Alt Tür tanımları ----- */
const projectTypes = ["Web", "Mobil", "Masaüstü", "API", "Oyun", "Diğer"];

const SUBTYPES = {
  Web: ["⚛️ Frontend", "🧠 Backend", "🔧 Full-Stack", "⚡ SPA/SSR", "🛒 E-commerce"],
  Mobil: ["📱 iOS", "🤖 Android", "⚛️ React Native", "🧪 Flutter", "🧩 Kotlin/Swift"],
  Masaüstü: ["🪟 Windows", "🍎 macOS", "🐧 Linux", "⚙️ Electron", "🧰 .NET"],
  API: ["🧩 REST", "🧪 GraphQL", "⚡ WebSocket", "🔐 Auth", "📈 Analytics"],
  Oyun: ["🎯 FPS", "🗡️ RPG", "🧩 Puzzle", "🏎️ Racing", "👾 Platformer"],
  Diğer: ["🧪 Deneysel", "📦 Kütüphane", "🛠️ CLI", "🔍 Araç"]
};

/* Tür emojileri */
const typeEmoji = {
  Web: "🌐",
  Mobil: "📱",
  Masaüstü: "🖥️",
  API: "🔗",
  Oyun: "🎮",
  Diğer: "⭐"
};

/* Yardımcı fonksiyonlar: Alt tür etiketi ve emojisi */
function getSubtypeLabel(subtype) {
  return subtype.replace(/^[^\s]+\s*/, "").trim();
}

function getSubtypeEmoji(subtype) {
  return subtype.match(/^([^\s]+)/)?.[1] || "🔖";
}

/* API temel URL'si */
const apiBaseUrl = '/api/';

/* Oturum ve geçici durum */
let currentUser = null;
let currentProject = null;

/* ----- SAYFA İÇERİKLERİ (Alt Tür alanları dahil) ----- */
const pages = {
  home: `
    <section class="hero">
      <h1>Knoovynox'a Hoşgeldin!</h1>
      <p>Projelerini paylaş, keşfet ve geliştir. Geleceğin fikirleri burada hayat buluyor.</p>
      <div class="categories-section">
        <h2>Kategoriler</h2>
        <div class="categories-list">
          ${projectTypes.map(type => `
            <a href="#" class="category-card" data-type="${type}">
              ${typeEmoji[type] || "⭐"} ${type}
            </a>
          `).join("")}
        </div>
        <!-- Tıklanan kategori için genişleyen ALT TÜRLER panelini burada göstereceğiz -->
        <div id="categoryExpanderContainer" class="category-expander-container"></div>
      </div>
    </section>
  `,
  projects: `
    <section class="projects-section">
      <div class="filter-sidebar">
        <h3>Filtrele</h3>
        <form id="filterForm" novalidate>
          <label for="searchQuery">Arama</label>
          <input type="text" id="searchQuery" name="searchQuery" placeholder="Proje başlığı veya açıklaması ara" />

          <label>Proje Türü</label>
          ${projectTypes.map(type => `
            <label>
              <input type="checkbox" name="projectType" value="${type}" checked> ${type}
            </label>
          `).join("")}

          <!-- Seçilen türlere göre ALT TÜRLER buraya dinamik eklenecek -->
          <div id="subtypeFilters" class="subtype-filters"></div>

          <label for="minPrice">Min Fiyat (TL)</label>
          <input type="number" id="minPrice" name="minPrice" min="0" placeholder="Min fiyat" />
          <label for="maxPrice">Max Fiyat (TL)</label>
          <input type="number" id="maxPrice" name="maxPrice" min="0" placeholder="Max fiyat" />
          <label for="dateFilter">Yüklenme Tarihi</label>
          <select id="dateFilter" name="dateFilter">
            <option value="all">Tümü</option>
            <option value="last7days">Son 7 Gün</option>
            <option value="last30days">Son 30 Gün</option>
            <option value="last90days">Son 90 Gün</option>
          </select>
          <label for="sortBy">Sırala</label>
          <select id="sortBy" name="sortBy">
            <option value="title-asc">Başlık (A-Z)</option>
            <option value="title-desc">Başlık (Z-A)</option>
            <option value="price-asc">Fiyat (Artan)</option>
            <option value="price-desc">Fiyat (Azalan)</option>
            <option value="date-asc">Tarih (Eski-Yeni)</option>
            <option value="date-desc">Tarih (Yeni-Eski)</option>
          </select>
          <button type="submit" class="btn btn-small">Filtrele</button>
        </form>
      </div>
      <div class="projects-content">
        <h2>Projeler</h2>
        <div class="project-list" id="projectList"></div>
      </div>
    </section>
  `,
  "add-project": `
    <section>
      <h2>Proje Yükle</h2>
      <form id="addProjectForm" novalidate enctype="multipart/form-data">
        <label for="title">Proje Başlığı</label>
        <input type="text" id="title" name="title" placeholder="Proje başlığını girin" required minlength="5" />

        <label for="description">Proje Açıklaması</label>
        <textarea id="description" name="description" placeholder="Projeni detaylandır" required minlength="10"></textarea>

        <label for="price">Fiyat (TL)</label>
        <input type="number" id="price" name="price" placeholder="Fiyat girin" min="0" required />

        <label for="type">Proje Türü</label>
        <select id="type" name="type" required>
          <option value="" disabled selected>Tür seçin</option>
          ${projectTypes.map(type => `<option value="${type}">${type}</option>`).join("")}
        </select>

        <label for="subtype">Alt Tür</label>
        <select id="subtype" name="subtype" disabled required>
          <option value="" disabled selected>Önce Tür seçin</option>
        </select>

        <label for="zipFile">Zip Dosyası (.zip)</label>
        <input type="file" id="zipFile" name="zipFile" accept=".zip" required />

        <label for="imageFile">Görsel Dosyası (.png, .jpg, .jpeg)</label>
        <input type="file" id="imageFile" name="imageFile" accept=".png,.jpg,.jpeg" required />

        <button type="submit" class="btn">Projeyi Yükle</button>
        <p class="message" id="formMessage"></p>
      </form>
    </section>
  `,
  control: `
    <section class="control-projects-section" data-section="control">
      <h2>Projeleri Kontrol Et</h2>
      <div id="controlProjectList" class="project-list"></div>
    </section>
  `,
  login: `
    <section>
      <h2>Giriş Yap</h2>
      <form id="loginForm" novalidate>
        <label for="loginEmail">E-posta</label>
        <input type="text" id="loginEmail" name="loginEmail" placeholder="E-postanızı girin" required />
        <label for="loginPassword">Şifre</label>
        <input type="password" id="loginPassword" name="loginPassword" placeholder="Şifrenizi girin" required />
        <button type="submit" class="btn">Giriş Yap</button>
        <p class="message" id="loginMessage"></p>
      </form>
    </section>
  `,
  register: `
    <section>
      <h2>Kayıt Ol</h2>
      <form id="registerForm" novalidate enctype="multipart/form-data">
        <label for="registerEmail">E-posta</label>
        <input type="text" id="registerEmail" name="registerEmail" placeholder="E-postanızı girin" required />
        <label for="registerUsername">Kullanıcı Adı</label>
        <input type="text" id="registerUsername" name="registerUsername" placeholder="Kullanıcı adınızı girin" required minlength="3" />
        <label for="registerPassword">Şifre</label>
        <input type="password" id="registerPassword" name="registerPassword" placeholder="Şifrenizi girin" required minlength="6" />
        <label for="registerConfirmPassword">Şifre Tekrar</label>
        <input type="password" id="registerConfirmPassword" name="registerConfirmPassword" placeholder="Şifrenizi tekrar girin" required minlength="6" />
        <label for="registerImageFile">Profil Fotoğrafı (.png, .jpg, .jpeg)</label>
        <input type="file" id="registerImageFile" name="registerImageFile" accept=".png,.jpg,.jpeg" />
        <label for="registerAge">Yaş</label>
        <input type="number" id="registerAge" name="registerAge" min="13" max="120" placeholder="Yaşınızı girin" />
        <label for="registerBirthDate">Doğum Tarihi</label>
        <input type="date" id="registerBirthDate" name="registerBirthDate" />
        <button type="submit" class="btn">Kayıt Ol</button>
        <p class="message" id="registerMessage"></p>
      </form>
    </section>
  `,
  "purchased-projects": `
    <section class="purchased-projects-section">
      <h2>Satın Alınan Projeler</h2>
      <div id="purchasedProjectList" class="project-list"></div>
    </section>
  `,
  profile: `
    <section>
      <h2>Profil Bilgileriniz</h2>
      <form id="profileForm" novalidate enctype="multipart/form-data">
        <label for="profileEmail">E-posta</label>
        <input type="text" id="profileEmail" name="profileEmail" placeholder="E-postanızı girin" required />
        <label for="profileUsername">Kullanıcı Adı</label>
        <input type="text" id="profileUsername" name="profileUsername" placeholder="Kullanıcı adınız" minlength="3" />
        <label for="profileImageFile">Profil Fotoğrafı (.png, .jpg, .jpeg)</label>
        <input type="file" id="profileImageFile" name="profileImageFile" accept=".png,.jpg,.jpeg" />
        <label for="profileAge">Yaş</label>
        <input type="number" id="profileAge" name="profileAge" min="13" max="120" placeholder="Yaşınızı girin" />
        <label for="profileBirthDate">Doğum Tarihi</label>
        <input type="date" id="profileBirthDate" name="profileBirthDate" />
        <button type="submit" class="btn">Bilgileri Güncelle</button>
        <p class="message" id="profileMessage"></p>
      </form>
    </section>
  `
};

/* ----- SAYFA YÜKLEME ----- */
window.addEventListener("DOMContentLoaded", async () => {
  await checkSession();
  updateNavForUser();
  loadPage("home");

  // Satın alınan projeler butonu (profil menüsünde)
  if (purchasedProjectsBtn) {
    purchasedProjectsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (!currentUser) {
        alert("Satın alınan projeleri görüntülemek için lütfen önce giriş yapın.");
        loadPage("login");
        profileMenu?.classList.add("hidden");
        return;
      }
      loadPage("purchased-projects");
      profileMenu?.classList.add("hidden");
    });
  }
});

/* ----- Oturumu kontrol et ----- */
async function checkSession() {
  try {
    const checkSessionResponse = await fetch(`${apiBaseUrl}users.php`, {
      method: 'GET',
      credentials: 'same-origin'
    });
    const text = await checkSessionResponse.text();
    if (!checkSessionResponse.ok) {
      currentUser = null;
      return;
    }
    const contentType = checkSessionResponse.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      currentUser = null;
      return;
    }
    const data = JSON.parse(text);
    if (data.error) {
      currentUser = null;
      return;
    }
    if (data.user && Object.keys(data.user).length > 0) {
      currentUser = data.user;
    } else {
      currentUser = null;
    }
  } catch (error) {
    console.error('Oturum kontrol hatası:', error);
    currentUser = null;
  }
}

/* ----- Profil menü toggle & dış tık kapama ----- */
if (profileMenuBtn) {
  profileMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    profileMenu?.classList.toggle("hidden");
  });
}
document.addEventListener("click", (e) => {
  if (profileContainer && !profileContainer.contains(e.target)) {
    profileMenu?.classList.add("hidden");
  }
});

/* Profil tam sayfa görüntüleme */
if (profileViewBtn) {
  profileViewBtn.addEventListener("click", () => {
    if (currentUser) {
      loadPage("profile");
      profileMenu?.classList.add("hidden");
    } else {
      loadPage("login");
    }
  });
}

/* (Eski profil modalı kullanılmıyor, yine de güvenli kapama) */
if (closeModal) {
  closeModal.addEventListener("click", () => {
    profileModal?.classList.add("hidden");
    profileModal?.classList.remove("show");
  });
}
document.addEventListener("click", (e) => {
  if (!profileModal?.contains?.(e.target) && e.target !== profileViewBtn) {
    profileModal?.classList?.add("hidden");
    profileModal?.classList?.remove("show");
  }
});

/* ----- Proje detay modalı kapama ----- */
if (closeProjectModal) {
  closeProjectModal.addEventListener("click", () => {
    projectDetailModal?.classList.add("hidden");
    projectDetailModal?.classList.remove("show");
  });
}
document.addEventListener("click", (e) => {
  if (projectDetailModal && !projectDetailModal.contains(e.target) && !e.target.closest?.(".project-card")) {
    projectDetailModal.classList.add("hidden");
    projectDetailModal.classList.remove("show");
  }
});

/* ----- Ödeme modalı kapama ----- */
if (closePaymentModal) {
  closePaymentModal.addEventListener("click", () => {
    paymentModal?.classList.add("hidden");
    paymentModal?.classList.remove("show");
  });
}
document.addEventListener("click", (e) => {
  const buyBtn = document.getElementById("buyProjectBtn");
  if (paymentModal && !paymentModal.contains(e.target) && e.target !== buyBtn) {
    paymentModal.classList.add("hidden");
    paymentModal.classList.remove("show");
  }
});

/* ----- Satın alınan proje detay modalı kapama ----- */
if (closePurchasedProjectDetailModal) {
  closePurchasedProjectDetailModal.addEventListener("click", () => {
    purchasedProjectDetailModal?.classList.add("hidden");
    purchasedProjectDetailModal?.classList.remove("show");
  });
}
document.addEventListener("click", (e) => {
  if (purchasedProjectDetailModal && !purchasedProjectDetailModal.contains(e.target) && !e.target.closest?.(".project-card")) {
    purchasedProjectDetailModal.classList.add("hidden");
    purchasedProjectDetailModal.classList.remove("show");
  }
});

/* ----- Nav link olayları ----- */
navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const page = e.currentTarget.dataset.page; // currentTarget güvenli
    if (page) loadPage(page);
  });
});

/* ----- Kullanıcı durumuna göre nav/profil güncelle ----- */
function updateNavForUser() {
  const existingUsername = document.getElementById("profileUsername");
  if (existingUsername) existingUsername.remove();

  if (currentUser) {
    if (profileAvatar) profileAvatar.src = currentUser.image_file_url || "/assets/default-avatar.png";
    const usernameSpan = document.createElement("span");
    usernameSpan.id = "profileUsername";
    usernameSpan.className = "profile-username";
    usernameSpan.textContent = currentUser.username || `user${currentUser.id || ''}`;
    profileMenuBtn?.appendChild(usernameSpan);
    profileContainer?.classList.remove("hidden");
    const navLogin = document.getElementById("navLogin");
    const navRegister = document.getElementById("navRegister");
    if (navLogin) navLogin.style.display = "none";
    if (navRegister) navRegister.style.display = "none";
  } else {
    profileContainer?.classList.add("hidden");
    const navLogin = document.getElementById("navLogin");
    const navRegister = document.getElementById("navRegister");
    if (navLogin) navLogin.style.display = "inline";
    if (navRegister) navRegister.style.display = "inline";
  }
}

/* ----- Profil formunu doldur/bağla ----- */
function loadProfileForm() {
  const form = document.getElementById("profileForm");
  if (!form || !currentUser) return;

  form.profileEmail.value = currentUser.email || "";
  form.profileUsername.value = currentUser.username || "";
  form.profileAge.value = currentUser.age || "";
  form.profileBirthDate.value = currentUser.birth_date || "";

  form.removeEventListener("submit", handleProfileUpdate);
  form.addEventListener("submit", handleProfileUpdate);
}

/* ----- Profil güncelleme ----- */
async function handleProfileUpdate(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.profileEmail.value.trim();
  const username = (form.profileUsername.value || "").trim();
  const age = form.profileAge.value;
  const birthDate = form.profileBirthDate.value;
  const imageFile = form.profileImageFile.files[0];
  const message = document.getElementById("profileMessage");

  if (!email) {
    message.textContent = "E-posta zorunludur.";
    message.style.color = "#1E3A8A";
    return;
  }
  if (username && username.length < 3) {
    message.textContent = "Kullanıcı adı en az 3 karakter olmalı.";
    message.style.color = "#1E3A8A";
    return;
  }

  try {
    let imageData = currentUser.image_file_url;
    if (imageFile) {
      const formData = new FormData();
      formData.append('file', imageFile);
      const uploadImageResponse = await fetch(`${apiBaseUrl}upload.php`, { method: 'POST', body: formData, credentials: 'same-origin' });
      const imageText = await uploadImageResponse.text();
      if (!uploadImageResponse.ok) {
        throw new Error(`Görsel yükleme hatası: ${uploadImageResponse.status} ${uploadImageResponse.statusText}`);
      }
      const imageContentType = uploadImageResponse.headers.get('Content-Type');
      if (!imageContentType || !imageContentType.includes('application/json')) {
        throw new Error('Sunucu yanıtı geçersiz: JSON bekleniyordu.');
      }
      const imageResult = JSON.parse(imageText);
      if (imageResult.error) {
        message.textContent = imageResult.error;
        message.style.color = "#1E3A8A";
        return;
      }
      imageData = imageResult.file_url;
    }

    const payload = {
      action: 'update_profile',
      email,
      age: age ? parseInt(age) : null,
      birth_date: birthDate || null,
      image_file_url: imageData
    };
    if (username) payload.username = username;

    const updateProfileResponse = await fetch(`${apiBaseUrl}users.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'same-origin'
    });
    const updateText = await updateProfileResponse.text();
    if (!updateProfileResponse.ok) {
      throw new Error(`Profil güncelleme hatası: ${updateProfileResponse.status} ${updateProfileResponse.statusText}`);
    }
    const updateContentType = updateProfileResponse.headers.get('Content-Type');
    if (!updateContentType || !updateContentType.includes('application/json')) {
      throw new Error('Sunucu yanıtı geçersiz: JSON bekleniyordu.');
    }
    const result = JSON.parse(updateText);
    message.textContent = result.message || result.error || "Bilinmeyen hata";
    message.style.color = result.error ? "#1E3A8A" : "#000000";

    if (!result.error) {
      currentUser = {
        ...currentUser,
        email,
        username: username || currentUser.username,
        age: age || null,
        birth_date: birthDate || null,
        image_file_url: imageData
      };
      updateNavForUser();
    }
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    message.textContent = `Profil güncellenirken bir hata oluştu: ${error.message}`;
    message.style.color = "#1E3A8A";
  }
}

/* ----- Çıkış yap ----- */
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      const logoutResponse = await fetch(`${apiBaseUrl}users.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
        credentials: 'same-origin'
      });
      const logoutText = await logoutResponse.text();
      if (!logoutResponse.ok) {
        throw new Error(`Çıkış yapma hatası: ${logoutResponse.status} ${logoutResponse.statusText}`);
      }
      const logoutContentType = logoutResponse.headers.get('Content-Type');
      if (!logoutContentType || !logoutContentType.includes('application/json')) {
        throw new Error('Sunucu yanıtı geçersiz: JSON bekleniyordu.');
      }
      const result = JSON.parse(logoutText);
      if (result.error) {
        alert(result.error);
        return;
      }
      currentUser = null;
      updateNavForUser();
      loadPage("home");
    } catch (error) {
      console.error('Çıkış yapma hatası:', error);
      alert(`Çıkış yaparken bir hata oluştu: ${error.message}`);
    }
  });
}

/* =========================
   Satın Alınan Projeler
   ========================= */
async function renderPurchasedProjects() {
  const purchasedList = document.getElementById("purchasedProjectList");
  if (!purchasedList) {
    console.error('purchasedProjectList bulunamadı');
    return;
  }

  purchasedList.innerHTML = "";
  try {
    const purchasedResponse = await fetch(`${apiBaseUrl}payments.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_user_purchases' }),
      credentials: 'same-origin'
    });
    const purchasedText = await purchasedResponse.text();
    if (!purchasedResponse.ok) {
      purchasedList.innerHTML = `<p style="color:#1E3A8A;">HTTP hatası: ${purchasedResponse.status} ${purchasedResponse.statusText}</p>`;
      return;
    }
    const contentType = purchasedResponse.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      purchasedList.innerHTML = `<p style="color:#1E3A8A;">Sunucu yanıtı geçersiz: JSON bekleniyordu.</p>`;
      return;
    }
    const data = JSON.parse(purchasedText);
    if (data.error) {
      purchasedList.innerHTML = `<p style="color:#1E3A8A;">Hata: ${data.error}</p>`;
      return;
    }
    const projects = data;
    if (projects.length > 0) {
      projects.forEach((proj) => {
        const projectCard = document.createElement("article");
        projectCard.className = "project-card";
        projectCard.innerHTML = `
          <h3>${proj.title || 'Başlık Yok'}</h3>
          <p>${proj.description || 'Açıklama Yok'}</p>
          <p>
            <strong>Tür:</strong> ${proj.type || 'Tanımsız'}
            ${proj.subtype ? ` | <strong>Alt Tür:</strong> ${formatSubtypeLabel(proj.subtype)}` : ""}
            | <strong>Fiyat:</strong> ${proj.price || 0} TL
            | <strong>Satın Alma Tarihi:</strong> ${new Date(proj.purchase_date).toLocaleDateString()}
          </p>
          <p>
            ${proj.zip_file_url ? `<a href="${proj.zip_file_url}" class="download-link" download="${proj.zip_file_name || 'project.zip'}">Zip Dosyasını İndir</a>` : "Dosya Yok"}
          </p>
          <img src="${proj.image_file_url || "/assets/default-project.png"}" alt="${proj.title || 'Proje'}" class="project-image" />
        `;
        projectCard.addEventListener("click", () => openPurchasedProjectDetail(proj));
        purchasedList.appendChild(projectCard);
      });
    } else {
      purchasedList.innerHTML = "<p>Henüz satın alınmış proje yok.</p>";
    }
  } catch (error) {
    console.error('Satın alınan projeleri yükleme hatası:', error);
    purchasedList.innerHTML = `<p style="color:#1E3A8A;">Projeler yüklenirken bir hata oluştu: ${error.message}</p>`;
  }
}

function openPurchasedProjectDetail(proj) {
  const purchasedProjectContent = document.getElementById("purchasedProjectDetailContent");
  if (!purchasedProjectContent) {
    console.error('purchasedProjectDetailContent bulunamadı');
    return;
  }
  purchasedProjectContent.innerHTML = `
    <h2>${proj.title || 'Başlık Yok'}</h2>
    <p><strong>Açıklama:</strong> ${proj.description || 'Açıklama Yok'}</p>
    <p><strong>Tür:</strong> ${proj.type || 'Tanımsız'}</p>
    ${proj.subtype ? `<p><strong>Alt Tür:</strong> ${formatSubtypeLabel(proj.subtype)}</p>` : ""}
    <p><strong>Fiyat:</strong> ${proj.price || 0} TL</p>
    <p><strong>Satın Alma Tarihi:</strong> ${new Date(proj.purchase_date).toLocaleDateString()}</p>
    <p>
      ${proj.zip_file_url ? `<a href="${proj.zip_file_url}" class="download-link" download="${proj.zip_file_name || 'project.zip'}">Zip Dosyasını İndir</a>` : "Dosya Yok"}
    </p>
    <img src="${proj.image_file_url || "/assets/default-project.png"}" alt="${proj.title || 'Proje'}" class="project-image" />
  `;
  purchasedProjectDetailModal.classList.remove("hidden");
  purchasedProjectDetailModal.classList.add("show");
}

/* =========================
   Yardımcılar (Alt Tür etiketleme & UI)
   ========================= */
function formatSubtypeLabel(sub) {
  return `${getSubtypeEmoji(sub)} ${getSubtypeLabel(sub)}`;
}

/* Alt tür select doldurma (Add/Edit formları) */
function populateSubtypeSelect(selectEl, typeValue, preset = null) {
  if (!selectEl) return;
  const options = SUBTYPES[typeValue] || [];
  selectEl.innerHTML = "";
  if (options.length === 0) {
    selectEl.disabled = true;
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Bu tür için alt tür yok";
    opt.disabled = true;
    opt.selected = true;
    selectEl.appendChild(opt);
    return;
  }
  selectEl.disabled = false;
  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = "Alt tür seçin";
  ph.disabled = true;
  ph.selected = !preset;
  selectEl.appendChild(ph);

  options.forEach(sub => {
    const o = document.createElement("option");
    o.value = getSubtypeLabel(sub); // Sadece metin kısmı
    o.textContent = `${formatSubtypeLabel(sub)}`;
    if (preset && getSubtypeLabel(preset) === getSubtypeLabel(sub)) o.selected = true;
    selectEl.appendChild(o);
  });
}
/* Seçili tür checkbox'larına göre alt tür filtre UI'si üret */
function buildSubtypeFilterUI() {
  const form = document.getElementById("filterForm");
  const container = document.getElementById("subtypeFilters");
  if (!form || !container) return;

  const selectedTypes = Array.from(form.querySelectorAll('input[name="projectType"]:checked'))
    .map(i => i.value);

  // localStorage'dan seçilen alt türü al
  const selectedSubtype = localStorage.getItem("selectedSubtype");

  // Boşalt
  container.innerHTML = "";

  // Seçili tür yoksa alt tür filtre göstermeyelim
  if (selectedTypes.length === 0) return;

  // Her tür için blok
  selectedTypes.forEach(type => {
    const subs = SUBTYPES[type] || [];
    if (subs.length === 0) return;

    const block = document.createElement("div");
    block.className = "subtype-block";
    block.dataset.type = type;

    const title = document.createElement("div");
    title.className = "subtype-block-title";
    title.textContent = `${typeEmoji[type] || "⭐"} ${type} - Alt Türler`;
    block.appendChild(title);

    const list = document.createElement("div");
    list.className = "subtype-block-list";

    subs.forEach(sub => {
      const id = `subtype_${type}_${getSubtypeLabel(sub).replace(/\s+/g, "_")}`;
      const label = document.createElement("label");
      label.setAttribute("for", id);

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.name = "projectSubtype";
      cb.value = getSubtypeLabel(sub); // Sadece metin kısmı
      cb.id = id;
      cb.checked = (getSubtypeLabel(sub) === getSubtypeLabel(selectedSubtype || ""));

      const txt = document.createElement("span");
      txt.textContent = `${formatSubtypeLabel(sub)}`;

      label.appendChild(cb);
      label.appendChild(txt);
      list.appendChild(label);
    });

    block.appendChild(list);
    container.appendChild(block);
  });
}

/* Kategori genişleticiyi oluştur ve yerleştir (Ana sayfa) */
function createCategoryExpander(type) {
  // Bu fonksiyon artık kullanılmıyor, .category-card içinde işleniyor
}

/* =========================
   SAYFA YÜKLEME & KANCALAR
   ========================= */
function loadPage(page) {
  profileMenu?.classList.add("hidden");
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.page === page);
  });
  mainContent.innerHTML = pages[page] || "<h2>Sayfa bulunamadı</h2>";

  // Projeler sayfası
  if (page === "projects") {
    const filterForm = document.getElementById("filterForm");
    if (filterForm) {
      // Tür checkbox değişince alt tür UI'sini güncelle
      filterForm.querySelectorAll('input[name="projectType"]').forEach(cb => {
        cb.addEventListener("change", buildSubtypeFilterUI);
      });

      // İlk yüklemede alt tür UI
      buildSubtypeFilterUI();

      filterForm.removeEventListener("submit", handleFilterProjects);
      filterForm.addEventListener("submit", handleFilterProjects);
      renderProjects();
    }
  }

  // Kontrol sayfası
  if (page === "control") {
    if (currentUser) {
      renderControlProjects();
    } else {
      mainContent.innerHTML = `<p style="color:#1E3A8A; font-weight:700; text-align:center;">Projeleri kontrol etmek için giriş yapmalısınız.</p>`;
    }
  }

  // Proje yükle sayfası
  if (page === "add-project") {
    if (!currentUser) {
      mainContent.innerHTML = `<p style="color:#1E3A8A; font-weight:700; text-align:center;">Projeyi yüklemek için giriş yapmalısınız.</p>`;
      return;
    }
    const addProjectForm = document.getElementById("addProjectForm");
    if (addProjectForm) {
      // Tür → Alt Tür select bağlama
      const typeSel = addProjectForm.querySelector("#type");
      const subSel  = addProjectForm.querySelector("#subtype");
      if (typeSel && subSel) {
        typeSel.addEventListener("change", () => {
          const val = typeSel.value;
          populateSubtypeSelect(subSel, val);
        });
      }
      addProjectForm.removeEventListener("submit", handleAddProject);
      addProjectForm.addEventListener("submit", handleAddProject);
    }
  }

  // Login sayfası
  if (page === "login") {
    if (currentUser) {
      loadPage("home");
      return;
    }
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.removeEventListener("submit", handleLogin);
      loginForm.addEventListener("submit", handleLogin);
    }
  }

  // Register sayfası
  if (page === "register") {
    if (currentUser) {
      loadPage("home");
      return;
    }
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
      registerForm.removeEventListener("submit", handleRegister);
      registerForm.addEventListener("submit", handleRegister);
    }
  }

  // Satın alınan projeler sayfası
  if (page === "purchased-projects") {
    if (!currentUser) {
      mainContent.innerHTML = `<p style="color:#1E3A8A; font-weight:700; text-align:center;">Satın alınan projeleri görüntülemek için giriş yapmalısınız.</p>`;
      return;
    }
    renderPurchasedProjects();
  }

  // Profil sayfası
  if (page === "profile") {
    if (!currentUser) {
      mainContent.innerHTML = `<p style="color:#1E3A8A; font-weight:700; text-align:center;">Profil bilgilerinizi görüntülemek için giriş yapmalısınız.</p>`;
      return;
    }
    loadProfileForm();
  }

  // Ana sayfa: Kategori kartları için olay dinleyicileri
  if (page === "home") {
    document.querySelectorAll(".category-card").forEach(card => {
      card.addEventListener("click", (e) => {
        e.preventDefault();

        // varsa açık paneli kapat
        document.querySelectorAll(".category-card.is-open").forEach(c => {
          c.classList.remove("is-open");
          c.querySelector(".subtype-panel")?.remove();
        });

        // bu kartı aç
        card.classList.add("is-open");
        const label = card.textContent.trim().replace(/\s+/g, " ");
        const key = Object.keys(SUBTYPES).find(k => label.includes(k)) || "Diğer";
        const chips = (SUBTYPES[key] || [])
          .map(t => `<button class="chip" data-type="${key}" data-subtype="${t}">${t}</button>`).join("");

        const panel = document.createElement("div");
        panel.className = "subtype-panel";
        panel.innerHTML = `
          <div class="subtype-title">${label} — Alt Türler</div>
          <div class="chips">${chips}</div>
          <div class="note">Bir alt tür seçtiğinde Projeler'e filtre uygulanır.</div>
        `;
        card.appendChild(panel);

        // Chip tıklanınca
        panel.addEventListener("click", (ev) => {
          const chip = ev.target.closest(".chip");
          if (!chip) return;
          const type = chip.dataset.type;
          const subtype = chip.dataset.subtype;
          // Tür ve alt türü localStorage'a kaydet
          localStorage.setItem("selectedType", type);
          localStorage.setItem("selectedSubtype", subtype);
          loadPage("projects");
        });

        // Kart dışına tıklayınca paneli kapat
        const closeOnOutside = (ev) => {
          if (card.contains(ev.target)) return;
          card.classList.remove("is-open");
          panel.remove();
          document.removeEventListener("click", closeOnOutside, true);
        };
        document.addEventListener("click", closeOnOutside, true);
      });
    });
  }

  mainContent.focus();
}
/* =========================
   Giriş yapma
   ========================= */
async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.loginEmail.value.trim();
  const password = form.loginPassword.value;
  const message = document.getElementById("loginMessage");

  if (!email || !password) {
    message.textContent = "E-posta ve şifre zorunludur.";
    message.style.color = "#1E3A8A";
    return;
  }

  try {
    const loginResponse = await fetch(`${apiBaseUrl}users.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password }),
      credentials: 'same-origin'
    });
    const loginText = await loginResponse.text();
    if (!loginResponse.ok) {
      throw new Error(`Giriş yapma hatası: ${loginResponse.status} ${loginResponse.statusText}`);
    }
    const loginContentType = loginResponse.headers.get('Content-Type');
    if (!loginContentType || !loginContentType.includes('application/json')) {
      throw new Error('Sunucu yanıtı geçersiz: JSON bekleniyordu.');
    }
    const result = JSON.parse(loginText);
    message.textContent = result.message || result.error || "Bilinmeyen hata";
    message.style.color = result.error ? "#1E3A8A" : "#000000";
    if (!result.error) {
      currentUser = result.user;
      updateNavForUser();
      form.reset();
      setTimeout(() => loadPage("home"), 700);
    }
  } catch (error) {
    console.error('Giriş yapma hatası:', error);
    message.textContent = `Giriş yaparken bir hata oluştu: ${error.message}`;
    message.style.color = "#1E3A8A";
  }
}

/* =========================
   Kayıt olma
   ========================= */
async function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.registerEmail.value.trim();
  const username = form.registerUsername.value.trim();
  const password = form.registerPassword.value;
  const confirmPassword = form.registerConfirmPassword.value;
  const age = form.registerAge.value;
  const birthDate = form.registerBirthDate.value;
  const imageFile = form.registerImageFile.files[0];
  const message = document.getElementById("registerMessage");

  if (!email || !username || !password || !confirmPassword) {
    message.textContent = "E-posta, kullanıcı adı ve şifre zorunludur.";
    message.style.color = "#1E3A8A";
    return;
  }
  if (password !== confirmPassword) {
    message.textContent = "Şifreler eşleşmiyor.";
    message.style.color = "#1E3A8A";
    return;
  }
  if (username.length < 3) {
    message.textContent = "Kullanıcı adı en az 3 karakter olmalı.";
    message.style.color = "#1E3A8A";
    return;
  }
  if (password.length < 6) {
    message.textContent = "Şifre en az 6 karakter olmalı.";
    message.style.color = "#1E3A8A";
    return;
  }

  try {
    let imageData = "/assets/default-avatar.png";
    if (imageFile) {
      const formData = new FormData();
      formData.append('file', imageFile);
      const uploadImageResponse = await fetch(`${apiBaseUrl}upload.php`, { method: 'POST', body: formData, credentials: 'same-origin' });
      const imageText = await uploadImageResponse.text();
      if (!uploadImageResponse.ok) {
        throw new Error(`Görsel yükleme hatası: ${uploadImageResponse.status} ${uploadImageResponse.statusText}`);
      }
      const imageContentType = uploadImageResponse.headers.get('Content-Type');
      if (!imageContentType || !imageContentType.includes('application/json')) {
        throw new Error('Sunucu yanıtı geçersiz: JSON bekleniyordu.');
      }
      const imageResult = JSON.parse(imageText);
      if (imageResult.error) {
        message.textContent = imageResult.error;
        message.style.color = "#1E3A8A";
        return;
      }
      imageData = imageResult.file_url;
    }

    const registerResponse = await fetch(`${apiBaseUrl}users.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'register',
        email,
        username,
        password,
        age: age ? parseInt(age) : null,
        birth_date: birthDate || null,
        image_file_url: imageData
      }),
      credentials: 'same-origin'
    });
    const registerText = await registerResponse.text();
    if (!registerResponse.ok) {
      throw new Error(`Kayıt olma hatası: ${registerResponse.status} ${registerResponse.statusText}`);
    }
    const registerContentType = registerResponse.headers.get('Content-Type');
    if (!registerContentType || !registerContentType.includes('application/json')) {
      throw new Error('Sunucu yanıtı geçersiz: JSON bekleniyordu.');
    }
    const result = JSON.parse(registerText);
    message.textContent = result.message || result.error || "Bilinmeyen hata";
    message.style.color = result.error ? "#1E3A8A" : "#000000";
    if (!result.error) {
      form.reset();
      setTimeout(() => loadPage("login"), 700);
    }
  } catch (error) {
    console.error('Kayıt olma hatası:', error);
    message.textContent = `Kayıt olurken bir hata oluştu: ${error.message}`;
    message.style.color = "#1E3A8A";
  }
}

/* =========================
   Projeleri listele (Filtre + Alt Tür)
   ========================= */
async function renderProjects() {
  const list = document.getElementById("projectList");
  const form = document.getElementById("filterForm");
  if (!list || !form) return;

  const searchQuery = form.searchQuery.value.trim().toLowerCase();
  const selectedTypes = Array.from(form.querySelectorAll('input[name="projectType"]:checked')).map(input => input.value);
  const subtypeInputs = Array.from(form.querySelectorAll('input[name="projectSubtype"]'));
  const selectedSubtypes = subtypeInputs.filter(i => i.checked).map(i => getSubtypeLabel(i.value));
  const minPrice = parseFloat(form.minPrice.value) || 0;
  const maxPrice = parseFloat(form.maxPrice.value) || Infinity;
  const dateFilter = form.dateFilter.value;
  const sortBy = form.sortBy.value;

  try {
    // API çağrısına tür ve alt tür filtreleri ekle
    const params = new URLSearchParams();
    if (selectedTypes.length > 0) {
      params.append("types", selectedTypes.join(","));
    }
    if (selectedSubtypes.length > 0) {
      params.append("subtypes", selectedSubtypes.join(","));
    }
    const url = `${apiBaseUrl}projects.php?${params.toString()}`;

    const projectsResponse = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const text = await projectsResponse.text();
    if (!projectsResponse.ok) {
      list.innerHTML = `<p style="color:#1E3A8A;">HTTP hatası: ${projectsResponse.status} ${projectsResponse.statusText}</p>`;
      return;
    }
    const contentType = projectsResponse.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      list.innerHTML = `<p style="color:#1E3A8A;">Sunucu yanıtı geçersiz: JSON bekleniyordu.</p>`;
      return;
    }
    const data = JSON.parse(text);
    if (data.error) {
      list.innerHTML = `<p style="color:#1E3A8A;">Hata: ${data.error}</p>`;
      return;
    }
    let projects = data;

    // İstemci tarafı filtreleme (arama, fiyat, tarih)
    if (searchQuery) {
      projects = projects.filter(proj =>
        (proj.title?.toLowerCase().includes(searchQuery) ||
         proj.description?.toLowerCase().includes(searchQuery))
      );
    }

    if (minPrice || maxPrice < Infinity) {
      projects = projects.filter(proj =>
        (proj.price ?? 0) >= minPrice && (proj.price ?? 0) <= maxPrice
      );
    }

    if (dateFilter !== "all") {
      const now = new Date();
      let cutoffDate = null;
      switch (dateFilter) {
        case "last7days":
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "last30days":
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "last90days":
          cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
      }
      if (cutoffDate) {
        projects = projects.filter(proj => new Date(proj.created_at) >= cutoffDate);
      }
    }

    // Sıralama
    projects = projects.sort((a, b) => {
      switch (sortBy) {
        case "title-asc":
          return (a.title || '').localeCompare(b.title || '');
        case "title-desc":
          return (b.title || '').localeCompare(a.title || '');
        case "price-asc":
          return (a.price || 0) - (b.price || 0);
        case "price-desc":
          return (b.price || 0) - (a.price || 0);
        case "date-asc":
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        case "date-desc":
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        default:
          return 0;
      }
    });

    // Render
    list.innerHTML = "";
    if (projects.length > 0) {
      projects.forEach(proj => {
        const card = document.createElement("article");
        card.className = "project-card";
        card.tabIndex = 0;
        card.innerHTML = `
          <h3>${proj.title || 'Başlık Yok'}</h3>
          <p>${proj.description || 'Açıklama Yok'}</p>
          <p>
            <strong>Tür:</strong> ${proj.type || 'Tanımsız'}
            ${proj.subtype ? ` | <strong>Alt Tür:</strong> ${formatSubtypeLabel(proj.subtype)}` : ""}
            | <strong>Fiyat:</strong> ${proj.price || 0} TL
            | <strong>Yükleyen:</strong> ${proj.username || 'Bilinmiyor'}
          </p>
          <img src="${proj.image_file_url || "/assets/default-project.png"}" alt="${proj.title || 'Proje'}" class="project-image" />
        `;
        card.addEventListener("click", () => openProjectDetail(proj));
        list.appendChild(card);
      });
    } else {
      list.innerHTML = "<p>Seçilen kriterlere uygun proje bulunamadı.</p>";
    }
  } catch (error) {
    console.error('Projeleri yükleme hatası:', error);
    list.innerHTML = `<p style="color:#1E3A8A;">Projeler yüklenirken bir hata oluştu: ${error.message}</p>`;
  }
}

/* =========================
   Proje detay + Satın alma akışı
   ========================= */
function openProjectDetail(proj) {
  currentProject = proj;
  const projectDetailContent = document.getElementById("projectDetailContent");
  if (!projectDetailContent) return;

  projectDetailContent.innerHTML = `
    <h2>${proj.title || 'Başlık Yok'}</h2>
    <p><strong>Açıklama:</strong> ${proj.description || 'Açıklama Yok'}</p>
    <p><strong>Tür:</strong> ${proj.type || 'Tanımsız'}</p>
    ${proj.subtype ? `<p><strong>Alt Tür:</strong> ${formatSubtypeLabel(proj.subtype)}</p>` : ""}
    <p><strong>Fiyat:</strong> ${proj.price || 0} TL</p>
    <p><strong>Yükleyen:</strong> ${proj.username || 'Bilinmiyor'}</p>
    <p class="download-note">Zip dosyası buradan erişilemez. Projeyi satın aldıktan sonra Satın Alınan Projeler kısmından erişebilirsiniz.</p>
    <img src="${proj.image_file_url || "/assets/default-project.png"}" alt="${proj.title || 'Proje'}" class="project-image" />
  `;

  projectDetailModal?.classList.remove("hidden");
  projectDetailModal?.classList.add("show");

  const buyProjectBtn = document.getElementById("buyProjectBtn");
  if (buyProjectBtn) {
    buyProjectBtn.removeEventListener("click", handleBuyProject);
    buyProjectBtn.addEventListener("click", handleBuyProject);
  }
}

function handleBuyProject() {
  if (!currentUser) {
    alert("Satın almak için giriş yapmalısınız.");
    loadPage("login");
    return;
  }
  if (!currentProject) {
    alert("Proje seçilmedi.");
    return;
  }
  if (currentUser.id === currentProject.user_id) {
    alert("Kendi projenizi satın alamazsınız.");
    return;
  }

  paymentModal?.classList.remove("hidden");
  paymentModal?.classList.add("show");

  const paymentForm = document.getElementById("paymentForm");
  if (paymentForm) {
    paymentForm.removeEventListener("submit", handlePayment);
    paymentForm.addEventListener("submit", handlePayment);
  }
}

async function handlePayment(e, projectId, price) {
  e.preventDefault();
  const form = e.target;
  const cardNumber = form.cardNumber.value.trim();
  const cardExpiry = form.cardExpiry.value.trim();
  const cardCvc = form.cardCvc.value.trim();
  const message = document.getElementById("paymentMessage");

  if (!/^\d{16}$/.test(cardNumber)) {
    message.textContent = "Geçerli bir kart numarası girin.";
    message.style.color = "red";
    return;
  }
  if (!/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(cardExpiry)) {
    message.textContent = "Geçerli bir son kullanma tarihi girin (MM/YY).";
    message.style.color = "red";
    return;
  }
  if (!/^\d{3}$/.test(cardCvc)) {
    message.textContent = "Geçerli bir 3 haneli CVC girin.";
    message.style.color = "red";
    return;
  }

  try {
    const res = await fetch(`${apiBaseUrl}payments.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        action: "add_payment",
        project_id: projectId,
        amount: price,
        card_number: cardNumber,
        card_expiry: cardExpiry,
        card_cvc: cardCvc
      }),
    });

    const data = await res.json();
    if (data.error) {
      message.textContent = "Hata: " + data.error;
      message.style.color = "red";
      return;
    }

    message.textContent = "Ödeme başarılı!";
    message.style.color = "green";
    form.reset();

    setTimeout(() => {
      document.getElementById("paymentModal").classList.add("hidden");
      loadPage("purchased-projects"); // satın alınan projelere yönlendir
    }, 1200);
  } catch (err) {
    message.textContent = "Sunucu hatası: " + err.message;
    message.style.color = "red";
  }
}

/* =========================
   Filtreleme (validasyon + tetikleme)
   ========================= */
function handleFilterProjects(e) {
  e.preventDefault();
  const form = e.target;
  const selectedTypes = Array.from(form.querySelectorAll('input[name="projectType"]:checked')).map(i => i.value);
  const minPrice = parseFloat(form.minPrice.value);
  const maxPrice = parseFloat(form.maxPrice.value);

  let msg = form.querySelector(".message.filter-message");
  if (!msg) {
    msg = document.createElement("p");
    msg.className = "message filter-message";
    form.appendChild(msg);
  }

  if (selectedTypes.length === 0) {
    msg.textContent = "En az bir proje türü seçmelisiniz.";
    msg.style.color = "#1E3A8A";
    return;
  }
  if (!Number.isNaN(minPrice) && !Number.isNaN(maxPrice) && minPrice > maxPrice) {
    msg.textContent = "Minimum fiyat, maksimum fiyattan büyük olamaz.";
    msg.style.color = "#1E3A8A";
    return;
  }

  msg.textContent = "";
  renderProjects();
}

/* =========================
   Proje ekleme (Alt Tür destekli)
   ========================= */
async function handleAddProject(e) {
  e.preventDefault();
  const form = e.target;
  const title = form.title.value.trim();
  const description = form.description.value.trim();
  const price = parseFloat(form.price.value);
  const type = form.type.value;
  const subtypeSel = form.querySelector("#subtype");
  const subtype = subtypeSel ? (getSubtypeLabel(subtypeSel.value) || null) : null;
  const zipFile = form.zipFile.files[0];
  const imageFile = form.imageFile.files[0];
  const message = document.getElementById("formMessage");

  if (title.length < 5) {
    message.textContent = "Proje başlığı en az 5 karakter olmalı.";
    message.style.color = "#1E3A8A";
    return;
  }
  if (description.length < 10) {
    message.textContent = "Proje açıklaması en az 10 karakter olmalı.";
    message.style.color = "#1E3A8A";
    return;
  }
  if (!type) {
    message.textContent = "Lütfen bir proje türü seçin.";
    message.style.color = "#1E3A8A";
    return;
  }
  if (!zipFile || !imageFile) {
    message.textContent = "Lütfen hem zip hem de görsel dosyası yükleyin.";
    message.style.color = "#1E3A8A";
    return;
  }

  try {
    // ZIP yükle
    const fdZip = new FormData();
    fdZip.append('file', zipFile);
    const uploadZipResponse = await fetch(`${apiBaseUrl}upload.php`, { method: 'POST', body: fdZip, credentials: 'same-origin' });
    const zipText = await uploadZipResponse.text();
    if (!uploadZipResponse.ok) throw new Error(`Zip yükleme hatası: ${uploadZipResponse.status} ${uploadZipResponse.statusText}`);
    const zipCT = uploadZipResponse.headers.get('Content-Type');
    if (!zipCT || !zipCT.includes('application/json')) throw new Error('Sunucu yanıtı geçersiz: JSON bekleniyordu.');
    const zipResult = JSON.parse(zipText);
    if (zipResult.error) { message.textContent = zipResult.error; message.style.color = "#1E3A8A"; return; }

    // Görsel yükle
    const fdImg = new FormData();
    fdImg.append('file', imageFile);
    const uploadImageResponse = await fetch(`${apiBaseUrl}upload.php`, { method: 'POST', body: fdImg, credentials: 'same-origin' });
    const imageText = await uploadImageResponse.text();
    if (!uploadImageResponse.ok) throw new Error(`Görsel yükleme hatası: ${uploadImageResponse.status} ${uploadImageResponse.statusText}`);
    const imgCT = uploadImageResponse.headers.get('Content-Type');
    if (!imgCT || !imgCT.includes('application/json')) throw new Error('Sunucu yanıtı geçersiz: JSON bekleniyordu.');
    const imageResult = JSON.parse(imageText);
    if (imageResult.error) { message.textContent = imageResult.error; message.style.color = "#1E3A8A"; return; }

    // Projeyi ekle
    const addProjectResponse = await fetch(`${apiBaseUrl}projects.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        title,
        description,
        price,
        type,
        subtype,
        zip_file_url: zipResult.file_url,
        zip_file_name: zipResult.file_name,
        image_file_url: imageResult.file_url
      }),
      credentials: 'same-origin'
    });
    const addProjectText = await addProjectResponse.text();
    if (!addProjectResponse.ok) throw new Error(`Proje ekleme hatası: ${addProjectResponse.status} ${addProjectResponse.statusText}`);
    const addCT = addProjectResponse.headers.get('Content-Type');
    if (!addCT || !addCT.includes('application/json')) throw new Error('Sunucu yanıtı geçersiz: JSON bekleniyordu.');
    const result = JSON.parse(addProjectText);

    message.textContent = result.message || result.error || "Bilinmeyen hata";
    message.style.color = result.error ? "#1E3A8A" : "#000000";
    if (!result.error) {
      form.reset();
      setTimeout(() => loadPage("projects"), 1000);
    }
  } catch (error) {
    console.error('Proje ekleme hatası:', error);
    message.textContent = `Proje yüklenirken bir hata oluştu: ${error.message}`;
    message.style.color = "#1E3A8A";
  }
}

/* =========================
   Projeleri kontrol et (sadece kullanıcının projeleri)
   ========================= */
async function renderControlProjects() {
  const controlDiv = document.getElementById("controlProjectList");
  if (!controlDiv) return;

  controlDiv.innerHTML = "";
  try {
    const resp = await fetch(`${apiBaseUrl}projects.php`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const text = await resp.text();
    if (!resp.ok) throw new Error(`HTTP hatası: ${resp.status} ${resp.statusText}`);
    const ct = resp.headers.get('Content-Type');
    if (!ct || !ct.includes('application/json')) throw new Error('Sunucu yanıtı geçersiz: JSON bekleniyordu.');
    const data = JSON.parse(text);
    if (data.error) { controlDiv.innerHTML = `<p style="color:#1E3A8A;">Hata: ${data.error}</p>`; return; }

    const userProjects = (data || []).filter(p => p.user_id === currentUser?.id);

    if (userProjects.length > 0) {
      userProjects.forEach((proj) => {
        const el = document.createElement("article");
        el.className = "project-card";
        el.innerHTML = `
          <h3>${proj.title || 'Başlık Yok'}</h3>
          <p>${proj.description || 'Açıklama Yok'}</p>
          <p>
            <strong>Tür:</strong> ${proj.type || 'Tanımsız'}
            ${proj.subtype ? ` | <strong>Alt Tür:</strong> ${formatSubtypeLabel(proj.subtype)}` : ""}
            | <strong>Fiyat:</strong> ${proj.price || 0} TL
            | <strong>Yükleyen:</strong> ${proj.username || 'Bilinmiyor'}
          </p>
          <img src="${proj.image_file_url || "/assets/default-project.png"}" alt="${proj.title || 'Proje'}" class="project-image" />
          <div class="actions" style="margin-top: 1.75rem;">
            <button class="edit-btn btn" data-index="${proj.id}">Değiştir</button>
            <button class="delete-btn btn" data-index="${proj.id}" style="margin-left: 0.75rem;">Sil</button>
          </div>
        `;
        controlDiv.appendChild(el);
      });

      controlDiv.querySelectorAll(".edit-btn").forEach(btn =>
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.index;
          openEditProject(id);
        })
      );
      controlDiv.querySelectorAll(".delete-btn").forEach(btn =>
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.index;
          deleteProject(id);
        })
      );
    } else {
      controlDiv.innerHTML = "<p>Henüz yüklenmiş proje yok.</p>";
    }
  } catch (error) {
    console.error('Projeleri kontrol etme hatası:', error);
    controlDiv.innerHTML = `<p style="color:#1E3A8A;">Projeler yüklenirken bir hata oluştu: ${error.message}</p>`;
  }
}

/* =========================
   Sil
   ========================= */
async function deleteProject(id) {
  if (!confirm("Bu projeyi silmek istediğinize emin misiniz?")) return;
  try {
    const resp = await fetch(`${apiBaseUrl}projects.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
      credentials: 'same-origin'
    });
    const text = await resp.text();
    if (!resp.ok) throw new Error(`Proje silme hatası: ${resp.status} ${resp.statusText}`);
    const ct = resp.headers.get('Content-Type');
    if (!ct || !ct.includes('application/json')) throw new Error('Sunucu yanıtı geçersiz: JSON bekleniyordu.');
    const result = JSON.parse(text);
    if (result.error) { alert(result.error); return; }
    renderControlProjects();
  } catch (error) {
    console.error('Proje silme hatası:', error);
    alert(`Proje silinirken bir hata oluştu: ${error.message}`);
  }
}

/* =========================
   Düzenleme: formu aç (Alt Tür destekli)
   ========================= */
async function openEditProject(id) {
  try {
    const resp = await fetch(`${apiBaseUrl}projects.php`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const text = await resp.text();
    if (!resp.ok) throw new Error(`HTTP hatası: ${resp.status} ${resp.statusText}`);
    const ct = resp.headers.get('Content-Type');
    if (!ct || !ct.includes('application/json')) throw new Error('Sunucu yanıtı geçersiz: JSON bekleniyordu.');
    const data = JSON.parse(text);
    if (data.error) { mainContent.innerHTML = `<p style="color:#1E3A8A;">Hata: ${data.error}</p>`; return; }

    const proj = (data || []).find(p => p.id == id);
    if (!proj) { mainContent.innerHTML = "<p>Proje bulunamadı.</p>"; return; }

    mainContent.innerHTML = `
      <section>
        <h2>Proje Güncelle</h2>
        <form id="editProjectForm" novalidate enctype="multipart/form-data">
          <label for="editTitle">Proje Başlığı</label>
          <input type="text" id="editTitle" name="editTitle" value="${proj.title || ''}" required minlength="5" />
          <label for="editDescription">Proje Açıklaması</label>
          <textarea id="editDescription" name="editDescription" required minlength="10">${proj.description || ''}</textarea>
          <label for="editPrice">Fiyat (TL)</label>
          <input type="number" id="editPrice" name="editPrice" value="${proj.price || 0}" min="0" required />
          <label for="editType">Proje Türü</label>
          <select id="editType" name="editType" required>
            <option value="" disabled>Tür seçin</option>
            ${projectTypes.map(type => `<option value="${type}" ${proj.type === type ? 'selected' : ''}>${type}</option>`).join("")}
          </select>
          <label for="editSubtype">Alt Tür</label>
          <select id="editSubtype" name="editSubtype" disabled>
            <option value="" disabled selected>Önce Tür seçin</option>
          </select>
          <label for="editZipFile">Zip Dosyası (.zip)</label>
          <input type="file" id="editZipFile" name="editZipFile" accept=".zip" />
          <label for="editImageFile">Görsel Dosyası (.png, .jpg, .jpeg)</label>
          <input type="file" id="editImageFile" name="editImageFile" accept=".png,.jpg,.jpeg" />
          <button type="submit" class="btn">Projeyi Güncelle</button>
          <p class="message" id="editFormMessage"></p>
        </form>
      </section>
    `;

    const editForm = document.getElementById("editProjectForm");
    if (editForm) {
      const typeSel = editForm.querySelector("#editType");
      const subSel = editForm.querySelector("#editSubtype");
      if (typeSel && subSel) {
        populateSubtypeSelect(subSel, proj.type, proj.subtype);
        typeSel.addEventListener("change", () => {
          const val = typeSel.value;
          populateSubtypeSelect(subSel, val);
        });
      }
      editForm.removeEventListener("submit", handleEditProject);
      editForm.addEventListener("submit", (e) => handleEditProject(e, id));
    }
  } catch (error) {
    console.error('Proje düzenleme formu yükleme hatası:', error);
    mainContent.innerHTML = `<p style="color:#1E3A8A;">Proje yüklenirken bir hata oluştu: ${error.message}</p>`;
  }
}

/* =========================
   Proje güncelleme
   ========================= */
async function handleEditProject(e, id) {
  e.preventDefault();
  const form = e.target;
  const title = form.editTitle.value.trim();
  const description = form.editDescription.value.trim();
  const price = parseFloat(form.editPrice.value);
  const type = form.editType.value;
  const subtype = form.editSubtype ? (getSubtypeLabel(form.editSubtype.value) || null) : null;
  const zipFile = form.editZipFile.files[0];
  const imageFile = form.editImageFile.files[0];
  const message = document.getElementById("editFormMessage");

  if (title.length < 5) {
    message.textContent = "Proje başlığı en az 5 karakter olmalı.";
    message.style.color = "#1E3A8A";
    return;
  }
  if (description.length < 10) {
    message.textContent = "Proje açıklaması en az 10 karakter olmalı.";
    message.style.color = "#1E3A8A";
    return;
  }
  if (!type) {
    message.textContent = "Lütfen bir proje türü seçin.";
    message.style.color = "#1E3A8A";
    return;
  }

  try {
    let zipData = null;
    if (zipFile) {
      const fdZip = new FormData();
      fdZip.append('file', zipFile);
      const uploadZipResponse = await fetch(`${apiBaseUrl}upload.php`, { method: 'POST', body: fdZip, credentials: 'same-origin' });
      const zipText = await uploadZipResponse.text();
      if (!uploadZipResponse.ok) throw new Error(`Zip yükleme hatası: ${uploadZipResponse.status} ${uploadZipResponse.statusText}`);
      const zipCT = uploadZipResponse.headers.get('Content-Type');
      if (!zipCT || !zipCT.includes('application/json')) throw new Error('Sunucu yanıtı geçersiz: JSON bekleniyordu.');
      const zipResult = JSON.parse(zipText);
      if (zipResult.error) { message.textContent = zipResult.error; message.style.color = "#1E3A8A"; return; }
      zipData = zipResult;
    }

    let imageData = null;
    if (imageFile) {
      const fdImg = new FormData();
      fdImg.append('file', imageFile);
      const uploadImageResponse = await fetch(`${apiBaseUrl}upload.php`, { method: 'POST', body: fdImg, credentials: 'same-origin' });
      const imageText = await uploadImageResponse.text();
      if (!uploadImageResponse.ok) throw new Error(`Görsel yükleme hatası: ${uploadImageResponse.status} ${uploadImageResponse.statusText}`);
      const imgCT = uploadImageResponse.headers.get('Content-Type');
      if (!imgCT || !imgCT.includes('application/json')) throw new Error('Sunucu yanıtı geçersiz: JSON bekleniyordu.');
      const imageResult = JSON.parse(imageText);
      if (imageResult.error) { message.textContent = imageResult.error; message.style.color = "#1E3A8A"; return; }
      imageData = imageResult;
    }

    const payload = {
      action: 'edit',
      id,
      title,
      description,
      price,
      type,
      subtype
    };
    if (zipData) {
      payload.zip_file_url = zipData.file_url;
      payload.zip_file_name = zipData.file_name;
    }
    if (imageData) {
      payload.image_file_url = imageData.file_url;
    }

    const editProjectResponse = await fetch(`${apiBaseUrl}projects.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'same-origin'
    });
    const editProjectText = await editProjectResponse.text();
    if (!editProjectResponse.ok) throw new Error(`Proje güncelleme hatası: ${editProjectResponse.status} ${editProjectResponse.statusText}`);
    const editCT = editProjectResponse.headers.get('Content-Type');
    if (!editCT || !editCT.includes('application/json')) throw new Error('Sunucu yanıtı geçersiz: JSON bekleniyordu.');
    const result = JSON.parse(editProjectText);

    message.textContent = result.message || result.error || "Bilinmeyen hata";
    message.style.color = result.error ? "#1E3A8A" : "#000000";
    if (!result.error) {
      form.reset();
      setTimeout(() => loadPage("control"), 1000);
    }
  } catch (error) {
    console.error('Proje güncelleme hatası:', error);
    message.textContent = `Proje güncellenirken bir hata oluştu: ${error.message}`;
    message.style.color = "#1E3A8A";
  }
}

/* =========================
   SAYFA YÜKLEME & KANCALAR (GÜNCELLENMİŞ)
   ========================= */
function loadPage(page) {
  profileMenu?.classList.add("hidden");
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.page === page);
  });
  
 // Geri butonu tanımlama
const backBtn = document.getElementById("globalBackBtn");

function toggleBackBtn() {
  if (history.length > 1) {
    backBtn.classList.remove("hidden");
  } else {
    backBtn.classList.add("hidden");
  }
}

backBtn.addEventListener("click", () => {
  if (document.referrer) {
    history.back();
  } else {
    loadPage("home");
  }
});


  mainContent.innerHTML = pages[page] || "<h2>Sayfa bulunamadı</h2>";

  // Projeler sayfası
  if (page === "projects") {
    const filterForm = document.getElementById("filterForm");
    if (filterForm) {
      // localStorage'dan türü ve alt türü al
      const selectedType = localStorage.getItem("selectedType");
      const selectedSubtype = localStorage.getItem("selectedSubtype");

      // Tür checkbox'larını güncelle
      filterForm.querySelectorAll('input[name="projectType"]').forEach(cb => {
        cb.checked = selectedType ? cb.value === selectedType : true;
      });

      // Tür checkbox değişince alt tür UI'sini güncelle
      filterForm.querySelectorAll('input[name="projectType"]').forEach(cb => {
        cb.addEventListener("change", buildSubtypeFilterUI);
      });

      // İlk yüklemede alt tür UI
      buildSubtypeFilterUI();

      // Alt türü otomatik seç
      if (selectedSubtype) {
        const subtypeInput = Array.from(filterForm.querySelectorAll('input[name="projectSubtype"]'))
          .find(input => getSubtypeLabel(input.value) === getSubtypeLabel(selectedSubtype));
        if (subtypeInput) subtypeInput.checked = true;
      }

      filterForm.removeEventListener("submit", handleFilterProjects);
      filterForm.addEventListener("submit", handleFilterProjects);

      // Filtreyi otomatik uygula
      renderProjects();

      // localStorage'ı temizle (bir kere kullanıldı)
      localStorage.removeItem("selectedType");
      localStorage.removeItem("selectedSubtype");
    }
  }

  // Kontrol sayfası
  if (page === "control") {
    if (currentUser) {
      renderControlProjects();
    } else {
      mainContent.innerHTML = `<p style="color:#1E3A8A; font-weight:700; text-align:center;">Projeleri kontrol etmek için giriş yapmalısınız.</p>`;
    }
  }

  // Proje yükle sayfası
  if (page === "add-project") {
    if (!currentUser) {
      mainContent.innerHTML = `<p style="color:#1E3A8A; font-weight:700; text-align:center;">Projeyi yüklemek için giriş yapmalısınız.</p>`;
      return;
    }
    const addProjectForm = document.getElementById("addProjectForm");
    if (addProjectForm) {
      // Tür → Alt Tür select bağlama
      const typeSel = addProjectForm.querySelector("#type");
      const subSel  = addProjectForm.querySelector("#subtype");
      if (typeSel && subSel) {
        typeSel.addEventListener("change", () => {
          const val = typeSel.value;
          populateSubtypeSelect(subSel, val);
        });
      }
      addProjectForm.removeEventListener("submit", handleAddProject);
      addProjectForm.addEventListener("submit", handleAddProject);
    }
  }

  // Login sayfası
  if (page === "login") {
    if (currentUser) {
      loadPage("home");
      return;
    }
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.removeEventListener("submit", handleLogin);
      loginForm.addEventListener("submit", handleLogin);
    }
  }

  // Register sayfası
  if (page === "register") {
    if (currentUser) {
      loadPage("home");
      return;
    }
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
      registerForm.removeEventListener("submit", handleRegister);
      registerForm.addEventListener("submit", handleRegister);
    }
  }

  // Satın alınan projeler sayfası
  if (page === "purchased-projects") {
    if (!currentUser) {
      mainContent.innerHTML = `<p style="color:#1E3A8A; font-weight:700; text-align:center;">Satın alınan projeleri görüntülemek için giriş yapmalısınız.</p>`;
      return;
    }
    renderPurchasedProjects();
  }

  // Profil sayfası
  if (page === "profile") {
    if (!currentUser) {
      mainContent.innerHTML = `<p style="color:#1E3A8A; font-weight:700; text-align:center;">Profil bilgilerinizi görüntülemek için giriş yapmalısınız.</p>`;
      return;
    }
    loadProfileForm();
  }

  // Ana sayfa: Kategori kartları için olay dinleyicileri
  if (page === "home") {
    document.querySelectorAll(".category-card").forEach(card => {
      card.addEventListener("click", (e) => {
        e.preventDefault();

        // varsa açık paneli kapat
        document.querySelectorAll(".category-card.is-open").forEach(c => {
          c.classList.remove("is-open");
          c.querySelector(".subtype-panel")?.remove();
        });

        // bu kartı aç
        card.classList.add("is-open");
        const label = card.textContent.trim().replace(/\s+/g, " ");
        const key = Object.keys(SUBTYPES).find(k => label.includes(k)) || "Diğer";
        const chips = (SUBTYPES[key] || [])
          .map(t => `<button class="chip" data-type="${key}" data-subtype="${t}">${t}</button>`).join("");

        const panel = document.createElement("div");
        panel.className = "subtype-panel";
        panel.innerHTML = `
          <div class="subtype-title">${label} — Alt Türler</div>
          <div class="chips">${chips}</div>
          <div class="note">Bir alt tür seçtiğinde Projeler'e filtre uygulanır.</div>
        `;
        card.appendChild(panel);

        // Chip tıklanınca
        panel.addEventListener("click", (ev) => {
          const chip = ev.target.closest(".chip");
          if (!chip) return;
          const type = chip.dataset.type;
          const subtype = chip.dataset.subtype;
          // Tür ve alt türü localStorage'a kaydet
          localStorage.setItem("selectedType", type);
          localStorage.setItem("selectedSubtype", subtype);
          loadPage("projects");
        });

        // Kart dışına tıklayınca paneli kapat
        const closeOnOutside = (ev) => {
          if (card.contains(ev.target)) return;
          card.classList.remove("is-open");
          panel.remove();
          document.removeEventListener("click", closeOnOutside, true);
        };
        document.addEventListener("click", closeOnOutside, true);
      });
    });
  }

  mainContent.focus();
}
// Proje detayını aç
function openProjectDetail(proj) {
  renderProjectDetail(proj); // objeyi doğrudan gönder
}

/* =========================
   Proje Detayını Göster (SPA)
   ========================= */
function renderProjectDetail(proj) {
  const projectListDiv = document.getElementById("projectList");
  if (!projectListDiv) return;

  projectListDiv.innerHTML = `
    <div class="project-detail">
      <h2>${proj.title}</h2>
      <img src="${proj.image_file_url || '/assets/default-project.png'}" 
           alt="${proj.title}" style="width:200px;border-radius:8px;margin:10px 0;" />
      <p><strong>Açıklama:</strong> ${proj.description}</p>
      <p><strong>Tür:</strong> ${proj.type} ${proj.subtype ? "· " + proj.subtype : ""}</p>
      <p><strong>Fiyat:</strong> ${proj.price} TL</p>
      <p><strong>Yükleyen:</strong> ${proj.username}</p>
      <div style="margin-top:20px;">
        <button id="buyProjectBtn" class="btn">Satın Al</button>
      </div>
    </div>
  `;

  // Satın alma butonu kontrolü
  const buyBtn = document.getElementById("buyProjectBtn");
  if (parseInt(proj.user_id) === (currentUser?.id || 0)) {
    buyBtn.disabled = true;
    buyBtn.textContent = "Bu proje sana ait!";
  } else {
    buyBtn.disabled = false;
    buyBtn.addEventListener("click", () => {
      alert("Ödeme ekranı burada açılacak. Proje ID: " + proj.id);
    });
  }
}
function renderProjectDetail(proj) {
  const projectListDiv = document.getElementById("projectList");
  if (!projectListDiv) return;

  projectListDiv.innerHTML = `
    <div class="project-detail-card">
      <h2 class="project-title">${proj.title}</h2>

      <img src="${proj.image_file_url || '/assets/default-project.png'}" 
           alt="${proj.title}" class="project-image" />

      <p><strong>📖 Açıklama:</strong><br>
        <span class="project-desc">${proj.description}</span>
      </p>

      <p><strong>📂 Tür:</strong> ${proj.type} ${proj.subtype ? "· " + proj.subtype : ""}</p>

      <p><strong>💰 Fiyat:</strong> <span class="project-price">${proj.price} TL</span></p>

      <p><strong>👤 Yükleyen:</strong> ${proj.username}</p>

      <div class="project-actions">
        <button id="buyProjectBtn" class="btn buy-btn">Satın Al</button>
      </div>
    </div>
  `;
function renderPaymentForm(proj) {
  const projectListDiv = document.getElementById("projectList");
  if (!projectListDiv) return;

  projectListDiv.innerHTML = `
    <div class="project-detail-card">
      <h2 class="project-title">💳 Ödeme Yap</h2>

      <p><strong>Proje:</strong> ${proj.title}</p>
      <p><strong>Fiyat:</strong> <span class="project-price">${proj.price} TL</span></p>

      <form id="paymentForm" class="payment-form">
        <label>Kart Numarası</label>
        <input type="text" name="cardNumber" maxlength="16" required />

        <label>Son Kullanma Tarihi (MM/YY)</label>
        <input type="text" name="cardExpiry" placeholder="MM/YY" required />

        <label>CVC</label>
        <input type="text" name="cardCvc" maxlength="3" required />

        <div class="payment-actions">
          <button type="submit" class="btn buy-btn">Ödeme Yap</button>
          <button type="button" id="cancelPaymentBtn" class="btn btn-cancel">İptal</button>
        </div>

        <p id="paymentMessage"></p>
      </form>
    </div>
  `;

  // form submit
  const paymentForm = document.getElementById("paymentForm");
  if (paymentForm) {
    paymentForm.onsubmit = (e) => handlePayment(e, proj.id, proj.price);
  }

  // iptal → proje detayına dön
  const cancelBtn = document.getElementById("cancelPaymentBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => renderProjectDetail(proj));
  }
}

  const buyBtn = document.getElementById("buyProjectBtn");
if (parseInt(proj.user_id) === (currentUser?.id || 0)) {
  buyBtn.disabled = true;
  buyBtn.textContent = "Bu proje sana ait!";
  buyBtn.classList.add("btn-disabled");
} else {
  buyBtn.addEventListener("click", () => {
    currentProject = proj; // seçilen proje bilgisi
    renderPaymentForm(proj); 
    function renderPaymentModal(proj) {
  const paymentModal = document.getElementById("paymentModal");
  if (!paymentModal) return;

  // Proje bilgilerini ödeme ekranında göster
  const paymentInfo = paymentModal.querySelector("#paymentInfo");
  if (paymentInfo) {
    paymentInfo.innerHTML = `
      <p><strong>Proje:</strong> ${proj.title}</p>
      <p><strong>Fiyat:</strong> ${proj.price} TL</p>
    `;
  }

  // Modalı aç
  paymentModal.classList.remove("hidden");
  paymentModal.classList.add("show");

  // Form submit bağlama
  const paymentForm = document.getElementById("paymentForm");
  if (paymentForm) {
    paymentForm.onsubmit = (e) => handlePayment(e, proj.id, proj.price);
  }
}
  });
}
}
