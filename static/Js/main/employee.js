// static/js/main/employees.js

document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize employees functionality
    initEmployeeList();
    initEmployeeForms();
    
    console.log('👥 Employees.js initialized');
});

// Employee List Functions
function initEmployeeList() {
    // Filter functionality
    initFilters();
    
    // Table interactions
    initTableFeatures();
    
    // Add employee button
    initAddEmployeeBtn();
}

// Initialize filters
function initFilters() {
    const positionFilter = document.getElementById('positionFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (positionFilter) {
        positionFilter.addEventListener('change', filterEmployees);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterEmployees);
    }
}

// Filter employees table
function filterEmployees() {
    const positionFilter = document.getElementById('positionFilter');
    const statusFilter = document.getElementById('statusFilter');
    const rows = document.querySelectorAll('.employee-row');
    
    const selectedPosition = positionFilter ? positionFilter.value : '';
    const selectedStatus = statusFilter ? statusFilter.value : '';
    
    rows.forEach(row => {
        const position = row.dataset.position;
        const status = row.dataset.status;
        
        let showRow = true;
        
        // Position filter
        if (selectedPosition && position !== selectedPosition) {
            showRow = false;
        }
        
        // Status filter  
        if (selectedStatus && status !== selectedStatus) {
            showRow = false;
        }
        
        row.style.display = showRow ? '' : 'none';
    });
    
    // Update count
    updateEmployeeCount();
}

// Update visible employee count
function updateEmployeeCount() {
    const visibleRows = document.querySelectorAll('.employee-row:not([style*="display: none"])');
    const totalRows = document.querySelectorAll('.employee-row');
    
    // You can add a counter display here if needed
    console.log(`Showing ${visibleRows.length} of ${totalRows.length} employees`);
}

// Table features
function initTableFeatures() {
    // Row click navigation (optional)
    const employeeRows = document.querySelectorAll('.employee-row');
    
    employeeRows.forEach(row => {
        row.addEventListener('click', function(e) {
            // Don't navigate if clicking on action buttons
            if (e.target.closest('.action-buttons')) {
                return;
            }
            
            const nameLink = row.querySelector('.employee-name');
            if (nameLink) {
                window.location.href = nameLink.href;
            }
        });
        
        // Add hover cursor
        row.style.cursor = 'pointer';
    });
}

// Add employee button
function initAddEmployeeBtn() {
    // Button artiq link sifatida ishlaydi
    console.log('Add employee button working as link');
}

// Employee Forms Functions
function initEmployeeForms() {
    // Form validation
    initFormValidation();
    
    // Password form features
    initPasswordForm();
    
    // Form auto-save (optional)
    // initAutoSave();
}

// Form validation
function initFormValidation() {
    const forms = document.querySelectorAll('.employee-form, .password-form');
    
    forms.forEach(form => {
        // Real-time validation
        const inputs = form.querySelectorAll('input, select');
        
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                clearFieldError(this);
            });
        });
        
        // Form submit validation
        form.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
                showToast('Ma\'lumotlarda xatolik bor. Iltimos, tekshiring.', 'error');
            }
        });
    });
}

// Validate single field
function validateField(field) {
    const fieldGroup = field.closest('.form-group');
    const errorDiv = fieldGroup.querySelector('.field-error');
    
    // Remove existing errors
    clearFieldError(field);
    
    // Required field validation
    if (field.hasAttribute('required') && !field.value.trim()) {
        showFieldError(field, 'Bu maydon to\'ldirilishi shart');
        return false;
    }
    
    // Phone number validation
    if (field.name === 'phone_number' && field.value) {
        const phoneRegex = /^\+998\d{9}$/;
        if (!phoneRegex.test(field.value.replace(/\s/g, ''))) {
            showFieldError(field, 'Telefon raqam +998XXXXXXXXX formatida bo\'lishi kerak');
            return false;
        }
    }
    
    // Password confirmation validation
    if (field.name === 'new_password2') {
        const password1 = document.querySelector('[name="new_password1"]');
        if (password1 && field.value !== password1.value) {
            showFieldError(field, 'Parollar mos kelmaydi');
            return false;
        }
    }
    
    return true;
}

