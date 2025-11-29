'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Scanner from '@/components/Scanner';
import PackingList from '@/components/PackingList';
import FeedbackOverlay from '@/components/FeedbackOverlay';
import { fetchOrder, updateOrderStatus } from '@/services/api';
import { playSuccessSound, playErrorSound } from '@/utils/sound';
import { ScanLine, CheckCircle, RefreshCw } from 'lucide-react';

export default function Home() {
  const [orderId, setOrderId] = useState(null);
  const [items, setItems] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ visible: false, type: '', message: '' });
  const [completed, setCompleted] = useState(false);

  // Check if all items are complete
  // Check if all items are complete
  useEffect(() => {
    if (items.length > 0) {
      const allComplete = items.every(item => item.scannedQty >= item.qtyRequired);
      if (allComplete && !completed) {
        setIsScanning(false);
        // Delay completion state to allow scanner to cleanup gracefully
        // and prevent race conditions with DOM removal
        setTimeout(() => {
          setCompleted(true);
          playSuccessSound();
        }, 500);
      }
    }
  }, [items, completed]);

  const showFeedback = (type, message) => {
    setFeedback({ visible: true, type, message });
    if (type === 'success') {
      playSuccessSound();
    } else {
      playErrorSound();
    }

    // Hide after 1.5s
    setTimeout(() => {
      setFeedback(prev => ({ ...prev, visible: false }));
    }, 1500);
  };

  const handleScan = useCallback(async (code) => {
    if (loading || feedback.visible || completed) return;

    if (!orderId) {
      // Step 1: Scan Carton QR
      setLoading(true);
      try {
        const orderItems = await fetchOrder(code);
        setOrderId(code);
        setItems(orderItems);
        setIsScanning(false); // Pause scanning to let user see list
        showFeedback('success', 'Order Found!');
      } catch (err) {
        showFeedback('error', 'Order Not Found');
      } finally {
        setLoading(false);
      }
    } else {
      // Step 2: Scan Item Barcode
      // Normalize code to string and trim
      const normalizedCode = String(code).trim();

      const itemIndex = items.findIndex(i => String(i.sku).trim() === normalizedCode);

      if (itemIndex === -1) {
        showFeedback('error', 'Wrong Item!');
        return;
      }

      const item = items[itemIndex];

      if (item.scannedQty >= item.qtyRequired) {
        showFeedback('error', 'Already Complete!');
        return;
      }

      // Update item
      const newItems = [...items];
      newItems[itemIndex] = { ...item, scannedQty: item.scannedQty + 1 };
      setItems(newItems);
      showFeedback('success', 'Item Verified');
    }
  }, [orderId, items, loading, feedback.visible, completed]);

  const handleCloseJob = async () => {
    setLoading(true);
    try {
      await updateOrderStatus(orderId, {
        status: 'Completed',
        timestamp: new Date().toISOString(),
        checkedBy: 'User' // In real app, get from auth
      });
      alert('Job Closed Successfully!');
      // Reset
      setOrderId(null);
      setItems([]);
      setCompleted(false);
    } catch (err) {
      alert('Failed to close job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
      <Header />

      <FeedbackOverlay
        visible={feedback.visible}
        type={feedback.type}
        message={feedback.message}
      />

      <div className="container">
        {/* Status Bar */}
        {orderId && (
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Order ID</div>
              <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{orderId}</div>
            </div>
            {completed && <div style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>COMPLETED</div>}
          </div>
        )}

        {/* Scanner Section - Hidden when completed instead of unmounted to prevent DOM errors */}
        <div className="card" style={{
          padding: '0.5rem',
          background: '#000',
          display: completed ? 'none' : 'block'
        }}>
          <Scanner
            onScan={handleScan}
            isScanning={isScanning}
          />
          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            onClick={() => setIsScanning(!isScanning)}
          >
            {isScanning ? 'Stop Camera' : (orderId ? 'Scan Item' : 'Scan Carton QR')}
          </button>
        </div>

        {/* Packing List */}
        {items.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Packing List</h2>
            <PackingList items={items} />
          </div>
        )}

        {/* Completion Action */}
        {completed && (
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <CheckCircle size={64} color="var(--success-color)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ marginBottom: '1rem' }}>All Items Packed!</h2>
            <button
              className="btn btn-accent"
              style={{ width: '100%', fontSize: '1.25rem', padding: '1rem' }}
              onClick={handleCloseJob}
              disabled={loading}
            >
              {loading ? 'Closing...' : 'Close Job'}
            </button>
          </div>
        )}

        {/* Initial State Hint */}
        {!orderId && !isScanning && (
          <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>
            <ScanLine size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>Tap "Scan Carton QR" to start</p>
          </div>
        )}
      </div>
    </main>
  );
}
