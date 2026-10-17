import React, { useState, useEffect } from 'react';
import useStore from '../store';
import BottomSheet from './BottomSheet';

export default function MemberInfoPanel({ memberId, onClose }) {
  const members = useStore(state => state.members);
  const unions = useStore(state => state.unions);
  const updateMember = useStore(state => state.updateMember);
  const softDeleteMember = useStore(state => state.softDeleteMember);
  const addSpouse = useStore(state => state.addSpouse);
  const addChild = useStore(state => state.addChild);
  const addParents = useStore(state => state.addParents); // <-- NEW
  
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const member = members.find(m => m.id === memberId);
    if (member) setFormData(member);
  }, [memberId, members]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await updateMember(memberId, formData);
    onClose();
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to remove this member?")) {
      await softDeleteMember(memberId);
      onClose();
    }
  };

  const handleAddSpouse = () => {
    addSpouse(memberId, formData.gender);
    onClose();
  };

  const handleAddChild = () => {
    addChild(memberId);
    onClose();
  };

  const handleAddParents = () => {
    addParents(memberId);
    onClose();
  };

  const hasSpouse = unions.some(u => u.partner_a_id === memberId || u.partner_b_id === memberId);
  const hasParents = !!formData.parent_union_id; // Check if already has parents

  return (
    <BottomSheet isOpen={!!memberId} onClose={onClose} title="Member Profile">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        
        {/* Quick Actions (Relationships) */}
        <div className="flex flex-wrap gap-2 pb-2">
          {!hasParents && (
            <button type="button" onClick={handleAddParents} className="flex-1 rounded-lg bg-orange-50 py-2 px-1 text-sm font-semibold text-orange-700 hover:bg-orange-100">
              + Add Parents
            </button>
          )}
          {!hasSpouse && (
            <button type="button" onClick={handleAddSpouse} className="flex-1 rounded-lg bg-green-50 py-2 px-1 text-sm font-semibold text-green-700 hover:bg-green-100">
              + Add Spouse
            </button>
          )}
          <button type="button" onClick={handleAddChild} className="flex-1 rounded-lg bg-purple-50 py-2 px-1 text-sm font-semibold text-purple-700 hover:bg-purple-100">
            + Add Child
          </button>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">First Name</label>
          <input type="text" name="first_name" value={formData.first_name || ''} onChange={handleChange} className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-blue-500" required />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Gender</label>
            <select name="gender" value={formData.gender || ''} onChange={handleChange} className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-blue-500">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Birth Date</label>
            <input type="date" name="birth_date" value={formData.birth_date || ''} onChange={handleChange} className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-blue-500" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Profession</label>
          <input type="text" name="profession" value={formData.profession || ''} onChange={handleChange} className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-blue-500" />
        </div>

        <div className="mt-2 flex gap-3 border-t border-gray-100 pt-4">
          <button type="button" onClick={handleDelete} className="w-1/3 rounded-xl bg-red-50 py-3 px-4 font-semibold text-red-600 hover:bg-red-100">
            Delete
          </button>
          <button type="submit" className="w-2/3 rounded-xl bg-blue-600 py-3 px-4 font-semibold text-white hover:bg-blue-700">
            Save Changes
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}