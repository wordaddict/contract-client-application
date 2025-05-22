// API Configuration
const API_BASE_URL = 'http://localhost:3001';

// Global state
let currentProfileId = null;

// Utility functions
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="error-message">${message}</div>`;
}

function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="success-message">${message}</div>`;
}

function showLoading(elementId) {
    const element = document.getElementById(elementId);
    element.innerHTML = '<div class="spinner"></div>';
}

// Profile Management
function setProfile() {
    const profileId = document.getElementById('profileId').value;
    if (!profileId) {
        showError('contractsList', 'Please enter a profile ID');
        return;
    }
    currentProfileId = profileId;
    loadContracts();
    loadJobs();
}

// Contract Management
async function loadContracts() {
    if (!currentProfileId) return;

    showLoading('contractsList');
    try {
        const response = await fetch(`${API_BASE_URL}/contracts`, {
            headers: {
                'profile_id': currentProfileId
            }
        });
        const data = await response.json();

        if (data.status === 'error') {
            showError('contractsList', data.message);
            return;
        }

        const contractsList = document.getElementById('contractsList');
        if (data.data.length === 0) {
            contractsList.innerHTML = '<p class="text-gray-500">No contracts found</p>';
            return;
        }

        contractsList.innerHTML = data.data.map(contract => `
            <div class="contract-card">
                <div class="flex justify-between items-center">
                    <h3 class="font-medium">Contract #${contract.id}</h3>
                    <span class="status-badge status-${contract.status}">${contract.status}</span>
                </div>
                <p class="text-gray-600 mt-2">${contract.terms}</p>
                <div class="mt-2 text-sm text-gray-500">
                    <p>Client ID: ${contract.ClientId}</p>
                    <p>Contractor ID: ${contract.ContractorId}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showError('contractsList', 'Failed to load contracts');
    }
}

// Job Management
async function loadJobs() {
    if (!currentProfileId) return;

    showLoading('jobsList');
    try {
        const response = await fetch(`${API_BASE_URL}/jobs/unpaid`, {
            headers: {
                'profile_id': currentProfileId
            }
        });
        const data = await response.json();

        if (data.status === 'error') {
            showError('jobsList', data.message);
            return;
        }

        const jobsList = document.getElementById('jobsList');
        if (data.data.length === 0) {
            jobsList.innerHTML = '<p class="text-gray-500">No unpaid jobs found</p>';
            return;
        }

        jobsList.innerHTML = data.data.map(job => `
            <div class="job-card">
                <div class="flex justify-between items-center">
                    <h3 class="font-medium">Job #${job.id}</h3>
                    <span class="paid-badge">Unpaid</span>
                </div>
                <p class="text-gray-600 mt-2">${job.description}</p>
                <div class="mt-2 flex justify-between items-center">
                    <span class="text-lg font-semibold">$${job.price}</span>
                    <button onclick="payForJob(${job.id})" 
                        class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                        Pay Now
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showError('jobsList', 'Failed to load jobs');
    }
}

async function payForJob(jobId) {
    if (!currentProfileId) {
        showError('jobsList', 'Please set a profile ID first');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/pay`, {
            method: 'POST',
            headers: {
                'profile_id': currentProfileId
            }
        });
        const data = await response.json();

        if (data.status === 'error') {
            showError('jobsList', data.message);
            return;
        }

        showSuccess('jobsList', 'Payment successful!');
        loadJobs(); // Refresh the jobs list
    } catch (error) {
        showError('jobsList', 'Failed to process payment');
    }
}

// Admin Dashboard
async function getBestProfession() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!startDate || !endDate) {
        showError('bestProfessionResult', 'Please select both start and end dates');
        return;
    }

    showLoading('bestProfessionResult');
    try {
        const response = await fetch(
            `${API_BASE_URL}/admin/best-profession?start=${startDate}&end=${endDate}`,
            {
                headers: {
                    'profile_id': currentProfileId
                }
            }
        );
        const data = await response.json();

        if (data.status === 'error') {
            showError('bestProfessionResult', data.message);
            return;
        }

        const resultDiv = document.getElementById('bestProfessionResult');
        if (!data.data.profession) {
            resultDiv.innerHTML = '<p class="text-gray-500">No data found for the selected period</p>';
            return;
        }

        resultDiv.innerHTML = `
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-medium">Best Profession: ${data.data.profession}</h4>
                <p class="text-gray-600">Total Earnings: $${data.data.totalEarnings}</p>
            </div>
        `;
    } catch (error) {
        showError('bestProfessionResult', 'Failed to fetch best profession data');
    }
}

async function getBestClients() {
    const startDate = document.getElementById('clientsStartDate').value;
    const endDate = document.getElementById('clientsEndDate').value;
    const limit = document.getElementById('clientsLimit').value;

    if (!startDate || !endDate) {
        showError('bestClientsResult', 'Please select both start and end dates');
        return;
    }

    showLoading('bestClientsResult');
    try {
        const response = await fetch(
            `${API_BASE_URL}/admin/best-clients?start=${startDate}&end=${endDate}&limit=${limit}`,
            {
                headers: {
                    'profile_id': currentProfileId
                }
            }
        );
        const data = await response.json();

        if (data.status === 'error') {
            showError('bestClientsResult', data.message);
            return;
        }

        const resultDiv = document.getElementById('bestClientsResult');
        if (data.data.length === 0) {
            resultDiv.innerHTML = '<p class="text-gray-500">No data found for the selected period</p>';
            return;
        }

        resultDiv.innerHTML = `
            <div class="space-y-4">
                ${data.data.map(client => `
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h4 class="font-medium">${client.fullName}</h4>
                        <p class="text-gray-600">Total Paid: $${client.paid}</p>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        showError('bestClientsResult', 'Failed to fetch best clients data');
    }
} 