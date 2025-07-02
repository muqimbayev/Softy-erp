// static/js/main/services.js

document.addEventListener('DOMContentLoaded', function() {
    // Initialize services functionality
    initServicesPage();
});

// Initialize services page
function initServicesPage() {
    // Filters functionality
    initFilters();
    
    // Table functionality
    initTable();
    
    // Search functionality
    initSearch();
    
    // Export functionality
    initExport();
    
    // Quick actions
    initQuickActions();
    
    // Advanced features
    initAdvancedFeatures();
}

// Initialize filters - Tozalangan versiya
function initFilters() {
    const filtersToggle = document.getElementById('filtersToggle');
    const filtersContent = document.getElementById('filtersContent');
    const filtersForm = document.getElementById('filtersForm');
    
    // Filterlar ko'rinishini boshqarish
    if (filtersToggle && filtersContent) {
        // Toggle funksiyasi
        filtersToggle.addEventListener('click', function(e) {
            e.preventDefault();
            
            const isVisible = filtersContent.style.display === 'block';
            
            if (isVisible) {
                filtersContent.classList.add('hidden');
                filtersContent.style.display = 'none';
            } else {
                filtersContent.classList.remove('hidden');
                filtersContent.style.display = 'block';
            }
            
            // Icon ni o'zgartirish
            const icon = filtersToggle.querySelector('i');
            if (icon) {
                const newIcon = isVisible ? 'chevron-down' : 'chevron-up';
                icon.setAttribute('data-lucide', newIcon);
                
                // Lucide iconlarni qayta yuklash
                if (window.lucide) {
                    lucide.createIcons();
                }
            }
        });
        
        // Dastlab filterlarni tekshirish
        setTimeout(() => {
            checkAndShowFilters(filtersContent, filtersForm);
        }, 100);
        
    }
    
    // Form elementi mavjudligini tekshirish
    if (filtersForm) {
        console.log('✅ Filter form topildi');
        
        // Manual submit funksiyasi - faqat tugma uchun
        initManualSubmit(filtersForm);
        
        // Form submit hodisasi
        filtersForm.addEventListener('submit', function(e) {
            console.log('📤 Filter form submit qilindi');
            saveFilterState();
            keepFiltersOpen();
            showLoading();
            // Form default submit ishini davom ettiradi
        });
        
        // Clear button - yangilangan selector (button element uchun)
        const clearBtn = filtersForm.querySelector('.clear-filters-btn') || 
                        filtersForm.querySelector('#clearFiltersBtn') ||
                        document.querySelector('.clear-filters-btn');
        
        if (clearBtn) {
            clearBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('🗑️ Filterlar tozalandi');
                clearAllFilters(filtersForm);
            });
            console.log('✅ Clear button event listener qo\'shildi');
        } else {
            console.warn('⚠️ Clear button topilmadi');
        }
    } else {
        console.warn('⚠️ Filter form topilmadi');
    }
}

// Barcha filterlarni tozalash funksiyasi - Soddalashtirilgan
function clearAllFilters(filtersForm) {
    // Barcha input va select elementlarni topish
    const inputs = filtersForm.querySelectorAll('input[type="text"], input[type="search"], input[type="date"]');
    const selects = filtersForm.querySelectorAll('select');
    
    // Input elementlarni tozalash
    inputs.forEach(input => {
        input.value = '';
        
        // Input eventini trigger qilish
        const inputEvent = new Event('input', { bubbles: true });
        input.dispatchEvent(inputEvent);
    });
    
    // Select elementlarni tozalash
    selects.forEach(select => {
        select.selectedIndex = 0; // Birinchi option (bo'sh)ni tanlash
        select.value = ''; // Qiymatni ham bo'sh qilish
        
        // Change hodisasini trigger qilish
        const changeEvent = new Event('change', { bubbles: true });
        select.dispatchEvent(changeEvent);
    });
    
    // Local storage dan ham tozalash
    localStorage.removeItem('serviceFilters');
    localStorage.removeItem('keepFiltersOpen');
    
    // URL parametrlarni tozalash va sahifani yangilash
    const baseUrl = window.location.pathname;
    window.location.href = baseUrl;
}

