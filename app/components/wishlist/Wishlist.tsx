'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Loader, AlertTriangle, ShoppingBag, Check, Trash, Edit } from 'lucide-react';
import { useSession } from '../layout/SessionContext';

interface IWishlistItem {
    _id: string;
    title: string;
    description?: string;
    pointsCost: number;
    priority: 'low' | 'medium' | 'high';
    isPurchased: boolean;
    imageUrl?: string;
}

const Wishlist: React.FC = () => {
    const [items, setItems] = useState<IWishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { token } = useSession();

    const fetchWishlist = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch('/web-bff/wishlist', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch wishlist');
            }

            const data = await response.json();
            setItems(data.data.wishlistItems || []);
            setError(null);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    const handlePurchase = async (id: string) => {
        if (!confirm('Mark this item as purchased?')) return;
        try {
            const response = await fetch(`/web-bff/wishlist/${id}/purchase`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to purchase item');
            fetchWishlist();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this item?')) return;
        try {
            const response = await fetch(`/web-bff/wishlist/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to delete item');
            fetchWishlist();
        } catch (e: any) {
            alert(e.message);
        }
    };

    if (loading && items.length === 0) {
        return <div className="p-8 text-center"><Loader className="w-6 h-6 animate-spin mx-auto text-action-primary" /></div>;
    }

    if (error) {
        return (
            <div className="p-4 bg-signal-alert/10 text-signal-alert rounded-lg flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                {error}
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-text-primary flex items-center">
                    <ShoppingBag className="w-5 h-5 mr-2 text-action-primary" />
                    Wishlist
                </h2>
                <button
                    className="px-4 py-2 bg-action-primary text-white rounded-lg hover:bg-action-hover transition-colors flex items-center text-sm font-medium"
                    onClick={() => alert('Create Modal Not Implemented Yet')}
                >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Item
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(item => (
                    <div key={item._id} className={`p-4 rounded-lg border ${item.isPurchased ? 'bg-bg-subtle border-border-subtle opacity-75' : 'bg-bg-surface border-border-subtle shadow-sm'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className={`font-medium ${item.isPurchased ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                                {item.title}
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${item.priority === 'high' ? 'bg-signal-alert/10 text-signal-alert' :
                                    item.priority === 'medium' ? 'bg-signal-warning/10 text-signal-warning' :
                                        'bg-signal-success/10 text-signal-success'
                                }`}>
                                {item.priority}
                            </span>
                        </div>
                        <p className="text-sm text-text-secondary mb-4 line-clamp-2">{item.description}</p>

                        <div className="flex justify-between items-center mt-auto">
                            <span className="font-bold text-action-primary">{item.pointsCost} pts</span>
                            <div className="flex space-x-2">
                                {!item.isPurchased && (
                                    <button
                                        onClick={() => handlePurchase(item._id)}
                                        className="p-2 text-signal-success hover:bg-signal-success/10 rounded transition-colors"
                                        title="Mark Purchased"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(item._id)}
                                    className="p-2 text-text-secondary hover:text-signal-alert hover:bg-signal-alert/10 rounded transition-colors"
                                    title="Delete"
                                >
                                    <Trash className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {items.length === 0 && (
                <div className="text-center p-8 bg-bg-surface rounded-lg border border-border-subtle text-text-secondary">
                    No items in wishlist.
                </div>
            )}
        </div>
    );
};

export default Wishlist;
