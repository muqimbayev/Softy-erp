// analytics.js - Complete ERP Analytics Dashboard JavaScript

// Global variables
let monthlyChart, serviceStatusChart, expensesCategoryChart, 
    tenderStatusChart, serviceTypeChart, tenderSuccessChart;
let dashboardData = {};

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

// Initialize all dashboard components
async function initializeDashboard() {
    showLoading(true);
    
    try {
        await loadDashboardData();
        updateStatsCards();
        await initializeCharts();
        await loadTopCompanies();
        await loadEmployeePerformance();
        updateFinancialSummary();
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
    } finally {
        showLoading(false);
    }
}

// Show/hide loading overlay
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

// Show error message
function showError(message) {
    alert(message);
}

// Load main dashboard data
async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard-stats/');
        if (!response.ok) throw new Error('Network response was not ok');
        dashboardData = await response.json();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        throw error;
    }
}

// Update stats cards
function updateStatsCards() {
    const { basic_stats, financial_stats } = dashboardData;
    
    // Update basic stats
    document.getElementById('totalCompanies').textContent = basic_stats.total_companies;
    document.getElementById('totalServices').textContent = basic_stats.total_services;
    document.getElementById('totalEmployees').textContent = basic_stats.total_employees;
    
    // Update financial stats
    document.getElementById('totalProfit').textContent = formatCurrency(financial_stats.profit);
    
    // Calculate and show changes (mock data for now)
    updateStatChanges();
}

// Update stat changes with mock percentages
function updateStatChanges() {
    const changes = [
        { id: 'companiesChange', value: '+12%' },
        { id: 'servicesChange', value: '+18%' },
        { id: 'employeesChange', value: '+5%' },
        { id: 'profitChange', value: '+24%' }
    ];
    
    changes.forEach(change => {
        const element = document.getElementById(change.id);
        if (element) {
            element.textContent = change.value;
            element.className = change.value.startsWith('+') ? 'stat-change positive' : 'stat-change negative';
        }
    });
}

// Initialize all charts
async function initializeCharts() {
    await Promise.all([
        initializeMonthlyChart(),
        initializeTenderStatusChart(),
        initializeServiceTypeChart(),
        initializeTenderSuccessChart(),
        initializeServiceStatusChart(),
        initializeExpensesCategoryChart()
    ]);
}