// Faol filterlarni tekshirish va ko'rsatish/yashirish - Tozalangan versiya
function checkAndShowFilters(filtersContent, filtersForm) {
    if (!filtersForm) return;
    
    const inputs = filtersForm.querySelectorAll('input[type="text"], input[type="search"], input[type="date"]');
    const selects = filtersForm.querySelectorAll('select');
    let hasActiveFilters = false;
    
    // URL parametrlarini ham tekshirish
    const urlParams = new URLSearchParams(window.location.search);
    
    // Text va date inputlarni tekshirish
    inputs.forEach(input => {
        const urlValue = urlParams.get(input.name);
        if ((input.value && input.value.trim() !== '') || (urlValue && urlValue.trim() !== '')) {
            hasActiveFilters = true;
        }
    });
    
    // Select elementlarni tekshirish
    selects.forEach(select => {
        const urlValue = urlParams.get(select.name);
        if ((select.value && select.value !== '') || (urlValue && urlValue !== '')) {
            hasActiveFilters = true;
        }
    });
    
    // Agar faol filterlar bo'lsa yoki localStorage da ochiq ture deb belgilangan bo'lsa
    const keepOpen = localStorage.getItem('keepFiltersOpen');
    
    if (hasActiveFilters || keepOpen === 'true') {
        filtersContent.style.display = 'block';
        filtersContent.classList.remove('hidden');
        
        // Icon ni ham to'g'ri qilish
        const toggle = document.getElementById('filtersToggle');
        if (toggle) {
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', 'chevron-up');
                if (window.lucide) {
                    lucide.createIcons();
                }
            }
        }
        
        // Agar localStorage flag bor edi uni tozalash
        if (keepOpen === 'true') {
            localStorage.removeItem('keepFiltersOpen');
        }
    } else {
        filtersContent.style.display = 'none';
        filtersContent.classList.add('hidden');
        
        // Icon ni ham to'g'ri qilish
        const toggle = document.getElementById('filtersToggle');
        if (toggle) {
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', 'chevron-down');
                if (window.lucide) {
                    lucide.createIcons();
                }
            }
        }
    }
}

// Manual submit - faqat tugma bosilganda
function initManualSubmit(filtersForm) {
    // Form submit tugmasi
    const submitBtn = filtersForm.querySelector('button[type="submit"]');
    
    if (submitBtn) {
        submitBtn.addEventListener('click', function(e) {
            // Loading ko'rsatish
            showLoading();
            
            // Form yuborish (default behavior)
            // e.preventDefault() qilmaymiz - form o'zi yuboriladi
        });
    }
}

// Filterlarni ochiq holatda ushlab turish
function keepFiltersOpen() {
    localStorage.setItem('keepFiltersOpen', 'true');
}

// Qidiruv funksiyasi - Faqat Enter tugmasi uchun
function initSearch() {
    const searchInput = document.querySelector('input[name="search"]');
    
    if (searchInput) {
        // Faqat Enter tugmasi bosilganda qidirish
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                showLoading();
                this.form.submit();
            }
        });
    }
}

// Jadval funksiyasi
function initTable() {
    // Satr bo'yicha navigatsiya
    const serviceRows = document.querySelectorAll('.service-row');
    serviceRows.forEach(row => {
        row.addEventListener('click', function(e) {
            // Agar checkbox, tugma yoki havola bosilmasa
            if (e.target.closest('input, button, a, .dropdown, .action-buttons-modern')) {
                return;
            }
            
            const serviceId = this.dataset.serviceId;
            if (serviceId) {
                window.location.href = `/services/${serviceId}/`;
            }
        });
        
        // Cursor qo'shish
        row.style.cursor = 'pointer';
    });
}

