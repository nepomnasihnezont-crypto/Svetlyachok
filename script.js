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

    function getCart() {
        return JSON.parse(localStorage.getItem('svetlyachok_cart')) || [];
    }

    function saveCart(cart) {
        localStorage.setItem('svetlyachok_cart', JSON.stringify(cart));
        updateCartCounters();
    }

    function updateCartCounters() {
        const cart = getCart();
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        const desktopCounter = document.getElementById('cartCountDesktop');
        const mobileCounter = document.getElementById('cartCountMobile');

        if (desktopCounter) desktopCounter.textContent = totalItems;
        if (mobileCounter) mobileCounter.textContent = totalItems;
    }

    updateCartCounters();

    const gallery = document.getElementById('gallery');
    const catalogTitle = document.getElementById('catalogTitle');
    const personGrid = document.getElementById('personGrid');
    const typeGrid = document.getElementById('typeGrid');

    if (gallery) {
        const urlParams = new URLSearchParams(window.location.search);
        let targetPerson = urlParams.get('person');
        let targetType = urlParams.get('type');
        let pageTitle = urlParams.get('title');

        if (!targetPerson && !targetType) {
            if (catalogTitle) catalogTitle.textContent = 'Выберите категорию';
            if (personGrid) personGrid.style.display = 'grid';
            if (typeGrid) typeGrid.style.display = 'none';
            gallery.style.display = 'none';
        } else if (targetPerson && !targetType) {
            if (catalogTitle) catalogTitle.textContent = decodeURIComponent(pageTitle || 'Выберите тип одежды');
            if (personGrid) personGrid.style.display = 'none';
            if (typeGrid) {
                typeGrid.style.display = 'grid';
                const p = encodeURIComponent(targetPerson);
                const tName = encodeURIComponent(pageTitle);
                const links = {
                    'linkTshirt': 'футболки',
                    'linkPants': 'штаны',
                    'linkShorts': 'шорты',
                    'linkDress': 'платья',
                    'linkShirt': 'рубашки',
                    'linkOuterwear': 'верхняя одежда',
                    'linkShoes': 'обувь',
                    'linkAccessories': 'аксессуары'
                };
                for (const [id, typeVal] of Object.entries(links)) {
                    const el = document.getElementById(id);
                    if (el) el.href = `catalog.html?person=${p}&type=${encodeURIComponent(typeVal)}&title=${tName}: ${typeVal.charAt(0).toUpperCase() + typeVal.slice(1)}`;
                }
            }
            gallery.style.display = 'none';
        } else {
            if (personGrid) personGrid.style.display = 'none';
            if (typeGrid) typeGrid.style.display = 'none';
            gallery.style.display = 'grid';

            if (pageTitle && catalogTitle) {
                catalogTitle.textContent = decodeURIComponent(pageTitle);
            }

            targetPerson = decodeURIComponent(targetPerson).toLowerCase();
            targetType = decodeURIComponent(targetType).toLowerCase();

            try {
                const response = await fetch('./content/products/products.json');
                if (!response.ok) {
                    gallery.innerHTML = '<p style="text-align:center; width: 100%;">В этом разделе пока нет товаров.</p>';
                    return;
                }

                const products = await response.json();

                const filtered = products.filter(item => 
                    item && item.gender && item.gender.toLowerCase() === targetPerson &&
                    item.type && item.type.toLowerCase() === targetType
                );

                if (filtered.length === 0) {
                    gallery.innerHTML = '<p style="text-align:center; width: 100%;">В этом разделе пока нет товаров.</p>';
                    return;
                }

                gallery.innerHTML = '';
                filtered.forEach((item, index) => {
                    const card = document.createElement('div');
                    card.classList.add('gallery-card');
                    card.style.cursor = 'pointer';
                    card.innerHTML = `
                        <img src="${item.image}" alt="${item.title}" loading="lazy">
                        <div class="gallery-card-info">
                            <div>
                                <p style="font-weight: 700; margin-bottom: 5px;">${item.title}</p>
                                <span style="color: #ff9e80; font-size: 18px; font-weight: bold;">${item.price} ₽</span>
                            </div>
                            <button class="add-to-cart-btn" data-id="${index}" data-title="${item.title}" data-price="${item.price}" data-image="${item.image}">В корзину</button>
                        </div>
                    `;

                    card.addEventListener('click', (e) => {
                        if (e.target.classList.contains('add-to-cart-btn')) return;
                        openProductModal(item);
                    });

                    gallery.appendChild(card);
                });

                document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const product = {
                            title: e.target.dataset.title,
                            price: Number(e.target.dataset.price),
                            image: e.target.dataset.image,
                            quantity: 1
                        };

                        let cart = getCart();
                        const existing = cart.find(i => i.title === product.title);
                        if (existing) {
                            existing.quantity += 1;
                        } else {
                            cart.push(product);
                        }
                        saveCart(cart);

                        btn.textContent = 'Добавлено! ✓';
                        setTimeout(() => { btn.textContent = 'В корзину'; }, 1500);
                    });
                });

            } catch (e) {
                console.error(e);
                gallery.innerHTML = '<p style="text-align:center; width: 100%;">Ошибка загрузки каталога.</p>';
            }
        }
    }

    const modal = document.getElementById('productModal');
    const closeModal = document.getElementById('closeModal');

    function openProductModal(item) {
        if (!modal) return;
        
        document.getElementById('modalTitle').textContent = item.title;
        document.getElementById('modalPrice').textContent = `${item.price} ₽`;
        document.getElementById('modalDescription').textContent = item.description || 'Описание отсутствует.';

        const modalGallery = document.getElementById('modalGallery');
        modalGallery.innerHTML = '';

        let allImages = [item.image];
        if (item.images && Array.isArray(item.images)) {
            item.images.forEach(imgObj => {
                if (imgObj && imgObj.img) allImages.push(imgObj.img);
            });
        }

        allImages.forEach(imgSrc => {
            const img = document.createElement('img');
            img.src = imgSrc;
            img.style.cssText = 'width: 120px; height: 120px; object-fit: cover; border-radius: 8px; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.1); cursor: pointer;';
            modalGallery.appendChild(img);
        });

        const modalAddToCart = document.getElementById('modalAddToCart');
        modalAddToCart.onclick = () => {
            const product = {
                title: item.title,
                price: Number(item.price),
                image: item.image,
                quantity: 1
            };
            let cart = getCart();
            const existing = cart.find(i => i.title === product.title);
            if (existing) {
                existing.quantity += 1;
            } else {
                cart.push(product);
            }
            saveCart(cart);
            modalAddToCart.textContent = 'Добавлено в корзину! ✓';
            setTimeout(() => { modalAddToCart.textContent = 'В корзину'; }, 1500);
        };

        modal.style.display = 'flex';
    }

    if (closeModal) {
        closeModal.onclick = () => { modal.style.display = 'none'; };
    }
    window.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
    };

    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartSummary = document.getElementById('cartSummary');

    if (cartItemsContainer) {
        function renderCart() {
            const cart = getCart();
            if (cart.length === 0) {
                cartItemsContainer.innerHTML = '<p style="text-align:center; padding: 40px 0;">Ваша корзина пока пуста 🥺</p>';
                if (cartSummary) cartSummary.style.display = 'none';
                return;
            }

            if (cartSummary) cartSummary.style.display = 'block';
            cartItemsContainer.innerHTML = '';
            let totalPrice = 0;

            cart.forEach((item, index) => {
                totalPrice += item.price * (item.quantity || 1);
                const div = document.createElement('div');
                div.classList.add('cart-item');
                div.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="${item.image}" alt="" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
                        <div>
                            <p style="font-weight: bold;">${item.title}</p>
                            <p style="color: #ff9e80;">${item.price} ₽ × ${item.quantity || 1}</p>
                        </div>
                    </div>
                    <button class="remove-item-btn" data-index="${index}">Удалить</button>
                `;
                cartItemsContainer.appendChild(div);
            });

            document.getElementById('cartTotalPrice').textContent = totalPrice;

            document.querySelectorAll('.remove-item-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = e.target.dataset.index;
                    let cart = getCart();
                    cart.splice(idx, 1);
                    saveCart(cart);
                    renderCart();
                });
            });
        }

        renderCart();

        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                alert('Заказ успешно сформирован!');
                localStorage.removeItem('svetlyachok_cart');
                renderCart();
                updateCartCounters();
            });
        }
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
