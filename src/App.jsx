import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import EmojiPicker from 'emoji-picker-react';
import { QRCodeSVG } from 'qrcode.react'; 
import { Html5QrcodeScanner } from 'html5-qrcode';
import { saveMessage, getChatMessages, updateMessageStatus, initDB, clearAllLogs, getConfig, setConfig, getRecentChats, deleteMessageFromDB, deleteChatFromDB } from './utils/db';
import { encryptMessage, decryptMessage, deriveSecretKey, deriveMasterKey } from './utils/crypto';

// SVG Icons for tactical aesthetic
const Icons = {
  Bluetooth: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"></polyline>
    </svg>
  ),
  Emoji: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
  ),
  Attach: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
  ),
  Send: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
  ),
  Audio: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
  ),
  Camera: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>
  ),
  QR: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  ),
  Copy: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
  ),
  Mic: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
  ),
  Stop: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"></rect></svg>
  ),
  Tick: ({ status }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" 
      stroke={status === 'read' ? '#34B7F1' : '#919191'} 
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
      style={{ marginLeft: '4px' }}>
      {/* First Tick (Left) */}
      <path d="M2 12L7 17L15 8" style={{ transform: 'translateX(0px)' }}></path>
      {/* Second Tick (Right) - Only for delivered/read */}
      {(status === 'delivered' || status === 'read') && (
        <path d="M8 12L13 17L21 8" style={{ transform: 'translateX(0px)' }}></path>
      )}
    </svg>
  ),
  Menu: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
  ),
  Trash: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
  ),
  Edit: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
  ),
  Forward: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 17 20 12 15 7"></polyline><path d="M4 18v-2a4 4 0 0 1 4-4h12"></path></svg>
  ),
  Close: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  ),
  Lock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
  ),
  Play: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
  ),
  Pause: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
  )
};

