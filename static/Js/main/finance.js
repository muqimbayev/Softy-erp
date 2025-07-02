// Finance JavaScript - Moliya bo'limi

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all finance functions
    initializeFinanceModule();
});

function initializeFinanceModule() {
    // Auto-submit filter forms
    setupFilterAutoSubmit();
    
    // Number formatting
    formatNumbers();
    
    // Tooltip initialization
    initializeTooltips();
    
    // Confirmation dialogs
    setupConfirmationDialogs();
    
    // Auto-refresh statistics
    if (typeof autoRefreshStats !== 'undefined' && autoRefreshStats) {
        setInterval(refreshStatistics, 60000); // 1 minute
    }
}

// Filter form auto-submit
function setupFilterAutoSubmit() {
    const filterForm = document.querySelector('.filter-form');
    if (filterForm) {
        const inputs = filterForm.querySelectorAll('select, input[type="date"]');
        inputs.forEach(input => {
            input.addEventListener('change', function() {
                // Add small delay to allow multiple selections
                setTimeout(() => {
                    filterForm.submit();
                }, 100);
            });
        });
    }
}

// Number formatting for amounts
function formatNumbers() {
    const amountElements = document.querySelectorAll('.amount-cell, .total-amount');
    amountElements.forEach(element => {
        const value = element.textContent.replace(/[^\d.-]/g, '');
        if (!isNaN(value) && value !== '') {
            const formatted = new Intl.NumberFormat('uz-UZ').format(parseFloat(value));
            element.textContent = formatted + ' so\'m';
        }
    });
}

// Tooltip initialization
function initializeTooltips() {
    const tooltipElements = document.querySelectorAll('[title]');
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(event) {
    const element = event.target;
    const title = element.getAttribute('title');
    
    if (!title) return;
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.textContent = title;
    tooltip.style.cssText = `
        position: absolute;
        background: #1f2937;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        z-index: 1000;
        pointer-events: none;
        white-space: nowrap;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    
    document.body.appendChild(tooltip);
    
    // Position tooltip
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
    
    // Store reference
    element._tooltip = tooltip;
    
    // Remove title to prevent browser tooltip
    element.setAttribute('data-original-title', title);
    element.removeAttribute('title');
}

function hideTooltip(event) {
    const element = event.target;
    if (element._tooltip) {
        document.body.removeChild(element._tooltip);
        element._tooltip = null;
    }
    
    // Restore title
    const originalTitle = element.getAttribute('data-original-title');
    if (originalTitle) {
        element.setAttribute('title', originalTitle);
        element.removeAttribute('data-original-title');
    }
}

// Confirmation dialogs
function setupConfirmationDialogs() {
    // Delete confirmation dialogs are handled by dedicated delete pages
    // No need for additional JavaScript confirmations
}

// Statistics refresh
function refreshStatistics() {
    const statsCards = document.querySelectorAll('.stat-card');
    
    fetch(window.location.href, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.statistics) {
            updateStatistics(data.statistics);
        }
    })
    .catch(error => {
        console.log('Statistics update failed:', error);
    });
}

function updateStatistics(stats) {
    // Update total amount
    const totalAmountElement = document.querySelector('.stat-card h3');
    if (totalAmountElement && stats.total_amount) {
        totalAmountElement.textContent = new Intl.NumberFormat('uz-UZ').format(stats.total_amount) + ' so\'m';
    }
}

// Expense form specific functions
function initializeExpenseForm() {
    const expenseTypeSelect = document.getElementById('expense_type');
    const categorySelect = document.getElementById('category_select');
    const amountInput = document.getElementById('base_amount');
    
    if (expenseTypeSelect) {
        expenseTypeSelect.addEventListener('change', function() {
            handleExpenseTypeChange(this.value);
        });
        
        // Trigger initial change if value exists
        if (expenseTypeSelect.value) {
            handleExpenseTypeChange(expenseTypeSelect.value);
        }
    }
    
    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            handleCategoryChange(this.value);
        });
        
        // Trigger initial change if value exists
        if (categorySelect.value) {
            handleCategoryChange(categorySelect.value);
        }
    }
    
    if (amountInput) {
        amountInput.addEventListener('input', function() {
            calculateTotalAmount();
        });
        
        // Format input as user types
        amountInput.addEventListener('input', function(e) {
            formatAmountInput(e.target);
        });
    }
}

function handleExpenseTypeChange(expenseType) {
    const employeeSection = document.getElementById('employee-section');
    const serviceSection = document.getElementById('service-section');
    
    // Hide all sections first
    if (employeeSection) employeeSection.style.display = 'none';
    if (serviceSection) serviceSection.style.display = 'none';
    
    // Show relevant section
    switch(expenseType) {
        case 'monthly':
            if (employeeSection) employeeSection.style.display = 'block';
            break;
        case 'service':
            if (serviceSection) serviceSection.style.display = 'block';
            break;
        case 'company':
            // Neither section needed
            break;
    }
    
    // Add visual feedback
    const sections = document.querySelectorAll('.employee-section, .service-section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(-10px)';
        
        if (section.style.display !== 'none') {
            setTimeout(() => {
                section.style.transition = 'all 0.3s ease';
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            }, 50);
        }
    });
}

function handleCategoryChange(categoryId) {
    const taxInfo = document.getElementById('tax-info');
    const taxCalculation = document.getElementById('tax-calculation');
    
    if (!categoryId) {
        if (taxInfo) taxInfo.textContent = '';
        if (taxCalculation) taxCalculation.style.display = 'none';
        return;
    }
    
    // Get category tax rate via AJAX
    fetch(`/finance/category-tax/?category_id=${categoryId}`)
        .then(response => response.json())
        .then(data => {
            if (taxInfo && taxCalculation) {
                if (data.tax_rate > 0) {
                    taxInfo.innerHTML = `<i class="fas fa-info-circle"></i> Bu kategoriya ${data.tax_rate}% soliq stavkasiga ega`;
                    taxCalculation.style.display = 'block';
                    document.getElementById('tax-rate-display').textContent = data.tax_rate;
                    calculateTotalAmount();
                } else {
                    taxInfo.innerHTML = `<i class="fas fa-check-circle"></i> Bu kategoriya soliqsiz`;
                    taxCalculation.style.display = 'none';
                }
            }
        })
        .catch(error => {
            console.error('Category tax fetch error:', error);
            if (taxInfo) {
                taxInfo.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Soliq ma\'lumotini yuklab bo\'lmadi';
            }
        });
}

function calculateTotalAmount() {
    const baseAmountInput = document.getElementById('base_amount');
    const taxRateDisplay = document.getElementById('tax-rate-display');
    
    if (!baseAmountInput || !taxRateDisplay) return;
    
    const baseAmount = parseFloat(baseAmountInput.value) || 0;
    const taxRate = parseFloat(taxRateDisplay.textContent) || 0;
    
    const taxAmount = baseAmount * (taxRate / 100);
    const totalAmount = baseAmount + taxAmount;
    
    // Update display elements
    const baseAmountDisplay = document.getElementById('base-amount-display');
    const taxAmountDisplay = document.getElementById('tax-amount-display');
    const totalAmountDisplay = document.getElementById('total-amount-display');
    
    if (baseAmountDisplay) {
        baseAmountDisplay.textContent = formatCurrency(baseAmount);
    }
    
    if (taxAmountDisplay) {
        taxAmountDisplay.textContent = formatCurrency(taxAmount);
    }
    
    if (totalAmountDisplay) {
        totalAmountDisplay.textContent = formatCurrency(totalAmount);
    }
    
    // Add visual feedback for calculation
    const calculationCard = document.querySelector('.calculation-card');
    if (calculationCard && baseAmount > 0) {
        calculationCard.style.transform = 'scale(1.02)';
        setTimeout(() => {
            calculationCard.style.transform = 'scale(1)';
        }, 200);
    }
}

function formatAmountInput(input) {
    // Remove non-numeric characters except decimal point
    let value = input.value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    input.value = value;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('uz-UZ', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount) + ' so\'m';
}

// Search functionality
function initializeSearch() {
    const searchInput = document.querySelector('input[name="search"]');
    if (searchInput) {
        let searchTimeout;
        
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(this.value);
            }, 500);
        });
    }
}

function performSearch(query) {
    const tableRows = document.querySelectorAll('.expenses-table tbody tr');
    
    tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const isVisible = text.includes(query.toLowerCase());
        
        row.style.display = isVisible ? '' : 'none';
        
        if (isVisible && query.length > 0) {
            // Highlight matching text
            highlightText(row, query);
        } else {
            // Remove highlighting
            removeHighlight(row);
        }
    });
    
    // Update row count
    const visibleRows = document.querySelectorAll('.expenses-table tbody tr[style=""]').length;
    updateSearchResults(visibleRows);
}

function highlightText(element, query) {
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    const textNodes = [];
    let node;
    
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }
    
    textNodes.forEach(textNode => {
        const text = textNode.textContent;
        const regex = new RegExp(`(${query})`, 'gi');
        
        if (regex.test(text)) {
            const highlightedText = text.replace(regex, '<mark>$1</mark>');
            const span = document.createElement('span');
            span.innerHTML = highlightedText;
            textNode.parentNode.replaceChild(span, textNode);
        }
    });
}

function removeHighlight(element) {
    const marks = element.querySelectorAll('mark');
    marks.forEach(mark => {
        mark.outerHTML = mark.innerHTML;
    });
}

function updateSearchResults(count) {
    let resultInfo = document.querySelector('.search-results-info');
    
    if (!resultInfo) {
        resultInfo = document.createElement('div');
        resultInfo.className = 'search-results-info';
        resultInfo.style.cssText = `
            padding: 10px;
            background: #f0f9ff;
            border: 1px solid #0284c7;
            border-radius: 6px;
            margin: 10px 0;
            color: #0c4a6e;
            font-size: 14px;
        `;
        
        const table = document.querySelector('.table-container');
        if (table) {
            table.parentNode.insertBefore(resultInfo, table);
        }
    }
    
    resultInfo.textContent = `${count} ta natija topildi`;
    
    if (count === 0) {
        resultInfo.style.background = '#fef2f2';
        resultInfo.style.borderColor = '#dc2626';
        resultInfo.style.color = '#991b1b';
        resultInfo.textContent = 'Hech qanday natija topilmadi';
    }
}

// Export functions
function exportToExcel() {
    const table = document.querySelector('.expenses-table');
    if (!table) return;
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.table_to_sheet(table);
    
    // Add to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Xarajatlar');
    
    // Save file
    const fileName = `xarajatlar_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

function exportToPDF() {
    window.print();
}

// Print functionality
function setupPrintStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @media print {
            .finance-header .header-right,
            .filter-section,
            .pagination-container,
            .action-buttons {
                display: none !important;
            }
            
            .table-container {
                box-shadow: none;
                border: 1px solid #ddd;
            }
            
            .expenses-table th,
            .expenses-table td {
                border: 1px solid #ddd;
                padding: 8px;
                font-size: 12px;
            }
            
            .page-title {
                font-size: 24px;
                margin-bottom: 20px;
            }
        }
    `;
    document.head.appendChild(style);
}

// Quick actions for expense management
function quickDeleteExpense(expenseId) {
    if (confirm('Bu xarajatni o\'chirish tasdiqlansinmi?')) {
        fetch(`/finance/expenses/${expenseId}/delete/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (response.ok) {
                // Remove row from table
                const row = document.querySelector(`tr[data-expense-id="${expenseId}"]`);
                if (row) {
                    row.style.animation = 'fadeOut 0.3s ease-out';
                    setTimeout(() => {
                        row.remove();
                        updateTableStatistics();
                    }, 300);
                }
                
                showNotification('Xarajat muvaffaqiyatli o\'chirildi', 'success');
            } else {
                showNotification('Xatolik yuz berdi', 'error');
            }
        })
        .catch(error => {
            console.error('Delete error:', error);
            showNotification('Xatolik yuz berdi', 'error');
        });
    }
}

