import { rtdb } from '../../services/firebase';
import { ref, push, onChildAdded, serverTimestamp, get, set, child, update, off } from 'firebase/database';

export const gameDb = rtdb;
export { ref, push, onChildAdded, serverTimestamp, get, set, child, update, off };