const VoicePlayer = ({ src, isSent }) => {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const toggle = () => {
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
    setPlaying(!playing);
  };

  const onTimeUpdate = () => setCurrentTime(audioRef.current.currentTime);
  const onLoadedMetadata = () => setDuration(audioRef.current.duration);
  const onEnded = () => {
    setPlaying(false);
    setCurrentTime(0);
  };

  const format = (s) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`voice-player ${isSent ? 'sent' : 'received'}`}>
      <audio 
        ref={audioRef} 
        src={src} 
        onTimeUpdate={onTimeUpdate} 
        onLoadedMetadata={onLoadedMetadata} 
        onEnded={onEnded}
      />
      <div className="voice-avatar">
        <Icons.Mic />
      </div>
      <button className="voice-play-btn" onClick={toggle}>
        {playing ? <Icons.Pause /> : <Icons.Play />}
      </button>
      <div className="voice-progress-container">
        <div className="voice-waveform">
          <div className="waveform-bg"></div>
          <div className="waveform-progress" style={{ width: `${(currentTime / duration) * 100 || 0}%` }}></div>
        </div>
        <div className="voice-meta">
          <span>{format(currentTime)} / {format(duration)}</span>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState({ 'GLOBAL_MESH': [] });
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [peer, setPeer] = useState(null);
  const [myPeerId, setMyPeerId] = useState(localStorage.getItem('TACTICAL_ID') || '');
  const [conn, setConn] = useState(null);
  const [targetId, setTargetId] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [vaultLocked, setVaultLocked] = useState(!sessionStorage.getItem('TACTICAL_SESSION'));
  const [pinInput, setPinInput] = useState('');
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const [masterKey, setMasterKey] = useState(null);
  const [viewMode, setViewMode] = useState('LIST');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [customNames, setCustomNames] = useState(JSON.parse(localStorage.getItem('TACTICAL_NAMES') || '{}'));
  const [toast, setToast] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [modalInput, setModalInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const qrScannerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    initDB().then(async () => {
      const salt = await getConfig('TACTICAL_SALT');
      if (!salt) setIsFirstLaunch(true);
    });

    const peerConfig = {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ]
      }
    };

    const peerInstance = savedId ? new window.Peer(savedId, peerConfig) : new window.Peer(peerConfig);
    
    peerInstance.on('open', (id) => {
      setMyPeerId(id);
      localStorage.setItem('TACTICAL_ID', id);
    });

    peerInstance.on('error', (err) => {
      console.error('Peer Error:', err.type);
      if (err.type === 'peer-unavailable') {
        showToast('SIGNAL FAILED: NODE NOT FOUND');
      } else if (err.type === 'unavailable-id') {
        showToast('ERROR: ID ALREADY ACTIVE');
      } else {
        showToast(`SIGNAL ERROR: ${err.type.toUpperCase()}`);
      }
    });
    
    peerInstance.on('connection', (incomingConn) => handleConnection(incomingConn));
    setPeer(peerInstance);

    // Load Recent Hub History
    getRecentChats().then(chatIds => {
      setContacts(chatIds.map(id => ({ peerId: id, name: getChatName(id) })));
    });

    const timer = setInterval(() => {
       if (!vaultLocked) {
         // Background Sync Pulse
       }
    }, 60000);

    return () => {
       peerInstance.destroy();
       clearInterval(timer);
    };
  }, []);

  // Auto-Lock Activity Tracker
  useEffect(() => {
    if (vaultLocked) return;
    const lockTimer = setTimeout(() => {
       setVaultLocked(true);
       sessionStorage.removeItem('TACTICAL_SESSION');
       showToast('VAULT AUTO-LOCKED');
    }, 600000); // 10 minutes (Professional Standard)
    
    // Reset timer on user input
    const resetTimer = () => {
       clearTimeout(lockTimer);
    };
    
    window.addEventListener('mousedown', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('touchstart', resetTimer);

    return () => {
       window.removeEventListener('mousedown', resetTimer);
       window.removeEventListener('keypress', resetTimer);
       window.removeEventListener('touchstart', resetTimer);
       clearTimeout(lockTimer);
    };
  }, [vaultLocked]);

  const handleSelectChat = (id) => {
    setActiveChatId(id);
    setViewMode('CHAT');
    setShowMobileSidebar(false);
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const copyMessage = (text) => {
    navigator.clipboard.writeText(text);
    showToast('SIGNAL COPIED');
  };

  const renameChat = (e, peerId) => {
    e.stopPropagation(); 
    if (!peerId) return;
    setModalInput(getChatName(peerId));
    setActiveModal({ type: 'RENAME', targetId: peerId });
  };

  const submitRename = () => {
    if (activeModal?.type === 'RENAME' && modalInput.trim()) {
      const peerId = activeModal.targetId;
      const updated = { ...customNames, [peerId]: modalInput.trim() };
      setCustomNames(updated);
      localStorage.setItem('TACTICAL_NAMES', JSON.stringify(updated));
      setContacts(prev => prev.map(c => c.peerId === peerId ? { ...c, name: modalInput.trim() } : c));
      setActiveModal(null);
      showToast('ALIAS UPDATED');
    }
  };

  const confirmDestroy = () => {
    setActiveModal({ type: 'CONFIRM_DESTROY' });
  };

  const executeDestroy = async () => {
    await clearAllLogs(); 
    localStorage.removeItem('TACTICAL_ID');
    sessionStorage.removeItem('TACTICAL_SESSION');
    window.location.reload(); 
  };

  const forwardSignal = (msg) => {
    setActiveModal({ type: 'FORWARD_SELECT', data: msg });
  };

  const executeForward = async (targetId) => {
    const originalMsg = activeModal.data;
    const relayedMsg = { 
      ...originalMsg, 
      id: crypto.randomUUID(), 
      sender: 'sent', 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered',
      isForwarded: true 
    };
    
    await saveMessage(relayedMsg, targetId);
    setMessages(prev => ({ ...prev, [targetId]: [...(prev[targetId] || []), relayedMsg] }));
    
    // If targeted peer is the currently active connection, send immediately
    if (conn && conn.open && conn.peer === targetId) {
       const key = await deriveSecretKey(myPeerId, targetId);
       let msgToSend = { ...relayedMsg };
       if (relayedMsg.type === 'text') {
         msgToSend.encrypted = await encryptMessage(relayedMsg.text, key);
         msgToSend.text = '[ENCRYPTED SIGNAL]';
       }
       conn.send(msgToSend);
    }
    
    setActiveModal(null);
    showToast('SIGNAL RELAYED');
  };
  const deleteMessage = (id) => {
    setActiveModal({ type: 'DELETE_MSG', targetId: id });
  };

  const executeDeleteMsg = async () => {
    const id = activeModal.targetId;
    await deleteMessageFromDB(id);
    setMessages(prev => {
      const updated = { ...prev };
      for (const chat in updated) {
        updated[chat] = (updated[chat] || []).filter(m => m.id !== id);
      }
      return updated;
    });
    setActiveModal(null);
    showToast('SIGNAL PURGED');
  };

  const deleteChat = (peerId) => {
    setActiveModal({ type: 'DELETE_CHAT', targetId: peerId });
  };

  const executeDeleteChat = async () => {
    const peerId = activeModal.targetId;
    await deleteChatFromDB(peerId);
    setContacts(prev => prev.filter(c => c.peerId !== peerId));
    setMessages(prev => {
      const updated = { ...prev };
      delete updated[peerId];
      return updated;
    });
    if (activeChatId === peerId) {
      setActiveChatId('GLOBAL_MESH');
      setViewMode('LIST');
    }
    setActiveModal(null);
    showToast('CHANNEL DECOMMISSIONED');
  };

  const getChatName = (id) => {
    if (customNames[id]) return customNames[id];
    if (id === 'GLOBAL_MESH') return 'TACTICAL MESH';
    return `NODE: ${id?.substring(0, 4)}...`;
  };

  const getIdenticonColor = (id) => {
    if (id === 'GLOBAL_MESH') return '#00ffbd'; // Main emerald
    let hash = 0;
    for (let i = 0; i < (id?.length || 0); i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${Math.abs(hash % 360)}, 70%, 50%)`;
    return color;
  };

  const getLastMsg = (chatId) => {
    const chatMsgs = messages[chatId] || [];
    if (chatMsgs.length === 0) return 'Signal standby...';
    const last = chatMsgs[chatMsgs.length - 1];
    if (last.type === 'audio') return 'Encrypted Voice Bit';
    if (last.type === 'image') return 'Visual Signal Attached';
    return last.text.substring(0, 30) + (last.text.length > 30 ? '...' : '');
  };

  const getLastMsgMeta = (chatId) => {
    const chatMsgs = messages[chatId] || [];
    if (chatMsgs.length === 0) return null;
    const last = chatMsgs[chatMsgs.length - 1];
    return { time: last.time, sender: last.sender, status: last.status };
  };

  const unlockVault = async () => {
    if (pinInput.length < 4) return;
    const existingSalt = await getConfig('TACTICAL_SALT');
    let saltData = existingSalt ? Uint8Array.from(atob(existingSalt), c => c.charCodeAt(0)) : null;

    const { key, salt } = await deriveMasterKey(pinInput, saltData);
    
    if (isFirstLaunch) {
      await setConfig('TACTICAL_SALT', salt);
    }
    
    setMasterKey(key);
    setVaultLocked(false);
    sessionStorage.setItem('TACTICAL_SESSION', 'ACTIVE');
    loadHistory('GLOBAL_MESH');
  };

  const loadHistory = async (chatId) => {
    const historicalMsgs = await getChatMessages(chatId);
    setMessages(prev => ({ ...prev, [chatId]: historicalMsgs }));
  };

  useEffect(() => {
    if (activeChatId) loadHistory(activeChatId);
  }, [activeChatId]);

  const handleConnection = (connection) => {
    connection.on('open', () => {
      setConn(connection);
      setActiveChatId(connection.peer);
      setViewMode('CHAT'); // SWITCH TO CHAT IMMEDIATELY ON CONNECT
      setIsScanning(false);
      setShowQR(false);
      
      // Update contacts list if not exists
      setContacts(prev => {
        if (!prev.find(c => c.peerId === connection.peer)) {
          return [...prev, { peerId: connection.peer, name: `Node: ${connection.peer.substring(0, 4)}` }];
        }
        return prev;
      });
    });

    connection.on('data', async (data) => {
      const chatId = connection.peer;
      const key = await deriveSecretKey(myPeerId, chatId);

      if (data.type === 'READ_RECEIPT') {
        await updateMessageStatus(data.msgId, 'read');
        setMessages(prev => {
          const chatMsgs = prev[chatId] || [];
          return { ...prev, [chatId]: chatMsgs.map(m => m.id === data.msgId ? { ...m, status: 'read' } : m) };
        });
        return;
      }

      if (data.type === 'TYPING_START') {
        setPeerTyping(true);
        return;
      }
      
      if (data.type === 'TYPING_STOP') {
        setPeerTyping(false);
        return;
      }

      // Decrypt/Persist Message
      let decryptedContent = data.text;
      if (data.encrypted) {
        decryptedContent = await decryptMessage(data.encrypted, key);
      }

      const receivedMsg = { 
        ...data, 
        text: decryptedContent,
        sender: 'received', 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      
      await saveMessage(receivedMsg, chatId);
      setMessages(prev => ({ ...prev, [chatId]: [...(prev[chatId] || []), receivedMsg] }));
      connection.send({ type: 'READ_RECEIPT', msgId: data.id });
    });

    connection.on('close', () => setConn(null));
  };

  const connectToPeer = (id) => {
    const cid = id || targetId;
    if (!cid || !peer) return;
    
    showToast('INITIATING SIG-LINK...');
    const outgoingConn = peer.connect(cid, {
      reliable: true
    });
    
    handleConnection(outgoingConn);
    
    // Fallback if no response
    setTimeout(() => {
       if (!conn || !conn.open) {
          // Check if we still don't have a connection
       }
    }, 5000);
  };

  const [scannerType, setScannerType] = useState('menu'); // menu, qr, bt

  const startScanner = () => {
    setIsScanning(true);
    setScannerType('menu');
  };

  const startQR = () => {
    setScannerType('qr');
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner("reader", { 
        fps: 20, 
        qrbox: {width: 250, height: 250},
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultFreeCamera: true
      });
      
      scanner.render((result) => {
        scanner.clear();
        connectToPeer(result);
      }, (error) => {});
      
      const startBtn = document.getElementById('html5-qrcode-button-camera-start');
      if (startBtn) startBtn.click();
    }, 100);
  };

  const startBT = async () => {
    setScannerType('bt');
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information', 'generic_access']
      });
      
      // If device name looks like a Peer ID, try connecting
      if (device.name && device.name.length > 10) {
        connectToPeer(device.name);
      } else {
        alert(`Connected to signal: ${device.name || 'Unknown'}. Manual ID sync may still be required for P2P.`);
      }
      setIsScanning(false);
    } catch (err) {
      console.warn('BT Cancelled', err);
      setScannerType('menu');
    }
  };

  const copyId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(myPeerId).then(() => {
        showToast('ID COPIED TO HUB');
      }).catch(() => fallbackCopyId(myPeerId));
    } else {
      fallbackCopyId(myPeerId);
    }
  };

  const fallbackCopyId = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('ID COPIED (LEGACY)');
    } catch (err) {}
    document.body.removeChild(textArea);
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (conn && conn.open) {
      if (!isTyping) {
        conn.send({ type: 'TYPING_START' });
        setIsTyping(true);
      }
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        if (conn && conn.open) conn.send({ type: 'TYPING_STOP' });
      }, 2000);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/ogg';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];
      
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: mimeType });
        const reader = new FileReader();
        reader.onload = async (e) => {
          const newMsg = { id: crypto.randomUUID(), type: 'audio', content: e.target.result, sender: 'sent', status: 'delivered', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) };
          const chatId = conn && conn.open ? activeChatId : 'GLOBAL_MESH';
          await saveMessage(newMsg, chatId);
          if (conn && conn.open) conn.send(newMsg);
          setMessages(prev => ({ ...prev, [chatId]: [...(prev[chatId] || []), newMsg] }));
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(t => t.stop());
        setRecordingTime(0);
        clearInterval(recordingIntervalRef.current);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) { showToast('MIC ACCESS DENIED'); }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const chatId = conn && conn.open ? activeChatId : 'GLOBAL_MESH';
    let msgToSend = { 
      id: crypto.randomUUID(), 
      type: 'text', 
      text: inputText, 
      sender: 'sent', 
      status: 'delivered', 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };

    if (conn && conn.open) {
      const key = await deriveSecretKey(myPeerId, chatId);
      const encrypted = await encryptMessage(inputText, key);
      msgToSend.encrypted = encrypted;
      msgToSend.text = '[ENCRYPTED SIGNAL]';
      conn.send(msgToSend);
    }
    
    // Save original (unencrypted) to local DB for display
    await saveMessage({ ...msgToSend, text: inputText }, chatId);
    setMessages(prev => ({ ...prev, [chatId]: [...(prev[chatId] || []), { ...msgToSend, text: inputText }] }));
    setInputText('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const newMsg = { id: crypto.randomUUID(), type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'file', content: event.target.result, fileName: file.name, sender: 'sent', status: 'delivered', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      
      const chatId = conn && conn.open ? activeChatId : 'GLOBAL_MESH';
      await saveMessage(newMsg, chatId);

      if (conn && conn.open) conn.send(newMsg);
      setMessages(prev => ({ ...prev, [chatId]: [...(prev[chatId] || []), newMsg] }));
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChatId]);

  if (vaultLocked) {
    return (
      <div className="vault-screen">
        <div className="vault-container">
          <div className="vault-header">
            <Icons.Bluetooth />
            <h2>NULL SIGNAL VAULT</h2>
            <p>{isFirstLaunch ? 'SET MASTER ACCESS PIN' : 'ENTER ACCESS CODE'}</p>
          </div>
          <div className="pin-display">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`pin-dot ${pinInput.length > i ? 'active' : ''}`}></div>
            ))}
          </div>
          <div className="pin-pad">
            {[1,2,3,4,5,6,7,8,9,0].map(n => (
              <button key={n} className="pin-btn" onClick={() => pinInput.length < 4 && setPinInput(p => p + n)}>{n}</button>
            ))}
            <button className="pin-btn clear" onClick={() => setPinInput('')}>CLR</button>
            <button className="pin-btn unlock" onClick={unlockVault}>{isFirstLaunch ? 'SET' : 'OPEN'}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Tactical Toast Notification */}
      {toast && <div className="tactical-toast">{toast}</div>}

      {/* Tactical Universal Modal */}
      {activeModal && (
        <div className="tactical-modal-overlay">
          <div className="tactical-modal">
            {activeModal.type === 'RENAME' ? (
              <>
                <h3>ALIAS PROTOCOL</h3>
                <p>Assign new label to selected tactical node</p>
                <input 
                  type="text" 
                  value={modalInput} 
                  onChange={(e) => setModalInput(e.target.value)} 
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && submitRename()}
                />
                <div className="modal-actions">
                  <button onClick={() => setActiveModal(null)}>ABORT</button>
                  <button className="confirm" onClick={submitRename}>UPDATE</button>
                </div>
              </>
            ) : activeModal.type === 'IMAGE_VIEW' ? (
              <div className="image-viewer-modal">
                <img src={activeModal.data} alt="Full Scale Signal" />
                <div className="modal-actions">
                   <button onClick={() => setActiveModal(null)} className="full-width">CLOSE VIEWER</button>
                </div>
              </div>
            ) : activeModal.type === 'DELETE_MSG' ? (
              <>
                <h3 className="danger">PURGE SIGNAL?</h3>
                <p>Delete this specific encrypted message from your local storage.</p>
                <div className="modal-actions">
                  <button onClick={() => setActiveModal(null)}>ABORT</button>
                  <button className="danger-btn" onClick={executeDeleteMsg}>DELETE</button>
                </div>
              </>
            ) : activeModal.type === 'DELETE_CHAT' ? (
              <>
                <h3 className="danger">DECOMMISSION CHANNEL?</h3>
                <p>Permanently remove this node and all associated signal history.</p>
                <div className="modal-actions">
                  <button onClick={() => setActiveModal(null)}>ABORT</button>
                  <button className="danger-btn" onClick={executeDeleteChat}>DELETE ALL</button>
                </div>
              </>
            ) : activeModal.type === 'FORWARD_SELECT' ? (
              <div className="forward-modal">
                <h3>SIGNAL RELAY HUB</h3>
                <p>Relay signal to target frequency</p>
                <div className="forward-list">
                  <div className="forward-item" onClick={() => executeForward('GLOBAL_MESH')}>
                    <div className="avatar small" style={{background: getIdenticonColor('GLOBAL_MESH'), color: '#000'}}>M</div>
                    <span>TACTICAL MESH (GLOBAL)</span>
                  </div>
                  {contacts.map(c => (
                    <div key={c.peerId} className="forward-item" onClick={() => executeForward(c.peerId)}>
                      <div className="avatar small" style={{background: getIdenticonColor(c.peerId)}}>{(customNames[c.peerId] || c.name).charAt(0)}</div>
                      <span>{getChatName(c.peerId)}</span>
                    </div>
                  ))}
                </div>
                <div className="modal-actions">
                   <button onClick={() => setActiveModal(null)} className="full-width">CANCEL RELAY</button>
                </div>
              </div>
            ) : activeModal.type === 'IDENTITY_CARD' ? (
              <div className="identity-card-modal">
                <div className="card-header">
                  <div className="avatar large" style={{background: 'linear-gradient(135deg, var(--accent-primary), #00a173)', color: '#000'}}>U</div>
                  <h3>MY TACTICAL IDENTITY</h3>
                  <p>Active Node Signal: {myPeerId.substring(0, 8)}</p>
                </div>
                
                <div className="id-block">
                   <label>NETWORK SIGNAL ID</label>
                   <div className="full-id-text" onClick={copyId}>{myPeerId}</div>
                   <span className="copy-hint">(Tap to Copy)</span>
                </div>

                <div className="qr-box">
                   <QRCodeSVG value={myPeerId} size={180} bgColor={"transparent"} fgColor={"#00ffbd"} level={"H"} />
                   <p>Point target camera here to sync</p>
                </div>

                <div className="modal-actions">
                   <button onClick={() => setActiveModal(null)} className="full-width">CLOSE CARD</button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="danger">PURGE PROTOCOL</h3>
                <p>This action will initiate immediate destruction of all encryption keys and signal history. Irreversible.</p>
                <div className="modal-actions">
                  <button onClick={() => setActiveModal(null)}>ABORT</button>
                  <button className="danger-btn" onClick={executeDestroy}>PURGE ALL</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <aside className={`sidebar ${viewMode === 'LIST' ? 'mobile-full-view' : 'mobile-hide'}`}>
        <header className="sidebar-header">
          <div className="header-brand">
            <span className="brand-title">NULL SIGNAL</span>
            <div className="brand-status"><div className="pulse"></div> ACTIVE HUB</div>
          </div>
          
          <div className="header-actions">
            <div className="user-profile-badge" onClick={() => setActiveModal({ type: 'IDENTITY_CARD' })} title="View Tactical ID">
              <div className="avatar">U</div>
              <span className="user-id-minimal">{myPeerId.substring(0, 8)}</span>
            </div>
            <div className="header-icon" onClick={() => setShowQR(!showQR)} title="Show My QR"><Icons.QR /></div>
            <div className="header-icon" onClick={startScanner} title="Discovery Hub"><Icons.Camera /></div>
          </div>
        </header>

        {showQR && (
          <div className="qr-overlay">
            <div className="qr-container">
              <h3>Tactical Signal Pulse</h3>
              <QRCodeSVG value={myPeerId} size={200} bgColor={"#0f1215"} fgColor={"#00ffbd"} level={"H"} />
              <p>Scan to link node</p>
              <button className="close-btn" onClick={() => setShowQR(false)}>CLOSE</button>
            </div>
          </div>
        )}

        {isScanning && (
          <div className="qr-overlay">
            <div className="qr-container tactical-hub">
              <h3>Signal Discovery Hub</h3>
              
              {scannerType === 'menu' && (
                <div className="hub-options">
                  <button className="hub-btn" onClick={startQR}>
                    <Icons.Camera />
                    <span>Visual Sync (QR)</span>
                  </button>
                  <button className="hub-btn" onClick={startBT}>
                    <Icons.Bluetooth />
                    <span>Signal Sync (Bluetooth)</span>
                  </button>
                </div>
              )}

              {scannerType === 'qr' && (
                <div id="reader" style={{width: '300px'}}></div>
              )}

              {scannerType === 'bt' && (
                <div className="bt-scanning-info">
                  <div className="loader"></div>
                  <p>Searching for nearby signals...</p>
                </div>
              )}

              <button className="close-btn" onClick={() => setIsScanning(false)}>ABORT SCAN</button>
            </div>
          </div>
        )}

        <section className="sidebar-search">
          <div className="search-wrapper">
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search Nodes..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="connect-row">
            <input type="text" className="search-input highlight" placeholder="Manual Peer ID..." value={targetId} onChange={(e) => setTargetId(e.target.value)} />
            <button className="connect-btn" onClick={() => connectToPeer()}>CONN</button>
          </div>
        </section>

        <div className="chat-list">
          <div 
            className={`chat-item ${activeChatId === 'GLOBAL_MESH' ? 'active' : ''}`}
            onClick={() => handleSelectChat('GLOBAL_MESH')}
          >
            <div className="avatar" style={{background: getIdenticonColor('GLOBAL_MESH'), color: '#000'}}>M</div>
            <div className="chat-item-info">
              <div className="chat-item-header">
                <span className="chat-name">{getChatName('GLOBAL_MESH')}</span>
                <div className="chat-item-meta-group">
                   <div className="chat-item-actions">
                     <button className="chat-rename-btn small" onClick={(e) => renameChat(e, 'GLOBAL_MESH')}>
                       <Icons.Edit />
                     </button>
                   </div>
                   <span className="chat-time">{getLastMsgMeta('GLOBAL_MESH')?.time}</span>
                </div>
              </div>
              <div className="chat-preview-row">
                 {getLastMsgMeta('GLOBAL_MESH')?.sender === 'sent' && <Icons.Tick status={getLastMsgMeta('GLOBAL_MESH')?.status} />}
                 <p className="chat-preview">{getLastMsg('GLOBAL_MESH')}</p>
              </div>
            </div>
          </div>
          {contacts
            .filter(c => getChatName(c.peerId).toLowerCase().includes(searchTerm.toLowerCase()))
            .map(c => (
            <div key={c.peerId} className={`chat-item ${activeChatId === c.peerId ? 'active' : ''}`} onClick={() => handleSelectChat(c.peerId)}>
              <div className="avatar" style={{background: getIdenticonColor(c.peerId)}}>{(customNames[c.peerId] || c.name).charAt(0)}</div>
              <div className="chat-item-info">
                <div className="chat-item-header">
                  <span className="chat-name">{getChatName(c.peerId)}</span>
                  <div className="chat-item-meta-group">
                    <div className="chat-item-actions">
                      <button className="chat-rename-btn small" onClick={(e) => renameChat(e, c.peerId)} title="Alias">
                        <Icons.Edit />
                      </button>
                      <button className="chat-rename-btn small danger" onClick={(e) => { e.stopPropagation(); deleteChat(c.peerId); }} title="Purge">
                        <Icons.Trash />
                      </button>
                    </div>
                    <span className="chat-time">{getLastMsgMeta(c.peerId)?.time}</span>
                  </div>
                </div>
                <div className="chat-preview-row">
                   {getLastMsgMeta(c.peerId)?.sender === 'sent' && <Icons.Tick status={getLastMsgMeta(c.peerId)?.status} />}
                   <p className="chat-preview">{getLastMsg(c.peerId)}</p>
                </div>
              </div>
            </div>
          ))}
          {conn && conn.peer !== activeChatId && (
            <div 
              className="chat-item highlight"
              onClick={() => handleSelectChat(conn.peer)}
            >
              <div className="avatar">P</div>
              <div className="chat-item-info">
                <span className="chat-name">INCOMING: {conn.peer.slice(0, 8)}</span>
                <p className="chat-preview">Tap to accept link</p>
              </div>
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <button className="destroy-btn" onClick={confirmDestroy}>
            <Icons.Trash />
            <span>DESTROY SIGNALS</span>
          </button>
        </div>
      </aside>

      <main className={`chat-main ${viewMode === 'CHAT' ? 'mobile-full-view' : 'mobile-hide'}`}>
        <header className="chat-header">
          {viewMode === 'CHAT' && (
            <button className="back-button" onClick={() => setViewMode('LIST')}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
          )}
          <div className="header-info">
            <div className="header-name-row">
              <h3>{getChatName(activeChatId)}</h3>
              <button className="chat-rename-btn" onClick={(e) => renameChat(e, activeChatId)} title="Set Alias">
                <Icons.Edit />
              </button>
            </div>
            <div className={`status-indicator ${peerTyping ? 'typing' : 'online'}`}>
               {peerTyping ? 'TARGET IS TYPING...' : 'SIGNAL STRENGTH: OPTIMAL'}
            </div>
          </div>
        </header>

        <div className="chat-messages">
          <div className="e2ee-banner">
            <Icons.Lock /> 
            <span>Signals are <b>end-to-end encrypted</b>. No node outside this frequency can decrypt.</span>
          </div>
          {(messages[activeChatId] || []).length === 0 ? (
            <div className="empty-mesh">
              <div className="radar-circle"></div>
              <h3>Waiting for Signal Pulse...</h3>
              <p>Secure Handshake Active: Send your first tactical signal to begin.</p>
            </div>
          ) : (
            (() => {
              const grouped = [];
              let lastDateStr = "";
              (messages[activeChatId] || []).forEach(msg => {
                const dateObj = new Date(msg.timestamp || Date.now());
                const dateStr = dateObj.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
                const todayStr = new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
                const label = dateStr === todayStr ? "TODAY" : dateStr;
                
                if (dateStr !== lastDateStr) {
                  grouped.push({ idIdx: `date-${dateStr}`, isDateDivider: true, label });
                  lastDateStr = dateStr;
                }
                grouped.push(msg);
              });

              return grouped.map((item, idx) => {
                if (item.isDateDivider) {
                  return (
                    <div key={item.idIdx} className="date-divider">
                      <span>{item.label}</span>
                    </div>
                  );
                }
                const msg = item;
                return (
                  <div key={msg.id} className={`message-wrapper message-${msg.sender}`}>
                    <div className="message-bubble">
                      <div className="message-actions-overlay">
                        <button onClick={(e) => { e.stopPropagation(); copyMessage(msg.text); }} title="Copy Signal"><Icons.Copy /></button>
                        <button onClick={(e) => { e.stopPropagation(); forwardSignal(msg); }} title="Relay Signal"><Icons.Forward /></button>
                        <button onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }} title="Purge Signal"><Icons.Trash /></button>
                      </div>
                      
                      {msg.type === 'image' ? (
                        <div className="media-preview image" onClick={() => setActiveModal({ type: 'IMAGE_VIEW', data: msg.content })}>
                          <img src={msg.content} alt="Visual Signal" />
                        </div>
                      ) : msg.type === 'audio' ? (
                        <VoicePlayer src={msg.content} isSent={msg.sender === 'sent'} />
                      ) : (
                        <div className="text-content">
                          {msg.isForwarded && <div className="forward-indicator"><Icons.Forward /> RELAYED SIGNAL</div>}
                          <span>{msg.text}</span>
                        </div>
                      )}
                      
                      <div className="message-meta">
                        <span>{msg.time}</span>
                        {msg.sender === 'sent' && <Icons.Tick status={msg.status} />}
                      </div>
                    </div>
                  </div>
                );
              });
            })()
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-area" onSubmit={handleSendMessage}>
          <div className="input-actions">
            {showEmojiPicker && (
              <div className="emoji-picker-container">
                <EmojiPicker 
                  theme="dark"
                  onEmojiClick={(emojiData) => {
                    setInputText(prev => prev + emojiData.emoji);
                    setShowEmojiPicker(false);
                  }}
                  width="100%"
                  height={400}
                  skinTonesDisabled
                  searchPlaceholder="Search Node Emojis..."
                />
              </div>
            )}
            <button type="button" className="icon-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}><Icons.Emoji /></button>
            <button type="button" className="icon-btn" onClick={() => fileInputRef.current.click()}><Icons.Attach /></button>
            <input type="file" ref={fileInputRef} style={{display: 'none'}} onChange={handleFileUpload} accept="image/*,audio/*" />
          </div>
          <input 
            type="text" 
            placeholder={isRecording ? `REC: ${formatTime(recordingTime)} Signal Active...` : "TRANSMIT SIGNAL..."}
            className={`message-input ${isRecording ? 'recording-active' : ''}`}
            value={inputText} 
            onChange={handleInputChange} 
            disabled={isRecording}
          />
          {inputText.trim() ? (
            <button type="submit" className="send-btn"><Icons.Send /></button>
          ) : (
            <button 
              type="button" 
              className={`send-btn ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
            >
              {isRecording ? <Icons.Stop /> : <Icons.Mic />}
            </button>
          )}
        </form>
      </main>
    </div>
  );
}

export default App;
