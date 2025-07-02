// static/js/main/service-create.js

class ServiceCreateForm {
    constructor() {
        this.selectedCompany = null;
        this.searchTimeout = null;
        this.init();
    }

    init() {
        this.initElements();
        this.bindEvents();
        this.initLucideIcons();
        this.initValidation();
    }

    initElements() {
        // Search elements
        this.companySearchInput = document.getElementById('company_search');
        this.searchResultsOverlay = document.getElementById('companySearchResults');
        this.searchResultsContent = document.getElementById('searchResultsContent');
        this.closeSearchBtn = document.getElementById('closeSearchResults');
        
        // Selected company elements
        this.selectedCompanyDiv = document.querySelector('.selected-company');
        this.selectedCompanyIdInput = document.getElementById('selected_company_id');
        this.removeCompanyBtn = document.querySelector('.remove-company');
        
        // Form elements
        this.form = document.getElementById('serviceCreateForm');
        this.saveBtn = document.getElementById('saveServiceBtn');
        this.tenderStatusSelect = document.getElementById('tender_status');
        this.startDateInput = document.getElementById('started_date');
        this.endDateInput = document.getElementById('end_date');
    }

    bindEvents() {
        // Company search
        if (this.companySearchInput) {
            this.companySearchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Close search results
        if (this.closeSearchBtn) {
            this.closeSearchBtn.addEventListener('click', () => {
                this.hideSearchResults();
            });
        }

        // Close on overlay click
        if (this.searchResultsOverlay) {
            this.searchResultsOverlay.addEventListener('click', (e) => {
                if (e.target === this.searchResultsOverlay) {
                    this.hideSearchResults();
                }
            });
        }

        // Remove selected company
        if (this.removeCompanyBtn) {
            this.removeCompanyBtn.addEventListener('click', () => {
                this.removeSelectedCompany();
            });
        }

        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                this.handleFormSubmit(e);
            });
        }

        // Tender status change
        if (this.tenderStatusSelect) {
            this.tenderStatusSelect.addEventListener('change', () => {
                this.handleTenderStatusChange();
            });
        }

        // Date validation
        if (this.startDateInput && this.endDateInput) {
            this.startDateInput.addEventListener('change', () => {
                this.validateDates();
            });
            this.endDateInput.addEventListener('change', () => {
                this.validateDates();
            });
        }
    }

    initLucideIcons() {
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    initValidation() {
        // Set initial date validation
        this.validateDates();
        this.handleTenderStatusChange();
    }

    handleSearch(query) {
        clearTimeout(this.searchTimeout);
        
        if (query.length < 2) {
            this.hideSearchResults();
            return;
        }

        this.searchTimeout = setTimeout(() => {
            this.searchCompanies(query);
        }, 300);
    }

    async searchCompanies(query) {
        try {
            const response = await fetch('/ajax/company-search/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                },
                body: JSON.stringify({ query: query })
            });

            const data = await response.json();
            
            if (data.companies) {
                this.displaySearchResults(data.companies, query);
            } else {
                this.showError('Kompaniyalar yuklanmadi');
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Qidirishda xatolik yuz berdi');
        }
    }

    displaySearchResults(companies, query) {
        let html = '';

        if (companies.length === 0) {
            html = `
                <div class="company-search-no-results">
                    <i data-lucide="search-x"></i>
                    <p>Hech qanday kompaniya topilmadi</p>
                    <button type="button" class="btn btn-primary btn-sm" onclick="this.openCreateCompanyModal('${query}')">
                        <i data-lucide="plus"></i>
                        Yangi kompaniya yaratish
                    </button>
                </div>
            `;
        } else {
            companies.forEach(company => {
                html += `
                    <div class="company-search-result" data-company-id="${company.id}">
                        <div class="company-result-name">${company.name}</div>
                        <div class="company-result-stir">STIR: ${company.stir}</div>
                        ${company.phone_number ? `<div class="company-result-info">${company.phone_number}</div>` : ''}
                    </div>
                `;
            });
        }

        this.searchResultsContent.innerHTML = html;
        this.showSearchResults();

        // Bind click events to results
        this.searchResultsContent.querySelectorAll('.company-search-result').forEach(result => {
            result.addEventListener('click', () => {
                const companyId = result.dataset.companyId;
                const company = companies.find(c => c.id == companyId);
                this.selectCompany(company);
            });
        });

        // Reinitialize icons
        this.initLucideIcons();
    }

    selectCompany(company) {
        this.selectedCompany = company;
        
        // Fill selected company display
        const companyCard = this.selectedCompanyDiv.querySelector('.company-card');
        const nameEl = companyCard.querySelector('.company-name');
        const stirEl = companyCard.querySelector('.company-stir');
        const infoEl = companyCard.querySelector('.company-info');
        
        nameEl.textContent = company.name;
        stirEl.textContent = `STIR: ${company.stir}`;
        
        let info = '';
        if (company.phone_number) info += company.phone_number;
        if (company.email) info += (info ? ' • ' : '') + company.email;
        infoEl.textContent = info;
        
        // Set hidden input value
        this.selectedCompanyIdInput.value = company.id;
        
        // Show selected company div
        this.selectedCompanyDiv.style.display = 'block';
        
        // Clear and hide search
        this.companySearchInput.value = '';
        this.hideSearchResults();
    }

    removeSelectedCompany() {
        this.selectedCompany = null;
        this.selectedCompanyIdInput.value = '';
        this.selectedCompanyDiv.style.display = 'none';
    }

    showSearchResults() {
        this.searchResultsOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    hideSearchResults() {
        this.searchResultsOverlay.style.display = 'none';
        document.body.style.overflow = '';
    }

    handleTenderStatusChange() {
        const status = this.tenderStatusSelect.value;
        
        // Barcha holatlar uchun sanalar majburiy emas
        // Faqat ixtiyoriy maydonlar sifatida qoldiriladi
        this.startDateInput.removeAttribute('required');
        this.endDateInput.removeAttribute('required');
        
        this.validateForm();
    }

    validateDates() {
        const startDate = this.startDateInput.value;
        const endDate = this.endDateInput.value;
        
        if (startDate && endDate) {
            if (new Date(startDate) > new Date(endDate)) {
                this.showFieldError(this.endDateInput, 'Tugash sanasi boshlash sanasidan kech bo\'lishi kerak');
                return false;
            } else {
                this.clearFieldError(this.endDateInput);
            }
        }
        
        return true;
    }

    validateForm() {
        let isValid = true;
        
        // Required fields validation
        const requiredFields = this.form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                this.showFieldError(field, 'Bu maydon majburiy');
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });
        
        // Company validation (if not pre-selected)
        if (!document.querySelector('input[name="company"][type="hidden"][value]') && !this.selectedCompanyIdInput.value) {
            this.showFieldError(this.companySearchInput, 'Kompaniya tanlash majburiy');
            isValid = false;
        }
        
        // Date validation
        if (!this.validateDates()) {
            isValid = false;
        }
        
        return isValid;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        
        field.classList.add('error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    showError(message) {
        // Create or update error alert
        let errorAlert = document.querySelector('.alert-danger');
        if (!errorAlert) {
            errorAlert = document.createElement('div');
            errorAlert.className = 'alert alert-danger';
            errorAlert.style.marginBottom = '20px';
            this.form.insertBefore(errorAlert, this.form.firstChild);
        }
        
        errorAlert.innerHTML = `
            <i data-lucide="alert-circle"></i>
            ${message}
        `;
        
        this.initLucideIcons();
        
        // Scroll to error
        errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    showSuccess(message) {
        const successAlert = document.createElement('div');
        successAlert.className = 'alert alert-success';
        successAlert.style.marginBottom = '20px';
        successAlert.innerHTML = `
            <i data-lucide="check-circle"></i>
            ${message}
        `;
        
        this.form.insertBefore(successAlert, this.form.firstChild);
        this.initLucideIcons();
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            if (successAlert.parentNode) {
                successAlert.remove();
            }
        }, 5000);
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            this.showError('Iltimos, barcha majburiy maydonlarni to\'ldiring');
            return;
        }
        
        this.submitForm();
    }

    async submitForm() {
        const submitBtn = this.saveBtn;
        const btnText = submitBtn.querySelector('span');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.classList.add('btn-loading');
        btnText.textContent = 'Saqlanmoqda...';
        btnLoader.style.display = 'block';
        
        try {
            // Create FormData object
            const formData = new FormData(this.form);
            
            const response = await fetch(this.form.action || window.location.href, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': this.getCsrfToken()
                }
            });
            
            if (response.ok) {
                const responseText = await response.text();
                
                // Check if response contains success message or redirect
                if (responseText.includes('muvaffaqiyatli yaratildi') || response.redirected) {
                    this.showSuccess('Xizmat muvaffaqiyatli yaratildi!');
                    
                    // Redirect after short delay
                    setTimeout(() => {
                        // Check if we have company context for redirect
                        const companyId = this.getCompanyIdFromContext();
                        if (companyId) {
                            window.location.href = `/companies/${companyId}/`;
                        } else if (response.redirected) {
                            window.location.href = response.url;
                        } else {
                            window.location.href = '/services/';
                        }
                    }, 1500);
                    return;
                }
                
                // If not redirected, show error
                this.showError('Xizmat yaratishda xatolik yuz berdi');
                
            } else {
                this.showError('Server xatosi. Iltimos, qayta urinib ko\'ring');
            }
            
        } catch (error) {
            console.error('Submit error:', error);
            this.showError('Tarmoq xatosi. Iltimos, qayta urinib ko\'ring');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.classList.remove('btn-loading');
            btnText.textContent = 'Xizmatni saqlash';
            btnLoader.style.display = 'none';
        }
    }

    getCsrfToken() {
        const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
        return csrfInput ? csrfInput.value : '';
    }

    getCompanyIdFromContext() {
        // Check if we have a pre-selected company (readonly mode)
        const companyHiddenInput = document.querySelector('input[name="company"][type="hidden"]');
        if (companyHiddenInput && companyHiddenInput.value) {
            return companyHiddenInput.value;
        }
        
        // Check if we have selected company
        if (this.selectedCompanyIdInput && this.selectedCompanyIdInput.value) {
            return this.selectedCompanyIdInput.value;
        }
        
        return null;
    }

    openCreateCompanyModal(searchQuery = '') {
        // This function would open the company creation modal
        // For now, we'll just redirect to company creation page
        const url = '/companies/create/';
        if (searchQuery) {
            window.location.href = `${url}?name=${encodeURIComponent(searchQuery)}`;
        } else {
            window.location.href = url;
        }
    }

    // Utility method to format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('uz-UZ', {
            style: 'currency',
            currency: 'UZS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    }

    // Auto-save draft functionality (optional)
    initAutoSave() {
        let autoSaveTimeout;
        
        const formInputs = this.form.querySelectorAll('input, select, textarea');
        formInputs.forEach(input => {
            input.addEventListener('input', () => {
                clearTimeout(autoSaveTimeout);
                autoSaveTimeout = setTimeout(() => {
                    this.saveDraft();
                }, 2000);
            });
        });
    }

    saveDraft() {
        const formData = new FormData(this.form);
        const draftData = {};
        
        for (let [key, value] of formData.entries()) {
            draftData[key] = value;
        }
        
        localStorage.setItem('service_create_draft', JSON.stringify(draftData));
        this.showDraftSaved();
    }

    loadDraft() {
        const draftData = localStorage.getItem('service_create_draft');
        if (draftData) {
            try {
                const data = JSON.parse(draftData);
                
                Object.keys(data).forEach(key => {
                    const input = this.form.querySelector(`[name="${key}"]`);
                    if (input) {
                        if (input.type === 'checkbox') {
                            input.checked = data[key] === 'on';
                        } else {
                            input.value = data[key];
                        }
                    }
                });
                
                this.showDraftLoaded();
            } catch (e) {
                console.error('Error loading draft:', e);
            }
        }
    }

    clearDraft() {
        localStorage.removeItem('service_create_draft');
    }

    showDraftSaved() {
        const indicator = document.createElement('div');
        indicator.className = 'draft-saved show';
        indicator.innerHTML = `
            <i data-lucide="save"></i>
            Qoralama saqlandi
        `;
        
        document.body.appendChild(indicator);
        this.initLucideIcons();
        
        setTimeout(() => {
            indicator.classList.remove('show');
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.remove();
                }
            }, 300);
        }, 2000);
    }

    showDraftLoaded() {
        this.showSuccess('Oldingi qoralama yuklandi');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const serviceForm = new ServiceCreateForm();
    
    // Initialize auto-save if needed
    // serviceForm.initAutoSave();
    
    // Load draft if available
    // serviceForm.loadDraft();
});

// Export for global access if needed
window.ServiceCreateForm = ServiceCreateForm;