import React, {useEffect, useState} from 'react';
import {Clock, DollarSign, Package, ShoppingBag, TrendingUp, Users} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {customerService} from '../services/customerService';
import {orderService} from '../services/orderService';
import {formatCurrency} from '../utils/helpers';
import {
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalCustomers: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [customers, orders] = await Promise.all([
                customerService.getAllCustomersForDropdown(),
                orderService.getAllOrders()
            ]);

            const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
            const pending = orders.filter(o => o.status === 'PENDING' || o.status === 'IN_PROGRESS').length;

            setStats({
                totalCustomers: customers.length,
                totalOrders: orders.length,
                pendingOrders: pending,
                totalRevenue
            });

            setRecentOrders(orders);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center py-12">
            <div className="loader"></div>
        </div>;
    }

    const cards = [
        {title: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'bg-primary-500'},
        {title: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'bg-green-500'},
        {title: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'bg-yellow-500'},
        {title: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'bg-purple-500'}
    ];

    const quickActions = [
        {
            label: 'Add Customer',
            icon: Users,
            onClick: () => navigate('/customers'),
            description: 'Register new customer'
        },
        {
            label: 'New Order',
            icon: ShoppingBag,
            onClick: () => navigate('/orders'),
            description: 'Create new order'
        },
        {
            label: 'Record Payment',
            icon: DollarSign,
            onClick: () => navigate('/payments'),
            description: 'Record customer payment'
        }
    ];

    // Prepare Order Status Distribution Data
    const statusData = [
        {
            name: 'Pending',
            value: recentOrders.filter(o => o.status === 'PENDING').length,
            color: '#f59e0b'
        },
        {
            name: 'In Progress',
            value: recentOrders.filter(o => o.status === 'IN_PROGRESS').length,
            color: '#3b82f6'
        },
        {
            name: 'Ready',
            value: recentOrders.filter(o => o.status === 'READY').length,
            color: '#22c55e'
        },
        {
            name: 'Collected',
            value: recentOrders.filter(o => o.status === 'COLLECTED').length,
            color: '#6b7280'
        },
        {
            name: 'Cancelled',
            value: recentOrders.filter(o => o.status === 'CANCELLED').length,
            color: '#ef4444'
        }
    ].filter(item => item.value > 0); // Only show statuses with data

    // Prepare Revenue Trend Data (Last 7 days)
    const getLast7Days = () => {
        const days = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            days.push({
                date: date.toISOString().split('T')[0],
                label: date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})
            });
        }
        return days;
    };

    const last7Days = getLast7Days();
    const revenueData = last7Days.map(day => {
        const dayOrders = recentOrders.filter(order => {
            const orderDate = new Date(order.created_at).toISOString().split('T')[0];
            return orderDate === day.date;
        });
        const revenue = dayOrders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
        return {
            date: day.label,
            revenue: revenue,
            orders: dayOrders.length
        };
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                <p className="text-gray-600 mt-1">Overview of your tailoring business</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div key={index} className="card hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                                    <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                                </div>
                                <div className={`p-4 rounded-xl ${card.color} text-white`}>
                                    <Icon className="h-8 w-8"/>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend Chart */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Revenue Trend (Last 7 Days)</h3>
                        <TrendingUp className="h-5 w-5 text-green-600"/>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                                <XAxis
                                    dataKey="date"
                                    tick={{fontSize: 12}}
                                    stroke="#9ca3af"
                                />
                                <YAxis
                                    tick={{fontSize: 12}}
                                    stroke="#9ca3af"
                                    tickFormatter={(value) => `₦${value.toLocaleString()}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                    formatter={(value, name) => {
                                        if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                                        return [value, 'Orders'];
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#0ea5e9"
                                    strokeWidth={3}
                                    dot={{fill: '#0ea5e9', r: 5}}
                                    activeDot={{r: 7}}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="orders"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={{fill: '#22c55e', r: 4}}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 bg-primary-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">Revenue (₦)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">Orders Count</span>
                        </div>
                    </div>
                </div>

                {/* Order Status Distribution Chart */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Order Status Distribution</h3>
                        <Package className="h-5 w-5 text-blue-600"/>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color}/>
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                    formatter={(value) => [`${value} orders`, 'Count']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        {statusData.map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div
                                    className="h-3 w-3 rounded-full"
                                    style={{backgroundColor: item.color}}
                                ></div>
                                <span className="text-sm text-gray-600">
                  {item.name} ({item.value})
                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {quickActions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={index}
                                onClick={action.onClick}
                                className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
                            >
                                <Icon className="h-5 w-5 text-gray-400 group-hover:text-primary-600"/>
                                <div className="text-left">
                                    <span
                                        className="block font-medium text-gray-600 group-hover:text-primary-600">{action.label}</span>
                                    <span className="block text-xs text-gray-500 mt-0.5">{action.description}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <span className="text-sm font-medium text-green-900">System Online</span>
                            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <span className="text-sm font-medium text-blue-900">Database Connected</span>
                            <span className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></span>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Orders This Month</span>
                            <span className="font-semibold text-gray-900">{stats.totalOrders}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Active Customers</span>
                            <span className="font-semibold text-gray-900">{stats.totalCustomers}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Pending Work</span>
                            <span className="font-semibold text-yellow-600">{stats.pendingOrders}</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t">
                            <span className="text-sm text-gray-600">Average Order Value</span>
                            <span className="font-semibold text-primary-600">
                {formatCurrency(stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0)}
              </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
