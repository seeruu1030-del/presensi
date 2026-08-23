const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

let client = null;
let qrDataURL = null;
let clientStatus = 'DISCONNECTED'; // DISCONNECTED, QR_READY, CONNECTED, AUTHENTICATING

function initializeWhatsApp() {
  if (client) {
    console.log('[WhatsApp] Client already exists.');
    return;
  }

  console.log('[WhatsApp] Initializing client...');
  clientStatus = 'AUTHENTICATING';
  qrDataURL = null;

  try {
    client = new Client({
      authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--no-zygote'],
        headless: true
      }
    });

    client.on('qr', async (qr) => {
      console.log('[WhatsApp] QR Code received.');
      clientStatus = 'QR_READY';
      try {
        qrDataURL = await qrcode.toDataURL(qr);
      } catch (err) {
        console.error('[WhatsApp] Failed to generate QR Data URL:', err);
      }
    });

    client.on('ready', () => {
      console.log('[WhatsApp] Client is ready!');
      clientStatus = 'CONNECTED';
      qrDataURL = null;
    });

    client.on('authenticated', () => {
      console.log('[WhatsApp] Client authenticated.');
    });

    client.on('auth_failure', (msg) => {
      console.error('[WhatsApp] Authentication failure:', msg);
      clientStatus = 'DISCONNECTED';
      qrDataURL = null;
    });

    client.on('disconnected', (reason) => {
      console.log('[WhatsApp] Client was disconnected:', reason);
      clientStatus = 'DISCONNECTED';
      qrDataURL = null;
      client = null;
    });

    client.initialize().catch(err => {
      console.error('[WhatsApp] Initialization error:', err);
      clientStatus = 'DISCONNECTED';
      client = null;
    });
  } catch (err) {
    console.error('[WhatsApp] Failed to initialize Puppeteer / WhatsApp:', err.message);
    clientStatus = 'DISCONNECTED';
    client = null;
  }
}

function getStatus() {
  return {
    status: clientStatus,
    qrDataURL: qrDataURL
  };
}

async function logout() {
  if (client) {
    try {
      await client.logout();
      await client.destroy();
    } catch (err) {
      console.error('[WhatsApp] Error during logout:', err);
    }
    client = null;
  }
  clientStatus = 'DISCONNECTED';
  qrDataURL = null;
  // Re-initialize to get a new QR code
  initializeWhatsApp();
}

/**
 * Send a WhatsApp message to a specific number.
 * @param {string} phone Number in local format (e.g., '08123456789') or standard format.
 * @param {string} message The text message to send.
 * @param {object} pengaturan The configuration object from database.
 */
async function sendMessage(phone, message, pengaturan) {
  const provider = (pengaturan && pengaturan.wa_provider) ? pengaturan.wa_provider : 'Lokal';

  if (provider === 'Wablas') {
    return sendWablasMessage(phone, message, pengaturan.wa_domain, pengaturan.wa_token);
  }

  // --- LOKAL (whatsapp-web.js) ---
  if (clientStatus !== 'CONNECTED' || !client) {
    console.log(`[WhatsApp] Cannot send message to ${phone}, client not connected.`);
    return false;
  }
  
  try {
    // Format the phone number (assuming Indonesian number)
    let formattedPhone = phone.replace(/\D/g, ''); // Remove non-numeric
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.substring(1); // Replace 0 with 62
    }
    const chatId = `${formattedPhone}@c.us`;
    
    await client.sendMessage(chatId, message);
    console.log(`[WhatsApp] Message successfully sent to ${formattedPhone}`);
    return true;
  } catch (err) {
    console.error(`[WhatsApp] Failed to send message to ${phone}:`, err);
    return false;
  }
}

/**
 * Send message using Wablas API.
 */
async function sendWablasMessage(phone, message, domain, token) {
  if (!domain || !token) {
    console.error('[Wablas] Domain or Token is missing.');
    return false;
  }

  try {
    // Format the phone number
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.substring(1);
    }

    // Wablas standard single send endpoint
    const url = `${domain}/api/send-message`;
    const payload = new URLSearchParams({
      phone: formattedPhone,
      message: message
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: payload
    });

    const result = await response.json();
    if (result.status || result.message) {
      console.log(`[Wablas] Message successfully sent to ${formattedPhone}`);
      return true;
    } else {
      console.error(`[Wablas] API Error:`, result);
      return false;
    }
  } catch (err) {
    console.error(`[Wablas] Failed to send message to ${phone}:`, err);
    return false;
  }
}

module.exports = {
  initializeWhatsApp,
  getStatus,
  logout,
  sendMessage
};
