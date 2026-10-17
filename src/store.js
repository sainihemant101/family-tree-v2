import { create } from 'zustand';
import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';

const useStore = create((set, get) => ({
  members: [],
  unions: [],
  loading: true,

  initSync: () => {
    const unsubMembers = onSnapshot(collection(db, 'members'), (snapshot) => {
      const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      set({ members: membersData });
    });

    const unsubUnions = onSnapshot(collection(db, 'unions'), (snapshot) => {
      const unionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      set({ unions: unionsData, loading: false });
    });

    return () => {
      unsubMembers();
      unsubUnions();
    };
  },

  addMember: async (memberData) => {
    const id = crypto.randomUUID();
    const newMember = { id, ...memberData, isDeleted: false };
    set((state) => ({ members: [...state.members, newMember] }));
    await setDoc(doc(db, 'members', id), newMember);
  },

  updateMember: async (id, updatedData) => {
    set((state) => ({
      members: state.members.map(m => m.id === id ? { ...m, ...updatedData } : m)
    }));
    await updateDoc(doc(db, 'members', id), updatedData);
  },

  softDeleteMember: async (id) => {
    set((state) => ({
      members: state.members.map(m => m.id === id ? { ...m, isDeleted: true } : m)
    }));
    await updateDoc(doc(db, 'members', id), { isDeleted: true });
  },

  // NEW: Relationship Logic
  addSpouse: async (currentMemberId, currentMemberGender) => {
    const spouseId = crypto.randomUUID();
    const unionId = crypto.randomUUID();
    
    // Default to opposite gender
    const spouseGender = currentMemberGender === 'male' ? 'female' : 'male';
    const newSpouse = { id: spouseId, first_name: 'Spouse', gender: spouseGender, isDeleted: false };
    
    // Create the edge
    const newUnion = { id: unionId, partner_a_id: currentMemberId, partner_b_id: spouseId, children_ids: [] };

    // Optimistic UI update
    set((state) => ({
      members: [...state.members, newSpouse],
      unions: [...state.unions, newUnion]
    }));

    // Background Sync
    await setDoc(doc(db, 'members', spouseId), newSpouse);
    await setDoc(doc(db, 'unions', unionId), newUnion);
  },

  addChild: async (currentMemberId) => {
    const childId = crypto.randomUUID();
    const newChild = { id: childId, first_name: 'Child', gender: 'male', isDeleted: false };

    const state = get();
    // Check if the current member is already part of a union (marriage)
    let union = state.unions.find(u => u.partner_a_id === currentMemberId || u.partner_b_id === currentMemberId);
    let isNewUnion = false;

    if (!union) {
      // Create a single-parent union if they have no spouse yet
      union = { id: crypto.randomUUID(), partner_a_id: currentMemberId, partner_b_id: null, children_ids: [] };
      isNewUnion = true;
    }

    const updatedChildren = [...(union.children_ids || []), childId];
    const updatedUnion = { ...union, children_ids: updatedChildren };
    newChild.parent_union_id = updatedUnion.id;

    // Optimistic UI update
    set((state) => ({
      members: [...state.members, newChild],
      unions: isNewUnion 
        ? [...state.unions, updatedUnion]
        : state.unions.map(u => u.id === updatedUnion.id ? updatedUnion : u)
    }));

    // Background Sync
    await setDoc(doc(db, 'members', childId), newChild);
    if (isNewUnion) {
      await setDoc(doc(db, 'unions', updatedUnion.id), updatedUnion);
    } else {
      await updateDoc(doc(db, 'unions', updatedUnion.id), { children_ids: updatedChildren });
    }
  },



  // NEW: Add Parents Logic
  addParents: async (childId) => {
    const fatherId = crypto.randomUUID();
    const motherId = crypto.randomUUID();
    const unionId = crypto.randomUUID();

    const newFather = { id: fatherId, first_name: 'Father', gender: 'male', isDeleted: false };
    const newMother = { id: motherId, first_name: 'Mother', gender: 'female', isDeleted: false };
    
    // Create the union and immediately assign the current member as their child
    const newUnion = { id: unionId, partner_a_id: fatherId, partner_b_id: motherId, children_ids: [childId] };

    // Optimistic UI Update
    set((state) => ({
      members: state.members
        .map(m => m.id === childId ? { ...m, parent_union_id: unionId } : m)
        .concat([newFather, newMother]),
      unions: [...state.unions, newUnion]
    }));

    // Background Sync to Firebase
    await setDoc(doc(db, 'members', fatherId), newFather);
    await setDoc(doc(db, 'members', motherId), newMother);
    await setDoc(doc(db, 'unions', unionId), newUnion);
    await updateDoc(doc(db, 'members', childId), { parent_union_id: unionId });
  }

  }));

export default useStore;