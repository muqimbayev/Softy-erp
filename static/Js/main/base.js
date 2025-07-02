// static/js/base.js - Base functionality

document.addEventListener('DOMContentLoaded', function() {
    
    // Elements
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userMenuDropdown = document.getElementById('userMenuDropdown');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    // Sidebar functionality
    function initSidebar() {
        // Desktop sidebar toggle
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', function() {
                sidebar.classList.toggle('collapsed');
                localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
            });
        }
        
        // Mobile menu toggle
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', function() {
                sidebar.classList.toggle('mobile-open');
            });
        }
        
        // Restore sidebar state
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed && window.innerWidth > 768) {
            sidebar.classList.add('collapsed');
        }
        
        // Submenu handling
        const navLinks = document.querySelectorAll('.nav-link.has-submenu');
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const navItem = this.closest('.nav-item');
                const isOpen = navItem.classList.contains('open');
                
                // Close all other submenus
                document.querySelectorAll('.nav-item.open').forEach(item => {
                    if (item !== navItem) {
                        item.classList.remove('open');
                    }
                });
                
                // Toggle current submenu
                navItem.classList.toggle('open', !isOpen);
            });
        });
        
        // Close mobile menu on outside click
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                    sidebar.classList.remove('mobile-open');
                }
            }
        });
        
        // Close sidebar on window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('mobile-open');
            }
        });
    }
    
    // Notification dropdown
    function initNotifications() {
        if (notificationBtn && notificationDropdown) {
            notificationBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                notificationDropdown.classList.toggle('show');
                userMenuDropdown?.classList.remove('show');
            });
            
            // Mark all as read
            const markAllReadBtn = document.querySelector('.mark-all-read');
            if (markAllReadBtn) {
                markAllReadBtn.addEventListener('click', function() {
                    const unreadItems = document.querySelectorAll('.notification-item.unread');
                    unreadItems.forEach(item => {
                        item.classList.remove('unread');
                    });
                    
                    // Update badge
                    const badge = document.querySelector('.notification-badge');
                    if (badge) {
                        badge.textContent = '0';
                        badge.style.display = 'none';
                    }
                    
                    showToast('Barcha bildirishnomalar o\'qilgan deb belgilandi', 'success');
                });
            }
        }
    }
    
    // User menu dropdown
    function initUserMenu() {
        if (userMenuBtn && userMenuDropdown) {
            userMenuBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                userMenuDropdown.classList.toggle('show');
                notificationDropdown?.classList.remove('show');
            });
        }
    }
    
    // Close dropdowns on outside click
    function initDropdownClose() {
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.notification-container')) {
                notificationDropdown?.classList.remove('show');
            }
            if (!e.target.closest('.user-menu-container')) {
                userMenuDropdown?.classList.remove('show');
            }
        });
    }
    
    // Search functionality
    function initSearch() {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            let searchTimeout;
            
            searchInput.addEventListener('input', function() {
                const query = this.value.trim();
                
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    if (query.length >= 2) {
                        performSearch(query);
                    }
                }, 300);
            });
            
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const query = this.value.trim();
                    if (query.length >= 2) {
                        performSearch(query);
                    }
                }
            });
        }
    }
    
    // Perform search
    function performSearch(query) {
        console.log('Qidiruv:', query);
        // Bu yerda AJAX request yuboriladi
        showLoading();
        
        // Simulate API call
        setTimeout(() => {
            hideLoading();
            showToast(`"${query}" uchun qidiruv natijalari`, 'info');
        }, 1000);
    }
    
    // Alert/Message handling
    function initAlerts() {
        const alerts = document.querySelectorAll('.alert-dismissible');
        alerts.forEach(alert => {
            const closeBtn = alert.querySelector('.alert-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    alert.style.opacity = '0';
                    alert.style.transform = 'translateY(-10px)';
                    setTimeout(() => {
                        alert.remove();
                    }, 300);
                });
            }
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (alert.parentNode) {
                    closeBtn?.click();
                }
            }, 5000);
        });
    }
    
    // Loading overlay
    function showLoading() {
        if (loadingOverlay) {
            loadingOverlay.classList.add('show');
        }
    }
    
    function hideLoading() {
        if (loadingOverlay) {
            loadingOverlay.classList.remove('show');
        }
    }
    
    // Toast notifications
    function showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i data-lucide="${getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close">
                <i data-lucide="x"></i>
            </button>
        `;
        
        // Add toast to container
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        toastContainer.appendChild(toast);
        
        // Initialize icons
        if (window.lucide) {
            lucide.createIcons();
        }
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto-hide
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
        
        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });
    }
    
    function getToastIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'x-circle',
            'warning': 'alert-triangle',
            'info': 'info'
        };
        return icons[type] || 'info';
    }
    
    // Navigation active state
    function updateActiveNavigation() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href && currentPath.includes(href) && href !== '#') {
                link.classList.add('active');
                // Open parent submenu if exists
                const navItem = link.closest('.nav-item');
                if (navItem) {
                    navItem.classList.add('open');
                }
            }
        });
    }
    
    // Form validation helper
    function validateForm(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                showFieldError(field, 'Bu maydon majburiy');
                isValid = false;
            } else {
                clearFieldError(field);
            }
        });
        
        return isValid;
    }
    
    function showFieldError(field, message) {
        clearFieldError(field);
        
        field.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error-message';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }
    
    function clearFieldError(field) {
        field.classList.remove('error');
        const errorMsg = field.parentNode.querySelector('.field-error-message');
        if (errorMsg) {
            errorMsg.remove();
        }
    }
    
    // Utility functions
    function formatNumber(num) {
        return new Intl.NumberFormat('uz-UZ').format(num);
    }
    
    function formatCurrency(amount) {
        return `${formatNumber(amount)} so'm`;
    }
    
    function formatDate(date) {
        return new Intl.DateTimeFormat('uz-UZ').format(new Date(date));
    }
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Initialize all functionality
    function init() {
        initSidebar();
        initNotifications();
        initUserMenu();
        initDropdownClose();
        initSearch();
        initAlerts();
        updateActiveNavigation();
        
        console.log('✅ Base.js initialized');
    }
    
    // Global functions
    window.showLoading = showLoading;
    window.hideLoading = hideLoading;
    window.showToast = showToast;
    window.validateForm = validateForm;
    window.formatNumber = formatNumber;
    window.formatCurrency = formatCurrency;
    window.formatDate = formatDate;
    window.debounce = debounce;
    
    // Initialize
    init();
    
    // Re-initialize on AJAX content load
    document.addEventListener('contentLoaded', init);
});

