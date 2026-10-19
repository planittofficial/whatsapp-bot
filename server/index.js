import 'dotenv/config';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT) || 3001;
const apiVersion = process.env.WHATSAPP_API_VERSION || 'v23.0';
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const rootDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(rootDir, '..', 'data');
const historyFile = path.join(dataDir, 'messages.json');

app.use(express.json({ limit: '16kb' }));

async function readHistory() {
  try {
    return JSON.parse(await readFile(historyFile, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

let persistQueue = Promise.resolve();
function saveHistory(history) {
  persistQueue = persistQueue.then(async () => {
    await mkdir(dataDir, { recursive: true });
    await writeFile(historyFile, JSON.stringify(history, null, 2));
  });
  return persistQueue;
}

app.get('/api/status', (_request, response) => {
  response.json({
    configured: Boolean(accessToken && phoneNumberId),
    sender: process.env.WHATSAPP_DISPLAY_NAME || 'WhatsApp Business',
    phoneNumberId: phoneNumberId ? `••••${phoneNumberId.slice(-4)}` : null,
  });
});

app.get('/api/messages', async (_request, response, next) => {
  try {
    const history = await readHistory();
    response.json(history.slice(0, 30));
  } catch (error) {
    next(error);
  }
});

app.post('/api/messages', async (request, response) => {
  const rawRecipient = typeof request.body?.recipient === 'string' ? request.body.recipient : '';
  const recipient = rawRecipient.replace(/[\s()-]/g, '').replace(/^\+/, '');
  const message = typeof request.body?.message === 'string' ? request.body.message.trim() : '';

  if (!/^\d{8,15}$/.test(recipient)) {
    return response.status(400).json({ error: 'Enter an international phone number with 8 to 15 digits.' });
  }
  if (!message || message.length > 4096) {
    return response.status(400).json({ error: 'Message must contain 1 to 4096 characters.' });
  }
  if (!accessToken || !phoneNumberId) {
    return response.status(503).json({ error: 'Add your WhatsApp Cloud API credentials to the server environment first.' });
  }

  const entry = {
    id: randomUUID(),
    recipient,
    message,
    status: 'failed',
    createdAt: new Date().toISOString(),
  };

  try {
    const apiResponse = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'text',
        text: { preview_url: false, body: message },
      }),
      signal: AbortSignal.timeout(20000),
    });
    const result = await apiResponse.json().catch(() => ({}));

    if (!apiResponse.ok) {
      entry.error = result.error?.message || 'WhatsApp could not send this message.';
    } else {
      entry.status = 'sent';
      entry.providerMessageId = result.messages?.[0]?.id;
    }
  } catch (error) {
    entry.error = error.name === 'TimeoutError' ? 'WhatsApp request timed out.' : 'Could not reach the WhatsApp API.';
  }

  try {
    const history = await readHistory();
    await saveHistory([entry, ...history].slice(0, 500));
  } catch {
    if (entry.status === 'sent') {
      return response.status(502).json({ error: 'WhatsApp accepted the message, but the local activity log could not be saved.' });
    }
  }

  if (entry.status === 'failed') {
    return response.status(502).json({ error: entry.error, message: entry });
  }
  return response.status(201).json(entry);
});

const clientDist = path.join(rootDir, '..', 'dist');
app.use(express.static(clientDist));
app.get('*', (_request, response, next) => {
  response.sendFile(path.join(clientDist, 'index.html'), (error) => {
    if (error) next();
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`WhatsApp sender API listening on port ${port}`);
});
