import api from './api';

export const orderService = {
    async getAllOrders() {
        const response = await api.get('/orders');
        return response.data;
    },

    async getMyOrders() {
        const response = await api.get('/orders/my-orders');
        return response.data;
    },

    async getUnassignedOrders() {
        const response = await api.get('/orders/unassigned');
        return response.data;
    },

    async getOrder(id) {
        const response = await api.get(`/orders/${id}`);
        return response.data;
    },

    async createOrder(data) {
        const response = await api.post('/orders', data);
        return response.data;
    },

    async updateOrder(id, data) {
        const response = await api.put(`/orders/${id}`, data);
        return response.data;
    },

    async assignOrder(id, tailorId) {
        const response = await api.post(`/orders/${id}/assign`, { assigned_to: tailorId });
        return response.data;
    },

    async deleteOrder(id) {
        const response = await api.delete(`/orders/${id}`);
        return response.data;
    }
};


// import api from './api';
//
//
// export const orderService = {
//     async getAllOrders() {
//         const response = await api.get('/orders');
//         return response.data;
//     },
//
//     async getOrder(id) {
//         const response = await api.get(`/orders/${id}`);
//         return response.data;
//     },
//
//     async createOrder(data) {
//         const response = await api.post('/orders', data);
//         return response.data;
//     },
//
//     async updateOrder(id, data) {
//         const response = await api.put(`/orders/${id}`, data);
//         return response.data;
//     },
//
//     async deleteOrder(id) {
//         const response = await api.delete(`/orders/${id}`);
//         return response.data;
//     }
// };
