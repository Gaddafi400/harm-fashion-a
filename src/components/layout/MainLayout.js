import React, {useEffect, useState} from 'react';
import {Link, Outlet, useLocation, useNavigate} from 'react-router-dom';
import {Briefcase, DollarSign, LayoutDashboard, LogOut, Menu, Ruler, Shield, ShoppingBag, Users, X} from 'lucide-react';
import {useAuth} from '../../hooks/useAuth';
import {useBusiness} from '../../hooks/useBusiness';

export default function MainLayout() {
    const {user, logout} = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const {business, loading} = useBusiness();

    // Redirect tailors to their dashboard
    useEffect(() => {
        if (user?.role === 'TAILOR' && location.pathname === '/dashboard') {
            navigate('/tailor-dashboard', { replace: true });
        }
    }, [user, location, navigate]);


    const navigation = [
        {name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'TAILOR', 'CASHIER']},
        { name: 'My Workload', href: '/tailor-dashboard', icon: Briefcase, roles: ['TAILOR', 'ADMIN'] },
        {name: 'Customers', href: '/customers', icon: Users, roles: ['ADMIN', 'TAILOR', 'CASHIER']},
        {name: 'Orders', href: '/orders', icon: ShoppingBag, roles: ['ADMIN', 'TAILOR', 'CASHIER']},
        {name: 'Payments', href: '/payments', icon: DollarSign, roles: ['ADMIN', 'TAILOR', 'CASHIER']},
        {name: 'Measurements', href: '/measurements', icon: Ruler, roles: ['ADMIN', 'TAILOR']},
        {name: 'Users', href: '/users', icon: Shield, roles: ['ADMIN']}
    ];

    const filteredNavigation = navigation.filter(item =>
        item.roles.includes(user?.role)
    );

    const isActive = (path) => location.pathname === path;


    if (loading) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}/>
                    <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
                        <div className="flex items-center justify-between h-16 px-6 border-b">
                            <span className="text-xl font-bold text-primary-600">{business?.business_name}</span>
                            <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="h-5 w-5"/>
                            </button>
                        </div>
                        <nav className="p-4 space-y-1">
                            {filteredNavigation.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                                            isActive(item.href) ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Icon className="h-5 w-5"/>
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            )}

            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
                <div className="flex flex-col flex-1 bg-white border-r">
                    <div className="flex items-center h-16 px-6 border-b">
                        <span className="text-xl font-bold text-primary-600">{business?.business_name}</span>
                    </div>
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {filteredNavigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                                        isActive(item.href) ? 'bg-primary-50 text-primary-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <Icon className="h-5 w-5"/>
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="p-4 border-t">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 mb-2">
                            <div
                                className="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center text-white font-semibold">
                                {user?.username?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                                <p className="text-xs text-gray-500">{user?.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                logout();
                                navigate('/login');
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                            <LogOut className="h-4 w-4"/>
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:pl-64">
                <div className="sticky top-0 z-10 flex h-16 bg-white border-b shadow-sm">
                    <button onClick={() => setSidebarOpen(true)} className="px-4 lg:hidden">
                        <Menu className="h-6 w-6"/>
                    </button>
                    <div className="flex flex-1 items-center justify-between px-4 sm:px-6 lg:px-8">
                        <h1 className="text-xl font-semibold text-gray-900">
                            {filteredNavigation.find(item => isActive(item.href))?.name || 'Dashboard'}
                        </h1>
                        <div
                            className="lg:hidden h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                            {user?.username?.[0]?.toUpperCase()}
                        </div>
                    </div>
                </div>
                <main className="p-4 sm:p-6 lg:p-8">
                    <div className="max-w-[85rem] mx-auto">
                        <Outlet/>
                    </div>
                </main>
            </div>
        </div>
    );
}
