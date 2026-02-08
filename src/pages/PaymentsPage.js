import React, {useEffect, useState} from 'react';
import {Calendar, CreditCard, DollarSign, Plus, Search, Eye, Trash2} from 'lucide-react';
import {orderService} from '../services/orderService';
import {customerService} from '../services/customerService';
import {paymentService} from '../services/paymentService';
import {formatCurrency, formatDate} from '../utils/helpers';
import toast from 'react-hot-toast';
import SearchableOrderSelect from "../components/common/SearchableOrderSelect";


export default function PaymentsPage() {
    const [payments, setPayments] = useState([]);
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({
        order_id: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode: 'CASH',
        reference: '',
        notes: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [ordersData, customersData, paymentsData] = await Promise.all([
                orderService.getAllOrders(),
                customerService.getAllCustomersForDropdown(),
                paymentService.getAllPayments()
            ]);

            setOrders(ordersData);
            setCustomers(customersData);

            // Map payments with order and customer data
            const mappedPayments = paymentsData.map(payment => {
                const order = ordersData.find(o => o.id === payment.order_id);
                const customer = customersData.find(c => c.id === order?.customer_id);
                return {
                    ...payment,
                    order,
                    customer
                };
            });

            setPayments(mappedPayments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        } catch (error) {
            toast.error('Failed to load data');
            console.error('Error loading payments data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const outstanding = getSelectedOrderBalance();
        const enteredAmount = parseFloat(form.amount);

        if (enteredAmount > outstanding) {
            toast.error(`Payment amount cannot exceed outstanding balance (${formatCurrency(outstanding)})`);
            return;
        }

        if (enteredAmount <= 0) {
            toast.error('Payment amount must be greater than zero');
            return;
        }

        try {
            const paymentData = {
                order_id: parseInt(form.order_id),
                amount: enteredAmount,
                payment_date: form.payment_date,
                payment_mode: form.payment_mode,
                reference: form.reference || null,
                notes: form.notes || null
            };

            await paymentService.createPayment(paymentData);
            toast.success('Payment recorded successfully');

            setShowModal(false);
            resetForm();
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || error.message || 'Failed to record payment');
        }
    };

    const handleDeletePayment = async (paymentId) => {
        if (!window.confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
            return;
        }

        try {
            await paymentService.deletePayment(paymentId);
            toast.success('Payment deleted successfully');
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to delete payment');
        }
    };

    const handleViewDetails = (payment) => {
        setSelectedPayment(payment);
        setShowDetails(true);
    };

    const resetForm = () => {
        setForm({
            order_id: '',
            amount: '',
            payment_date: new Date().toISOString().split('T')[0],
            payment_mode: 'CASH',
            reference: '',
            notes: ''
        });
    };

    const getSelectedOrderBalance = () => {
        if (!form.order_id) return 0;
        const order = orders.find(o => o.id === parseInt(form.order_id));
        if (!order) return 0;
        return parseFloat(order.total_amount) - parseFloat(order.amount_paid);
    };

    const filteredPayments = payments.filter(p =>
        p.order?.order_number.toLowerCase().includes(search.toLowerCase()) ||
        p.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
        p.reference?.toLowerCase().includes(search.toLowerCase())
    );

    const paymentModes = ['CASH', 'CARD', 'TRANSFER', 'MOBILE_MONEY', 'OTHER'];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Payments</h2>
                    <p className="text-gray-600 mt-1">
                        {payments.length} total payments • Total: {formatCurrency(
                        payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0)
                    )}
                    </p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                    <Plus className="h-4 w-4"/>
                    Record Payment
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="h-5 w-5"/>
                </div>
                <input
                    type="text"
                    placeholder="Search by order number, customer, or reference..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-field !pl-10"
                />
            </div>

            {/* Payments Table */}
            <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPayments.map((payment) => (
                            <tr key={payment.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                    {formatDate(payment.payment_date)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                    {payment.order?.order_number}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                    {payment.customer?.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">
                                    {formatCurrency(payment.amount)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                                        payment.payment_mode === 'CASH' ? 'bg-green-100 text-green-800' :
                                            payment.payment_mode === 'CARD' ? 'bg-blue-100 text-blue-800' :
                                                payment.payment_mode === 'TRANSFER' ? 'bg-purple-100 text-purple-800' :
                                                    'bg-gray-100 text-gray-800'
                                    }`}>
                                        {payment.payment_mode}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleViewDetails(payment)}
                                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="View Details"
                                        >
                                            <Eye className="h-4 w-4 text-blue-600"/>
                                        </button>
                                        <button
                                            onClick={() => handleDeletePayment(payment.id)}
                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Payment"
                                        >
                                            <Trash2 className="h-4 w-4 text-red-600"/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {filteredPayments.length === 0 && (
                <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                    <p className="text-gray-500">
                        {search ? 'No payments found matching your search' : 'No payments recorded yet'}
                    </p>
                </div>
            )}

            {/* Payment Details Modal */}
            {showDetails && selectedPayment && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDetails(false)}/>
                        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
                            <h3 className="text-xl font-semibold mb-6">Payment Details</h3>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm font-medium text-gray-500">Order Number</p>
                                        <p className="text-lg font-semibold text-gray-900">{selectedPayment.order?.order_number}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm font-medium text-gray-500">Customer</p>
                                        <p className="text-lg font-semibold text-gray-900">{selectedPayment.customer?.name}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm font-medium text-gray-500">Payment Amount</p>
                                        <p className="text-lg font-semibold text-green-600">{formatCurrency(selectedPayment.amount)}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm font-medium text-gray-500">Payment Date</p>
                                        <p className="text-lg font-semibold text-gray-900">{formatDate(selectedPayment.payment_date)}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm font-medium text-gray-500">Payment Mode</p>
                                        <p className="text-lg font-semibold text-gray-900">{selectedPayment.payment_mode}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm font-medium text-gray-500">Reference</p>
                                        <p className="text-lg font-semibold text-gray-900">{selectedPayment.reference || 'N/A'}</p>
                                    </div>
                                </div>

                                {selectedPayment.notes && (
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-sm font-medium text-yellow-900 mb-2">Notes</p>
                                        <p className="text-sm text-yellow-800">{selectedPayment.notes}</p>
                                    </div>
                                )}

                                <div className="pt-4 border-t">
                                    <p className="text-sm text-gray-500">Recorded on: {formatDate(selectedPayment.created_at)}</p>
                                </div>

                                <div className="flex gap-3 pt-6">
                                    <button
                                        onClick={() => setShowDetails(false)}
                                        className="btn-secondary flex-1"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDetails(false);
                                            handleDeletePayment(selectedPayment.id);
                                        }}
                                        className="btn-danger flex-1"
                                    >
                                        Delete Payment
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Record Payment Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => {
                            setShowModal(false);
                            resetForm();
                        }}/>

                        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
                            <h3 className="text-xl font-semibold mb-6">Record Payment</h3>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Order *</label>
                                    <SearchableOrderSelect
                                        value={form.order_id}
                                        onChange={(orderId) => setForm({...form, order_id: orderId})}
                                        orders={orders}
                                        customers={customers}
                                        required
                                        placeholder="Search order by order number or customer..."
                                        showBalance={true}
                                    />
                                </div>

                                {form.order_id && (
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm font-medium text-blue-900">
                                            Outstanding Balance: <span
                                            className="text-lg font-bold">{formatCurrency(getSelectedOrderBalance())}</span>
                                        </p>
                                        <p className="text-xs text-blue-700 mt-1">
                                            Enter amount less than or equal to this balance
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <DollarSign className="h-5 w-5"/>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={form.amount}
                                            onChange={(e) => setForm({...form, amount: e.target.value})}
                                            className="input-field !pl-10"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                    {form.order_id && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Maximum allowed: {formatCurrency(getSelectedOrderBalance())}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date *</label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                <Calendar className="h-5 w-5"/>
                                            </div>
                                            <input
                                                type="date"
                                                value={form.payment_date}
                                                onChange={(e) => setForm({...form, payment_date: e.target.value})}
                                                className="input-field !pl-10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode *</label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                <CreditCard className="h-5 w-5"/>
                                            </div>
                                            <select
                                                value={form.payment_mode}
                                                onChange={(e) => setForm({...form, payment_mode: e.target.value})}
                                                className="input-field !pl-10"
                                                required
                                            >
                                                {paymentModes.map(mode => (
                                                    <option key={mode} value={mode}>{mode.replace('_', ' ')}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Reference (Optional)</label>
                                    <input
                                        type="text"
                                        value={form.reference}
                                        onChange={(e) => setForm({...form, reference: e.target.value})}
                                        className="input-field"
                                        placeholder="Transaction reference or receipt number"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                                    <textarea
                                        value={form.notes}
                                        onChange={(e) => setForm({...form, notes: e.target.value})}
                                        className="input-field"
                                        placeholder="Additional notes"
                                        rows="2"
                                    />
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
                                    <button
                                        type="submit"
                                        className="btn-primary flex-1"
                                        disabled={!form.order_id || !form.amount || parseFloat(form.amount) <= 0}
                                    >
                                        Record Payment
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

// import React, {useEffect, useState} from 'react';
// import {Calendar, CreditCard, DollarSign, Plus, Search} from 'lucide-react';
// import {orderService} from '../services/orderService';
// import {customerService} from '../services/customerService';
// import {formatCurrency, formatDate} from '../utils/helpers';
// import toast from 'react-hot-toast';
//
// export default function PaymentsPage() {
//     const [payments, setPayments] = useState([]);
//     const [orders, setOrders] = useState([]);
//     const [customers, setCustomers] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [showModal, setShowModal] = useState(false);
//     const [search, setSearch] = useState('');
//     const [form, setForm] = useState({
//         order_id: '',
//         amount: '',
//         payment_date: new Date().toISOString().split('T')[0],
//         payment_mode: 'CASH',
//         reference: '',
//         notes: ''
//     });
//
//     useEffect(() => {
//         loadData();
//     }, []);
//
//     const loadData = async () => {
//         try {
//             const [ordersData, customersData] = await Promise.all([
//                 orderService.getAllOrders(),
//                 customerService.getAllCustomersForDropdown()
//             ]);
//
//             setOrders(ordersData);
//             setCustomers(customersData);
//
//             // Get payments for all orders
//             const allPayments = [];
//             for (const order of ordersData) {
//                 try {
//                     const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'}/payments/order/${order.id}`, {
//                         headers: {
//                             'Authorization': `Bearer ${localStorage.getItem('access_token')}`
//                         }
//                     });
//                     if (response.ok) {
//                         const orderPayments = await response.json();
//                         allPayments.push(...orderPayments.map(p => ({
//                             ...p,
//                             order,
//                             customer: customersData.find(c => c.id === order.customer_id)
//                         })));
//                     }
//                 } catch (error) {
//                     // Order has no payments
//                 }
//             }
//             setPayments(allPayments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
//         } catch (error) {
//             toast.error('Failed to load data');
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     const handleSubmit = async (e) => {
//         e.preventDefault();
//
//         const outstanding = getSelectedOrderBalance();
//         const enteredAmount = parseFloat(form.amount);
//
//         if (enteredAmount > outstanding) {
//             toast.error(`Payment amount cannot exceed outstanding balance (${formatCurrency(outstanding)})`);
//             return;
//         }
//
//         if (enteredAmount <= 0) {
//             toast.error('Payment amount must be greater than zero');
//             return;
//         }
//
//         try {
//             const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'}/payments`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${localStorage.getItem('access_token')}`
//                 },
//                 body: JSON.stringify({
//                     order_id: parseInt(form.order_id),
//                     amount: parseFloat(form.amount),
//                     payment_date: form.payment_date,
//                     payment_mode: form.payment_mode,
//                     reference: form.reference || null,
//                     notes: form.notes || null
//                 })
//             });
//
//             if (!response.ok) {
//                 const error = await response.json();
//                 throw new Error(error.detail || 'Failed to record payment');
//             }
//
//             toast.success('Payment recorded successfully');
//             setShowModal(false);
//             setForm({
//                 order_id: '',
//                 amount: '',
//                 payment_date: new Date().toISOString().split('T')[0],
//                 payment_mode: 'CASH',
//                 reference: '',
//                 notes: ''
//             });
//             loadData();
//         } catch (error) {
//             toast.error(error.message);
//         }
//     };
//
//     const getSelectedOrderBalance = () => {
//         if (!form.order_id) return 0;
//         const order = orders.find(o => o.id === parseInt(form.order_id));
//         if (!order) return 0;
//         return parseFloat(order.total_amount) - parseFloat(order.amount_paid);
//     };
//
//     const filteredPayments = payments.filter(p =>
//         p.order?.order_number.toLowerCase().includes(search.toLowerCase()) ||
//         p.customer?.name.toLowerCase().includes(search.toLowerCase())
//     );
//
//     if (loading) {
//         return <div className="flex items-center justify-center py-12">
//             <div className="loader"></div>
//         </div>;
//     }
//
//     const paymentModes = ['CASH', 'CARD', 'TRANSFER', 'MOBILE_MONEY', 'OTHER'];
//
//     return (
//         <div className="space-y-6">
//             {/* Header */}
//             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//                 <div>
//                     <h2 className="text-2xl font-bold text-gray-900">Payments</h2>
//                     <p className="text-gray-600 mt-1">{payments.length} total payments</p>
//                 </div>
//                 <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
//                     <Plus className="h-4 w-4"/>
//                     Record Payment
//                 </button>
//             </div>
//
//             {/* Search */}
//             <div className="relative">
//                 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
//                     <Search className="h-5 w-5"/>
//                 </div>
//                 <input
//                     type="text"
//                     placeholder="Search by order number or customer..."
//                     value={search}
//                     onChange={(e) => setSearch(e.target.value)}
//                     className="input-field !pl-10"
//                 />
//             </div>
//
//             {/* Payments Table */}
//             <div className="card p-0 overflow-hidden">
//                 <div className="overflow-x-auto">
//                     <table className="min-w-full divide-y divide-gray-200">
//                         <thead className="bg-gray-50">
//                         <tr>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
//                         </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-gray-200">
//                         {filteredPayments.map((payment) => (
//                             <tr key={payment.id} className="hover:bg-gray-50">
//                                 <td className="px-6 py-4 whitespace-nowrap text-gray-600">
//                                     {formatDate(payment.payment_date)}
//                                 </td>
//                                 <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
//                                     {payment.order?.order_number}
//                                 </td>
//                                 <td className="px-6 py-4 whitespace-nowrap text-gray-600">
//                                     {payment.customer?.name}
//                                 </td>
//                                 <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">
//                                     {formatCurrency(payment.amount)}
//                                 </td>
//                                 <td className="px-6 py-4 whitespace-nowrap">
//                     <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
//                       {payment.payment_mode}
//                     </span>
//                                 </td>
//                                 <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">
//                                     {payment.reference || '-'}
//                                 </td>
//                             </tr>
//                         ))}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//
//             {filteredPayments.length === 0 && (
//                 <div className="text-center py-12">
//                     <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
//                     <p className="text-gray-500">No payments found</p>
//                 </div>
//             )}
//
//             {/* Payment Modal */}
//             {showModal && (
//                 <div className="fixed inset-0 z-50 overflow-y-auto">
//                     <div className="flex min-h-screen items-center justify-center p-4">
//                         <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)}/>
//
//                         <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
//                             <h3 className="text-xl font-semibold mb-6">Record Payment</h3>
//
//                             <form onSubmit={handleSubmit} className="space-y-4">
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700 mb-2">Order *</label>
//                                     <select
//                                         value={form.order_id}
//                                         onChange={(e) => setForm({...form, order_id: e.target.value})}
//                                         className="input-field"
//                                         required
//                                     >
//                                         <option value="">Select order</option>
//                                         {orders.filter(o => {
//                                             const balance = parseFloat(o.total_amount) - parseFloat(o.amount_paid);
//                                             return balance > 0;
//                                         }).map((order) => {
//                                             const balance = parseFloat(order.total_amount) - parseFloat(order.amount_paid);
//                                             const customer = customers.find(c => c.id === order.customer_id);
//                                             return (
//                                                 <option key={order.id} value={order.id}>
//                                                     {order.order_number} - {customer?.name} -
//                                                     Balance: {formatCurrency(balance)}
//                                                 </option>
//                                             );
//                                         })}
//                                     </select>
//                                 </div>
//
//                                 {form.order_id && (
//                                     <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
//                                         <p className="text-sm font-medium text-blue-900">
//                                             Outstanding Balance: <span
//                                             className="text-lg font-bold">{formatCurrency(getSelectedOrderBalance())}</span>
//                                         </p>
//                                     </div>
//                                 )}
//
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
//                                     <div className="relative">
//                                         <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
//                                             <DollarSign className="h-5 w-5"/>
//                                         </div>
//                                         <input
//                                             type="number"
//                                             step="0.01"
//                                             value={form.amount}
//                                             onChange={(e) => setForm({...form, amount: e.target.value})}
//                                             className="input-field !pl-10"
//                                             placeholder="0.00"
//                                             required
//                                         />
//                                     </div>
//                                 </div>
//
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date
//                                         *</label>
//                                     <div className="relative">
//                                         <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
//                                             <Calendar className="h-5 w-5"/>
//                                         </div>
//                                         <input
//                                             type="date"
//                                             value={form.payment_date}
//                                             onChange={(e) => setForm({...form, payment_date: e.target.value})}
//                                             className="input-field !pl-10"
//                                             required
//                                         />
//                                     </div>
//                                 </div>
//
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode
//                                         *</label>
//                                     <div className="relative">
//                                         <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
//                                             <CreditCard className="h-5 w-5"/>
//                                         </div>
//                                         <select
//                                             value={form.payment_mode}
//                                             onChange={(e) => setForm({...form, payment_mode: e.target.value})}
//                                             className="input-field !pl-10"
//                                             required
//                                         >
//                                             {paymentModes.map(mode => (
//                                                 <option key={mode} value={mode}>{mode.replace('_', ' ')}</option>
//                                             ))}
//                                         </select>
//                                     </div>
//                                 </div>
//
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700 mb-2">Reference
//                                         (Optional)</label>
//                                     <input
//                                         type="text"
//                                         value={form.reference}
//                                         onChange={(e) => setForm({...form, reference: e.target.value})}
//                                         className="input-field"
//                                         placeholder="Transaction reference or receipt number"
//                                     />
//                                 </div>
//
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700 mb-2">Notes
//                                         (Optional)</label>
//                                     <input
//                                         type="text"
//                                         value={form.notes}
//                                         onChange={(e) => setForm({...form, notes: e.target.value})}
//                                         className="input-field"
//                                         placeholder="Additional notes"
//                                     />
//                                 </div>
//
//                                 <div className="flex gap-3 pt-4 border-t">
//                                     <button type="button" onClick={() => setShowModal(false)}
//                                             className="btn-secondary flex-1">
//                                         Cancel
//                                     </button>
//                                     <button type="submit" className="btn-primary flex-1">
//                                         Record Payment
//                                     </button>
//                                 </div>
//                             </form>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }
