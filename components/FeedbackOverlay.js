import styles from './FeedbackOverlay.module.css';
import { CheckCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';

export default function FeedbackOverlay({ type, message, visible }) {
    if (!visible) return null;

    return (
        <div className={clsx(styles.overlay, type === 'success' ? styles.success : styles.error)}>
            <div className={styles.content}>
                {type === 'success' ? (
                    <CheckCircle size={80} className={styles.icon} />
                ) : (
                    <XCircle size={80} className={styles.icon} />
                )}
                <h2 className={styles.message}>{message}</h2>
            </div>
        </div>
    );
}
