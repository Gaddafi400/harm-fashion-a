import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Loader2, Mail, Phone, Plus, Search} from 'lucide-react';
import {customerService} from '../services/customerService';
import {getInitials} from '../utils/helpers';
import toast from 'react-hot-toast';

export default function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({name: '', phone: '', email: '', gender: '', address: ''});


    const [pagination, setPagination] = useState({
        skip: 0,
        limit: 20,
        total: 0,
        hasMore: true
    });

    const observerRef = useRef();

    useEffect(() => {
        loadCustomers();
    }, []);


    useEffect(() => {
        const filteredCustomers = customers.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.phone.includes(search)
        );
        setFiltered(filteredCustomers);
    }, [search, customers]);

    const loadCustomers = async (loadMore = false) => {
        try {
            if (loadMore) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }

            const params = {
                skip: loadMore ? pagination.skip : 0,
                limit: pagination.limit
            };

            const response = await customerService.getAllCustomers(params.skip, params.limit);

            if (loadMore) {
                setCustomers(prev => [...prev, ...response.customers]);
            } else {
                setCustomers(response.customers);
            }

            setPagination(prev => ({
                ...prev,
                skip: response.skip + response.customers.length,
                total: response.total,
                hasMore: response.has_more
            }));

        } catch (error) {
            toast.error('Failed to load customers');
            console.error('Error loading customers:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const lastCustomerRefCallback = useCallback((node) => {
        if (loading || loadingMore) return;

        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && pagination.hasMore) {
                loadCustomers(true);
            }
        });

        if (node) observerRef.current.observe(node);
    }, [loading, loadingMore, pagination.hasMore]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await customerService.createCustomer(form);
            toast.success('Customer created!');
            setShowModal(false);
            setForm({name: '', phone: '', email: '', gender: '', address: ''});

            setPagination({
                skip: 0,
                limit: 20,
                total: 0,
                hasMore: true
            });
            loadCustomers(false);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to create customer');
        }
    };

    // Handle search with debounce (optional enhancement)
    useEffect(() => {
        const timer = setTimeout(() => {
            // If there's a search term, we need to handle it differently
            if (search) {
                // We could implement a search API endpoint for better performance
                // For now, we'll filter locally

            }
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600"/>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
                    <p className="text-gray-600 mt-1">{pagination.total} total customers</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="h-4 w-4"/>
                    Add Customer
                </button>
            </div>

            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="h-5 w-5"/>
                </div>
                <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-field !pl-10"
                />
            </div>

            {filtered.length === 0 ? (
                <div className="card text-center py-12">
                    <div className="text-gray-400">
                        <Search className="h-12 w-12 mx-auto mb-4"/>
                        <p className="text-lg font-medium text-gray-900">No customers found</p>
                        <p className="text-gray-600 mt-1">
                            {search ? 'Try a different search term' : 'No customers yet. Add your first customer!'}
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((customer, index) => {
                            const isLastCustomer = index === filtered.length - 1;

                            return (
                                <div
                                    key={customer.id}
                                    ref={isLastCustomer ? lastCustomerRefCallback : null}
                                    className="card hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex items-start gap-3 mb-4">
                                        <div
                                            className="h-12 w-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                            {getInitials(customer.name)}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                                            {customer.gender && (
                                                <span
                                                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          {customer.gender}
                        </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4"/>
                                            <span>{customer.phone}</span>
                                        </div>
                                        {customer.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4"/>
                                                <span className="truncate">{customer.email}</span>
                                            </div>
                                        )}
                                        {customer.address && (
                                            <div className="pt-2 text-xs text-gray-500">
                                                <p className="truncate">{customer.address}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {loadingMore && (
                        <div className="flex justify-center py-8">
                            <div className="flex items-center gap-3 text-gray-600">
                                <Loader2 className="h-5 w-5 animate-spin"/>
                                <span>Loading more customers...</span>
                            </div>
                        </div>
                    )}

                    {!pagination.hasMore && filtered.length > 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <p>You've reached the end of the customer list</p>
                        </div>
                    )}
                </>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)}/>
                        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
                            <h3 className="text-xl font-semibold mb-6">Add New Customer</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        placeholder="Enter customer full name"
                                        onChange={(e) => setForm({...form, name: e.target.value})}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => setForm({...form, phone: e.target.value})}
                                        className="input-field"
                                        placeholder="Enter customer phone number"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email
                                        (Optional)</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({...form, email: e.target.value})}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                                    <select
                                        value={form.gender}
                                        onChange={(e) => setForm({...form, gender: e.target.value})}
                                        className="input-field"
                                    >
                                        <option value="">Select gender</option>
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Address
                                        (Optional)</label>
                                    <input
                                        type="text"
                                        value={form.address}
                                        onChange={(e) => setForm({...form, address: e.target.value})}
                                        className="input-field"
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowModal(false)}
                                            className="btn-secondary flex-1">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary flex-1">
                                        Create Customer
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
