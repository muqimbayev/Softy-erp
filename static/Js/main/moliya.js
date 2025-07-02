// Moliya JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const addIncomeBtn = document.getElementById('addIncomeBtn');
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    
    // Initialize modals properly
    let incomeModal = null;
    let expenseModal = null;
    
    // Check if Bootstrap is available
    if (typeof bootstrap !== 'undefined') {
        incomeModal = new bootstrap.Modal(document.getElementById('incomeModal'), {
            backdrop: 'static',
            keyboard: false
        });
        expenseModal = new bootstrap.Modal(document.getElementById('expenseModal'), {
            backdrop: 'static',
            keyboard: false
        });
    }
    
    const searchInput = document.getElementById('searchInput');
    const transactionsTable = document.getElementById('transactionsTable');
    const dateFilter = document.getElementById('dateFilter');
    const typeFilter = document.getElementById('typeFilter');
    const serviceFilter = document.getElementById('serviceFilter');
    
    // Forms
    const incomeForm = document.getElementById('incomeForm');
    const expenseForm = document.getElementById('expenseForm');
    
    // Expense type handling
    const expenseType = document.getElementById('expenseType');
    const salarySection = document.getElementById('salarySection');
    const serviceSection = document.getElementById('serviceSection');
    const employeeSearch = document.getElementById('employeeSearch');
    const expenseEmployee = document.getElementById('expenseEmployee');
    const expenseTitle = document.getElementById('expenseTitle');
    
    // Modal event listeners
    if (addIncomeBtn) {
        addIncomeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openIncomeModal();
        });
    }
    
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openExpenseModal();
        });
    }
    
    // Global modal functions
    window.openIncomeModal = function() {
        resetForm('incomeForm');
        const modal = document.getElementById('incomeModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('show');
            document.body.classList.add('modal-open');
            document.body.style.overflow = 'hidden';
        }
    };
    
    window.closeIncomeModal = function() {
        const modal = document.getElementById('incomeModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            resetForm('incomeForm');
        }
    };
    
    window.openExpenseModal = function() {
        resetForm('expenseForm');
        const modal = document.getElementById('expenseModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('show');
            document.body.classList.add('modal-open');
            document.body.style.overflow = 'hidden';
        }
    };
    
    window.closeExpenseModal = function() {
        const modal = document.getElementById('expenseModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            resetForm('expenseForm');
        }
    };
    
    // Expense type change handler
    expenseType.addEventListener('change', function() {
        const selectedType = this.value;
        
        // Hide all sections
        salarySection.style.display = 'none';
        serviceSection.style.display = 'none';
        
        // Reset form fields
        expenseEmployee.value = '';
        document.getElementById('expenseServiceSelect').value = '';
        expenseTitle.value = '';
        
        // Show relevant section and set title
        switch(selectedType) {
            case 'salary':
                salarySection.style.display = 'block';
                expenseTitle.placeholder = 'Masalan: Iyun oyi maoshi';
                break;
            case 'service':
                serviceSection.style.display = 'block';
                expenseTitle.placeholder = 'Masalan: Loyiha uchun material xarid';
                break;
            case 'other':
                expenseTitle.placeholder = 'Xarajat tavsifini kiriting';
                break;
        }
    });
    
    // Employee search functionality
    let employeeDropdown = null;
    
    employeeSearch.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        // Remove existing dropdown
        if (employeeDropdown) {
            employeeDropdown.remove();
            employeeDropdown = null;
        }
        
        if (searchTerm.length < 2) return;
        
        // Get matching employees
        const employees = Array.from(expenseEmployee.options).slice(1); // Skip first empty option
        const matches = employees.filter(option => 
            option.dataset.name.toLowerCase().includes(searchTerm)
        );
        
        if (matches.length > 0) {
            createEmployeeDropdown(matches);
        }
    });
    
    function createEmployeeDropdown(employees) {
        employeeDropdown = document.createElement('div');
        employeeDropdown.className = 'employee-dropdown';
        
        employees.forEach(employee => {
            const option = document.createElement('div');
            option.className = 'employee-option';
            option.textContent = employee.dataset.name;
            option.addEventListener('click', function() {
                employeeSearch.value = employee.dataset.name;
                expenseEmployee.value = employee.value;
                expenseTitle.value = `${employee.dataset.name} - Oylik`;
                employeeDropdown.remove();
                employeeDropdown = null;
            });
            employeeDropdown.appendChild(option);
        });
        
        employeeSearch.parentNode.appendChild(employeeDropdown);
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (employeeDropdown && !employeeSearch.contains(e.target) && !employeeDropdown.contains(e.target)) {
            employeeDropdown.remove();
            employeeDropdown = null;
        }
    });
    
    // Search functionality
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        filterTransactions();
    });
    
    // Filter functionality
    dateFilter.addEventListener('change', filterTransactions);
    typeFilter.addEventListener('change', filterTransactions);
    serviceFilter.addEventListener('change', filterTransactions);
    
    function filterTransactions() {
        const searchTerm = searchInput.value.toLowerCase();
        const dateFilterValue = dateFilter.value;
        const typeFilterValue = typeFilter.value;
        const serviceFilterValue = serviceFilter.value;
        const rows = transactionsTable.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            let showRow = true;
            
            // Search filter
            if (searchTerm) {
                const rowText = row.textContent.toLowerCase();
                if (!rowText.includes(searchTerm)) {
                    showRow = false;
                }
            }
            
            // Type filter
            if (typeFilterValue !== 'all') {
                const rowType = row.dataset.type;
                if (rowType !== typeFilterValue) {
                    showRow = false;
                }
            }
            
            // Service filter
            if (serviceFilterValue !== 'all') {
                const rowService = row.dataset.service;
                if (rowService !== serviceFilterValue) {
                    showRow = false;
                }
            }
            
            // Date filter (simplified - you can enhance this)
            if (dateFilterValue !== 'all') {
                // Add date filtering logic here based on your needs
                // This is a placeholder for date filtering
            }
            
            row.style.display = showRow ? '' : 'none';
        });
    }
    
    // Form submission handlers
    incomeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        
        // Add loading state
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Saqlanmoqda...';
        submitBtn.disabled = true;
        
        // Submit form
        fetch('/finance/add-income/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Daromad muvaffaqiyatli qo\'shildi!', 'success');
                closeIncomeModal();
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } else {
                showNotification('Xatolik yuz berdi: ' + (data.message || 'Noma\'lum xatolik'), 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Tarmoq xatoligi yuz berdi', 'error');
        })
        .finally(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    });
    
    expenseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        
        // Add employee ID if salary type
        if (expenseType.value === 'salary' && expenseEmployee.value) {
            formData.set('employee', expenseEmployee.value);
        }
        
        // Add service ID if service type
        if (expenseType.value === 'service') {
            const serviceSelect = document.getElementById('expenseServiceSelect');
            formData.set('service', serviceSelect.value);
        }
        
        // Add loading state
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Saqlanmoqda...';
        submitBtn.disabled = true;
        
        // Submit form
        fetch('/finance/add-expense/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Xarajat muvaffaqiyatli qo\'shildi!', 'success');
                closeExpenseModal();
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } else {
                showNotification('Xatolik yuz berdi: ' + (data.message || 'Noma\'lum xatolik'), 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Tarmoq xatoligi yuz berdi', 'error');
        })
        .finally(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    });
    
    // View and Edit button handlers
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-action.view')) {
            const row = e.target.closest('tr');
            const type = row.dataset.type;
            const id = row.dataset.id;
            
            // Implement view functionality
            console.log(`View ${type} with ID: ${id}`);
        }
        
        if (e.target.closest('.btn-action.edit')) {
            const row = e.target.closest('tr');
            const type = row.dataset.type;
            const id = row.dataset.id;
            
            // Implement edit functionality
            console.log(`Edit ${type} with ID: ${id}`);
        }
    });
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('incomeDate').value = today;
    document.getElementById('expenseDate').value = today;
    
    // Helper functions
    function resetForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            
            // Remove validation classes
            const inputs = form.querySelectorAll('.is-invalid');
            inputs.forEach(input => input.classList.remove('is-invalid'));
            
            if (formId === 'expenseForm') {
                const salarySection = document.getElementById('salarySection');
                const serviceSection = document.getElementById('serviceSection');
                const employeeSearch = document.getElementById('employeeSearch');
                const expenseEmployee = document.getElementById('expenseEmployee');
                const expenseType = document.getElementById('expenseType');
                
                if (salarySection) salarySection.style.display = 'none';
                if (serviceSection) serviceSection.style.display = 'none';
                if (employeeSearch) employeeSearch.value = '';
                if (expenseEmployee) expenseEmployee.value = '';
                if (expenseType) expenseType.value = '';
                
                // Remove any existing employee dropdown
                const existingDropdown = document.querySelector('.employee-dropdown');
                if (existingDropdown) {
                    existingDropdown.remove();
                }
            }
        }
    }
    
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            
            // Remove backdrop if exists
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            
            // Reset form
            if (modalId === 'incomeModal') {
                resetForm('incomeForm');
            } else if (modalId === 'expenseModal') {
                resetForm('expenseForm');
            }
        }
    }
    
    // Close modal when clicking backdrop
    document.addEventListener('click', function(e) {
        // Close income modal when clicking backdrop
        if (e.target.id === 'incomeModal') {
            closeIncomeModal();
        }
        
        // Close expense modal when clicking backdrop
        if (e.target.id === 'expenseModal') {
            closeExpenseModal();
        }
    });
    
    // Close modal with ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const incomeModal = document.getElementById('incomeModal');
            const expenseModal = document.getElementById('expenseModal');
            
            if (incomeModal && incomeModal.classList.contains('show')) {
                closeIncomeModal();
            }
            
            if (expenseModal && expenseModal.classList.contains('show')) {
                closeExpenseModal();
            }
        }
    });
    
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        // Add styles if not exists
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    padding: 16px;
                    min-width: 300px;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    animation: slideIn 0.3s ease;
                }
                
                .notification-success {
                    border-left: 4px solid #28a745;
                }
                
                .notification-error {
                    border-left: 4px solid #dc3545;
                }
                
                .notification-info {
                    border-left: 4px solid #17a2b8;
                }
                
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .notification-success .fas {
                    color: #28a745;
                }
                
                .notification-error .fas {
                    color: #dc3545;
                }
                
                .notification-info .fas {
                    color: #17a2b8;
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    opacity: 0.5;
                }
                
                .notification-close:hover {
                    opacity: 1;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add to body
        document.body.appendChild(notification);
        
        // Close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', function() {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
    }
    
    // Format numbers in the table and stats
    function formatNumbers() {
        // Format amounts in table
        const amountCells = document.querySelectorAll('.amount');
        amountCells.forEach(cell => {
            const text = cell.textContent;
            const number = text.match(/[\d,]+/);
            if (number) {
                const formatted = parseInt(number[0].replace(/,/g, '')).toLocaleString();
                cell.textContent = text.replace(number[0], formatted);
            }
        });
        
        // Format numbers in stats cards
        const formatNumberElements = document.querySelectorAll('.format-number');
        formatNumberElements.forEach(element => {
            const number = parseInt(element.textContent.replace(/[^\d]/g, ''));
            if (!isNaN(number)) {
                element.textContent = number.toLocaleString();
            }
        });
    }
    
    // Initialize number formatting
    formatNumbers();
    
    // Auto-fill title based on selections
    document.getElementById('expenseServiceSelect').addEventListener('change', function() {
        if (expenseType.value === 'service' && this.value) {
            const serviceName = this.options[this.selectedIndex].text;
            expenseTitle.value = `${serviceName} uchun xarajat`;
        }
    });
    
    // Validation helpers
    function validateForm(formElement) {
        const requiredFields = formElement.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('is-invalid');
                isValid = false;
            } else {
                field.classList.remove('is-invalid');
            }
        });
        
        return isValid;
    }
    
    // Add validation styles
    const validationStyle = document.createElement('style');
    validationStyle.textContent = `
        .is-invalid {
            border-color: #dc3545 !important;
            box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
        }
    `;
    document.head.appendChild(validationStyle);
});


