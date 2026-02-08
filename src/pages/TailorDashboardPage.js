import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, AlertCircle, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { formatCurrency, formatDate, getStatusColor } from '../utils/helpers';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function TailorDashboardPage() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    ready: 0,
    overdue: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await orderService.getMyOrders();
      setOrders(data);
      
      const now = new Date();
      const overdue = data.filter(o => 
        new Date(o.due_date) < now && 
        !['READY', 'COLLECTED', 'CANCELLED'].includes(o.status)
      ).length;
      
      setStats({
        total: data.length,
        pending: data.filter(o => o.status === 'PENDING').length,
        inProgress: data.filter(o => o.status === 'IN_PROGRESS').length,
        ready: data.filter(o => o.status === 'READY').length,
        overdue
      });
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="loader"></div></div>;
  }

  const statCards = [
    { title: 'Total Assigned', value: stats.total, icon: Package, color: 'bg-primary-500' },
    { title: 'Pending', value: stats.pending, icon: Clock, color: 'bg-yellow-500' },
    { title: 'In Progress', value: stats.inProgress, icon: AlertCircle, color: 'bg-blue-500' },
    { title: 'Ready', value: stats.ready, icon: CheckCircle, color: 'bg-green-500' }
  ];

  // Status distribution data
  const statusData = [
    { name: 'Pending', value: stats.pending, color: '#f59e0b' },
    { name: 'In Progress', value: stats.inProgress, color: '#3b82f6' },
    { name: 'Ready', value: stats.ready, color: '#22c55e' }
  ].filter(item => item.value > 0);

  // Priority orders (overdue + due soon)
  const priorityOrders = orders
    .filter(o => !['READY', 'COLLECTED', 'CANCELLED'].includes(o.status))
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Workload</h2>
        <p className="text-gray-600 mt-1">Orders assigned to you</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`p-4 rounded-xl ${card.color} text-white`}>
                  <Icon className="h-8 w-8" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overdue Alert */}
      {stats.overdue > 0 && (
        <div className="card bg-red-50 border-2 border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Overdue Orders</h3>
              <p className="text-sm text-red-700">
                You have {stats.overdue} overdue {stats.overdue === 1 ? 'order' : 'orders'} that need immediate attention
              </p>
            </div>
            <button 
              onClick={() => navigate('/orders')}
              className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              View Orders
            </button>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Orders */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Orders (Next 5)</h3>
          <div className="space-y-3">
            {priorityOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending orders</p>
            ) : (
              priorityOrders.map((order) => {
                const daysUntilDue = Math.ceil(
                  (new Date(order.due_date) - new Date()) / (1000 * 60 * 60 * 24)
                );
                const isOverdue = daysUntilDue < 0;
                
                return (
                  <div key={order.id} className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{order.order_number}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Customer: {order.customer?.name || `#${order.customer_id}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : daysUntilDue <= 2 ? 'text-orange-600' : 'text-gray-600'}`}>
                          {isOverdue ? 'OVERDUE' : `${daysUntilDue} ${daysUntilDue === 1 ? 'day' : 'days'}`}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(order.due_date)}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {priorityOrders.length > 0 && (
            <button
              onClick={() => navigate('/orders')}
              className="w-full mt-4 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              View All Orders
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
          >
            <Package className="h-5 w-5 text-gray-400 group-hover:text-primary-600" />
            <div className="text-left">
              <span className="block font-medium text-gray-600 group-hover:text-primary-600">View All Orders</span>
              <span className="block text-xs text-gray-500 mt-0.5">Manage your assigned orders</span>
            </div>
          </button>
          
          <button
            onClick={() => navigate('/measurements')}
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
          >
            <User className="h-5 w-5 text-gray-400 group-hover:text-primary-600" />
            <div className="text-left">
              <span className="block font-medium text-gray-600 group-hover:text-primary-600">Measurements</span>
              <span className="block text-xs text-gray-500 mt-0.5">View customer measurements</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
