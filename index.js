const venom = require('venom-bot');
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 5000;

app.use(express.json());

// Store clients and QR codes by session name
const sessions = {};

// Function to create/init a session
async function createSession(sessionName) {
  if (sessions[sessionName] && sessions[sessionName].client) {
    // Session already exists
    return sessions[sessionName];
  }

  sessions[sessionName] = { qrCodeBase64: '', client: null };

  venom.create(
    {
      session: sessionName,
      headless: true,
      browserArgs: ['--no-sandbox', '--disable-setuid-sandbox', '--headless=new'],
    },
    (base64Qr) => {
      sessions[sessionName].qrCodeBase64 = base64Qr;
      console.log(`QR Code generated for session: ${sessionName}`);
    }
  )
    .then(client => {
      sessions[sessionName].client = client;
      console.log(`Venom client ready for session: ${sessionName}`);
    })
    .catch(err => {
      console.error(`Error initializing Venom for session ${sessionName}:`, err);
    });

  return sessions[sessionName];
}

// Endpoint to create/init a session by name
app.post('/session/:sessionName', async (req, res) => {
  const { sessionName } = req.params;

  if (!sessionName) {
    return res.status(400).json({ error: 'Session name is required' });
  }

  await createSession(sessionName);
  res.json({ message: `Session ${sessionName} initialization started` });
});

// Endpoint to get QR code for a session
app.get('/qr/:sessionName', (req, res) => {
  const { sessionName } = req.params;
  const session = sessions[sessionName];

  if (session && session.qrCodeBase64) {
    res.json({ qr: session.qrCodeBase64 });
  } else {
    res.status(404).json({ error: 'QR code not yet generated or session does not exist' });
  }
});

// Endpoint to send message for a session
app.post('/send-text/:sessionName', async (req, res) => {
  const { sessionName } = req.params;
  const { mobile, message } = req.body;

  if (!mobile || !message) {
    return res.status(400).json({ error: 'Mobile number and message are required' });
  }

  const session = sessions[sessionName];
  if (!session || !session.client) {
    return res.status(503).json({ error: 'WhatsApp client not ready for this session' });
  }

  const formattedNumber = `${mobile}@c.us`;

  try {
    const result = await session.client.sendText(formattedNumber, message);
    res.json({ success: true, result });
  } catch (error) {
    console.error(`Failed to send message for session ${sessionName}:`, error);
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
});

// Endpoint to check connection state for a session
app.get('/connection-state/:sessionName', async (req, res) => {
  const { sessionName } = req.params;
  const session = sessions[sessionName];

  if (!session || !session.client) {
    return res.status(503).json({ state: 'NOT_INITIALIZED' });
  }

  try {
    const state = await session.client.getConnectionState();
    res.json({ state });
  } catch (err) {
    console.error(`Error getting connection state for session ${sessionName}:`, err);
    res.status(500).json({ state: 'ERROR', error: err.message });
  }
});

// DELETE endpoint to delete a session
app.delete('/session/:sessionName', async (req, res) => {
  const { sessionName } = req.params;
  const session = sessions[sessionName];

  if (!session) {
    return res.status(404).json({ error: `Session ${sessionName} does not exist` });
  }

  try {
    if (session.client) {
      await session.client.close(); // Close the venom client/browser
      console.log(`Venom client closed for session: ${sessionName}`);
    }

    // Remove session from sessions object
    delete sessions[sessionName];

    // Delete the session folder to clear stored WhatsApp data
    const sessionFolder = path.resolve(`./tokens/${sessionName}`);
    if (fs.existsSync(sessionFolder)) {
      fs.rmSync(sessionFolder, { recursive: true, force: true });
      console.log(`Session folder deleted: ${sessionFolder}`);
    }

    res.json({ message: `Session ${sessionName} deleted successfully` });
  } catch (error) {
    console.error(`Failed to delete session ${sessionName}:`, error);
    res.status(500).json({ error: 'Failed to delete session', details: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
