import api from './api';

export const measurementService = {
  async getAllMeasurements() {
    const response = await api.get('/measurements');
    return response.data;
  },
  
  async getCustomerMeasurements(customerId) {
    const response = await api.get(`/measurements/customer/${customerId}`);
    return response.data;
  },
  
  async getOrderMeasurements(orderId) {
    const response = await api.get(`/measurements/order/${orderId}`);
    return response.data;
  },
  
  async createMeasurement(data) {
    const response = await api.post('/measurements', data);
    return response.data;
  },
  
  async updateMeasurement(id, data) {
    const response = await api.put(`/measurements/${id}`, data);
    return response.data;
  },
  
  async deleteMeasurement(id) {
    const response = await api.delete(`/measurements/${id}`);
    return response.data;
  }
};
