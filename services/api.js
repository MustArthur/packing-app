// Mock API Service
const USE_REAL_API = true; // Set to true to use n8n via Proxy
// No need for external URL here, we use internal API routes
const API_BASE_URL = '/api';

const MOCK_DB = {
    'ORDER-001': [
        { sku: '88500001', flavor: 'Vanilla', qtyRequired: 2, scannedQty: 0, status: 'Pending' },
        { sku: '88500002', flavor: 'Chocolate', qtyRequired: 1, scannedQty: 0, status: 'Pending' },
    ],
    'ORDER-002': [
        { sku: '88500003', flavor: 'Strawberry', qtyRequired: 3, scannedQty: 0, status: 'Pending' },
    ]
};

export const fetchOrder = async (orderId) => {
    if (USE_REAL_API) {
        try {
            // Call internal API route
            const res = await fetch(`${API_BASE_URL}/order?orderId=${orderId}`);
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            return data; // Ensure n8n returns array of items
        } catch (error) {
            console.error("API Error:", error);
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                throw new Error('Cannot connect to server. Is it running?');
            }
            throw error;
        }
    }

    // Mock Fallback
    await new Promise(resolve => setTimeout(resolve, 500));
    const items = MOCK_DB[orderId];
    if (!items) throw new Error('Order not found');
    return JSON.parse(JSON.stringify(items));
};

export const updateOrderStatus = async (orderId, data) => {
    if (USE_REAL_API) {
        try {
            // Call internal API route
            const res = await fetch(`${API_BASE_URL}/update-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, ...data })
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Update failed');
            }
            return await res.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }

    // Mock Fallback
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`Order ${orderId} updated:`, data);
    return { success: true };
};