// Export funksiyasi
function initExport() {
    const exportBtn = document.getElementById('exportBtn');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            showToast('Export funksiyasi tez orada qo\'shiladi', 'info');
        });
    }
}

// Tezkor amallar
function initQuickActions() {
    // Yangi xizmat qo'shish tugmasi
    const addServiceBtn = document.querySelector('a[href*="service_add"]');
    if (addServiceBtn) {
        addServiceBtn.addEventListener('click', function(e) {
            this.classList.add('loading');
            showLoading();
        });
    }
}

// Filter holatini saqlash - Soddalashtirilgan
function saveFilterState() {
    const filtersForm = document.getElementById('filtersForm');
    if (!filtersForm) return;
    
    const formData = new FormData(filtersForm);
    const filters = {};
    
    for (let [key, value] of formData.entries()) {
        // Qidiruv uchun bo'sh qiymatlarni saqlamaslik
        if (key === 'search') {
            if (value && value.trim() !== '') {
                filters[key] = value.trim();
            }
        } else {
            // Boshqa filterlar uchun
            if (value && value.trim() !== '') {
                filters[key] = value;
            }
        }
    }
    
    localStorage.setItem('serviceFilters', JSON.stringify(filters));
}

// Filter holatini yuklash - Soddalashtirilgan versiya
function loadFilterState() {
    // URL parametrlarini olish
    const urlParams = new URLSearchParams(window.location.search);
    
    try {
        const filtersForm = document.getElementById('filtersForm');
        
        if (!filtersForm) return;
        
        // URL dan qiymatlarni formga yuklash
        const inputs = filtersForm.querySelectorAll('input, select');
        inputs.forEach(input => {
            const urlValue = urlParams.get(input.name);
            if (urlValue && urlValue !== '') {
                input.value = urlValue;
                
                // Agar select bo'lsa, selected qilish
                if (input.tagName === 'SELECT') {
                    const option = input.querySelector(`option[value="${urlValue}"]`);
                    if (option) {
                        option.selected = true;
                    }
                }
                
                // Faol filter ko'rsatkichi
                const filterGroup = input.closest('.filter-group');
                if (filterGroup) {
                    filterGroup.classList.add('has-value');
                }
            }
        });
        
    } catch (error) {
        localStorage.removeItem('serviceFilters');
        localStorage.removeItem('keepFiltersOpen');
    }
}

// Klaviatura tugmalari
function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + F - qidiruv
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.querySelector('input[name="search"]');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Ctrl/Cmd + N - yangi xizmat
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            const addBtn = document.querySelector('a[href*="service_add"]');
            if (addBtn) {
                addBtn.click();
            }
        }
    });
}

// Qo'shimcha funksiyalar - Soddalashtirilgan versiya
function initAdvancedFeatures() {
    initKeyboardShortcuts();
    
    // Sahifa yuklangandan keyin filter holatini tekshirish
    setTimeout(() => {
        loadFilterState();
    }, 200);
}

// Utility funksiyalar
function showLoading() {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.style.display = 'block';
    } else {
        // Agar loading elementi bo'lmasa, yaratish
        const loading = document.createElement('div');
        loading.id = 'loading';
        loading.innerHTML = `
            <div class="loading-overlay">
                <div class="loading-spinner"></div>
                <div class="loading-text">Yuklanmoqda...</div>
            </div>
        `;
        loading.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;
        document.body.appendChild(loading);
    }
}

function hideLoading() {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

function showToast(message, type = 'info') {
    console.log(`📢 Toast [${type}]:`, message);
    
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
           document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

// Window load hodisasi
window.addEventListener('load', function() {
    hideLoading();
    console.log('🎉 Sahifa to\'liq yuklandi');
});

// Export qilish
window.servicesFunctions = {
    showToast,
    showLoading,
    hideLoading,
    saveFilterState,
    loadFilterState,
    getCSRFToken,
    clearAllFilters,
    keepFiltersOpen
};