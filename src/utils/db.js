const DB_NAME = 'NullSignalDB';
const DB_VERSION = 3; // Incremented for chatId index
const STORE_NAME = 'messages';
const CONFIG_STORE = 'config';

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const transaction = event.target.transaction;
      
      let messageStore;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        messageStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      } else {
        messageStore = transaction.objectStore(STORE_NAME);
      }

      if (!messageStore.indexNames.contains('chatId')) {
        messageStore.createIndex('chatId', 'chatId', { unique: false });
      }

      if (!db.objectStoreNames.contains(CONFIG_STORE)) {
        db.createObjectStore(CONFIG_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getConfig = async (key) => {
  const db = await initDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(CONFIG_STORE, 'readonly');
    const store = transaction.objectStore(CONFIG_STORE);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
  });
};

export const setConfig = async (key, value) => {
  const db = await initDB();
  const transaction = db.transaction(CONFIG_STORE, 'readwrite');
  transaction.objectStore(CONFIG_STORE).put(value, key);
};

export const saveMessage = async (msg, chatId) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put({ ...msg, chatId });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const updateMessageStatus = async (msgId, status) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(msgId);
    
    getRequest.onsuccess = () => {
      const msg = getRequest.result;
      if (msg) {
        msg.status = status;
        store.put(msg);
      }
    };
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getChatMessages = async (chatId) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('chatId');
    const request = index.getAll(chatId);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const clearAllLogs = async () => {
  const db = await initDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  store.clear();
};

export const deleteMessageFromDB = async (id) => {
  const db = await initDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  transaction.objectStore(STORE_NAME).delete(id);
};

export const deleteChatFromDB = async (chatId) => {
  const db = await initDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const index = store.index('chatId');
  const cursorRequest = index.openCursor(IDBKeyRange.only(chatId));

  cursorRequest.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      cursor.delete();
      cursor.continue();
    }
  };
};

export const getRecentChats = async () => {
  const db = await initDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('chatId');
    const request = index.openCursor(null, 'nextunique');
    const chatIds = [];
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        if (cursor.key !== 'GLOBAL_MESH') {
          chatIds.push(cursor.key);
        }
        cursor.continue();
      } else {
        resolve(chatIds);
      }
    };
  });
};
