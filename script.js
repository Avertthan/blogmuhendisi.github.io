// Güvenlik: Blog sahibi bilgileri (İlk kurulumda ayarlanır)
const BLOG_OWNER = {
    password: 'admin123', // Burası değiştirilebilir
    setupComplete: localStorage.getItem('blogSetupComplete') === 'true'
};

// LocalStorage'dan blogları yükle
let blogs = JSON.parse(localStorage.getItem('blogs')) || [];

let currentPage = 1;
const postsPerPage = 6;
let currentPostId = null;
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';

// Tema yükleme
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeIcon();

// Sayfa yüklendiğinde
checkAuthentication();
renderUserMenu();
renderBlogs();
updateBlogInfo();
renderAboutSection();

function checkAuthentication() {
    // İlk kurulum yapılmamışsa ve URL'de admin parametresi varsa kurulum modalını göster
    if (!BLOG_OWNER.setupComplete && window.location.search.includes('admin=true')) {
        setTimeout(() => {
            alert('Hoş geldiniz! Lütfen blogunuzu kurmak için bilgilerinizi girin.');
            openAuthModal();
        }, 500);
    }
}

function saveBlogsToStorage() {
    localStorage.setItem('blogs', JSON.stringify(blogs));
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const theme = document.documentElement.getAttribute('data-theme');
    const icon = theme === 'light' ? '🌙' : '☀️';
    document.querySelector('.theme-toggle').textContent = icon;
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function renderUserMenu() {
    const menuSection = document.getElementById('userMenuSection');
    
    if (currentUser && isAuthenticated) {
        menuSection.innerHTML = `
            <button class="btn btn-secondary" onclick="openNewPostModal()">✏️ Yeni Yazı</button>
            <button class="btn btn-donate" onclick="openDonateModal()">❤️ Bağış Yap</button>
            <div class="user-menu">
                <button class="user-button" onclick="toggleDropdown()">
                    <div class="user-avatar">${getInitials(currentUser.name)}</div>
                    <span>${currentUser.name}</span>
                </button>
                <div id="userDropdown" class="dropdown-menu">
                    <div class="user-info">
                        <div class="user-info-name">${currentUser.name}</div>
                        <div class="user-info-email">${currentUser.email}</div>
                    </div>
                    <div class="dropdown-item" onclick="openSettingsModal()">
                        ⚙️ Blog Ayarları
                    </div>
                    <div class="dropdown-item" onclick="logout()">
                        🔒 Kilitle
                    </div>
                </div>
            </div>
        `;
    } else if (currentUser && !isAuthenticated) {
        // Blog kurulumu yapılmış, ziyaretçi modunda - sadece bağış butonu
        menuSection.innerHTML = `
            <button class="btn btn-donate" onclick="openDonateModal()">❤️ Bağış Yap</button>
            ${window.location.search.includes('admin=true') ? '<button class="btn btn-primary" onclick="openLoginModal()">🔐 Giriş Yap</button>' : ''}
        `;
    } else {
        // İlk kurulum - sadece admin modunda göster
        if (window.location.search.includes('admin=true')) {
            menuSection.innerHTML = `
                <button class="btn btn-primary" onclick="openAuthModal()">🚀 Blogu Kur</button>
            `;
        } else {
            menuSection.innerHTML = '';
        }
    }
}

function updateBlogInfo() {
    if (currentUser) {
        const blogTitle = `${currentUser.name.split(' ')[0]}'in Blogu`;
        document.getElementById('blogTitle').textContent = currentUser.blogTitle || blogTitle;
        document.getElementById('heroTitle').textContent = `${currentUser.name}'e Hoş Geldiniz`;
        document.getElementById('heroSubtitle').textContent = currentUser.bio || 'Düşüncelerimi, deneyimlerimi ve fikirlerimi paylaşıyorum';
    } else {
        // Blog kurulmamışsa bile ziyaretçilere profesyonel görünüm
        document.getElementById('blogTitle').textContent = 'Kişisel Blog';
        document.getElementById('heroTitle').textContent = 'Kişisel Blog';
        document.getElementById('heroSubtitle').textContent = 'Yakında içerikler yayınlanacak...';
    }
}

function renderAboutSection() {
    const aboutSection = document.getElementById('aboutSection');
    
    if (currentUser) {
        aboutSection.style.display = 'block';
        
        let socialLinks = '';
        if (currentUser.twitter) {
            socialLinks += `<a href="${currentUser.twitter}" target="_blank" class="social-link">🐦 Twitter</a>`;
        }
        if (currentUser.github) {
            socialLinks += `<a href="${currentUser.github}" target="_blank" class="social-link">💻 GitHub</a>`;
        }
        if (currentUser.linkedin) {
            socialLinks += `<a href="${currentUser.linkedin}" target="_blank" class="social-link">💼 LinkedIn</a>`;
        }
        
        aboutSection.innerHTML = `
            <div class="about-header">
                <div class="about-avatar">${getInitials(currentUser.name)}</div>
                <div class="about-info">
                    <h2>${currentUser.name}</h2>
                    <p>${currentUser.email}</p>
                </div>
            </div>
            ${currentUser.bio ? `<div class="about-bio">${currentUser.bio}</div>` : ''}
            ${socialLinks ? `<div class="social-links">${socialLinks}</div>` : ''}
        `;
    } else {
        aboutSection.style.display = 'none';
    }
}

function showHome() {
    closeFullPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderBlogs() {
    const grid = document.getElementById('blogGrid');
    const start = (currentPage - 1) * postsPerPage;
    const end = start + postsPerPage;
    const paginatedBlogs = blogs.slice(start, end);

    if (paginatedBlogs.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <h3>Henüz blog yazısı yok</h3>
                <p>${isAuthenticated ? 'İlk blog yazınızı oluşturmak için "Yeni Yazı" butonuna tıklayın.' : 'Yakında içerikler yayınlanacak...'}</p>
            </div>
        `;
    } else {
        grid.innerHTML = paginatedBlogs.map(blog => `
            <div class="blog-card">
                <div class="blog-image" onclick="openPost(${blog.id})">📝</div>
                <div class="blog-content">
                    <div class="author-badge">
                        <div class="author-badge-avatar">${getInitials(blog.author)}</div>
                        <span>${blog.author}</span>
                    </div>
                    <h3 class="blog-title" onclick="openPost(${blog.id})" style="cursor: pointer;">${blog.title}</h3>
                    <p class="blog-excerpt">${blog.excerpt}</p>
                    <div class="blog-meta">
                        <span>📅 ${blog.date}</span>
                    </div>
                    <a href="#" class="read-more" onclick="event.preventDefault(); openPost(${blog.id})">
                        Devamını Oku →
                    </a>
                    ${isAuthenticated ? `
                        <div class="blog-actions">
                            <button class="btn-edit" onclick="event.stopPropagation(); editPost(${blog.id})">✏️ Düzenle</button>
                            <button class="btn-delete" onclick="event.stopPropagation(); deletePost(${blog.id})">🗑️ Sil</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    renderPagination();
}

function renderPagination() {
    const totalPages = Math.ceil(blogs.length / postsPerPage);
    const pagination = document.getElementById('pagination');

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';
    
    if (currentPage > 1) {
        html += `<button class="page-btn" onclick="changePage(${currentPage - 1})">← Önceki</button>`;
    }

    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }

    if (currentPage < totalPages) {
        html += `<button class="page-btn" onclick="changePage(${currentPage + 1})">Sonraki →</button>`;
    }

    pagination.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    renderBlogs();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleDropdown() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('active');
}

function openAuthModal() {
    // İlk kurulum yapıldıysa veya admin modunda değilse izin verme
    if (BLOG_OWNER.setupComplete) {
        alert('Blog zaten kurulmuş!');
        return;
    }
    if (!window.location.search.includes('admin=true')) {
        return;
    }
    document.getElementById('authModal').classList.add('active');
    document.getElementById('authForm').reset();
}

function openLoginModal() {
    if (!window.location.search.includes('admin=true')) {
        return;
    }
    const password = prompt('Lütfen şifrenizi girin:');
    if (password === BLOG_OWNER.password) {
        isAuthenticated = true;
        sessionStorage.setItem('isAuthenticated', 'true');
        renderUserMenu();
        renderBlogs();
        alert('Başarıyla giriş yaptınız! ✅');
    } else if (password !== null) {
        alert('Hatalı şifre! ❌');
    }
}

function openSettingsModal() {
    toggleDropdown();
    if (currentUser && isAuthenticated) {
        document.getElementById('settingsName').value = currentUser.name;
        document.getElementById('settingsEmail').value = currentUser.email;
        document.getElementById('settingsBlogTitle').value = currentUser.blogTitle || '';
        document.getElementById('settingsBio').value = currentUser.bio || '';
        document.getElementById('settingsTwitter').value = currentUser.twitter || '';
        document.getElementById('settingsGithub').value = currentUser.github || '';
        document.getElementById('settingsLinkedin').value = currentUser.linkedin || '';
        document.getElementById('settingsModal').classList.add('active');
    }
}

function handleAuth(event) {
    event.preventDefault();
    
    // İlk kurulum kontrolü
    if (BLOG_OWNER.setupComplete) {
        alert('Blog zaten kurulmuş! ❌');
        closeModal('authModal');
        return;
    }
    
    const name = document.getElementById('authName').value;
    const email = document.getElementById('authEmail').value;
    const blogTitle = document.getElementById('authBlogTitle').value;
    const bio = document.getElementById('authBio').value;
    const twitter = document.getElementById('authTwitter').value;
    const github = document.getElementById('authGithub').value;
    const linkedin = document.getElementById('authLinkedin').value;
    
    currentUser = { 
        name, 
        email, 
        blogTitle,
        bio,
        twitter,
        github,
        linkedin
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('blogSetupComplete', 'true');
    isAuthenticated = true;
    sessionStorage.setItem('isAuthenticated', 'true');
    
    renderUserMenu();
    updateBlogInfo();
    renderAboutSection();
    closeModal('authModal');
    
    alert('Blogunuz başarıyla kuruldu! 🎉\n\nÖnemli: Şifreniz "admin123" olarak ayarlandı. script.js dosyasını düzenleyerek değiştirebilirsiniz.');
}

function saveSettings(event) {
    event.preventDefault();
    
    if (!isAuthenticated) {
        alert('Ayarları değiştirmek için giriş yapmalısınız! 🔐');
        return;
    }
    
    currentUser.name = document.getElementById('settingsName').value;
    currentUser.email = document.getElementById('settingsEmail').value;
    currentUser.blogTitle = document.getElementById('settingsBlogTitle').value;
    currentUser.bio = document.getElementById('settingsBio').value;
    currentUser.twitter = document.getElementById('settingsTwitter').value;
    currentUser.github = document.getElementById('settingsGithub').value;
    currentUser.linkedin = document.getElementById('settingsLinkedin').value;
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    renderUserMenu();
    updateBlogInfo();
    renderAboutSection();
    closeModal('settingsModal');
    
    alert('Ayarlar başarıyla kaydedildi! ✅');
}

function logout() {
    if (confirm('Blog yönetim panelini kilitlemek istediğinizden emin misiniz?')) {
        isAuthenticated = false;
        sessionStorage.removeItem('isAuthenticated');
        renderUserMenu();
        renderBlogs();
        toggleDropdown();
        alert('Blog yönetim paneli kilitlendi! 🔒\n\nBloglarınızı görebilirsiniz ancak düzenlemek için giriş yapmalısınız.');
    }
}

function openNewPostModal() {
    if (!isAuthenticated) {
        alert('Blog yazmak için giriş yapmalısınız! 🔐');
        openLoginModal();
        return;
    }
    document.getElementById('newPostModal').classList.add('active');
    document.getElementById('newPostForm').reset();
    document.getElementById('editPostId').value = '';
    document.getElementById('modalTitle').textContent = 'Yeni Blog Yazısı';
    document.getElementById('submitBtnText').textContent = 'Yayınla';
}

function openDonateModal() {
    document.getElementById('donateModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function editPost(id) {
    const blog = blogs.find(b => b.id === id);
    if (!blog) return;

    if (!isAuthenticated) {
        alert('Blog düzenlemek için giriş yapmalısınız! 🔐');
        openLoginModal();
        return;
    }

    document.getElementById('editPostId').value = blog.id;
    document.getElementById('postTitle').value = blog.title;
    document.getElementById('postExcerpt').value = blog.excerpt;
    document.getElementById('postContent').value = blog.content;
    document.getElementById('modalTitle').textContent = 'Blog Yazısını Düzenle';
    document.getElementById('submitBtnText').textContent = 'Güncelle';
    document.getElementById('newPostModal').classList.add('active');
    closeFullPage();
}

function savePost(event) {
    event.preventDefault();

    if (!isAuthenticated) {
        alert('Blog yazmak için giriş yapmalısınız! 🔐');
        return;
    }

    const editId = document.getElementById('editPostId').value;
    const title = document.getElementById('postTitle').value;
    const excerpt = document.getElementById('postExcerpt').value;
    const content = document.getElementById('postContent').value;

    if (editId) {
        // Düzenleme modu
        const blogIndex = blogs.findIndex(b => b.id === parseInt(editId));
        if (blogIndex !== -1) {
            blogs[blogIndex] = {
                ...blogs[blogIndex],
                title: title,
                excerpt: excerpt,
                content: content
            };
            alert('Blog yazınız başarıyla güncellendi! ✅');
        }
    } else {
        // Yeni yazı modu
        const newPost = {
            id: blogs.length > 0 ? Math.max(...blogs.map(b => b.id)) + 1 : 1,
            title: title,
            excerpt: excerpt,
            content: content,
            date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
            author: currentUser.name,
            authorEmail: currentUser.email
        };
        blogs.unshift(newPost);
        alert('Blog yazınız başarıyla yayınlandı! ✅');
    }

    saveBlogsToStorage();
    currentPage = 1;
    renderBlogs();
    closeModal('newPostModal');
}

function openPost(id) {
    const blog = blogs.find(b => b.id === id);
    if (!blog) return;

    currentPostId = id;

    document.getElementById('articleTitle').textContent = blog.title;
    document.getElementById('articleMeta').innerHTML = `
        <span>📅 ${blog.date}</span>
        <div class="author-badge">
            <div class="author-badge-avatar">${getInitials(blog.author)}</div>
            <span>${blog.author}</span>
        </div>
    `;
    document.getElementById('articleContent').innerHTML = blog.content.split('\n').map(p => `<p>${p}</p>`).join('');
    
    if (isAuthenticated) {
        document.getElementById('articleActions').innerHTML = `
            <button class="btn-edit" onclick="editPost(${blog.id})">✏️ Düzenle</button>
            <button class="btn-delete" onclick="deletePost(${blog.id})">🗑️ Sil</button>
        `;
    } else {
        document.getElementById('articleActions').innerHTML = '';
    }
    
    document.getElementById('readPostModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeFullPage() {
    document.getElementById('readPostModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function deletePost(id) {
    if (!isAuthenticated) {
        alert('Blog silmek için giriş yapmalısınız! 🔐');
        openLoginModal();
        return;
    }

    if (confirm('Bu blog yazısını silmek istediğinizden emin misiniz?')) {
        blogs = blogs.filter(b => b.id !== id);
        saveBlogsToStorage();
        
        const totalPages = Math.ceil(blogs.length / postsPerPage);
        if (currentPage > totalPages && currentPage > 1) {
            currentPage = totalPages;
        }
        
        renderBlogs();
        closeFullPage();
        alert('Blog yazısı başarıyla silindi! ✅');
    }
}

function shareOnTwitter() {
    const blog = blogs.find(b => b.id === currentPostId);
    const text = encodeURIComponent(blog.title);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
}

function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

function shareOnLinkedIn() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
}

function shareOnWhatsApp() {
    const blog = blogs.find(b => b.id === currentPostId);
    const text = encodeURIComponent(`${blog.title} - ${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Link panoya kopyalandı! ✅');
    }).catch(() => {
        alert('Link kopyalanamadı. Lütfen manuel olarak kopyalayın.');
    });
}

// Modal dışına tıklandığında kapat
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
    if (!event.target.closest('.user-menu')) {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    }
}

// ESC tuşu ile modal'ı kapat
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        closeFullPage();
    }
});