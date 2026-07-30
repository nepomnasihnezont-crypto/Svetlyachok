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
    const categoryGrid = document.getElementById('categoryGrid');

    if (gallery) {
        const urlParams = new URLSearchParams(window.location.search);
        let targetType = urlParams.get('type');
        let pageTitle = urlParams.get('title');

        if (!targetType) {
            if (catalogTitle) catalogTitle.textContent = 'Выберите категорию';
            if (categoryGrid) categoryGrid.style.display = 'grid';
            gallery.style.display = 'none';
        } else {
            if (categoryGrid) categoryGrid.style.display = 'none';
            gallery.style.display = 'grid';

            if (pageTitle && catalogTitle) {
                catalogTitle.textContent = decodeURIComponent(pageTitle);
            }

            targetType = decodeURIComponent(targetType).toLowerCase();

            try {
                const response = await fetch('/content/products/index.json');
                if (!response.ok) {
                    gallery.innerHTML = '<p style="text-align:center; width: 100%;">В этом разделе пока нет товаров.</p>';
                    return;
                }

                const data = await response.json();
                const products = data.products || [];

                const filtered = products.filter(item => 
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
                    gallery.appendChild(card);
                });

                document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
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
