'use client';

import { useState } from 'react';
import { supabase } from '../utils/supabase';
import styles from './Login.module.css';

export default function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Check if username exists in profiles table
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', username.trim())
                .single();

            if (error) throw error;

            if (data) {
                onLogin(data);
            } else {
                setError('Username not found');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Login failed. Please check username.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.card}>
                <h1 className={styles.title}>Packing App</h1>
                <p className={styles.subtitle}>Please log in to continue</p>

                <form onSubmit={handleLogin} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <button type="submit" className={styles.button} disabled={loading || !username}>
                        {loading ? 'Checking...' : 'Log In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
