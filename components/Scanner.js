'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import styles from './Scanner.module.css';
import clsx from 'clsx';

export default function Scanner({ onScan, isScanning, scanDelay = 500 }) {
    // Scanner component with camera switching
    const scannerRef = useRef(null);
    const [error, setError] = useState(null);
    const [hasPermission, setHasPermission] = useState(false);
    const [devices, setDevices] = useState([]);
    const [activeDeviceId, setActiveDeviceId] = useState(null);

    // Initialize cameras on mount
    useEffect(() => {
        let isMounted = true;
        Html5Qrcode.getCameras().then(cameras => {
            if (!isMounted) return;
            if (cameras && cameras.length) {
                setDevices(cameras);

                // Smart selection: Prefer back camera
                const backCamera = cameras.find(device =>
                    device.label.toLowerCase().includes('back') ||
                    device.label.toLowerCase().includes('environment')
                );

                if (backCamera) {
                    setActiveDeviceId(backCamera.id);
                } else {
                    // Fallback to last camera (often back on mobile) or first
                    setActiveDeviceId(cameras[cameras.length - 1].id);
                }
            } else {
                setError("No camera found.");
            }
        }).catch(err => {
            if (!isMounted) return;
            console.error("Camera enumeration error", err);
            setError("Camera permission denied or no camera found.");
        });

        return () => { isMounted = false; };
    }, []);

    // Handle Scanning
    useEffect(() => {
        if (!isScanning || !activeDeviceId) return;

        const scannerId = "reader";
        let isMounted = true;
        let html5QrCode;

        const startScanning = async () => {
            try {
                if (!document.getElementById(scannerId)) return;

                html5QrCode = new Html5Qrcode(scannerId);
                scannerRef.current = html5QrCode;

                const config = {
                    fps: 10,
                    qrbox: { width: 300, height: 150 },
                    aspectRatio: 1.0,
                    formatsToSupport: [
                        Html5QrcodeSupportedFormats.EAN_13,
                        Html5QrcodeSupportedFormats.EAN_8,
                        Html5QrcodeSupportedFormats.CODE_128,
                        Html5QrcodeSupportedFormats.CODE_39,
                        Html5QrcodeSupportedFormats.QR_CODE,
                    ]
                };

                await html5QrCode.start(
                    activeDeviceId,
                    config,
                    (decodedText) => {
                        if (isMounted) onScan(decodedText);
                    },
                    (errorMessage) => { }
                );

                if (isMounted) setHasPermission(true);
            } catch (err) {
                if (isMounted) {
                    console.error("Error starting scanner", err);
                    setError("Failed to start camera. Please check permissions.");
                }
            }
        };

        startScanning();

        return () => {
            isMounted = false;
            if (html5QrCode) {
                // Robust cleanup sequence
                const cleanup = async () => {
                    try {
                        // Attempt to stop
                        try {
                            if (html5QrCode.isScanning) {
                                await html5QrCode.stop();
                            }
                        } catch (err) {
                            console.warn("Scanner stop ignored:", err);
                        }

                        // Attempt to clear if element exists
                        if (document.getElementById(scannerId)) {
                            try {
                                await html5QrCode.clear();
                            } catch (err) {
                                console.warn("Scanner clear ignored:", err);
                            }
                        }
                    } catch (err) {
                        console.error("Scanner cleanup failed:", err);
                    }
                };

                cleanup();
            }
        };
    }, [isScanning, activeDeviceId, onScan]);

    const handleSwitchCamera = () => {
        if (devices.length < 2) return;
        const currentIndex = devices.findIndex(d => d.id === activeDeviceId);
        const nextIndex = (currentIndex + 1) % devices.length;
        setActiveDeviceId(devices[nextIndex].id);
    };

    const [manualCode, setManualCode] = useState('');
    const [showManual, setShowManual] = useState(false);

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualCode.trim()) {
            onScan(manualCode.trim());
            setManualCode('');
        }
    };

    return (
        <div className={styles.scannerWrapper}>
            {error ? (
                <div className={styles.errorContainer}>
                    <div className={styles.error}>{error}</div>
                    <button
                        className={styles.retryBtn}
                        onClick={() => window.location.reload()}
                    >
                        Retry Camera
                    </button>
                    <div className={styles.divider}>OR</div>
                    <form onSubmit={handleManualSubmit} className={styles.manualForm}>
                        <input
                            type="text"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            placeholder="Enter code manually"
                            className={styles.manualInput}
                        />
                        <button type="submit" className={styles.manualBtn}>Submit</button>
                    </form>
                </div>
            ) : (
                <>
                    <div id="reader" className={clsx(styles.scanner, (!isScanning || showManual) && styles.hidden)}></div>
                    {!hasPermission && isScanning && !error && (
                        <div className={styles.loading}>Initializing Camera...</div>
                    )}

                    {/* Manual Input Toggle for testing/fallback */}
                    <div className={styles.manualToggle}>
                        {devices.length > 1 && (
                            <button
                                className={styles.textBtn}
                                onClick={handleSwitchCamera}
                                style={{ marginRight: '1rem' }}
                            >
                                ⟳ Switch Cam
                            </button>
                        )}
                        <button
                            className={styles.textBtn}
                            onClick={() => setShowManual(!showManual)}
                        >
                            {showManual ? 'Show Camera' : 'Enter Code Manually'}
                        </button>
                    </div>


                    {showManual && (
                        <div className={styles.manualOverlay}>
                            <form onSubmit={handleManualSubmit} className={styles.manualForm}>
                                <input
                                    type="text"
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value)}
                                    placeholder="Enter Barcode/QR"
                                    className={styles.manualInput}
                                    autoFocus
                                />
                                <button type="submit" className={styles.manualBtn}>Submit</button>
                            </form>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
