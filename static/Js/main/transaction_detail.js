// Transaction Detail JavaScript - To'g'rilangan versiya
let currentTransaction = null;
let userPermissions = null;

// Initialize transaction detail functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Transaction detail script loaded');
    
    // Get user permissions from Django template
    userPermissions = {
        canEdit: window.userCanEdit || false,
        canDelete: window.userCanDelete || false,
        position: window.userPosition || 'user'
    };
    
    console.log('User permissions:', userPermissions);
    
    // Add click listeners to transaction rows
    initializeTransactionRows();
});

function initializeTransactionRows() {
    const transactionRows = document.querySelectorAll('.transaction-row');
    console.log('Found transaction rows:', transactionRows.length);
    
    transactionRows.forEach((row, index) => {
        console.log(`Setting up row ${index}:`, {
            type: row.dataset.type,
            id: row.dataset.id
        });
        
        // Remove existing listeners to prevent duplicates
        row.removeEventListener('click', handleTransactionRowClick);
        
        // Add click listener
        row.addEventListener('click', handleTransactionRowClick);
        
        // Make row clickable
        row.style.cursor = 'pointer';
        
        // Update action buttons
        updateActionButtons(row);
    });
}

function handleTransactionRowClick(e) {
    // Don't trigger if clicking on action buttons
    if (e.target.closest('.btn-action')) {
        e.stopPropagation();
        return;
    }
    
    const row = e.currentTarget;
    const transactionType = row.dataset.type;
    const transactionId = row.dataset.id;
    
    console.log('Row clicked:', { type: transactionType, id: transactionId });
    
    if (transactionType && transactionId) {
        viewTransactionDetail(transactionType, transactionId);
    } else {
        console.error('Missing transaction data:', { type: transactionType, id: transactionId });
    }
}

function updateActionButtons(row) {
    const viewBtn = row.querySelector('.btn-action.view');
    const editBtn = row.querySelector('.btn-action.edit');
    const deleteBtn = row.querySelector('.btn-action.delete');
    
    if (viewBtn) {
        viewBtn.onclick = function(e) {
            e.stopPropagation();
            const transactionType = row.dataset.type;
            const transactionId = row.dataset.id;
            console.log('View button clicked:', { type: transactionType, id: transactionId });
            viewTransactionDetail(transactionType, transactionId);
        };
    }
    
    if (editBtn) {
        if (userPermissions.canEdit) {
            editBtn.style.display = 'inline-block';
            editBtn.onclick = function(e) {
                e.stopPropagation();
                const transactionType = row.dataset.type;
                const transactionId = row.dataset.id;
                editTransaction(transactionType, transactionId);
            };
        } else {
            editBtn.style.display = 'none';
        }
    }
    
    if (deleteBtn) {
        if (userPermissions.canDelete) {
            deleteBtn.style.display = 'inline-block';
            deleteBtn.onclick = function(e) {
                e.stopPropagation();
                const transactionType = row.dataset.type;
                const transactionId = row.dataset.id;
                confirmDeleteTransaction(transactionType, transactionId);
            };
        } else {
            deleteBtn.style.display = 'none';
        }
    }
}

