import styles from './Header.module.css';
import { PackageCheck } from 'lucide-react';

export default function Header({ user }) {
    return (
        <header className={styles.header}>
            <div className={styles.logo}>
                <PackageCheck size={24} />
                <span>Packing App</span>
            </div>
            {user && (
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                    {user.username}
                </div>
            )}
        </header>
    );
}
