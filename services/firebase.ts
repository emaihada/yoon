import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc,
  updateDoc,
  where,
  increment,
  writeBatch,
  getDocs,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { GuestbookEntry, ContentItem, Comment, RoomItem, BackgroundConfig } from '../types';

// 1. 파이어베이스 설정 (진짜 키 적용됨)
const firebaseConfig = {
  apiKey: "AIzaSyAIhldYrJQlT0ME1uWXoozADdHN72dmlO8",
  authDomain: "yoon-2007.firebaseapp.com",
  databaseURL: "https://yoon-2007-default-rtdb.firebaseio.com",
  projectId: "yoon-2007",
  storageBucket: "yoon-2007.firebasestorage.app",
  messagingSenderId: "101769158544",
  appId: "1:101769158544:web:1f49aa66afd430302b9d15",
  measurementId: "G-1F2JXYV214"
};

// 2. 파이어베이스 시작
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);

// --- 에러 핸들링 기능 ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- 웹사이트 기능 ---

// 관리자 로그인 기능 (이메일/비밀번호)
export const loginAdmin = async (email: string, pass: string) => {
  return await signInWithEmailAndPassword(auth, email, pass);
};

// 구글 로그인 기능
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

// 로그아웃 기능
export const logoutAdmin = async () => {
  return signOut(auth);
};

// 비밀번호 재설정 기능
export const resetAdminPassword = async (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

// 로그인 상태 감시
export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// --- 방문자 수 기능 ---
export const incrementVisitorCount = async () => {
  const statsRef = doc(db, 'stats', 'general');
  try {
    await setDoc(statsRef, {
      totalVisitors: increment(1)
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'stats/general');
  }
};

export const getVisitorCount = async (): Promise<number> => {
  const statsRef = doc(db, 'stats', 'general');
  try {
    const snap = await getDoc(statsRef);
    if (snap.exists()) {
      return snap.data().totalVisitors || 0;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'stats/general');
  }
  return 0;
};

// --- 방명록 관련 기능 ---
export const addGuestbookEntry = async (name: string, content: string) => {
  try {
    await addDoc(collection(db, 'guestbook'), {
      name,
      content,
      createdAt: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'guestbook');
  }
};

export const deleteGuestbookEntry = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'guestbook', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `guestbook/${id}`);
  }
};

export const subscribeToGuestbook = (callback: (entries: GuestbookEntry[]) => void) => {
  const q = query(collection(db, 'guestbook'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as GuestbookEntry));
    callback(entries);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'guestbook');
  });
};

// --- 블로그/메모 관련 기능 ---
export const addContentItem = async (item: Omit<ContentItem, 'id'>) => {
  try {
    await addDoc(collection(db, 'contents'), { ...item, views: 0, likeCount: 0, commentCount: 0 });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'contents');
  }
};

export const updateContentItem = async (id: string, data: Partial<ContentItem>) => {
  try {
    const docRef = doc(db, 'contents', id);
    await updateDoc(docRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `contents/${id}`);
  }
};

export const incrementPostViews = async (id: string) => {
  try {
    const docRef = doc(db, 'contents', id);
    await updateDoc(docRef, {
      views: increment(1)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `contents/${id}`);
  }
};

export const incrementPostLikes = async (id: string) => {
  try {
    const docRef = doc(db, 'contents', id);
    await updateDoc(docRef, {
      likeCount: increment(1)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `contents/${id}`);
  }
};

export const decrementPostLikes = async (id: string) => {
  try {
    const docRef = doc(db, 'contents', id);
    await updateDoc(docRef, {
      likeCount: increment(-1)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `contents/${id}`);
  }
};

export const deleteContentItem = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'contents', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `contents/${id}`);
  }
};

export const getContentItem = async (id: string): Promise<ContentItem | null> => {
  try {
    const docRef = doc(db, 'contents', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ContentItem;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `contents/${id}`);
    return null;
  }
};

export const toggleContentPin = async (id: string, category: string, currentStatus: boolean) => {
  try {
    const batch = writeBatch(db);
    if (currentStatus) {
      const docRef = doc(db, 'contents', id);
      batch.update(docRef, { isPinned: false });
    } else {
      const q = query(
        collection(db, 'contents'), 
        where('category', '==', category),
        where('isPinned', '==', true)
      );
      const snapshot = await getDocs(q);
      snapshot.forEach((doc) => {
        batch.update(doc.ref, { isPinned: false });
      });
      const docRef = doc(db, 'contents', id);
      batch.update(docRef, { isPinned: true });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'contents');
  }
};

export const subscribeToContent = (category: string, callback: (items: ContentItem[]) => void) => {
  const q = query(collection(db, 'contents'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    let items = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as ContentItem))
      .filter(item => item.category === category);
    items.sort((a, b) => {
      if (!!a.isPinned === !!b.isPinned) {
        return b.createdAt - a.createdAt;
      }
      return a.isPinned ? -1 : 1;
    });
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'contents');
  });
};

// --- 댓글(Comments) 관련 기능 ---
export const addComment = async (postId: string, name: string, content: string) => {
  try {
    const batch = writeBatch(db);
    const commentRef = doc(collection(db, 'comments'));
    batch.set(commentRef, {
      postId,
      name,
      content,
      createdAt: Date.now()
    });
    const postRef = doc(db, 'contents', postId);
    batch.update(postRef, { commentCount: increment(1) });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'comments');
  }
};

export const deleteComment = async (id: string, postId: string) => {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'comments', id));
    const postRef = doc(db, 'contents', postId);
    batch.update(postRef, { commentCount: increment(-1) });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'comments');
  }
};

export const subscribeToComments = (postId: string, callback: (comments: Comment[]) => void) => {
  const q = query(
    collection(db, 'comments'), 
    where('postId', '==', postId)
  );
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Comment));
    comments.sort((a, b) => a.createdAt - b.createdAt);
    callback(comments);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'comments');
  });
};

// --- 미니룸 관련 기능 ---
export const saveMiniroom = async (items: RoomItem[], bgConfig: BackgroundConfig) => {
  try {
    const docRef = doc(db, 'miniroom', 'layout');
    await setDoc(docRef, { items, bgConfig, updatedAt: Date.now() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'miniroom/layout');
  }
};

export const subscribeToMiniroom = (callback: (data: { items: RoomItem[], bgConfig: BackgroundConfig } | null) => void) => {
  const docRef = doc(db, 'miniroom', 'layout');
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as { items: RoomItem[], bgConfig: BackgroundConfig });
    } else {
      callback(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'miniroom/layout');
  });
};