// View transaction detail
function viewTransactionDetail(type, id) {
    console.log('viewTransactionDetail called:', { type, id });
    
    const modal = document.getElementById('transactionDetailModal');
    const modalTitle = document.getElementById('detailModalTitle');
    const modalBody = document.getElementById('transactionDetailBody');
    const modalFooter = document.getElementById('detailModalFooter');
    
    if (!modal || !modalTitle || !modalBody || !modalFooter) {
        console.error('Modal elements not found');
        // Fallback to simple alert
        alert(`Transaction details: Type: ${type}, ID: ${id}`);
        return;
    }
    
    // Show loading
    modalBody.innerHTML = `
        <div class="loading-spinner" style="text-align: center; padding: 40px;">
            <i class="fas fa-spinner fa-spin fa-2x"></i>
            <p>Yuklanmoqda...</p>
        </div>
    `;
    
    modalTitle.textContent = type === 'income' ? 'Daromad ma\'lumotlari' : 'Xarajat ma\'lumotlari';
    
    // Show modal
    modal.style.display = 'flex';
    modal.classList.add('show');
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    
    // Construct the URL
    const url = `/transaction/${type}/${id}/`;
    console.log('Fetching from URL:', url);
    
    // Fetch transaction details
    fetch(url)
        .then(response => {
            console.log('Fetch response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Fetch response data:', data);
            if (data.success) {
                currentTransaction = {
                    type: type,
                    id: id,
                    data: data.data
                };
                renderTransactionDetail(data.data);
                renderDetailActions();
            } else {
                modalBody.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>Ma'lumotlarni yuklashda xatolik: ${data.message || 'Noma\'lum xatolik'}</span>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            modalBody.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Tarmoq xatoligi: ${error.message}</span>
                </div>
            `;
        });
}

function renderTransactionDetail(data) {
    const modalBody = document.getElementById('transactionDetailBody');
    
    if (data.type === 'income') {
        modalBody.innerHTML = renderIncomeDetail(data);
    } else {
        modalBody.innerHTML = renderExpenseDetail(data);
    }
}

function renderIncomeDetail(data) {
    return `
        <div class="transaction-detail">
            <div class="detail-header">
                <span class="detail-type-badge income">
                    <i class="fas fa-arrow-up"></i> Daromad
                </span>
                <h3 class="detail-amount income">${formatMoney(data.amount)} so'm</h3>
            </div>
            
            <div class="detail-grid">

                
                <div class="detail-item income-item">
                    <div class="detail-label">Xizmat</div>
                    <div class="detail-value">${data.service || 'N/A'}</div>
                </div>
                
                <div class="detail-item income-item">
                    <div class="detail-label">To'lov sanasi</div>
                    <div class="detail-value">${formatDate(data.payment_date)}</div>
                </div>
                
                <div class="detail-item income-item">
                    <div class="detail-label">Holat</div>
                    <div class="detail-value">
                        <span class="status-detail-badge ${data.status}">${getStatusText(data.status)}</span>
                    </div>
                </div>
                
                <div class="detail-item income-item">
                    <div class="detail-label">To'lov usuli</div>
                    <div class="detail-value">${getPaymentMethodText(data.payment_method)}</div>
                </div>
                
    
                
                <div class="detail-item income-item">
                    <div class="detail-label">Yaratgan</div>
                    <div class="detail-value">${data.created_by || 'Noma\'lum'}</div>
                </div>
                
                <div class="detail-item income-item">
                    <div class="detail-label">Yaratilgan sana</div>
                    <div class="detail-value">${data.created_date || 'N/A'}</div>
                </div>
            </div>
            
            ${data.notes ? `
                <div class="detail-notes">
                    <h6>Izoh</h6>
                    <p>${data.notes}</p>
                </div>
            ` : ''}
        </div>
    `;
}

function renderExpenseDetail(data) {
    return `
        <div class="transaction-detail">
            <div class="detail-header">
                <span class="detail-type-badge expense">
                    <i class="fas fa-arrow-down"></i> Xarajat
                </span>
                <h3 class="detail-amount expense">${formatMoney(data.amount)} so'm</h3>
            </div>
            
            <div class="detail-grid">
                <div class="detail-item expense-item">
                    <div class="detail-label">Sarlavha</div>
                    <div class="detail-value">${data.title || 'N/A'}</div>
                </div>
                
                <div class="detail-item expense-item">
                    <div class="detail-label">Xizmat</div>
                    <div class="detail-value">${data.service || 'N/A'}</div>
                </div>
                
                ${data.employee ? `
                    <div class="detail-item expense-item">
                        <div class="detail-label">Xodim</div>
                        <div class="detail-value">${data.employee}</div>
                    </div>
                ` : ''}
                
                <div class="detail-item expense-item">
                    <div class="detail-label">Sana</div>
                    <div class="detail-value">${formatDate(data.date)}</div>
                </div>
                
                <div class="detail-item expense-item">
                    <div class="detail-label">Kategoriya</div>
                    <div class="detail-value">${data.category || 'N/A'}</div>
                </div>
                
                <div class="detail-item expense-item">
                    <div class="detail-label">To'lov usuli</div>
                    <div class="detail-value">${getPaymentMethodText(data.payment_method)}</div>
                </div>
                
                <div class="detail-item expense-item">
                    <div class="detail-label">Yaratgan</div>
                    <div class="detail-value">${data.created_by || 'Noma\'lum'}</div>
                </div>
                
                <div class="detail-item expense-item">
                    <div class="detail-label">Yaratilgan sana</div>
                    <div class="detail-value">${data.created_date || 'N/A'}</div>
                </div>
            </div>
            
            ${data.notes ? `
                <div class="detail-notes">
                    <h6>Izoh</h6>
                    <p>${data.notes}</p>
                </div>
            ` : ''}
        </div>
    `;
}

function renderDetailActions() {
    const modalFooter = document.getElementById('detailModalFooter');
    
    let actions = `<button type="button" class="btn-detail-action btn-close-detail" onclick="closeDetailModal()">
        <i class="fas fa-times"></i> Yopish
    </button>`;
    
    if (userPermissions.canEdit) {
        actions = `<button type="button" class="btn-detail-action btn-edit" onclick="editCurrentTransaction()">
            <i class="fas fa-edit"></i> Tahrirlash
        </button>` + actions;
    }
    
    if (userPermissions.canDelete) {
        actions = `<button type="button" class="btn-detail-action btn-delete" onclick="deleteCurrentTransaction()">
            <i class="fas fa-trash"></i> O'chirish
        </button>` + actions;
    }
    
    modalFooter.innerHTML = `<div class="detail-actions">${actions}</div>`;
}

// Edit transaction
function editTransaction(type, id) {
    if (!userPermissions.canEdit) {
        showNotification('Sizda tahrirlash huquqi yo\'q', 'error');
        return;
    }
    
    // Close detail modal if open
    closeDetailModal();
    
    // Show edit modal
    showEditModal(type, id);
}

function editCurrentTransaction() {
    if (currentTransaction) {
        editTransaction(currentTransaction.type, currentTransaction.id);
    }
}

function showEditModal(type, id) {
    const modal = document.getElementById('editTransactionModal');
    const modalTitle = document.getElementById('editModalTitle');
    const modalBody = document.getElementById('editTransactionBody');
    
    if (!modal) {
        console.error('Edit modal not found');
        return;
    }
    
    modalTitle.textContent = type === 'income' ? 'Daromadni tahrirlash' : 'Xarajatni tahrirlash';
    
    // Show loading
    modalBody.innerHTML = `
        <div class="loading-spinner" style="text-align: center; padding: 40px;">
            <i class="fas fa-spinner fa-spin fa-2x"></i>
            <p>Yuklanmoqda...</p>
        </div>
    `;
    
    // Show modal
    modal.style.display = 'flex';
    modal.classList.add('show');
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    
    // Fetch transaction data for editing
    fetch(`/transaction/${type}/${id}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (type === 'income') {
                    renderIncomeEditForm(data.data);
                } else {
                    renderExpenseEditForm(data.data);
                }
                setupEditFormSubmission(type, id);
            } else {
                modalBody.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>Ma'lumotlarni yuklashda xatolik: ${data.message}</span>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            modalBody.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Tarmoq xatoligi yuz berdi</span>
                </div>
            `;
        });
}

// Delete transaction
function confirmDeleteTransaction(type, id) {
    if (!userPermissions.canDelete) {
        showNotification('Sizda o\'chirish huquqi yo\'q', 'error');
        return;
    }
    
    currentTransaction = { type, id };
    
    const modal = document.getElementById('deleteConfirmModal');
    const confirmText = document.getElementById('deleteConfirmText');
    
    if (!modal) {
        console.error('Delete confirm modal not found');
        return;
    }
    
    confirmText.textContent = `Haqiqatan ham bu ${type === 'income' ? 'daromad' : 'xarajat'} yozuvini o'chirmoqchimisiz?`;
    
    // Show modal
    modal.style.display = 'flex';
    modal.classList.add('show');
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
}

function deleteCurrentTransaction() {
    if (currentTransaction) {
        confirmDeleteTransaction(currentTransaction.type, currentTransaction.id);
    }
}

function confirmDelete() {
    if (!currentTransaction) return;
    
    const { type, id } = currentTransaction;
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const originalText = confirmBtn.innerHTML;
    
    // Add loading state
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> O\'chirilmoqda...';
    confirmBtn.disabled = true;
    
    fetch(`/delete/${type}/${id}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Muvaffaqiyatli o\'chirildi!', 'success');
            closeDeleteModal();
            closeDetailModal();
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
        confirmBtn.innerHTML = originalText;
        confirmBtn.disabled = false;
    });
}

// Modal control functions
window.closeDetailModal = function() {
    const modal = document.getElementById('transactionDetailModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        currentTransaction = null;
    }
};

window.closeEditModal = function() {
    const modal = document.getElementById('editTransactionModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
    }
};

window.closeDeleteModal = function() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
    }
};

// Close modals with ESC key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const detailModal = document.getElementById('transactionDetailModal');
        const editModal = document.getElementById('editTransactionModal');
        const deleteModal = document.getElementById('deleteConfirmModal');
        
        if (detailModal && detailModal.classList.contains('show')) {
            closeDetailModal();
        }
        
        if (editModal && editModal.classList.contains('show')) {
            closeEditModal();
        }
        
        if (deleteModal && deleteModal.classList.contains('show')) {
            closeDeleteModal();
        }
    }
});

// Close modals when clicking backdrop
document.addEventListener('click', function(e) {
    if (e.target.id === 'transactionDetailModal') {
        closeDetailModal();
    }
    
    if (e.target.id === 'editTransactionModal') {
        closeEditModal();
    }
    
    if (e.target.id === 'deleteConfirmModal') {
        closeDeleteModal();
    }
});

// Utility functions
function formatMoney(amount) {
    if (!amount) return '0';
    return parseInt(amount).toLocaleString();
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function getStatusText(status) {
    const statusMap = {
        'received': 'Qabul qilingan',
        'pending': 'Kutilmoqda',
        'partial': 'Qisman to\'langan',
        'completed': 'To\'langan'
    };
    return statusMap[status] || status;
}

function getPaymentMethodText(method) {
    const methodMap = {
        'cash': 'Naqd',
        'card': 'Karta',
        'transfer': 'O\'tkazma',
        'check': 'Chek'
    };
    return methodMap[method] || method;
}

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
    // Container topilmagan holatda yaratib olamiz
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '1000';
        container.style.maxWidth = '350px';
        container.style.width = '100%';
        document.body.appendChild(container);
    }

    // Notification elementini yaratamiz
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Notificationga click bo'lganda o'chirish
    notification.addEventListener('click', () => {
        notification.remove();
    });

    // 5 sekunddan keyin avtomatik o'chirish
    const timeout = setTimeout(() => {
        notification.remove();
    }, 5000);

    // Agar foydalanuvchi ustiga bosib qo'ysa, timeoutni bekor qilamiz
    notification.addEventListener('mouseenter', () => {
        clearTimeout(timeout);
        notification.style.animation = 'none';
        notification.querySelector('::after').style.animation = 'none';
    });

    notification.addEventListener('mouseleave', () => {
        notification.style.animation = 'fadeOut 0.5s forwards';
        setTimeout(() => {
            notification.remove();
        }, 500);
    });

    // Containerga qo'shamiz
    container.appendChild(notification);
}



// Additional form rendering functions
function renderIncomeEditForm(data) {
    const modalBody = document.getElementById('editTransactionBody');
    
    modalBody.innerHTML = `

        
        <div class="edit-form-row">
            <div class="edit-form-col">
                <div class="edit-form-group">
                    <label for="editIncomeAmount">Miqdor (so'm) *</label>
                    <input type="number" id="editIncomeAmount" name="amount" class="edit-form-control" 
                           step="0.01" value="${data.amount}" required>
                </div>
            </div>
            <div class="edit-form-col">
                <div class="edit-form-group">
                    <label for="editIncomeDate">To'lov sanasi *</label>
                    <input type="date" id="editIncomeDate" name="payment_date" class="edit-form-control" 
                           value="${data.payment_date}" required>
                </div>
            </div>
        </div>
        
        <div class="edit-form-row">
            <div class="edit-form-col">
                <div class="edit-form-group">
                    <label for="editIncomeStatus">Holat *</label>
                    <select id="editIncomeStatus" name="status" class="edit-form-control" required>
                        <option value="pending" ${data.status === 'pending' ? 'selected' : ''}>Kutilmoqda</option>
                        <option value="received" ${data.status === 'received' ? 'selected' : ''}>Qabul qilingan</option>
                        <option value="partial" ${data.status === 'partial' ? 'selected' : ''}>Qisman to'langan</option>
                    </select>
                </div>
            </div>
            <div class="edit-form-col">
                <div class="edit-form-group">
                    <label for="editIncomePaymentMethod">To'lov usuli *</label>
                    <select id="editIncomePaymentMethod" name="payment_method" class="edit-form-control" required>
                        <option value="cash" ${data.payment_method === 'cash' ? 'selected' : ''}>Naqd</option>
                        <option value="card" ${data.payment_method === 'card' ? 'selected' : ''}>Karta</option>
                        <option value="transfer" ${data.payment_method === 'transfer' ? 'selected' : ''}>O'tkazma</option>
                    </select>
                </div>
            </div>
        </div>

        
        <div class="edit-form-group">
            <label for="editIncomeNotes">Izoh</label>
            <textarea id="editIncomeNotes" name="notes" class="edit-form-control" rows="3">${data.notes || ''}</textarea>
        </div>
    `;
    
    // Load dropdown options
    loadEditFormData('income', data);
}

function renderExpenseEditForm(data) {
    const modalBody = document.getElementById('editTransactionBody');
    
    modalBody.innerHTML = `
        <div class="edit-form-group">
            <label for="editExpenseTitle">Sarlavha </label>
            <input type="text" id="editExpenseTitle" name="title" class="edit-form-control" 
                   value="${data.title || ''}">
        </div>
        
        <div class="edit-form-row">
            <div class="edit-form-col">
                
            </div>
            <div class="edit-form-col">
                <div class="edit-form-group">
                    <label for="editExpenseEmployee">Xodim</label>
                    <select id="editExpenseEmployee" name="employee" class="edit-form-control">
                        <option value="">Yuklanmoqda...</option>
                    </select>
                </div>
            </div>
        </div>
        
        <div class="edit-form-row">
            <div class="edit-form-col">
                <div class="edit-form-group">
                    <label for="editExpenseAmount">Miqdor (so'm) *</label>
                    <input type="number" id="editExpenseAmount" name="amount" class="edit-form-control" 
                           step="0.01" value="${data.amount}" required>
                </div>
            </div>
            <div class="edit-form-col">
                <div class="edit-form-group">
                    <label for="editExpenseDate">Sana *</label>
                    <input type="date" id="editExpenseDate" name="date" class="edit-form-control" 
                           value="${data.date}" required>
                </div>
            </div>
        </div>
        
        <div class="edit-form-row">
            <div class="edit-form-col">
                <div class="edit-form-group">
                    <label for="editExpenseCategory">Kategoriya *</label>
                    <select id="editExpenseCategory" name="category" class="edit-form-control" required>
                        <option value="">Yuklanmoqda...</option>
                    </select>
                </div>
            </div>
            <div class="edit-form-col">
                <div class="edit-form-group">
                    <label for="editExpensePaymentMethod">To'lov usuli *</label>
                    <select id="editExpensePaymentMethod" name="payment_method" class="edit-form-control" required>
                        <option value="cash" ${data.payment_method === 'cash' ? 'selected' : ''}>Naqd</option>
                        <option value="card" ${data.payment_method === 'card' ? 'selected' : ''}>Karta</option>
                        <option value="transfer" ${data.payment_method === 'transfer' ? 'selected' : ''}>O'tkazma</option>
                        <option value="check" ${data.payment_method === 'check' ? 'selected' : ''}>Chek</option>
                    </select>
                </div>
            </div>
        </div>
        
        <div class="edit-form-group">
            <label for="editExpenseNotes">Izoh </label>
            <textarea id="editExpenseNotes" name="notes" class="edit-form-control" rows="3">${data.notes || ''}</textarea>
        </div>
    `;
    
    // Load dropdown options
    loadEditFormData('expense', data);
}

function loadEditFormData(type, currentData) {
    // URL manzilini to'g'rilash (Django URL patterniga mos ravishda)
    fetch(`/get-edit-data/${type}/${currentData.id}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            if (result.success) {
                const data = result.data;
                
                if (type === 'income') {
                    // Kompaniyalarni to'ldirish
                    const companySelect = document.getElementById('editIncomeCompany');
                    if (companySelect) {
                        companySelect.innerHTML = '<option value="">Kompaniyani tanlang</option>';
                        data.companies?.forEach(company => {
                            const option = new Option(company.name, company.id);
                            if (company.id == currentData.company_id) {
                                option.selected = true;
                            }
                            companySelect.add(option);
                        });
                    }
                    
                    // Xizmatlarni to'ldirish
                    const serviceSelect = document.getElementById('editIncomeService');
                    if (serviceSelect) {
                        serviceSelect.innerHTML = '<option value="">Xizmatni tanlang</option>';
                        data.services?.forEach(service => {
                            const option = new Option(service.name, service.id);
                            if (service.id == currentData.service_id) {
                                option.selected = true;
                            }
                            serviceSelect.add(option);
                        });
                    }
                } else {
                    // Xizmatlarni to'ldirish (xarajat uchun)
                    const serviceSelect = document.getElementById('editExpenseService');
                    if (serviceSelect) {
                        serviceSelect.innerHTML = '<option value="">Xizmatni tanlang</option>';
                        data.services?.forEach(service => {
                            const option = new Option(service.name, service.id);
                            if (service.id == currentData.service_id) {
                                option.selected = true;
                            }
                            serviceSelect.add(option);
                        });
                    }
                    
                    // Xodimlarni to'ldirish
                    
                    const employeeSelect = document.getElementById('editExpenseEmployee');
                    if (employeeSelect) {
                        employeeSelect.innerHTML = '<option value="">Xodimni tanlang</option>';
                        data.employees?.forEach(employee => {
                            const option = new Option(
                                `${employee.name}`, 
                                employee.id
                            );
                            if (employee.id == currentData.employee_id) {
                                option.selected = true;
                            }
                            employeeSelect.add(option);
                        });
                    }
                    
                    // Kategoriyalarni to'ldirish
                    const categorySelect = document.getElementById('editExpenseCategory');
                    if (categorySelect) {
                        categorySelect.innerHTML = '<option value="">Kategoriyani tanlang</option>';
                        data.expense_categories?.forEach(category => {
                            const option = new Option(category.name, category.id);
                            if (category.id == currentData.category_id) {
                                option.selected = true;
                            }
                            categorySelect.add(option);
                        });
                    }
                }
            } else {
                console.error('Server xatosi:', result.error || 'Noma\'lum xatolik');
                showNotification('Ma\'lumotlarni yuklashda xatolik: ' + (result.error || 'Noma\'lum xatolik'), 'error');
            }
        })
        .catch(error => {
            console.error('Fetch xatosi:', error);
            showNotification('Serverga ulanib bo\'lmadi', 'error');
        });
}

function setupEditFormSubmission(type, id) {
    const form = document.getElementById('editTransactionForm');
    
    form.onsubmit = function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        // Add loading state
        submitBtn.textContent = 'Saqlanmoqda...';
        submitBtn.disabled = true;
        
        // Submit form
        fetch(`/update/${type}/${id}/`, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Muvaffaqiyatli yangilandi!', 'success');
                closeEditModal();
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
    };
}

// Global function to make viewTransactionDetail available
window.viewTransactionDetail = viewTransactionDetail;