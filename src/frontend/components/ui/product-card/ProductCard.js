/**
 * ProductCard Component
 * Render thẻ sản phẩm chuẩn VIP B2B E-commerce
 */
var ProductCard = (function() {
    
    /**
     * @param {Object} product - Object chứa thông tin sản phẩm {sku, name, price, img, stock}
     * @param {Number} index - Vị trí của sản phẩm trong mảng để gọi hàm addToCart
     * @param {Function} formatMoneyFn - Hàm format tiền tệ (Ví dụ: 450000 -> 450.000đ)
     * @param {String} addToCartFnName - Tên hàm JS sẽ gọi khi click (Mặc định: 'addToCart')
     */
    function render(product, index, formatMoneyFn, addToCartFnName = 'addToCart') {
        const lang = localStorage.getItem('app_lang') || 'vi';
        const t = (typeof translations !== 'undefined' && translations[lang]) ? translations[lang] : {};
        const getT = (key, defaultText) => t[key] || defaultText;

        const isOutOfStock = product.stock === 0;
        const stockBadge = isOutOfStock 
            ? `<div class="stock-badge" style="color:#ef4444;">${getT('product.out_of_stock', 'Hết hàng')}</div>` 
            : `<div class="stock-badge">${getT('product.in_stock', 'Còn')} ${product.stock}</div>`;
        
        // Pass 'this', 'product.sku' and 'event' for the new animation logic
        let clickHandler = `${addToCartFnName}(${index})`;
        if (addToCartFnName === 'addToCartFromGrid') {
            const productCode = product.code2 || product.sku.replace(/\d{2}/, ''); // Fallback if code2 is missing
            clickHandler = `addToCartFromGrid(this, '${productCode}', event)`;
        }
        
        const btnState = isOutOfStock ? 'disabled' : `onclick="${clickHandler}"`;
        const formattedPrice = typeof formatMoneyFn === 'function' ? formatMoneyFn(product.price) : product.price + 'đ';

        return `
            <div class="product-card">
                <div class="product-img-wrap">
                    ${stockBadge}
                    <img src="${product.img}" class="product-img" alt="${product.name}" loading="lazy">
                </div>
                <div class="product-info">
                    <div class="product-sku">SKU: ${product.sku}</div>
                    <div class="product-name" title="${product.name}">${product.name}</div>
                    <div class="product-price">${formattedPrice}</div>
                    <button class="btn-add" ${btnState} aria-label="Thêm vào giỏ">
                        <span class="material-symbols-outlined" style="font-size: 20px;">add_shopping_cart</span>
                    </button>
                </div>
            </div>
        `;
    }

    return {
        render: render
    };
})();
