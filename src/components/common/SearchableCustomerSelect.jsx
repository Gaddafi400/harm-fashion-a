import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ChevronDown, Search} from 'lucide-react';

import debounce from 'lodash/debounce';
import {customerService} from "../../services/customerService";
import {getInitials} from "../../utils/helpers";

export default function SearchableCustomerSelect({
                                                     value,
                                                     onChange,
                                                     required = false,
                                                     placeholder = "Select customer..."
                                                 }) {
    const [search, setSearch] = useState('');
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const dropdownRef = useRef(null);


    useEffect(() => {
        if (value) {
            loadSelectedCustomer(value);
        }
    }, [value]);


    useEffect(() => {
        const filtered = customers.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.phone.includes(search) ||
            c.email?.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredCustomers(filtered);
    }, [search, customers]);


    const loadSelectedCustomer = async (customerId) => {
        try {
            const allCustomers = await customerService.getAllCustomersForDropdown();
            const customer = allCustomers.find(c => c.id === parseInt(customerId));
            setSelectedCustomer(customer);
            if (customer) {
                setSearch(customer.name); // Pre-fill the search with selected customer name
            }
        } catch (error) {
            console.error('Error loading customer:', error);
        }
    };

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce(async (searchTerm) => {
            if (!searchTerm.trim()) {
                setCustomers([]);
                return;
            }

            setLoading(true);
            try {
                // You can implement a search endpoint or filter locally
                const allCustomers = await customerService.getAllCustomersForDropdown();
                const filtered = allCustomers.filter(c =>
                    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    c.phone.includes(searchTerm) ||
                    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
                ).slice(0, 10); // Limit to 10 results
                setCustomers(filtered);
            } catch (error) {
                console.error('Error searching customers:', error);
                setCustomers([]);
            } finally {
                setLoading(false);
            }
        }, 300),
        []
    );

    // Handle search input change
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        setIsOpen(true);
        debouncedSearch(value);
    };

    // Handle customer selection
    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setSearch(customer.name);
        onChange(customer.id);
        setIsOpen(false);
    };

    // Clear selection
    const handleClear = () => {
        setSelectedCustomer(null);
        setSearch('');
        onChange('');
        setIsOpen(false);
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

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="h-5 w-5"/>
                </div>
                <input
                    type="text"
                    placeholder={placeholder}
                    value={search}
                    onChange={handleSearchChange}
                    onFocus={() => setIsOpen(true)}
                    className="input-field !pl-10 !pr-10 w-full"
                    required={required && !selectedCustomer}
                />
                {selectedCustomer && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        ×
                    </button>
                )}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <ChevronDown className="h-5 w-5"/>
                </div>
            </div>

            {/* Hidden input for form submission */}
            <input type="hidden" name="customer_id" value={selectedCustomer?.id || ''}/>

            {/* Dropdown */}
            {isOpen && (
                <div
                    className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">
                            <div className="loader-small mx-auto"></div>
                            <p className="mt-2 text-sm">Searching...</p>
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            <Search className="h-6 w-6 mx-auto mb-2"/>
                            <p className="text-sm">{search ? 'No customers found' : 'Start typing to search customers'}</p>
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                                >
                                    Clear search
                                </button>
                            )}
                        </div>
                    ) : (
                        <div>
                            {filteredCustomers.map((customer) => (
                                <button
                                    key={customer.id}
                                    type="button"
                                    onClick={() => handleSelectCustomer(customer)}
                                    className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                                        selectedCustomer?.id === customer.id ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="h-8 w-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-medium text-sm">
                                            {getInitials(customer.name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{customer.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-sm text-gray-600">{customer.phone}</p>
                                                {customer.email && (
                                                    <>
                                                        <span className="text-gray-300">•</span>
                                                        <p className="text-sm text-gray-600 truncate">{customer.email}</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}