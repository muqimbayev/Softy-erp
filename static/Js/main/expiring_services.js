// Dashboard JavaScript funksiyalari

document.addEventListener('DOMContentLoaded', function() {
    // Dashboard kartalar uchun hover effektlari
    const dashboardCards = document.querySelectorAll('.dashboard-card');
    const tableRows = document.querySelectorAll('.table-row');
    
    // Dashboard kartalar uchun animatsiya
    dashboardCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0px)';
        });
    });
    
    // Table rowlar uchun hover effektlari
    tableRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f8f9fa';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
    });
    
    // Action tugmalar uchun event delegation
    document.addEventListener('click', function(e) {
        if (e.target.closest('.action-btn')) {
            e.stopPropagation();
        }
    });
    
    // Responsive table uchun data-label qo'shish
    addResponsiveLabels();
    
    // Auto-refresh (5 daqiqada bir marta)
    setTimeout(function() {
        location.reload();
    }, 300000);
});

function addResponsiveLabels() {
    const headers = ['Kompaniya va xizmat', 'Muddat', 'Tender holati', 'To\'lov holati', 'Amallar'];
    const rows = document.querySelectorAll('.table-row');
    
    rows.forEach(row => {
        const cols = row.querySelectorAll('.table-col');
        cols.forEach((col, index) => {
            if (headers[index]) {
                col.setAttribute('data-label', headers[index]);
            }
        });
    });
}

// Keyboard navigation for table
document.addEventListener('keydown', function(e) {
    const rows = Array.from(document.querySelectorAll('.table-row'));
    const currentFocused = document.activeElement;
    const currentIndex = rows.indexOf(currentFocused);
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % rows.length;
        if (rows[nextIndex]) {
            rows[nextIndex].focus();
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex <= 0 ? rows.length - 1 : currentIndex - 1;
        if (rows[prevIndex]) {
            rows[prevIndex].focus();
        }
    } else if (e.key === 'Enter' && currentFocused.classList.contains('table-row')) {
        currentFocused.click();
    }
});

// Table rowlarni klaviatura orqali navigatsiya qilish uchun tabindex qo'shish
document.querySelectorAll('.table-row').forEach((row, index) => {
    row.setAttribute('tabindex', index === 0 ? '0' : '-1');
    row.setAttribute('role', 'button');
    
    const serviceName = row.querySelector('.service-name');
    if (serviceName) {
        row.setAttribute('aria-label', `${serviceName.textContent} xizmatini ko'rish`);
    }
});

// Dashboard kartalar animatsiyasi
function animateDashboardCards() {
    const cards = document.querySelectorAll('.dashboard-card');
    
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'all 0.5s ease';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 50);
        }, index * 100);
    });
}

// Sahifa yuklanganda animatsiya
window.addEventListener('load', function() {
    animateDashboardCards();
});

// Search functionality (agar kerak bo'lsa)
function filterServices(searchTerm) {
    const rows = document.querySelectorAll('.table-row');
    
    rows.forEach(row => {
        const serviceName = row.querySelector('.service-name').textContent.toLowerCase();
        const companyName = row.querySelector('.company-name').textContent.toLowerCase();
        
        if (serviceName.includes(searchTerm.toLowerCase()) || 
            companyName.includes(searchTerm.toLowerCase())) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}