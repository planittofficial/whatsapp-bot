import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  CircleHelp,
  Clock3,
  MessageSquareText,
  Plus,
  Send,
  Settings2,
  ShieldCheck,
  Smartphone,
  Wifi,
  WifiOff,
} from 'lucide-react';

function formatTime(dateString) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(dateString));
}

function App() {
  const [status, setStatus] = useState(null);
  const [messages, setMessages] = useState([]);
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState(null);

  async function refreshDashboard() {
    const [statusResponse, messagesResponse] = await Promise.all([
      fetch('/api/status'),
      fetch('/api/messages'),
    ]);
    if (statusResponse.ok) setStatus(await statusResponse.json());
    if (messagesResponse.ok) setMessages(await messagesResponse.json());
  }

  useEffect(() => {
    refreshDashboard().catch(() => setNotice({ type: 'error', text: 'Could not connect to the dashboard server.' }));
  }, []);

  async function handleSend(event) {
    event.preventDefault();
    setSending(true);
    setNotice(null);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, message }),
      });
      const result = await response.json();

      if (!response.ok) {
        if (result.message) setMessages((current) => [result.message, ...current].slice(0, 30));
        throw new Error(result.error || 'Message could not be sent.');
      }

      setMessages((current) => [result, ...current].slice(0, 30));
      setMessage('');
      setNotice({ type: 'success', text: 'Message sent successfully.' });
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setSending(false);
    }
  }

  const sentCount = messages.filter((item) => item.status === 'sent').length;
  const failedCount = messages.filter((item) => item.status === 'failed').length;
  const characterCount = message.length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Relay home">
          <span className="brand-mark"><MessageSquareText size={19} strokeWidth={2.4} /></span>
          <span>relay<span className="brand-period">.</span></span>
        </a>

        <div className="workspace-label">WORKSPACE</div>
        <button className="workspace-switcher" type="button">
          <span className="workspace-avatar">W</span>
          <span className="workspace-copy"><strong>WhatsApp</strong><small>Outbound desk</small></span>
          <Settings2 size={16} />
        </button>

        <div className="nav-label">MESSAGING</div>
        <nav className="nav-list" aria-label="Main navigation">
          <a className="nav-item active" href="#compose"><Send size={17} /><span>Compose</span><span className="nav-key">⌘ 1</span></a>
          <a className="nav-item" href="#activity"><Clock3 size={17} /><span>Activity</span></a>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-link"><CircleHelp size={17} /><span>Help center</span><ArrowUpRight size={14} /></div>
          <div className="profile-row">
            <div className="profile-avatar">Y</div>
            <div className="profile-copy"><strong>Your workspace</strong><small>Personal</small></div>
            <span className="profile-menu">···</span>
          </div>
        </div>
      </aside>

      <main id="top" className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>Messaging</span><span className="crumb-divider">/</span><strong>Compose</strong></div>
          <div className="topbar-meta">
            <span className={`connection-pill ${status?.configured ? 'is-online' : 'is-offline'}`}>
              {status?.configured ? <Wifi size={14} /> : <WifiOff size={14} />}
              {status?.configured ? 'Connected' : 'Not configured'}
            </span>
            <button className="icon-button" type="button" title="WhatsApp Cloud API connection" aria-label="WhatsApp Cloud API connection"><Smartphone size={17} /></button>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot" /> OUTBOUND MESSAGING</div>
              <h1>Message desk<span className="heading-period">.</span></h1>
              <p>Send a message. Keep it human.</p>
            </div>
            <div className="heading-stats" aria-label="Message activity summary">
              <div className="stat"><span className="stat-number">{sentCount.toString().padStart(2, '0')}</span><span>sent</span></div>
              <span className="stat-divider" />
              <div className="stat"><span className="stat-number">{failedCount.toString().padStart(2, '0')}</span><span>failed</span></div>
            </div>
          </section>

          {!status?.configured && status && (
            <div className="setup-banner">
              <div className="setup-icon"><Settings2 size={18} /></div>
              <div className="setup-copy"><strong>Connect your WhatsApp Business number</strong><span>Add your Cloud API token and phone number ID to the server environment to start sending.</span></div>
              <span className="setup-step">SETUP REQUIRED</span>
            </div>
          )}

          <div className="dashboard-grid">
            <section className="compose-panel" id="compose">
              <div className="panel-heading">
                <div className="panel-icon"><MessageSquareText size={18} /></div>
                <div><h2>New message</h2><p>Write and send directly to a recipient.</p></div>
                <span className="manual-tag"><span /> MANUAL</span>
              </div>

              <form onSubmit={handleSend}>
                <label className="field-label" htmlFor="recipient">RECIPIENT</label>
                <div className="recipient-field">
                  <span className="country-code">+</span>
                  <input
                    id="recipient"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="1 415 555 0138"
                    value={recipient}
                    onChange={(event) => setRecipient(event.target.value)}
                    required
                  />
                  <span className="input-hint">INTERNATIONAL FORMAT</span>
                </div>

                <div className="message-label-row">
                  <label className="field-label" htmlFor="message">YOUR MESSAGE</label>
                  <span className="plain-text-note">Plain text only</span>
                </div>
                <div className="message-box">
                  <textarea
                    id="message"
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    maxLength={4096}
                    required
                  />
                  <div className="message-box-footer">
                    <span className="message-footnote"><ShieldCheck size={14} /> End-to-end encrypted by WhatsApp</span>
                    <span className={characterCount > 3900 ? 'count-warning' : ''}>{characterCount} / 4096</span>
                  </div>
                </div>

                {notice && <div className={`notice ${notice.type}`} role="status">{notice.type === 'success' && <Check size={15} />}{notice.text}</div>}

                <div className="form-footer">
                  <span className="delivery-note"><Clock3 size={15} /> Usually delivered in seconds</span>
                  <button className="send-button" type="submit" disabled={sending || !status?.configured || !recipient.trim() || !message.trim()}>
                    {sending ? <span className="button-spinner" /> : <Send size={16} />}
                    {sending ? 'Sending...' : 'Send message'}
                    {!sending && <span className="send-shortcut">↵</span>}
                  </button>
                </div>
              </form>
            </section>

            <aside className="activity-panel" id="activity">
              <div className="activity-heading">
                <div><div className="activity-title-row"><h2>Recent activity</h2><span className="live-dot" /></div><p>Your latest message attempts</p></div>
                <button className="icon-button add-button" type="button" title="Compose a message" aria-label="Compose a message" onClick={() => document.getElementById('recipient')?.focus()}><Plus size={18} /></button>
              </div>

              {messages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-illustration"><div className="empty-ring ring-one" /><div className="empty-ring ring-two" /><MessageSquareText size={23} /></div>
                  <strong>No messages yet</strong>
                  <span>Your sent messages will show up here.</span>
                  <button type="button" onClick={() => document.getElementById('recipient')?.focus()}>Write your first message <ArrowUpRight size={14} /></button>
                </div>
              ) : (
                <div className="activity-list">
                  {messages.map((item) => (
                    <article className="activity-item" key={item.id}>
                      <div className={`activity-status ${item.status}`} aria-label={item.status}>{item.status === 'sent' ? <Check size={14} /> : <WifiOff size={14} />}</div>
                      <div className="activity-item-copy">
                        <div className="activity-recipient">+{item.recipient}<time>{formatTime(item.createdAt)}</time></div>
                        <p>{item.message}</p>
                        <span className={`delivery-status ${item.status}`}>{item.status === 'sent' ? 'Accepted by WhatsApp' : item.error || 'Not sent'}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <div className="activity-footer"><span>ACTIVITY LOG</span><span>{messages.length} / 30</span></div>
            </aside>
          </div>

          <footer className="page-footer"><span>RELAY MESSAGING</span><span className="footer-dot">·</span><span>Powered by WhatsApp Cloud API</span><span className="footer-right">No automated replies <span className="footer-cross">×</span></span></footer>
        </div>
      </main>
    </div>
  );
}

export default App;
