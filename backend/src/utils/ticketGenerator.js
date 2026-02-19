/**
 * TICKET GENERATOR - Creates unique tickets and QR codes
 * 
 * Purpose: Generate unique ticket IDs and QR codes for event registrations
 * Uses: 
 * - uuid: Creates unique random IDs
 * - qrcode: Converts data into scannable QR code images
 * 
 * Flow:
 * 1. Generate unique ticket ID (e.g., FEL-2026-A3F9B)
 * 2. Create QR code containing ticket data
 * 3. Return QR code as base64 image (can be embedded in emails/shown on screen)
 */

import QRCode from "qrcode";  // Package to generate QR codes
import { v4 as uuidv4 } from "uuid";  // Package to generate unique IDs

/**
 * GENERATE UNIQUE TICKET ID
 * 
 * Purpose: Create a unique, human-readable ticket ID
 * Format: FEL-YYYY-XXXXX
 *   - FEL: Felicity prefix
 *   - YYYY: Current year (2026)
 *   - XXXXX: Random 5-character code
 * 
 * Example output: "FEL-2026-A3F9B"
 * 
 * Why: Easy to reference, search, and verify tickets manually
 */
export const generateTicketId = () => {
  const year = new Date().getFullYear();           // Get current year (2026)
  const uniqueCode = uuidv4().split("-")[0].toUpperCase();  // Generate random code (first part of UUID)
  return `FEL-${year}-${uniqueCode}`;             // Combine into ticket ID
};

/**
 * GENERATE QR CODE
 * 
 * Purpose: Convert ticket data into a scannable QR code image
 * Input: Any data object (ticketId, participant info, event info, etc.)
 * Output: Base64 encoded image (data:image/png;base64,...)
 * 
 * What is Base64?: A way to represent images as text strings
 * - Can be embedded directly in HTML: <img src="data:image/png;base64,..." />
 * - Can be sent in emails
 * - Can be stored in database
 * 
 * How it works:
 * 1. Convert data object to JSON string
 * 2. Generate QR code from that string
 * 3. Return as base64 image
 * 
 * When scanned: The QR scanner will read back the original JSON data
 * 
 * @param {Object} data - Data to encode (e.g., {ticketId, participantName, eventName})
 * @returns {String} Base64 image string starting with "data:image/png;base64,..."
 */
export const generateQRCode = async (data) => {
  try {
    // Step 1: Convert JavaScript object to JSON string
    // Example: {ticketId: "FEL-2026-ABC"} → '{"ticketId":"FEL-2026-ABC"}'
    const qrString = JSON.stringify(data);
    
    // Step 2: Generate QR code from the JSON string
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: "H",  // H = High error correction (QR works even if partially damaged)
      type: "image/png",           // Output format: PNG image
      quality: 0.95,               // Image quality (95% = high quality)
      margin: 1,                   // White border around QR code (1 = minimal)
      width: 300,                  // QR code size in pixels (300x300)
    });
    
    // Step 3: Return the base64 image string
    // Format: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    return qrCodeDataURL;
  } catch (error) {
    console.error("QR Code generation error:", error);
    throw new Error("Failed to generate QR code");
  }
};

/**
 * VERIFY QR CODE DATA
 * 
 * Purpose: Parse and validate data from a scanned QR code
 * 
 * How organizers use this:
 * 1. Scan participant's QR code using phone camera or scanner
 * 2. Get the JSON string from QR code
 * 3. Pass it to this function
 * 4. Get back the original ticket data object
 * 
 * Example:
 * Input (scanned QR):  '{"ticketId":"FEL-2026-ABC","participantName":"John"}'
 * Output:              {ticketId: "FEL-2026-ABC", participantName: "John"}
 * 
 * @param {String} qrData - JSON string from scanned QR code
 * @returns {Object} Parsed ticket data object
 * @throws {Error} If QR data is invalid/corrupted
 */
export const verifyQRCode = (qrData) => {
  try {
    // Convert JSON string back to JavaScript object
    return JSON.parse(qrData);
  } catch (error) {
    // If parsing fails, QR code is invalid/corrupted
    throw new Error("Invalid QR code data");
  }
};
