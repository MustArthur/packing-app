'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import styles from './Scanner.module.css';
import clsx from 'clsx';

export default function Scanner({ onScan, isScanning, scanDelay = 500 }) {
    const scannerRef = useRef(null);
    const [error, setError] = useState(null);
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        const scannerId = "reader";
        let isMounted = true;
        let html5QrCode;

        const startScanning = async () => {
            try {
                // Wait a bit for the DOM to be ready and any previous cleanup to finish
                await new Promise(r => setTimeout(r, 100));
                if (!isMounted) return;

                if (!document.getElementById(scannerId)) {
                    console.warn("Scanner element not found");
                    return;
                }

                // Always create a new instance for this mount
                html5QrCode = new Html5Qrcode(scannerId);

                const config = {
                    fps: 10,
                    // Use a rectangular box for better barcode scanning (EAN-13 is wide)
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

                // Explicitly check for cameras first
                const devices = await Html5Qrcode.getCameras();

                if (devices && devices.length) {
                    // Default to the first camera
                    let cameraId = devices[0].id;

                    // Try to find a back/environment camera if multiple exist
                    if (devices.length > 1) {
                        const backCamera = devices.find(device =>
                            device.label.toLowerCase().includes('back') ||
                            device.label.toLowerCase().includes('environment')
                        );
                        if (backCamera) {
                            cameraId = backCamera.id;
                        } else {
                            // If no clear back camera, usually the last one is the back camera on mobile
                            cameraId = devices[devices.length - 1].id;
                        }
                    }

                    await html5QrCode.start(
                        cameraId,
                        config,
                        (decodedText) => {
                            if (isMounted) onScan(decodedText);
                        },
                        (errorMessage) => {
                            // ignore
                        }
                    );
                } else {
                    // Fallback: try generic "user" facing mode if enumeration returned nothing but didn't throw
                    // This is rare but possible in some privacy modes
                    await html5QrCode.start(
                        { facingMode: "user" },
                        config,
                        (decodedText) => {
                            if (isMounted) onScan(decodedText);
                        },
                        (errorMessage) => { }
                    );
                }

                // Only set ref AFTER start is successful
                if (isMounted) {
                    scannerRef.current = html5QrCode;
                    setHasPermission(true);
                } else {
                    html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => { });
                }
            } catch (err) {
                if (isMounted) {
                    console.error("Error starting scanner", err);
                    if (err?.name === 'NotAllowedError') {
                        setError("Camera permission denied.");
                    } else if (err?.name === 'NotFoundError') {
                        setError("No camera found on this device.");
                    } else {
                        setError("Failed to start camera: " + (err.message || "Unknown error"));
                    }
                }
            }
        };

        if (isScanning) {
            startScanning();
        }

        return () => {
            isMounted = false;
            if (scannerRef.current) {
                const scannerToStop = scannerRef.current;
                scannerRef.current = null;

                scannerToStop.stop().then(() => {
                    return scannerToStop.clear();
                }).catch(err => {
                    // Ignore "not running" errors which happen if start failed or was cancelled
                    console.warn("Scanner cleanup warning:", err);
                });
            }
        };
    }, [isScanning, onScan]);

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
