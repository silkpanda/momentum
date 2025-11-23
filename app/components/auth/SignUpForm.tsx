'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, User, AlertTriangle, Loader, CheckCircle, Home, Palette, CheckIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FormInput from '../layout/FormInput';
import { PROFILE_COLORS } from '../../lib/constants';

interface FormState {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    householdName: string;
    userDisplayName: string;
    inviteCode?: string;
}

const SignUpForm: React.FC = () => {
    const [formData, setFormData] = useState<FormState>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        householdName: '',
        userDisplayName: '',
        inviteCode: '',
    });
    const [hasInviteCode, setHasInviteCode] = useState(false);
    const [selectedColor, setSelectedColor] = useState<string>(PROFILE_COLORS[0].hex);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (
            !formData.firstName || !formData.lastName || !formData.email ||
            !formData.password || !formData.userDisplayName
        ) {
            setError('Please fill in all fields.');
            setIsLoading(false);
            return;
        }

        if (!hasInviteCode && !formData.householdName) {
            setError('Please enter a household name.');
            setIsLoading(false);
            return;
        }

        if (hasInviteCode && !formData.inviteCode) {
            setError('Please enter an invite code.');
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long.');
            setIsLoading(false);
            return;
        }

        try {
            const payload = {
                ...formData,
                userProfileColor: selectedColor,
            };

            if (hasInviteCode) {
                delete (payload as any).householdName;
            } else {
                delete (payload as any).inviteCode;
            }

            const response = await fetch('/web-bff/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok || data.status === 'fail' || data.status === 'error') {
                const message = data.message || 'An unknown error occurred during sign-up.';
                setError(message);
                setIsLoading(false);
                return;
            }

            setSuccess(true);

            if (data.token) {
                localStorage.setItem('momentum_token', data.token);
            }

            setTimeout(() => {
                router.push('/dashboard');
            }, 1500);

        } catch (err) {
            console.error('Network or unexpected error:', err);
            setError('A network error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-lg">
            <h2 className="text-3xl font-semibold text-text-primary text-center mb-6">
                {hasInviteCode ? 'Join a Household' : 'Create Your Household'}
            </h2>

            {error && (
                <div className="mb-4 flex items-center p-4 bg-signal-alert/10 text-signal-alert rounded-lg border border-signal-alert/30">
                    <AlertTriangle className="w-5 h-5 mr-3" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}
            {success && (
                <div className="mb-4 flex items-center p-4 bg-signal-success/10 text-signal-success rounded-lg border border-signal-success/30">
                    <CheckCircle className="w-5 h-5 mr-3" />
                    <p className="text-sm font-medium">Success! Redirecting you now...</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                        id="firstName"
                        name="firstName"
                        type="text"
                        label="Your First Name"
                        Icon={User}
                        placeholder="e.g., Jessica"
                        value={formData.firstName}
                        onChange={handleInputChange}
                    />

                    <FormInput
                        id="lastName"
                        name="lastName"
                        type="text"
                        label="Your Last Name"
                        Icon={User}
                        placeholder="e.g., Smith"
                        value={formData.lastName}
                        onChange={handleInputChange}
                    />
                </div>

                {/* Invite Code Toggle */}
                <div className="flex items-center justify-between p-3 bg-bg-canvas rounded-lg border border-border-subtle">
                    <span className="text-sm font-medium text-text-primary">Joining an existing household?</span>
                    <button
                        type="button"
                        onClick={() => {
                            setHasInviteCode(!hasInviteCode);
                            if (!hasInviteCode) setFormData(prev => ({ ...prev, householdName: '' }));
                            else setFormData(prev => ({ ...prev, inviteCode: '' }));
                        }}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${hasInviteCode ? 'bg-action-primary' : 'bg-border-subtle'}`}
                    >
                        <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${hasInviteCode ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                    </button>
                </div>

                {hasInviteCode ? (
                    <FormInput
                        id="inviteCode"
                        name="inviteCode"
                        type="text"
                        label="Invite Code"
                        Icon={Home}
                        placeholder="e.g., A1B2C3"
                        value={formData.inviteCode || ''}
                        onChange={handleInputChange}
                    />
                ) : (
                    <FormInput
                        id="householdName"
                        name="householdName"
                        type="text"
                        label="Household Name"
                        Icon={Home}
                        placeholder="e.g., 'The Smith Family'"
                        value={formData.householdName}
                        onChange={handleInputChange}
                    />
                )}

                <FormInput
                    id="userDisplayName"
                    name="userDisplayName"
                    type="text"
                    label="Your Display Name"
                    Icon={User}
                    placeholder="e.g., 'Mom' or 'Jessica'"
                    value={formData.userDisplayName}
                    onChange={handleInputChange}
                />

                <FormInput
                    id="email"
                    name="email"
                    type="email"
                    label="Email Address"
                    Icon={Mail}
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                />

                <FormInput
                    id="password"
                    name="password"
                    type="password"
                    label="Password"
                    Icon={Lock}
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={handleInputChange}
                />

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-text-secondary">
                        Your Profile Color
                    </label>
                    <div className="flex flex-wrap gap-2 p-2 bg-bg-canvas rounded-lg border border-border-subtle">
                        {PROFILE_COLORS.map((color) => (
                            <button
                                type="button"
                                key={color.hex}
                                title={color.name}
                                onClick={() => setSelectedColor(color.hex)}
                                className={`w-8 h-8 rounded-full border-2 transition-all
                          ${selectedColor === color.hex ? 'border-action-primary ring-2 ring-action-primary/50 scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                style={{ backgroundColor: color.hex }}
                            >
                                {selectedColor === color.hex && <CheckIcon className="w-5 h-5 text-white m-auto" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={isLoading || success}
                        className={`w-full flex justify-center items-center rounded-lg py-3 px-4 text-base font-medium shadow-sm 
                        text-white transition-all duration-200 
                        ${isLoading || success ? 'bg-action-primary/60 cursor-not-allowed' : 'bg-action-primary hover:bg-action-hover transform hover:scale-[1.005] focus:ring-4 focus:ring-action-primary/50'}`}
                    >
                        {isLoading && <Loader className="w-5 h-5 mr-2" />}
                        {success ? (hasInviteCode ? 'Joining...' : 'Signing Up...') : (hasInviteCode ? 'Join Household' : 'Sign Up')}
                    </button>
                </div>
            </form>

            <p className="mt-6 text-center text-sm text-text-secondary">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-action-primary hover:text-action-hover">
                    Login here
                </Link>
            </p>
        </div>
    );
};

export default SignUpForm;