// Initialize monthly financial chart
async function initializeMonthlyChart() {
    try {
        const response = await fetch('/api/monthly-chart-data/');
        const data = await response.json();
        
        const ctx = document.getElementById('monthlyChart').getContext('2d');
        
        monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.months,
                datasets: [
                    {
                        label: 'Daromad',
                        data: data.income,
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Xarajat',
                        data: data.expenses,
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Foyda',
                        data: data.profit,
                        borderColor: '#714b67',
                        backgroundColor: 'rgba(113, 75, 103, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    } catch (error) {
        console.error('Error initializing monthly chart:', error);
    }
}

// Initialize tender status pie chart
async function initializeTenderStatusChart() {
    try {
        const response = await fetch('/api/tender-status-chart/');
        const data = await response.json();
        
        const ctx = document.getElementById('tenderStatusChart').getContext('2d');
        
        tenderStatusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.data,
                    backgroundColor: data.colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            afterLabel: function(context) {
                                const amount = data.amounts[context.dataIndex];
                                return `Summa: ${formatCurrency(amount)}`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing tender status chart:', error);
    }
}

// Initialize service type bar chart
async function initializeServiceTypeChart() {
    try {
        const response = await fetch('/api/service-type-chart/');
        const data = await response.json();
        
        const ctx = document.getElementById('serviceTypeChart').getContext('2d');
        
        serviceTypeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Xizmatlar soni',
                    data: data.data,
                    backgroundColor: data.colors,
                    borderColor: data.colors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            afterBody: function(tooltipItems) {
                                const index = tooltipItems[0].dataIndex;
                                const amount = data.amounts[index];
                                return [`Umumiy summa: ${formatCurrency(amount)}`];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing service type chart:', error);
    }
}

// Initialize tender success rate chart
async function initializeTenderSuccessChart() {
    try {
        const response = await fetch('/api/tender-success-rate/');
        const data = await response.json();
        
        // Update success rate display
        const successDisplay = document.getElementById('successRateDisplay');
        if (successDisplay) {
            successDisplay.querySelector('.success-rate-number').textContent = 
                data.overall_success_rate + '%';
        }
        
        const ctx = document.getElementById('tenderSuccessChart').getContext('2d');
        
        tenderSuccessChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.monthly_data.months,
                datasets: [
                    {
                        label: 'Muvaffaqiyat foizi (%)',
                        data: data.monthly_data.success_rates,
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Yutgan tenderlar',
                        data: data.monthly_data.won_counts,
                        borderColor: '#714b67',
                        backgroundColor: 'rgba(113, 75, 103, 0.1)',
                        fill: false,
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing tender success chart:', error);
    }
}

// Initialize service status pie chart
async function initializeServiceStatusChart() {
    try {
        const response = await fetch('/api/service-status-chart/');
        const data = await response.json();
        
        const ctx = document.getElementById('serviceStatusChart').getContext('2d');
        
        serviceStatusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.data,
                    backgroundColor: data.colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing service status chart:', error);
    }
}

// Initialize expenses category bar chart
async function initializeExpensesCategoryChart() {
    try {
        const response = await fetch('/api/expenses-by-category/');
        const data = await response.json();
        
        const ctx = document.getElementById('expensesCategoryChart').getContext('2d');
        
        expensesCategoryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Xarajat',
                    data: data.data,
                    backgroundColor: 'rgba(113, 75, 103, 0.8)',
                    borderColor: '#714b67',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing expenses category chart:', error);
    }
}

// Load and display top companies
async function loadTopCompanies() {
    try {
        const response = await fetch('/api/top-companies/');
        const data = await response.json();
        
        const container = document.getElementById('topCompaniesList');
        container.innerHTML = '';
        
        data.companies.forEach((company, index) => {
            const item = document.createElement('div');
            item.className = 'company-item';
            item.innerHTML = `
                <div class="company-info">
                    <h4>${company.name}</h4>
                    <p>${company.phone || 'Telefon mavjud emas'}</p>
                </div>
                <div class="company-stats">
                    <div class="amount">${formatCurrency(company.total_income)}</div>
                    <div class="services">${company.service_count} ta xizmat</div>
                </div>
            `;
            container.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading top companies:', error);
    }
}

// Load and display employee performance
async function loadEmployeePerformance() {
    try {
        const response = await fetch('/api/employee-performance/');
        const data = await response.json();
        
        const tbody = document.querySelector('#employeePerformanceTable tbody');
        tbody.innerHTML = '';
        
        data.employees.forEach(employee => {
            const performance = calculatePerformance(employee);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${employee.name}</td>
                <td>${employee.position}</td>
                <td>${employee.services_created}</td>
                <td>${formatCurrency(employee.income_managed)}</td>
                <td>${formatCurrency(employee.expenses_managed)}</td>
                <td><span class="performance-badge ${performance.class}">${performance.text}</span></td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading employee performance:', error);
    }
}

// Calculate performance rating
function calculatePerformance(employee) {
    const score = employee.services_created * 10 + 
                  (employee.income_managed / 1000000) * 5 - 
                  (employee.expenses_managed / 1000000) * 2;
    
    if (score >= 50) return { class: 'excellent', text: 'A\'lo' };
    if (score >= 30) return { class: 'good', text: 'Yaxshi' };
    if (score >= 15) return { class: 'average', text: 'O\'rta' };
    return { class: 'poor', text: 'Past' };
}

// Update financial summary
function updateFinancialSummary() {
    const { financial_stats } = dashboardData;
    
    document.getElementById('monthlyIncome').textContent = formatCurrency(financial_stats.monthly_income);
    document.getElementById('monthlyExpense').textContent = formatCurrency(financial_stats.monthly_expenses);
    document.getElementById('monthlyProfitSummary').textContent = formatCurrency(financial_stats.monthly_profit);
    
    // Calculate profit margin
    const margin = financial_stats.monthly_income > 0 ? 
        (financial_stats.monthly_profit / financial_stats.monthly_income * 100) : 0;
    document.getElementById('profitMargin').textContent = margin.toFixed(1) + '%';
}

// Update monthly chart period
async function updateMonthlyChart() {
    const period = document.getElementById('monthlyChartPeriod').value;
    
    try {
        const response = await fetch(`/api/monthly-chart-data/?period=${period}`);
        const data = await response.json();
        
        monthlyChart.data.labels = data.months;
        monthlyChart.data.datasets[0].data = data.income;
        monthlyChart.data.datasets[1].data = data.expenses;
        monthlyChart.data.datasets[2].data = data.profit;
        monthlyChart.update();
    } catch (error) {
        console.error('Error updating monthly chart:', error);
    }
}

// Refresh entire dashboard
async function refreshDashboard() {
    await initializeDashboard();
    showNotification('Dashboard yangilandi', 'success');
}

// Export data
function exportData() {
    window.open('/api/export-analytics-data/', '_blank');
    showNotification('Ma\'lumotlar eksport qilindi', 'success');
}

// Format currency
function formatCurrency(value) {
    if (value === null || value === undefined) return '0 so\'m';
    return new Intl.NumberFormat('uz-UZ').format(value) + ' so\'m';
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#17a2b8'};
        color: white;
        padding: 15px 20px;
        border-radius: 6px;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
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

// Handle window resize
window.addEventListener('resize', function() {
    if (monthlyChart) monthlyChart.resize();
    if (serviceStatusChart) serviceStatusChart.resize();
    if (expensesCategoryChart) expensesCategoryChart.resize();
    if (tenderStatusChart) tenderStatusChart.resize();
    if (serviceTypeChart) serviceTypeChart.resize();
    if (tenderSuccessChart) tenderSuccessChart.resize();
});

// Auto-refresh dashboard every 5 minutes
setInterval(refreshDashboard, 300000);

// Handle chart interactions
function setupChartInteractions() {
    // Add click handlers for charts if needed
    if (monthlyChart) {
        monthlyChart.options.onClick = function(event, elements) {
            if (elements.length > 0) {
                const index = elements[0].index;
                const label = monthlyChart.data.labels[index];
                console.log('Clicked on month:', label);
                // Handle chart click - could navigate to detailed view
            }
        };
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+R or F5 - Refresh dashboard
    if ((e.ctrlKey && e.key === 'r') || e.key === 'F5') {
        e.preventDefault();
        refreshDashboard();
    }
    
    // Ctrl+E - Export data
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        exportData();
    }
});

// Print functionality
function printDashboard() {
    window.print();
}

// Add print styles
const printStyle = document.createElement('style');
printStyle.textContent = `
    @media print {
        .header-right, .quick-actions {
            display: none !important;
        }
        
        .analytics-container {
            margin: 0;
            padding: 0;
        }
        
        .chart-container {
            page-break-inside: avoid;
        }
        
        .stats-grid {
            page-break-after: avoid;
        }
    }
`;
document.head.appendChild(printStyle);