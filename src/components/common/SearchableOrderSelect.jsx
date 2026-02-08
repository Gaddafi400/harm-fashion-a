import React, {useEffect, useRef, useState} from 'react';
import {ChevronDown, Package, Search, X, DollarSign, User} from 'lucide-react';
import {useBusiness} from "../../hooks/useBusiness";

export default function SearchableOrderSelect({
                                                  value,
                                                  onChange,
                                                  orders = [],
                                                  customers = [],
                                                  required = false,
                                                  placeholder = "Search order...",
                                                  className = "",
                                                  showBalance = true // New prop to control whether to filter by balance
                                              }) {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const dropdownRef = useRef(null);
    const {business, is_buss_loading} = useBusiness();

    // Calculate order balance
    const calculateBalance = (order) => {
        const totalAmount = parseFloat(order.total_amount) || 0;
        const amountPaid = parseFloat(order.amount_paid) || 0;
        return totalAmount - amountPaid;
    };

    // Find selected order when value changes
    useEffect(() => {
        if (value) {
            const order = orders.find(o => o.id === parseInt(value));
            setSelectedOrder(order);
            if (order) {
                setSearch(order.order_number);
                const customer = customers.find(c => c.id === order.customer_id);
                setSelectedCustomer(customer);
            }
        } else {
            setSelectedOrder(null);
            setSelectedCustomer(null);
            setSearch('');
        }
    }, [value, orders, customers]);

    // Filter orders based on search and balance
    const filteredOrders = orders
        .filter(order => {
            const customer = customers.find(c => c.id === order.customer_id);
            const balance = calculateBalance(order);

            // Filter by search term
            const matchesSearch =
                order.order_number.toLowerCase().includes(search.toLowerCase()) ||
                (customer?.name?.toLowerCase().includes(search.toLowerCase())) ||
                (customer?.phone?.includes(search));

            // If showBalance is true, exclude orders with zero balance
            if (showBalance) {
                return matchesSearch && balance > 0;
            }

            return matchesSearch;
        })
        .slice(0, 10);

    const handleSelectOrder = (order) => {
        setSelectedOrder(order);
        const customer = customers.find(c => c.id === order.customer_id);
        setSelectedCustomer(customer);
        setSearch(order.order_number);
        onChange(order.id);
        setIsOpen(false);
    };

    const handleClear = () => {
        setSelectedOrder(null);
        setSelectedCustomer(null);
        setSearch('');
        onChange('');
        setIsOpen(false);
    };

    // Format currency
    const formatCurrency = (amount) => {
        return `${business.currency_symbol}${Number(amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (is_buss_loading) return <div>Loading...</div>;

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="h-5 w-5"/>
                </div>
                <input
                    type="text"
                    placeholder={placeholder}
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    className="input-field !pl-10 !pr-10 w-full"
                    required={required && !selectedOrder}
                />
                {selectedOrder && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-4 w-4"/>
                    </button>
                )}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <ChevronDown className="h-5 w-5"/>
                </div>
            </div>

            {/* Hidden input for form submission */}
            <input type="hidden" name="order_id" value={selectedOrder?.id || ''}/>

            {/* Show selected order details */}
            {selectedOrder && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-blue-900">{selectedOrder.order_number}</p>
                            {selectedCustomer && (
                                <p className="text-sm text-blue-800">{selectedCustomer.name} • {selectedCustomer.phone}</p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-blue-700">Balance: {formatCurrency(calculateBalance(selectedOrder))}</p>
                            <p className="text-xs text-blue-600">Total: {formatCurrency(selectedOrder.total_amount)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Dropdown */}
            {isOpen && (
                <div
                    className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto">
                    {filteredOrders.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            <Package className="h-6 w-6 mx-auto mb-2"/>
                            <p className="text-sm">
                                {search
                                    ? `No ${showBalance ? 'orders with outstanding balance' : 'orders'} found`
                                    : 'Start typing to search orders'
                                }
                            </p>
                            {showBalance && search && (
                                <p className="text-xs text-gray-400 mt-1">
                                    Only showing orders with outstanding balance
                                </p>
                            )}
                        </div>
                    ) : (
                        <div>
                            {filteredOrders.map((order) => {
                                const customer = customers.find(c => c.id === order.customer_id);
                                const balance = calculateBalance(order);

                                return (
                                    <button
                                        key={order.id}
                                        type="button"
                                        onClick={() => handleSelectOrder(order)}
                                        className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                                            selectedOrder?.id === order.id ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                                                <Package className="h-5 w-5"/>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="font-medium text-gray-900 truncate">{order.order_number}</p>
                                                    <span className={`text-sm font-semibold whitespace-nowrap ${
                                                        balance > 0 ? 'text-green-600' : 'text-gray-500'
                                                    }`}>
                                                        {formatCurrency(balance)}
                                                    </span>
                                                </div>
                                                {customer && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <User className="h-3 w-3 text-gray-400"/>
                                                        <p className="text-sm text-gray-600 truncate">{customer.name}</p>
                                                        <span className="text-gray-300">•</span>
                                                        <p className="text-sm text-gray-600">{customer.phone}</p>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <DollarSign className="h-3 w-3 text-gray-400"/>
                                                    <p className="text-sm text-gray-500">
                                                        Total: {formatCurrency(order.total_amount)} •
                                                        Paid: {formatCurrency(order.amount_paid)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// import React, {useEffect, useRef, useState} from 'react';
// import {ChevronDown, Package, Search, X} from 'lucide-react';
// import {useBusiness} from "../../hooks/useBusiness";
//
// export default function SearchableOrderSelect({
//                                                   value,
//                                                   onChange,
//                                                   orders = [],
//                                                   customers = [],
//                                                   required = false,
//                                                   placeholder = "Search order...",
//                                                   className = ""
//                                               }) {
//     const [search, setSearch] = useState('');
//     const [isOpen, setIsOpen] = useState(false);
//     const [selectedOrder, setSelectedOrder] = useState(null);
//     const dropdownRef = useRef(null);
//     const {business, is_buss_loading} = useBusiness();
//
//
//     // Find selected order when value changes
//     useEffect(() => {
//         if (value) {
//             const order = orders.find(o => o.id === parseInt(value));
//             setSelectedOrder(order);
//             if (order) {
//                 setSearch(order.order_number);
//             }
//         } else {
//             setSelectedOrder(null);
//             setSearch('');
//         }
//     }, [value, orders]);
//
//     const filteredOrders = orders.filter(order =>
//         order.order_number.toLowerCase().includes(search.toLowerCase()) ||
//         (order.customer_name && order.customer_name.toLowerCase().includes(search.toLowerCase()))
//     ).slice(0, 10);
//
//     const handleSelectOrder = (order) => {
//         setSelectedOrder(order);
//         setSearch(order.order_number);
//         onChange(order.id);
//         setIsOpen(false);
//     };
//
//     const handleClear = () => {
//         setSelectedOrder(null);
//         setSearch('');
//         onChange('');
//         setIsOpen(false);
//     };
//
//     // Close dropdown when clicking outside
//     useEffect(() => {
//         const handleClickOutside = (event) => {
//             if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//                 setIsOpen(false);
//             }
//         };
//
//         document.addEventListener('mousedown', handleClickOutside);
//         return () => document.removeEventListener('mousedown', handleClickOutside);
//     }, []);
//
//
//     if (is_buss_loading) return <div>Loading...</div>;
//
//
//     return (
//         <div className={`relative ${className}`} ref={dropdownRef}>
//             <div className="relative">
//                 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
//                     <Search className="h-5 w-5"/>
//                 </div>
//                 <input
//                     type="text"
//                     placeholder={placeholder}
//                     value={search}
//                     onChange={(e) => {
//                         setSearch(e.target.value);
//                         setIsOpen(true);
//                     }}
//                     onFocus={() => setIsOpen(true)}
//                     className="input-field !pl-10 !pr-10 w-full"
//                 />
//                 {selectedOrder && (
//                     <button
//                         type="button"
//                         onClick={handleClear}
//                         className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                     >
//                         <X className="h-4 w-4"/>
//                     </button>
//                 )}
//                 <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
//                     <ChevronDown className="h-5 w-5"/>
//                 </div>
//             </div>
//
//             {/* Hidden input for form submission */}
//             <input type="hidden" name="order_id" value={selectedOrder?.id || ''}/>
//
//             {/* Dropdown */}
//             {isOpen && (
//                 <div
//                     className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto">
//                     {filteredOrders.length === 0 ? (
//                         <div className="p-4 text-center text-gray-500">
//                             <Package className="h-6 w-6 mx-auto mb-2"/>
//                             <p className="text-sm">{search ? 'No orders found' : 'Start typing to search orders'}</p>
//                         </div>
//                     ) : (
//                         <div>
//                             {filteredOrders.map((order) => {
//                                 const customer = customers.find(c => c.id === order.customer_id);
//                                 return (
//                                     <button
//                                         key={order.id}
//                                         type="button"
//                                         onClick={() => handleSelectOrder(order)}
//                                         className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
//                                             selectedOrder?.id === order.id ? 'bg-blue-50' : ''
//                                         }`}
//                                     >
//                                         <div className="flex items-center gap-3">
//                                             <div
//                                                 className="h-8 w-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white">
//                                                 <Package className="h-4 w-4"/>
//                                             </div>
//
//                                             <div className="flex-1 min-w-0">
//                                                 <p className="font-medium text-gray-900 truncate">
//                                                     {order.order_number}
//                                                 </p>
//
//                                                 <div className="flex items-center gap-2 mt-1">
//                                                     <p className="text-sm text-gray-600">
//                                                         {customer?.name || `Customer #${order.customer_id}`}
//                                                     </p>
//                                                     <span className="text-gray-300">•</span>
//                                                     <p className="text-sm text-gray-600">
//                                                         {business.currency_symbol}
//                                                         {Number(order.total_amount).toLocaleString(undefined, {
//                                                             minimumFractionDigits: 2,
//                                                             maximumFractionDigits: 2,
//                                                         })}
//
//                                                     </p>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </button>
//                                 );
//                             })}
//                         </div>
//                     )}
//                 </div>
//             )}
//         </div>
//     );
// }
