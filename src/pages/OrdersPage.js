import React, {useEffect, useState} from 'react';
import {Calendar, Edit2, Filter, Plus, RefreshCw, Search, UserPlus, X} from 'lucide-react';
import {orderService} from '../services/orderService';
import {customerService} from '../services/customerService';
import {formatCurrency, formatDate, formatName, getStatusColor} from '../utils/helpers';
import toast from 'react-hot-toast';
import SearchableCustomerSelect from "../components/common/SearchableCustomerSelect";
import {useAuth} from "../hooks/useAuth";
import {userService} from "../services/userService";

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [tailors, setTailors] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [assignedFilter, setAssignedFilter] = useState('ALL');
    const [customerFilter, setCustomerFilter] = useState('ALL');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);
    const [assigningOrder, setAssigningOrder] = useState(null);
    const {user} = useAuth();

    const [form, setForm] = useState({customer_id: '', total_amount: '', due_date: '', notes: ''});
    const [editForm, setEditForm] = useState({
        total_amount: '',
        due_date: '',
        collection_date: '',
        status: '',
        notes: ''
    });

    // State for managing which order's quick status menu is open
    const [quickStatusMenuOpen, setQuickStatusMenuOpen] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [search, statusFilter, assignedFilter, customerFilter, dateFrom, dateTo, orders]);

    const loadData = async () => {
        try {
            const [ordersData, customersData] = await Promise.all([
                orderService.getAllOrders(),
                customerService.getAllCustomersForDropdown()
            ]);
            setOrders(ordersData);
            setFiltered(ordersData);
            setCustomers(customersData);

            if (user?.role === 'ADMIN') {
                const usersData = await userService.getAllUsers();
                const tailorUsers = usersData.filter(u => u.role === 'TAILOR');
                setTailors(tailorUsers);
            }

        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = orders;

        // Search filter
        if (search) {
            result = result.filter(o =>
                o.order_number.toLowerCase().includes(search.toLowerCase()) ||
                customers.find(c => c.id === o.customer_id)?.name.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'ALL') {
            result = result.filter(o => o.status === statusFilter);
        }

        // Assigned filter
        if (assignedFilter !== 'ALL') {
            if (assignedFilter === 'UNASSIGNED') {
                result = result.filter(o => !o.assigned_to);
            } else {
                result = result.filter(o => o.assigned_to === parseInt(assignedFilter));
            }
        }

        // Customer filter
        if (customerFilter !== 'ALL') {
            result = result.filter(o => o.customer_id === parseInt(customerFilter));
        }

        // Date range filter
        if (dateFrom) {
            result = result.filter(o => new Date(o.created_at) >= new Date(dateFrom));
        }
        if (dateTo) {
            const endDate = new Date(dateTo);
            endDate.setHours(23, 59, 59, 999);
            result = result.filter(o => new Date(o.created_at) <= endDate);
        }

        setFiltered(result);
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('ALL');
        setAssignedFilter('ALL');
        setCustomerFilter('ALL');
        setDateFrom('');
        setDateTo('');
    };

    const hasActiveFilters = () => {
        return statusFilter !== 'ALL' || assignedFilter !== 'ALL' ||
            customerFilter !== 'ALL' || dateFrom || dateTo || search;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await orderService.createOrder(form);
            toast.success('Order created!');
            setShowModal(false);
            setForm({customer_id: '', total_amount: '', due_date: '', notes: ''});
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to create order');
        }
    };

    const handleAssignOrder = (order) => {
        setAssigningOrder(order);
        setShowAssignModal(true);
    };

    const handleEdit = (order) => {
        setEditingOrder(order);
        setEditForm({
            total_amount: order.total_amount,
            due_date: order.due_date,
            collection_date: order.collection_date || '',
            status: order.status,
            notes: order.notes || ''
        });
        setShowEditModal(true);
    };

    const handleUpdateOrder = async (e) => {
        e.preventDefault();
        try {
            await orderService.updateOrder(editingOrder.id, editForm);
            toast.success('Order updated successfully!');
            setShowEditModal(false);
            setEditingOrder(null);
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to update order');
        }
    };

    const handleSubmitAssignment = async (e) => {
        e.preventDefault();
        const tailorId = e.target.tailor.value;

        try {
            await orderService.assignOrder(assigningOrder.id, tailorId || null);
            toast.success(tailorId ? 'Order assigned successfully!' : 'Order unassigned');
            setShowAssignModal(false);
            setAssigningOrder(null);
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to assign order');
        }
    };

    const handleQuickStatusUpdate = async (orderId, newStatus) => {
        try {
            await orderService.updateOrder(orderId, {status: newStatus});
            toast.success(`Status updated to ${newStatus}`);
            setQuickStatusMenuOpen(null);
            loadData();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    // Toggle quick status menu
    const toggleQuickStatusMenu = (orderId) => {
        if (quickStatusMenuOpen === orderId) {
            setQuickStatusMenuOpen(null);
        } else {
            setQuickStatusMenuOpen(orderId);
        }
    };

    // Close quick status menu when clicking elsewhere
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.quick-status-menu') && !event.target.closest('.quick-status-button')) {
                setQuickStatusMenuOpen(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    if (loading) {
        return <div className="flex items-center justify-center py-12">
            <div className="loader"></div>
        </div>;
    }

    const statusCounts = {
        ALL: orders.length,
        PENDING: orders.filter(o => o.status === 'PENDING').length,
        IN_PROGRESS: orders.filter(o => o.status === 'IN_PROGRESS').length,
        READY: orders.filter(o => o.status === 'READY').length,
        COLLECTED: orders.filter(o => o.status === 'COLLECTED').length
    };

    const statusOptions = ['PENDING', 'IN_PROGRESS', 'READY', 'COLLECTED', 'CANCELLED'];
    const isAdmin = user?.role === 'ADMIN';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
                    <p className="text-gray-600 mt-1">
                        Showing {filtered.length} of {orders.length} orders
                    </p>
                </div>
                <div className="flex gap-2">
                    {isAdmin && (
                        <>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-primary-50 text-primary-600 border-primary-600' : ''}`}
                            >
                                <Filter className="h-4 w-4"/>
                                Filters
                                {hasActiveFilters() && (
                                    <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                                        {[
                                            statusFilter !== 'ALL',
                                            assignedFilter !== 'ALL',
                                            customerFilter !== 'ALL',
                                            dateFrom,
                                            dateTo,
                                            search
                                        ].filter(Boolean).length}
                                    </span>
                                )}
                            </button>
                            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                                <Plus className="h-4 w-4"/>
                                New Order
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Advanced Filters Panel */}
            {isAdmin && showFilters && (
                <div className="card bg-gray-50 border-2 border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Filter Orders</h3>
                        {hasActiveFilters() && (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                            >
                                <X className="h-4 w-4"/>
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="input-field"
                            >
                                <option value="ALL">All Statuses</option>
                                {statusOptions.map((status) => (
                                    <option key={status} value={status}>{status.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </div>

                        {/* Assigned To Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                            <select
                                value={assignedFilter}
                                onChange={(e) => setAssignedFilter(e.target.value)}
                                className="input-field"
                            >
                                <option value="ALL">All Tailors</option>
                                <option value="UNASSIGNED">Unassigned</option>
                                {tailors.map((tailor) => (
                                    <option key={tailor.id} value={tailor.id}>
                                        {formatName(tailor.username)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Customer Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
                            <select
                                value={customerFilter}
                                onChange={(e) => setCustomerFilter(e.target.value)}
                                className="input-field"
                            >
                                <option value="ALL">All Customers</option>
                                {customers.map((customer) => (
                                    <option key={customer.id} value={customer.id}>
                                        {formatName(customer.name)} - {customer.phone}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date From */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Calendar className="h-5 w-5"/>
                                </div>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="input-field !pl-10"
                                />
                            </div>
                        </div>

                        {/* Date To */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Calendar className="h-5 w-5"/>
                                </div>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="input-field !pl-10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Active Filters Summary */}
                    {hasActiveFilters() && (
                        <div className="mt-4 pt-4 border-t border-gray-300">
                            <div className="flex flex-wrap gap-2">
                                <span className="text-sm text-gray-600 font-medium">Active filters:</span>
                                {statusFilter !== 'ALL' && (
                                    <span
                                        className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                                        Status: {statusFilter.replace('_', ' ')}
                                    </span>
                                )}
                                {assignedFilter !== 'ALL' && (
                                    <span
                                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                        Assigned: {assignedFilter === 'UNASSIGNED' ? 'Unassigned' :
                                        formatName(tailors.find(t => t.id === parseInt(assignedFilter))?.username)}
                                    </span>
                                )}
                                {customerFilter !== 'ALL' && (
                                    <span
                                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                        Customer: {formatName(customers.find(c => c.id === parseInt(customerFilter))?.name)}
                                    </span>
                                )}
                                {dateFrom && (
                                    <span
                                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                        From: {formatDate(dateFrom)}
                                    </span>
                                )}
                                {dateTo && (
                                    <span
                                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                        To: {formatDate(dateTo)}
                                    </span>
                                )}
                                {search && (
                                    <span
                                        className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                                        Search: "{search}"
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Search Bar and Quick Status Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Search className="h-5 w-5"/>
                    </div>
                    <input
                        type="text"
                        placeholder="Search by order number or customer name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-field !pl-10"
                    />
                </div>

                {/* Quick Status Filters (visible for all users) */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {Object.entries(statusCounts).map(([status, count]) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                                statusFilter === status
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border'
                            }`}
                        >
                            {status === 'ALL' ? 'All' : status.replace('_', ' ')} ({count})
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                            {isAdmin &&
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned
                                    To</th>}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filtered.map((order) => {
                            const balance = parseFloat(order.total_amount) - parseFloat(order.amount_paid);
                            const customer = customers.find(c => c.id === order.customer_id);

                            return (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                        {order.order_number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                        {customer?.name
                                            ? formatName(customer.name)
                                            : `Customer #${order.customer_id}`}
                                    </td>
                                    {isAdmin && (
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {order.assigned_tailor ? (
                                                <span
                                                    className="text-sm text-gray-900">{formatName(order.assigned_tailor.username)}</span>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">Unassigned</span>
                                            )}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap font-semibold">
                                        {formatCurrency(order.total_amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={balance > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                                            {formatCurrency(balance)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                        {formatDate(order.due_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`px-2.5 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleAssignOrder(order)}
                                                    className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                                                    title="Assign Tailor"
                                                >
                                                    <UserPlus className="h-4 w-4 text-purple-600"/>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleEdit(order)}
                                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit Order"
                                            >
                                                <Edit2 className="h-4 w-4 text-blue-600"/>
                                            </button>
                                            {order.status !== 'COLLECTED' && order.status !== 'CANCELLED' && (
                                                <div className="relative">
                                                    <button
                                                        onClick={() => toggleQuickStatusMenu(order.id)}
                                                        className="p-2 hover:bg-green-50 rounded-lg transition-colors quick-status-button"
                                                        title="Quick Status Update"
                                                    >
                                                        <RefreshCw className="h-4 w-4 text-green-600"/>
                                                    </button>
                                                    {quickStatusMenuOpen === order.id && (
                                                        <div
                                                            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 quick-status-menu">
                                                            {statusOptions.filter(s => s !== order.status).map((status) => (
                                                                <button
                                                                    key={status}
                                                                    onClick={() => handleQuickStatusUpdate(order.id, status)}
                                                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                                                                >
                                                                    {status.replace('_', ' ')}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>

                {filtered.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No orders found matching your filters</p>
                        {hasActiveFilters() && (
                            <button
                                onClick={clearFilters}
                                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                            >
                                Clear filters to see all orders
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Create Order Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)}/>
                        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
                            <h3 className="text-xl font-semibold mb-6">Create New Order</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
                                    <SearchableCustomerSelect
                                        value={form.customer_id}
                                        onChange={(customerId) => setForm({...form, customer_id: customerId})}
                                        required
                                        placeholder="Search by name, phone, or email..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.total_amount}
                                        onChange={(e) => setForm({...form, total_amount: e.target.value})}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                                    <input
                                        type="date"
                                        value={form.due_date}
                                        onChange={(e) => setForm({...form, due_date: e.target.value})}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                    <input
                                        type="text"
                                        value={form.notes}
                                        onChange={(e) => setForm({...form, notes: e.target.value})}
                                        className="input-field"
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowModal(false)}
                                            className="btn-secondary flex-1">Cancel
                                    </button>
                                    <button type="submit" className="btn-primary flex-1">Create Order</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Order Modal */}
            {showEditModal && editingOrder && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowEditModal(false)}/>
                        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
                            <h3 className="text-xl font-semibold mb-6">Edit Order - {editingOrder.order_number}</h3>
                            <form onSubmit={handleUpdateOrder} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <select
                                        value={editForm.status}
                                        onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                                        className="input-field"
                                        required
                                    >
                                        {statusOptions.map((status) => (
                                            <option key={status} value={status}>{status.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editForm.total_amount}
                                        onChange={(e) => setEditForm({...editForm, total_amount: e.target.value})}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                                    <input
                                        type="date"
                                        value={editForm.due_date}
                                        onChange={(e) => setEditForm({...editForm, due_date: e.target.value})}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Collection Date
                                        (Optional)</label>
                                    <input
                                        type="date"
                                        value={editForm.collection_date}
                                        onChange={(e) => setEditForm({...editForm, collection_date: e.target.value})}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                    <textarea
                                        value={editForm.notes}
                                        onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                                        className="input-field"
                                        rows="3"
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowEditModal(false)}
                                            className="btn-secondary flex-1">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary flex-1">
                                        Update Order
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Tailor Modal */}
            {showAssignModal && assigningOrder && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black bg-opacity-50"
                             onClick={() => setShowAssignModal(false)}/>
                        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                            <h3 className="text-xl font-semibold mb-6">Assign Order - {assigningOrder.order_number}</h3>
                            <form onSubmit={handleSubmitAssignment} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Assign To
                                        Tailor</label>
                                    <select name="tailor" defaultValue={assigningOrder.assigned_to || ''}
                                            className="input-field">
                                        <option value="">-- Unassign --</option>
                                        {tailors.map((tailor) => (
                                            <option key={tailor.id} value={tailor.id}>
                                                {formatName(tailor.username)} ({tailor.role})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Currently: {assigningOrder.assigned_tailor ? formatName(assigningOrder.assigned_tailor.username) : 'Unassigned'}
                                    </p>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowAssignModal(false)}
                                            className="btn-secondary flex-1">Cancel
                                    </button>
                                    <button type="submit" className="btn-primary flex-1">Assign</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
