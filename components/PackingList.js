import styles from './PackingList.module.css';
import { CheckCircle, Circle } from 'lucide-react';
import clsx from 'clsx';

export default function PackingList({ items }) {
    return (
        <div className={styles.listContainer}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>SKU</th>
                        <th>Flavor</th>
                        <th className="text-center">Qty</th>
                        <th className="text-center">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => {
                        const isComplete = item.scannedQty >= item.qtyRequired;
                        return (
                            <tr key={item.sku} className={clsx(isComplete && styles.complete)}>
                                <td className={styles.sku}>{item.sku}</td>
                                <td>{item.flavor}</td>
                                <td className="text-center">
                                    <span className={styles.qty}>
                                        {item.scannedQty} / {item.qtyRequired}
                                    </span>
                                </td>
                                <td className="text-center">
                                    {isComplete ? (
                                        <CheckCircle className={styles.iconSuccess} size={24} />
                                    ) : (
                                        <Circle className={styles.iconPending} size={24} />
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
