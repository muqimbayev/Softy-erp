 // static/js/main/companies.js

document.addEventListener('DOMContentLoaded', function() {
    initCompaniesPage();
    console.log('🏢 Companies.js initialized');
});

function initCompaniesPage() {
    // Initialize search and filters
    initSearchAndFilters();
    
    // Initialize table interactions
    initTableFeatures();
    
    console.log('Companies page features initialized');
}

// Search and filter functionality
function initSearchAndFilters() {
    const searchInput = document.getElementById('searchInput');
    const sortFilter = document.getElementById('sortFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchCompanies(this.value);
        });
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', function() {
            sortCompanies(this.value);
        });
    }
}

// Search companies
function searchCompanies(searchTerm) {
    const rows = document.querySelectorAll('.company-row');
    const searchLower = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const name = row.dataset.name || '';
        const stir = row.dataset.stir || '';
        const companyName = row.querySelector('.company-name')?.textContent.toLowerCase() || '';
        const email = row.querySelector('.company-email')?.textContent.toLowerCase() || '';
        const phone = row.querySelector('.phone-number')?.textContent.toLowerCase() || '';
        
        const matches = name.includes(searchLower) ||
                       stir.includes(searchLower) ||
                       companyName.includes(searchLower) ||
                       email.includes(searchLower) ||
                       phone.includes(searchLower);
        
        row.style.display = matches ? '' : 'none';
    });
    
    updateCompanyCount();
}

// Sort companies
function sortCompanies(sortBy) {
    const tbody = document.getElementById('companiesTableBody');
    if (!tbody) return;
    
    const rows = Array.from(tbody.querySelectorAll('.company-row'));
    
    rows.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
            case 'name':
                aValue = a.querySelector('.company-name')?.textContent || '';
                bValue = b.querySelector('.company-name')?.textContent || '';
                return aValue.localeCompare(bValue);
                
            case 'stir':
                aValue = a.querySelector('.stir-number')?.textContent || '';
                bValue = b.querySelector('.stir-number')?.textContent || '';
                return aValue.localeCompare(bValue);
                
            case 'date':
                aValue = a.querySelector('.created-date')?.textContent || '';
                bValue = b.querySelector('.created-date')?.textContent || '';
                // Convert dd.mm.yyyy to comparable format
                const dateA = aValue.split('.').reverse().join('');
                const dateB = bValue.split('.').reverse().join('');
                return dateB.localeCompare(dateA); // Newest first
                
            default:
                return 0;
        }
    });
    
    // Re-append sorted rows
    rows.forEach(row => tbody.appendChild(row));
}

// Update visible company count
function updateCompanyCount() {
    const visibleRows = document.querySelectorAll('.company-row:not([style*="display: none"])');
    const totalRows = document.querySelectorAll('.company-row');
    
    console.log(`Showing ${visibleRows.length} of ${totalRows.length} companies`);
    
    // You can add a counter display here if needed
    // const counter = document.querySelector('.company-counter');
    // if (counter) {
    //     counter.textContent = `${visibleRows.length} dan ${totalRows.length}`;
    // }
}

// Table features
function initTableFeatures() {
    // Row click navigation (optional)
    const companyRows = document.querySelectorAll('.company-row');
    
    companyRows.forEach(row => {
        row.addEventListener('click', function(e) {
            // Don't navigate if clicking on action buttons
            if (e.target.closest('.action-buttons')) {
                return;
            }
            
            const nameLink = row.querySelector('.company-name');
            if (nameLink) {
                window.location.href = nameLink.href;
            }
        });
        
        // Add hover cursor
        row.style.cursor = 'pointer';
    });
}

// Phone number formatting (for display)
function formatPhoneDisplay(phone) {
    if (!phone || phone === '—') return phone;
    
    // Format +998901234567 to +998 90 123 45 67
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('998')) {
        return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10)}`;
    }
    return phone;
}

// STIR validation helper
function validateSTIR(stir) {
    return /^\d{9}$/.test(stir);
}

// Export functions for external use
window.companyFunctions = {
    searchCompanies,
    sortCompanies,
    updateCompanyCount,
    validateSTIR
};

console.log('🏢 Companies.js loaded successfully');