// Show field error
function showFieldError(field, message) {
    const fieldGroup = field.closest('.form-group');
    let errorDiv = fieldGroup.querySelector('.field-error');
    
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        fieldGroup.appendChild(errorDiv);
    }
    
    errorDiv.textContent = message;
    field.classList.add('error');
}

// Clear field error
function clearFieldError(field) {
    const fieldGroup = field.closest('.form-group');
    const errorDiv = fieldGroup.querySelector('.field-error');
    
    if (errorDiv && !errorDiv.classList.contains('server-error')) {
        errorDiv.remove();
    }
    
    field.classList.remove('error');
}

// Validate entire form
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    return isValid;
}

// Password form specific features
function initPasswordForm() {
    const passwordForm = document.querySelector('.password-form');
    
    if (passwordForm) {
        // Password strength indicator
        const password1 = passwordForm.querySelector('[name="new_password1"]');
        
        if (password1) {
            password1.addEventListener('input', function() {
                checkPasswordStrength(this.value);
            });
        }
        
        // Show/hide password toggle
        addPasswordToggle();
    }
}

// Check password strength
function checkPasswordStrength(password) {
    // You can add password strength indicator here
    const strength = calculatePasswordStrength(password);
    
    // Update UI based on strength
    console.log('Password strength:', strength);
}

// Calculate password strength
function calculatePasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    return strength;
}

// Add password toggle buttons
function addPasswordToggle() {
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    
    passwordInputs.forEach(input => {
        const wrapper = document.createElement('div');
        wrapper.className = 'password-input-wrapper';
        
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle';
        toggleBtn.innerHTML = '<i data-lucide="eye"></i>';
        
        toggleBtn.addEventListener('click', function() {
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            
            const icon = type === 'password' ? 'eye' : 'eye-off';
            toggleBtn.innerHTML = `<i data-lucide="${icon}"></i>`;
            
            // Re-initialize lucide icons
            if (window.lucide) {
                lucide.createIcons();
            }
        });
        
        wrapper.appendChild(toggleBtn);
    });
}

// Phone number formatting
function initPhoneFormatting() {
    const phoneInputs = document.querySelectorAll('input[name="phone_number"]');
    
    phoneInputs.forEach(input => {
        input.addEventListener('input', function() {
            formatPhoneNumber(this);
        });
    });
}

// Format phone number as user types
function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.startsWith('998')) {
        value = '+' + value;
    } else if (value.startsWith('8')) {
        value = '+99' + value;
    } else if (!value.startsWith('+998')) {
        value = '+998' + value;
    }
    
    // Limit to correct length
    if (value.length > 13) {
        value = value.slice(0, 13);
    }
    
    input.value = value;
}

// Export functions for external use
window.employeeFunctions = {
    filterEmployees,
    validateForm,
    updateEmployeeCount
};

// Password reveal functionality
function initPasswordReveal() {
    const revealBtns = document.querySelectorAll('.reveal-password-btn');
    
    revealBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const passwordDisplay = this.parentElement.querySelector('.masked-password');
            const realPassword = this.dataset.password;
            const icon = this.querySelector('i');
            
            if (passwordDisplay.textContent.includes('*')) {
                // Show real password
                passwordDisplay.textContent = realPassword;
                icon.setAttribute('data-lucide', 'eye-off');
            } else {
                // Hide password
                passwordDisplay.textContent = '*'.repeat(realPassword.length);
                icon.setAttribute('data-lucide', 'eye');
            }
            
            // Re-initialize Lucide icons
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    });
}

// Initialize password reveal when page loads
document.addEventListener('DOMContentLoaded', function() {
    initPasswordReveal();
});