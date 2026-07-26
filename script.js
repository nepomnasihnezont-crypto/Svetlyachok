document.addEventListener('DOMContentLoaded', async () => {
    const starsCount = 45; 
    for (let i = 0; i < starsCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        
        const size = Math.random() * 3 + 1.5;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.top = `${Math.random() * 100}vh`;
        star.style.left = `${Math.random() * 100}vw`;
        star.style.animationDuration = `${Math.random() * 3 + 2}s`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        
        document.body.appendChild(star);
    }

    const burgerBtn = document.getElementById('burgerBtn');
    const navMenu = document.getElementById('navMenu');
    const dropdowns = document.querySelectorAll('.dropdown');

    if (burgerBtn && navMenu) {
        burgerBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            burgerBtn.classList.toggle('active');
        });
    }

    dropdowns.forEach(dropdown => {
        const toggleBtn = dropdown.querySelector('.dropdown-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdowns.forEach(item => {
                    if (item !== dropdown) item.classList.remove('open');
                });
                dropdown.classList.toggle('open');
            });
        }
    });

    document.addEventListener('click', () => {
        dropdowns.forEach(item => item.classList.remove('open'));
    });

    const gallery = document.getElementById('gallery');
    const catalogTitle = document.getElementById('catalogTitle');

    if (!gallery) return;

    const urlParams = new URLSearchParams(window.location.search);
    let targetGender = urlParams.get('gender');
    let targetType = urlParams.get('type');
    let pageTitle = urlParams.get('title');

    if (pageTitle && catalogTitle) {
        catalogTitle.textContent = decodeURIComponent(pageTitle);
    }

    if (!targetGender || !targetType) {
        gallery.innerHTML = '<p style="text-align:center; width: 100%;">Выберите раздел в меню выше.</p>';
        return;
    }

    targetGender = decodeURIComponent(targetGender).toLowerCase();
    targetType = decodeURIComponent(targetType).toLowerCase();

    try {
     
        const response = await fetch('/content/products/index.json');
        if (!response.ok) {
            gallery.innerHTML = '<p style="text-align:center; width: 100%;">В этом разделе пока нет товаров.</p>';
            return;
        }

        const products = await response.json();

        const filtered = products.filter(item => 
            item.gender.toLowerCase() === targetGender && 
            item.type.toLowerCase() === targetType
        );

        if (filtered.length === 0) {
            gallery.innerHTML = '<p style="text-align:center; width: 100%;">В этом разделе пока нет товаров.</p>';
            return;
        }

        gallery.innerHTML = '';
        filtered.forEach(item => {
            const card = document.createElement('div');
            card.classList.add('gallery-card');
            card.innerHTML = `
                <img src="${item.image}" alt="${item.title}" loading="lazy">
                <div class="gallery-card-info">
                    <p style="font-weight: 700; margin-bottom: 5px;">${item.title}</p>
                    <span style="color: #ff9e80; font-size: 18px; font-weight: bold;">${item.price} ₽</span>
                </div>
            `;
            gallery.appendChild(card);
        });

    } catch (e) {
        console.error(e);
        gallery.innerHTML = '<p style="text-align:center; width: 100%;">Ошибка загрузки каталога.</p>';
    }
});

if (window.netlifyIdentity) {
    window.netlifyIdentity.on("init", user => {
        if (!user) {
            window.netlifyIdentity.on("login", () => {
                document.location.href = "/admin/";
            });
        }
    });
}