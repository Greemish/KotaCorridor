import { useState, useEffect, useCallback, useMemo } from 'react';
import { getOrderQueue } from '../api/staff.ts';
import { useWebSocket } from '../hooks/useWebSocket.ts';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Order } from '../types';

export default function CustomerDisplayPage() {
    const { isAuthenticated } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchQueue = useCallback(() => {
        getOrderQueue()
            .then((res) => {
                setOrders(res.data || []);
            })
            .catch((err) => {
                console.error("API Error on Display Page:", err);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchQueue();
    }, [fetchQueue]);

    const handleRefresh = useCallback(() => {
        fetchQueue();
    }, [fetchQueue]);

    const subscriptions = useMemo(
        () => [
            { topic: '/topic/orders/new', handler: handleRefresh },
            { topic: '/topic/orders/updates', handler: handleRefresh },
        ],
        [handleRefresh]
    );

    useWebSocket({ enabled: isAuthenticated, subscriptions });

    // Get last 4 characters of order number
    const getShortNumber = (orderNumber: string) => {
        return orderNumber.slice(-4);
    };

    const readyOrders = orders.filter(o => o.status?.toUpperCase() === 'READY');
    const preparingOrders = orders.filter(o => o.status?.toUpperCase() === 'PREPARING' || o.status?.toUpperCase() === 'PENDING');

    if (loading && orders.length === 0) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Side by Side Layout */}
            <div className="grid grid-cols-2 min-h-screen">
                {/* Ready Side - Green */}
                <div className="bg-green-600 flex flex-col">
                    <div className="bg-green-700 py-3 text-center">
                        <h2 className="text-2xl font-bold uppercase">Ready</h2>
                    </div>
                    <div className="flex-1 p-6">
                        <div className="flex flex-col gap-3">
                            {readyOrders.map(order => (
                                <div key={order.id} className="bg-white text-black rounded p-4 text-center">
                                    <span className="text-4xl font-bold">{getShortNumber(order.orderNumber)}</span>
                                </div>
                            ))}
                            {readyOrders.length === 0 && (
                                <p className="text-white text-center text-lg">--</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Preparing Side - Dark */}
                <div className="bg-gray-800 flex flex-col">
                    <div className="bg-gray-700 py-3 text-center">
                        <h2 className="text-2xl font-bold uppercase">Preparing</h2>
                    </div>
                    <div className="flex-1 p-6">
                        <div className="flex flex-col gap-3">
                            {preparingOrders.map(order => (
                                <div key={order.id} className="bg-gray-700 border border-gray-600 rounded p-3 text-center">
                                    <span className="text-2xl font-bold text-white">{getShortNumber(order.orderNumber)}</span>
                                </div>
                            ))}
                            {preparingOrders.length === 0 && (
                                <p className="text-gray-400 text-center text-lg">--</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}