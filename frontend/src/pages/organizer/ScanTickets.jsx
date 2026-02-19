/**
 * SCAN TICKETS PAGE
 * 
 * For organizers to scan and verify participant tickets at the event venue
 * Features:
 * - Camera-based QR code scanning
 * - Manual ticket ID entry
 * - Verify ticket authenticity
 * - Mark attendance
 * - View verification history and statistics
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { organizerAPI } from '../../services/api';
import './ScanTickets.css';

function ScanTickets() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  
  // State
  const [ticketId, setTicketId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [scanMode, setScanMode] = useState('manual'); // 'manual' or 'camera'
  const [cameraScanner, setCameraScanner] = useState(null);
  const [scannerLoading, setScannerLoading] = useState(false);

  /**
   * VERIFY TICKET BY ID
   */
  const verifyTicketById = async (id) => {
    try {
      setScanning(true);
      setError('');
      setResult(null);

      const response = await organizerAPI.verifyTicket(id.trim());
      
      // Success
      setResult({
        success: true,
        ...response.data
      });

      // Add to history
      setHistory(prevHistory => [
        {
          id: Date.now(),
          ticketId: id.trim(),
          timestamp: new Date(),
          success: true,
          participant: response.data.registration.participant.name
        },
        ...prevHistory
      ]);
    } catch (err) {
      console.error('Verification failed:', err);
      
      const errorData = err.response?.data || {};
      
      setResult({
        success: false,
        message: errorData.message || 'Verification failed',
        alreadyScanned: errorData.alreadyScanned,
        registration: errorData.registration
      });

      // Add to history
      setHistory(prevHistory => [
        {
          id: Date.now(),
          ticketId: id.trim(),
          timestamp: new Date(),
          success: false,
          message: errorData.message || 'Verification failed'
        },
        ...prevHistory
      ]);

      setError(errorData.message || 'Failed to verify ticket');
    } finally {
      setScanning(false);
    }
  };

  /**
   * HANDLE SUCCESSFUL QR SCAN
   */
  const onScanSuccess = React.useCallback(async (decodedText) => {
    console.log('QR Code detected:', decodedText);
    
    // Stop scanner temporarily
    if (scannerRef.current) {
      try {
        scannerRef.current.pause(true);
      } catch (e) {
        console.log('Pause error:', e);
      }
    }

    // Parse QR code data - it could be JSON or plain ticketId
    let ticketId = decodedText;
    try {
      // Try to parse as JSON (in case QR contains ticket object)
      const qrData = JSON.parse(decodedText);
      console.log('Parsed QR data:', qrData);
      
      // Extract ticketId from the parsed object
      if (qrData.ticketId) {
        ticketId = qrData.ticketId;
      }
    } catch (e) {
      // Not JSON, use as plain ticketId
      console.log('QR code contains plain text, using as ticketId');
    }

    console.log('Using ticketId for verification:', ticketId);

    // Verify the ticket
    await verifyTicketById(ticketId);
  }, []);

  /**
   * HANDLE SCAN FAILURE
   */
  const onScanFailure = React.useCallback((error) => {
    // Silent - normal when no QR code in view
  }, []);

  /**
   * INITIALIZE CAMERA SCANNER
   */
  useEffect(() => {
    console.log('Scanner useEffect triggered. scanMode:', scanMode, 'cameraScanner:', cameraScanner);
    
    if (scanMode === 'camera' && !cameraScanner) {
      console.log('Initializing camera scanner...');
      setScannerLoading(true);
      
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        try {
          const scanner = new Html5QrcodeScanner(
            "qr-reader",
            { 
              fps: 10, 
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
              rememberLastUsedCamera: true,
              formatsToSupport: [0], // QR_CODE
              showTorchButtonIfSupported: true,
              // Enable both camera and file-based scanning
              supportedScanTypes: [
                Html5QrcodeScanType.SCAN_TYPE_CAMERA,
                Html5QrcodeScanType.SCAN_TYPE_FILE
              ]
            },
            /* verbose= */ false
          );

          scanner.render(onScanSuccess, onScanFailure)
            .then(() => {
              console.log('Scanner rendered successfully');
              setCameraScanner(scanner);
              scannerRef.current = scanner;
              setScannerLoading(false);
            })
            .catch(err => {
              console.error('Scanner render error:', err);
              setError('Failed to initialize camera scanner. Please check camera permissions.');
              setScannerLoading(false);
            });
        } catch (err) {
          console.error('Scanner initialization error:', err);
          setError('Failed to create scanner instance.');
          setScannerLoading(false);
        }
      }, 100);
    }

    // Cleanup
    return () => {
      if (scannerRef.current && scanMode !== 'camera') {
        console.log('Cleaning up scanner');
        scannerRef.current.clear().catch(err => {
          console.log('Scanner cleanup error:', err);
        });
        scannerRef.current = null;
      }
    };
  }, [scanMode, onScanSuccess, onScanFailure]);

  /**
   * HANDLE MANUAL TICKET VERIFICATION
   */
  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!ticketId.trim()) {
      setError('Please enter a ticket ID');
      return;
    }

    await verifyTicketById(ticketId);
    setTicketId('');
  };

  /**
   * CLEAR RESULT
   */
  const handleClearResult = () => {
    setResult(null);
    setError('');
    setTicketId('');
    
    // Resume camera scanner if in camera mode
    if (scanMode === 'camera' && scannerRef.current) {
      try {
        scannerRef.current.resume();
      } catch (e) {
        console.log('Resume error:', e);
      }
    }
  };

  /**
   * TOGGLE SCAN MODE
   */
  const toggleScanMode = (mode) => {
    console.log('Toggling scan mode to:', mode);
    
    // Clear any existing scanner
    if (scannerRef.current) {
      console.log('Clearing existing scanner');
      scannerRef.current.clear().catch(err => {
        console.log('Error clearing scanner:', err);
      });
      scannerRef.current = null;
    }

    // Reset camera scanner state
    setCameraScanner(null);
    setScannerLoading(false);
    setScanMode(mode);
    setResult(null);
    setError('');
    setTicketId('');
  };

  /**
   * CALCULATE STATISTICS
   */
  const totalScans = history.length;
  const successfulScans = history.filter(h => h.success).length;
  const failedScans = history.filter(h => h.success === false).length;
  const successRate = totalScans > 0 ? ((successfulScans / totalScans) * 100).toFixed(1) : 0;

  /**
   * FORMAT TIME
   */
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="scan-tickets">
      {/* Header */}
      <div className="page-header">
        <button onClick={() => navigate('/organizer/dashboard')} className="back-button">
          ← Back
        </button>
        <h1>🎫 Scan Tickets</h1>
        <p>Verify participant tickets and mark attendance</p>
      </div>

      {/* Attendance Statistics */}
      {totalScans > 0 && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{totalScans}</div>
              <div className="stat-label">Total Scans</div>
            </div>
          </div>
          
          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{successfulScans}</div>
              <div className="stat-label">Verified</div>
            </div>
          </div>
          
          <div className="stat-card error">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <div className="stat-value">{failedScans}</div>
              <div className="stat-label">Failed</div>
            </div>
          </div>
          
          <div className="stat-card rate">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="stat-value">{successRate}%</div>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Scan Mode Toggle */}
      <div className="mode-toggle">
        <button 
          className={scanMode === 'camera' ? 'active' : ''}
          onClick={() => toggleScanMode('camera')}
        >
          📷 Camera Scan
        </button>
        <button 
          className={scanMode === 'manual' ? 'active' : ''}
          onClick={() => toggleScanMode('manual')}
        >
          ⌨️ Manual Entry
        </button>
      </div>

      {/* Scanner Section */}
      <div className="scanner-section">
        <div className="scanner-card">
          <h2>{scanMode === 'camera' ? 'Camera Scanner' : 'Verify Ticket'}</h2>
          
          {scanMode === 'camera' ? (
            // Camera QR Scanner
            <div className="camera-scanner-container">
              {scannerLoading && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#6b7280',
                  fontSize: '16px'
                }}>
                  <div style={{ marginBottom: '10px' }}>⏳ Initializing camera scanner...</div>
                  <div style={{ fontSize: '14px' }}>Please wait while we set up the scanner</div>
                </div>
              )}
              <div id="qr-reader"></div>
              {!scannerLoading && (
                <p className="scanner-hint">
                  📱 Position the QR code within the frame to scan automatically or upload an image
                </p>
              )}
            </div>
          ) : (
            // Manual Entry Form
            <form onSubmit={handleVerify} className="verify-form">
              <div className="form-group">
                <label>Enter Ticket ID</label>
                <input
                  type="text"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  placeholder="TKT-XXXXXXXX"
                  disabled={scanning}
                  autoFocus
                  className="ticket-input"
                />
                <p className="input-hint">
                  💡 Participants can find their Ticket ID in "My Registrations"
                </p>
              </div>

              <button 
                type="submit" 
                disabled={scanning || !ticketId.trim()}
                className="verify-button"
              >
                {scanning ? '⏳ Verifying...' : '✓ Verify Ticket'}
              </button>
            </form>
          )}

          {/* Error Message */}
          {error && !result && (
            <div className="alert alert-error">
              <span className="alert-icon">❌</span>
              <span>{error}</span>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className={`verification-result ${result.success ? 'success' : 'failure'}`}>
              {result.success ? (
                // SUCCESS
                <div className="result-content">
                  <div className="result-icon success-icon">✅</div>
                  <h3>Ticket Verified!</h3>
                  <div className="attendance-marked">
                    <span className="checkmark">✓</span> Attendance Marked
                  </div>
                  <div className="result-details">
                    <div className="detail-item">
                      <strong>Participant:</strong>
                      <span>{result.registration.participant.name}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Email:</strong>
                      <span>{result.registration.participant.email}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Event:</strong>
                      <span>{result.registration.event.name}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Ticket ID:</strong>
                      <span className="ticket-id-display">{result.registration.ticketId}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Status:</strong>
                      <span className="status-badge success">{result.registration.status}</span>
                    </div>
                  </div>
                  <button onClick={handleClearResult} className="btn-continue">
                    {scanMode === 'camera' ? 'Resume Scanning' : 'Scan Next Ticket'}
                  </button>
                </div>
              ) : (
                // FAILURE
                <div className="result-content">
                  <div className="result-icon error-icon">❌</div>
                  <h3>Verification Failed</h3>
                  <p className="error-message">{result.message}</p>
                  
                  {result.alreadyScanned && result.registration && (
                    <div className="result-details">
                      <p className="warning-text">⚠️ This ticket was already scanned:</p>
                      <div className="detail-item">
                        <strong>Participant:</strong>
                        <span>{result.registration.participant.firstName} {result.registration.participant.lastName}</span>
                      </div>
                      <div className="detail-item">
                        <strong>Scanned At:</strong>
                        <span>{new Date(result.registration.scannedAt).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  )}
                  
                  <button onClick={handleClearResult} className="btn-continue">
                    {scanMode === 'camera' ? 'Resume Scanning' : 'Try Again'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Verification History */}
      {history.length > 0 && (
        <div className="history-section">
          <h2>Recent Verifications ({history.length})</h2>
          <div className="history-list">
            {history.map((item) => (
              <div key={item.id} className={`history-item ${item.success ? 'success' : 'failure'}`}>
                <div className="history-icon">
                  {item.success ? '✅' : '❌'}
                </div>
                <div className="history-details">
                  <div className="history-ticket">{item.ticketId}</div>
                  {item.success ? (
                    <div className="history-info">{item.participant}</div>
                  ) : (
                    <div className="history-error">{item.message}</div>
                  )}
                </div>
                <div className="history-time">{formatTime(item.timestamp)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ScanTickets;
