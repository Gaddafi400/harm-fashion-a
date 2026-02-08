import React, {useEffect, useState} from 'react';
import {Edit, Eye, Plus, Ruler, Search, Trash2, X} from 'lucide-react';
import {measurementService} from '../services/measurementService';
import {customerService} from '../services/customerService';
import {orderService} from '../services/orderService';
import {formatDate} from '../utils/helpers';
import toast from 'react-hot-toast';
import SearchableCustomerSelect from "../components/common/SearchableCustomerSelect";
import SearchableOrderSelect from "../components/common/SearchableOrderSelect";

export default function MeasurementsPage() {
    const [measurements, setMeasurements] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [selectedMeasurement, setSelectedMeasurement] = useState(null);
    const [editingMeasurement, setEditingMeasurement] = useState(null);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({
        customer_id: '',
        order_id: '',
        measurement_type: 'MALE',
        notes: '',
        data: {}
    });

    const maleMeasurements = [
        {key: 'neck', label: 'Neck', unit: 'inches'},
        {key: 'shoulder', label: 'Shoulder', unit: 'inches'},
        {key: 'chest', label: 'Chest', unit: 'inches'},
        {key: 'waist', label: 'Waist', unit: 'inches'},
        {key: 'hips', label: 'Hips', unit: 'inches'},
        {key: 'shirt_length', label: 'Shirt Length', unit: 'inches'},
        {key: 'sleeve_length', label: 'Sleeve Length', unit: 'inches'},
        {key: 'trouser_length', label: 'Trouser Length', unit: 'inches'},
        {key: 'thigh', label: 'Thigh', unit: 'inches'},
        {key: 'knee', label: 'Knee', unit: 'inches'},
        {key: 'ankle', label: 'Ankle', unit: 'inches'},
        {key: 'crotch', label: 'Crotch', unit: 'inches'}
    ];

    const femaleMeasurements = [
        {key: 'bust', label: 'Bust', unit: 'inches'},
        {key: 'under_bust', label: 'Under Bust', unit: 'inches'},
        {key: 'waist', label: 'Waist', unit: 'inches'},
        {key: 'hips', label: 'Hips', unit: 'inches'},
        {key: 'shoulder', label: 'Shoulder', unit: 'inches'},
        {key: 'sleeve_length', label: 'Sleeve Length', unit: 'inches'},
        {key: 'dress_length', label: 'Dress Length', unit: 'inches'},
        {key: 'skirt_length', label: 'Skirt Length', unit: 'inches'},
        {key: 'blouse_length', label: 'Blouse Length', unit: 'inches'},
        {key: 'armhole', label: 'Armhole', unit: 'inches'},
        {key: 'neck', label: 'Neck', unit: 'inches'}
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [customersData, ordersData] = await Promise.all([
                customerService.getAllCustomersForDropdown(),
                orderService.getAllOrders()
            ]);
            setCustomers(customersData);
            setOrders(ordersData);

            const measurementsData = [];
            for (const customer of customersData) {
                try {
                    const customerMeasurements = await measurementService.getCustomerMeasurements(customer.id);
                    measurementsData.push(...customerMeasurements.map(m => ({...m, customer})));
                } catch (error) {
                    // Customer has no measurements
                }
            }
            setMeasurements(measurementsData);
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const measurementData = {
                customer_id: parseInt(form.customer_id),
                order_id: form.order_id ? parseInt(form.order_id) : null,
                measurement_type: form.measurement_type,
                data: form.data,
                notes: form.notes
            };

            if (editingMeasurement) {
                await measurementService.updateMeasurement(editingMeasurement.id, measurementData);
                toast.success('Measurement updated successfully');
            } else {
                await measurementService.createMeasurement(measurementData);
                toast.success('Measurement created successfully');
            }

            setShowModal(false);
            resetForm();
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Operation failed');
        }
    };

    const handleEdit = (measurement) => {
        setEditingMeasurement(measurement);
        setForm({
            customer_id: measurement.customer_id.toString(),
            order_id: measurement.order_id?.toString() || '',
            measurement_type: measurement.measurement_type,
            notes: measurement.notes || '',
            data: measurement.data || {}
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this measurement?')) return;

        try {
            await measurementService.deleteMeasurement(id);
            toast.success('Measurement deleted');
            loadData();
        } catch (error) {
            toast.error('Failed to delete measurement');
        }
    };

    const handleViewDetails = (measurement) => {
        setSelectedMeasurement(measurement);
        setShowPreview(true);
    };

    const resetForm = () => {
        setForm({
            customer_id: '',
            order_id: '',
            measurement_type: 'MALE',
            notes: '',
            data: {}
        });
        setEditingMeasurement(null);
    };

    const updateMeasurementData = (key, value) => {
        setForm({
            ...form,
            data: {...form.data, [key]: value}
        });
    };

    const currentMeasurementFields = form.measurement_type === 'MALE' ? maleMeasurements : femaleMeasurements;

    const filteredMeasurements = measurements.filter(m =>
        m.customer?.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <div className="flex items-center justify-center py-12">
            <div className="loader"></div>
        </div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Measurements</h2>
                    <p className="text-gray-600 mt-1">{measurements.length} total measurements</p>
                </div>
                <button onClick={() => {
                    resetForm();
                    setShowModal(true);
                }} className="btn-primary flex items-center gap-2">
                    <Plus className="h-4 w-4"/>
                    Add Measurement
                </button>
            </div>

            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="h-5 w-5"/>
                </div>
                <input
                    type="text"
                    placeholder="Search by customer name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-field !pl-10"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMeasurements.map((measurement) => (
                    <div key={measurement.id} className="card hover:shadow-lg transition-shadow group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                                    <Ruler className="h-6 w-6"/>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{measurement.customer?.name}</h3>
                                    <span
                                        className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded-full font-medium">
                    {measurement.measurement_type}
                  </span>
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleViewDetails(measurement)}
                                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="View Details"
                                >
                                    <Eye className="h-4 w-4 text-blue-600"/>
                                </button>
                                <button
                                    onClick={() => handleEdit(measurement)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Edit className="h-4 w-4 text-gray-600"/>
                                </button>
                                <button
                                    onClick={() => handleDelete(measurement.id)}
                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="h-4 w-4 text-red-600"/>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {Object.entries(measurement.data).slice(0, 4).map(([key, value]) => (
                                    <div key={key} className="flex justify-between p-2 bg-gray-50 rounded">
                                        <span
                                            className="text-gray-600 capitalize text-xs">{key.replace('_', ' ')}:</span>
                                        <span className="font-medium text-gray-900">{value}"</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => handleViewDetails(measurement)}
                                className="w-full mt-2 px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Eye className="h-4 w-4"/>
                                View All {Object.keys(measurement.data).length} Measurements
                            </button>
                            {measurement.notes && (
                                <p className="text-sm text-gray-600 mt-3 pt-3 border-t italic">
                                    {measurement.notes}
                                </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                                Created: {formatDate(measurement.created_at)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {filteredMeasurements.length === 0 && (
                <div className="text-center py-12">
                    <Ruler className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                    <p className="text-gray-500">No measurements found</p>
                </div>
            )}

            {/* Preview Modal */}
            {showPreview && selectedMeasurement && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowPreview(false)}/>

                        <div
                            className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b p-6 z-10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold">{selectedMeasurement.customer?.name} -
                                        Measurements</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Type: <span
                                        className="font-medium text-purple-600">{selectedMeasurement.measurement_type}</span>
                                        {' • '}
                                        Created: {formatDate(selectedMeasurement.created_at)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="h-5 w-5"/>
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {Object.entries(selectedMeasurement.data).map(([key, value]) => (
                                        <div key={key}
                                             className="p-4 bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-lg">
                                            <p className="text-xs text-purple-600 font-medium uppercase mb-1">
                                                {key.replace('_', ' ')}
                                            </p>
                                            <p className="text-2xl font-bold text-gray-900">{value}<span
                                                className="text-sm text-gray-500 ml-1">inches</span></p>
                                        </div>
                                    ))}
                                </div>

                                {selectedMeasurement.notes && (
                                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-sm font-medium text-yellow-900 mb-1">Notes:</p>
                                        <p className="text-sm text-yellow-800">{selectedMeasurement.notes}</p>
                                    </div>
                                )}

                                <div className="mt-6 flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowPreview(false);
                                            handleEdit(selectedMeasurement);
                                        }}
                                        className="btn-primary flex-1"
                                    >
                                        Edit Measurement
                                    </button>
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        className="btn-secondary flex-1"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => {
                            setShowModal(false);
                            resetForm();
                        }}/>

                        <div
                            className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b p-6 z-10">
                                <h3 className="text-xl font-semibold">
                                    {editingMeasurement ? 'Edit Measurement' : 'Add New Measurement'}
                                </h3>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Customer
                                            *</label>
                                        <SearchableCustomerSelect
                                            value={form.customer_id}
                                            onChange={(customerId) => setForm({...form, customer_id: customerId})}
                                            required
                                            placeholder="Search customer by name, phone, or email..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Order
                                            (Optional)</label>
                                        <SearchableOrderSelect
                                            value={form.order_id}
                                            onChange={(orderId) => setForm({...form, order_id: orderId})}
                                            orders={orders}
                                            placeholder="Search order by order number..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                                        <select
                                            value={form.measurement_type}
                                            onChange={(e) => setForm({
                                                ...form,
                                                measurement_type: e.target.value,
                                                data: {}
                                            })}
                                            className="input-field"
                                            required
                                        >
                                            <option value="MALE">Male</option>
                                            <option value="FEMALE">Female</option>
                                            <option value="GENERAL">General</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                        <input
                                            type="text"
                                            value={form.notes}
                                            onChange={(e) => setForm({...form, notes: e.target.value})}
                                            className="input-field"
                                            placeholder="Additional notes..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Ruler className="h-5 w-5"/>
                                        {form.measurement_type} Measurements (in inches)
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {currentMeasurementFields.map((field) => (
                                            <div key={field.key}>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    {field.label}
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={form.data[field.key] || ''}
                                                    onChange={(e) => updateMeasurementData(field.key, e.target.value)}
                                                    className="input-field"
                                                    placeholder="0.0"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            resetForm();
                                        }}
                                        className="btn-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary flex-1">
                                        {editingMeasurement ? 'Update Measurement' : 'Create Measurement'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
