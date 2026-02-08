import api from './api';

export const paymentService = {
    async getAllPayments() {
        try {
            const response = await api.get('/payments');
            return response.data;
        } catch (error) {
            console.error('Error fetching all payments:', error);
            throw error;
        }
    },

    async getOrderPayments(orderId) {
        try {
            const response = await api.get(`/payments/order/${orderId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching payments for order ${orderId}:`, error);
            throw error;
        }
    },

    async createPayment(paymentData) {
        try {
            const response = await api.post('/payments', paymentData);
            return response.data;
        } catch (error) {
            console.error('Error creating payment:', error);
            throw error;
        }
    },

    async updatePayment(id, paymentData) {
        try {
            const response = await api.put(`/payments/${id}`, paymentData);
            return response.data;
        } catch (error) {
            console.error(`Error updating payment ${id}:`, error);
            throw error;
        }
    },

    async deletePayment(id) {
        try {
            const response = await api.delete(`/payments/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting payment ${id}:`, error);
            throw error;
        }
    }
};