import api from './api';

export const customerService = {

    async getAllCustomers(skip = 0, limit = 20) {
        const response = await api.get('/customers', {
            params: {skip, limit}
        });
        return response.data;
    },

    async getAllCustomersForDropdown() {
        const response = await api.get('/customers');
        if (response.data?.customers) {
            return response.data.customers;
        }
        return response.data;
    },

    async createCustomer(data) {
        const response = await api.post('/customers', data);
        return response.data;
    },
    async updateCustomer(id, data) {
        const response = await api.put(`/customers/${id}`, data);
        return response.data;
    }
};
