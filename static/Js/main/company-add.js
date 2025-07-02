// static/js/main/company-add.js

document.addEventListener('DOMContentLoaded', function() {
    initCompanyForm();
    console.log('🏢 Company form initialized');
});

function initCompanyForm() {
    const form = document.getElementById('companyAddForm') || document.getElementById('companyEditForm');
    const stirInput = document.querySelector('[name="stir"]');
    const phoneInput = document.querySelector('[name="phone_number"]');
    const nameInput = document.querySelector('[name="name"]');
    
    if (!form) return;
    
    // STIR validation
    if (stirInput) {
        initSTIRValidation(stirInput);
    }
    
    // Phone validation and formatting
    if (phoneInput) {
        initPhoneValidation(phoneInput);
    }
    
    // Company name validation
    if (nameInput) {
        initNameValidation(nameInput);
    }
    
    // Form submission
    form.addEventListener('submit', function(e) {
        if (!validateCompanyForm()) {
            e.preventDefault();
            return;
        }
        showLoadingState();
    });
}

// STIR validation
function initSTIRValidation(stirInput) {
    stirInput.addEventListener('input', function() {
        // Only allow numbers
        this.value = this.value.replace(/\D/g, '');
        
        // Limit to 9 digits
        if (this.value.length > 9) {
            this.value = this.value.slice(0, 9);
        }
        
        validateSTIRField(this.value);
    });
    
    stirInput.addEventListener('keydown', function(e) {
        // Allow: backspace, delete, tab, escape, enter
        if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
            // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true)) {
            return;
        }
        // Ensure that it is a number
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });
}

// Validate STIR field
function validateSTIRField(stir) {
    const input = document.querySelector('[name="stir"]');
    const container = input.closest('.form-group');
    
    // Remove existing validation
    const existingValidation = container.querySelector('.stir-validation');
    if (existingValidation) {
        existingValidation.remove();
    }
    
    if (stir.length === 0) return;
    
    const validation = document.createElement('div');
    validation.className = 'stir-validation';
    
    if (stir.length === 9) {
        validation.className += ' valid';
        validation.innerHTML = '<i data-lucide="check-circle"></i><span>STIR to\'g\'ri</span>';
        validation.style.color = '#00b894';
        input.classList.remove('error');
        input.classList.add('success');
    } else {
        validation.className += ' invalid';
        validation.innerHTML = '<i data-lucide="x-circle"></i><span>STIR 9 ta raqamdan iborat bo\'lishi kerak</span>';
        validation.style.color = '#d63031';
        input.classList.remove('success');
        input.classList.add('error');
    }
    
    container.appendChild(validation);
    
    if (window.lucide) {
        lucide.createIcons();
    }
}

// Phone validation and formatting
function initPhoneValidation(phoneInput) {
    phoneInput.addEventListener('input', function() {
        formatPhoneNumber(this);
        validatePhoneField(this.value);
    });
    
    phoneInput.addEventListener('keydown', function(e) {
        // Allow: backspace, delete, tab, escape, enter, +
        if ([8, 9, 27, 13, 46, 107, 187].indexOf(e.keyCode) !== -1 ||
            // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true)) {
            return;
        }
        // Ensure that it is a number
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });
}

// Format phone number
function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.startsWith('998')) {
        value = '+' + value;
    } else if (!value.startsWith('+998') && value.length > 0) {
        value = '+998' + value;
    }
    
    // Limit length
    if (value.length > 13) {
        value = value.slice(0, 13);
    }
    
    input.value = value;
}

// Validate phone field
function validatePhoneField(phone) {
    if (!phone) return; // Phone is optional
    
    const input = document.querySelector('[name="phone_number"]');
    const container = input.closest('.form-group');
    
    // Remove existing validation
    const existingValidation = container.querySelector('.phone-validation');
    if (existingValidation) {
        existingValidation.remove();
    }
    
    const validation = document.createElement('div');
    validation.className = 'phone-validation';
    
    const cleanPhone = phone.replace(/\s/g, '');
    const isValid = /^\+998\d{9}$/.test(cleanPhone);
    
    if (isValid) {
        validation.className += ' valid';
        validation.innerHTML = '<i data-lucide="check-circle"></i><span>Telefon raqam to\'g\'ri</span>';
        validation.style.color = '#00b894';
        input.classList.remove('error');
        input.classList.add('success');
    } else {
        validation.className += ' invalid';
        validation.innerHTML = '<i data-lucide="x-circle"></i><span>To\'liq telefon raqam kiriting: +998901234567</span>';
        validation.style.color = '#d63031';
        input.classList.remove('success');
        input.classList.add('error');
    }
    
    container.appendChild(validation);
    
    if (window.lucide) {
        lucide.createIcons();
    }
}

// Company name validation
function initNameValidation(nameInput) {
    nameInput.addEventListener('input', function() {
        validateNameField(this.value);
    });
}

// Validate company name
function validateNameField(name) {
    const input = document.querySelector('[name="name"]');
    const container = input.closest('.form-group');
    
    // Remove existing validation
    const existingValidation = container.querySelector('.name-validation');
    if (existingValidation) {
        existingValidation.remove();
    }
    
    if (name.length === 0) return;
    
    const validation = document.createElement('div');
    validation.className = 'name-validation';
    
    if (name.length >= 2 && name.length <= 255) {
        validation.className += ' valid';
        validation.innerHTML = '<i data-lucide="check-circle"></i><span>Kompaniya nomi to\'g\'ri</span>';
        validation.style.color = '#00b894';
        input.classList.remove('error');
        input.classList.add('success');
    } else {
        validation.className += ' invalid';
        if (name.length < 2) {
            validation.innerHTML = '<i data-lucide="x-circle"></i><span>Kompaniya nomi juda qisqa</span>';
        } else {
            validation.innerHTML = '<i data-lucide="x-circle"></i><span>Kompaniya nomi juda uzun (maksimal 255 belgi)</span>';
        }
        validation.style.color = '#d63031';
        input.classList.remove('success');
        input.classList.add('error');
    }
    
    container.appendChild(validation);
    
    if (window.lucide) {
        lucide.createIcons();
    }
}

// Form validation
function validateCompanyForm() {
    const name = document.querySelector('[name="name"]').value;
    const stir = document.querySelector('[name="stir"]').value;
    const phone = document.querySelector('[name="phone_number"]').value;
    
    // Required fields
    if (!name || !stir) {
        showToast('Kompaniya nomi va STIR majburiy!', 'error');
        return false;
    }
    
    // Name validation
    if (name.length < 2 || name.length > 255) {
        showToast('Kompaniya nomi 2-255 belgi orasida bo\'lishi kerak!', 'error');
        return false;
    }
    
    // STIR validation
    if (!/^\d{9}$/.test(stir)) {
        showToast('STIR 9 ta raqamdan iborat bo\'lishi kerak!', 'error');
        return false;
    }
    
    // Phone validation (if provided)
    if (phone && !/^\+998\d{9}$/.test(phone.replace(/\s/g, ''))) {
        showToast('Telefon raqam noto\'g\'ri formatda!', 'error');
        return false;
    }
    
    return true;
}

// Show loading state
function showLoadingState() {
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('span');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    
    if (submitBtn && btnText && btnLoader) {
        submitBtn.disabled = true;
        btnText.textContent = 'Saqlanmoqda...';
        btnLoader.style.display = 'block';
    }
}

console.log('🏢 Company form JavaScript loaded successfully');