function updateTableStatistics() {
    const rows = document.querySelectorAll('.expenses-table tbody tr:not([style*="display: none"])');
    const total = Array.from(rows).reduce((sum, row) => {
        const amountCell = row.querySelector('.amount-cell');
        if (amountCell) {
            const amount = parseFloat(amountCell.textContent.replace(/[^\d.-]/g, '')) || 0;
            return sum + amount;
        }
        return sum;
    }, 0);
    
    // Update total amount display
    const totalAmountElement = document.querySelector('.stat-card h3');
    if (totalAmountElement) {
        totalAmountElement.textContent = formatCurrency(total);
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
        max-width: 350px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    
    // Set background color based on type
    switch(type) {
        case 'success':
            notification.style.background = '#10b981';
            break;
        case 'error':
            notification.style.background = '#ef4444';
            break;
        case 'warning':
            notification.style.background = '#f59e0b';
            break;
        default:
            notification.style.background = '#3b82f6';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Utility functions
function getCsrfToken() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrftoken') {
            return value;
        }
    }
    return '';
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

// Add CSS animations
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: scale(1);
        }
        to {
            opacity: 0;
            transform: scale(0.95);
        }
    }
    
    .table-container {
        transition: all 0.3s ease;
    }
    
    .calculation-card {
        transition: transform 0.2s ease;
    }
    
    .employee-section,
    .service-section {
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(animationStyles);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFinanceModule);
} else {
    initializeFinanceModule();
}