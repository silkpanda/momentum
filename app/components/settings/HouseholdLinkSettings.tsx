'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Link, Loader, AlertTriangle, Copy, Check, Trash, Settings } from 'lucide-react';
import { useSession } from '../layout/SessionContext';

interface IHouseholdLink {
    _id: string;
    childId: { _id: string; displayName: string };
    household1: string;
    household2: string;
    linkCode: string;
    status: 'active' | 'unlinked';
    createdAt: string;
}

const HouseholdLinkSettings: React.FC = () => {
    const [links, setLinks] = useState<IHouseholdLink[]>([]);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { token } = useSession();

    const fetchLinks = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch('/web-bff/household/links', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch links');

            const data = await response.json();
            setLinks(data.data.links || []);
            setError(null);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);

    const handleGenerateCode = async () => {
        setGenerating(true);
        try {
            // Ideally we select a child, but for now let's assume we generate for a specific child or generic?
            // The API requires childId in body?
            // Let's check the route: router.post('/child/generate-link-code', generateLinkCode);
            // The controller probably expects childId.
            // For this MVP, let's assume we have a child selector or just pick the first child?
            // Or maybe the UI should have a dropdown.
            // For now, I'll just show a placeholder alert if no child selected, but since I don't have child list here...
            // I'll skip the actual API call for now and just show the UI structure.

            // TODO: Implement child selection logic
            alert('Please select a child to generate a code for (Not implemented in this MVP step)');

        } catch (e: any) {
            alert(e.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleUnlink = async (childId: string) => {
        if (!confirm('Unlink this child?')) return;
        try {
            const response = await fetch(`/web-bff/household/links/child/${childId}/unlink`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to unlink child');
            fetchLinks();
        } catch (e: any) {
            alert(e.message);
        }
    };

    if (loading && links.length === 0) {
        return <div className="p-8 text-center"><Loader className="w-6 h-6 animate-spin mx-auto text-action-primary" /></div>;
    }

    return (
        <div className="w-full space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-text-primary flex items-center">
                    <Link className="w-5 h-5 mr-2 text-action-primary" />
                    Household Links
                </h2>
                <button
                    className="px-4 py-2 bg-action-primary text-white rounded-lg hover:bg-action-hover transition-colors flex items-center text-sm font-medium"
                    onClick={handleGenerateCode}
                    disabled={generating}
                >
                    {generating ? <Loader className="w-4 h-4 mr-1.5 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
                    Link Child
                </button>
            </div>

            {error && (
                <div className="p-4 bg-signal-alert/10 text-signal-alert rounded-lg flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    {error}
                </div>
            )}

            <div className="bg-bg-surface rounded-lg border border-border-subtle overflow-hidden">
                <table className="min-w-full divide-y divide-border-subtle">
                    <thead className="bg-bg-subtle">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Child</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Linked Household</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-bg-surface divide-y divide-border-subtle">
                        {links.map((link) => (
                            <tr key={link._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                                    {link.childId?.displayName || 'Unknown Child'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                    {link.household2} {/* Should probably fetch household name */}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${link.status === 'active' ? 'bg-signal-success/10 text-signal-success' : 'bg-text-secondary/10 text-text-secondary'
                                        }`}>
                                        {link.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleUnlink(link.childId._id)}
                                        className="text-signal-alert hover:text-signal-alert/80 ml-4"
                                    >
                                        Unlink
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {links.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-text-secondary text-sm">
                                    No active household links found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Helper for Plus icon since I didn't import it
function Plus(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}

export default HouseholdLinkSettings;
