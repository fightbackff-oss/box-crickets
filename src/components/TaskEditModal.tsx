import React, { useState } from 'react';
import { Task, Subtask } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, Tag, AlignLeft, CheckCircle2, ChevronRight, Check } from 'lucide-react';

const CATEGORIES = [
  { id: 'Business', label: 'Business', icon: '💼' },
  { id: 'Study', label: 'Study', icon: '📚' },
  { id: 'Personal', label: 'Personal', icon: '🏠' },
  { id: 'Finance', label: 'Finance', icon: '💰' },
  { id: 'Health', label: 'Health', icon: '🏋️' }
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

interface TaskEditModalProps {
  task: Task;
  onSave: (t: Task) => void;
  onClose: () => void;
}

export function TaskEditModal({ task, onSave, onClose }: TaskEditModalProps) {
  const [editedTask, setEditedTask] = useState<Task>({ ...task });
  const [newSubtask, setNewSubtask] = useState('');

  const handleChange = (field: keyof Task, val: any) => {
    setEditedTask(prev => ({ ...prev, [field]: val }));
  };

  const handleAddSubtask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSubtask.trim()) {
      const st: Subtask = {
        id: Math.random().toString(),
        title: newSubtask.trim(),
        completed: false
      };
      setEditedTask(prev => ({ ...prev, subtasks: [...(prev.subtasks || []), st] }));
      setNewSubtask('');
    }
  };

  const toggleSubtask = (id: string) => {
    setEditedTask(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s)
    }));
  };

  const removeSubtask = (id: string) => {
    setEditedTask(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(s => s.id !== id)
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#F6F8F4]/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center py-10" onClick={(e) => e.stopPropagation()}>
        <motion.div 
          initial={{ y: 20, scale: 0.95, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 20, scale: 0.95, opacity: 0 }}
          className="w-full max-w-md bg-white rounded-[32px] p-6 shadow-xl border border-[#E8EEE5]"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[20px] font-extrabold text-[var(--color-primary)]">Edit Task</h3>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-[#F6F8F4] flex items-center justify-center text-[#8BA090] hover:bg-[#E8EEE5]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-[12px] font-bold text-[#8BA090] uppercase tracking-wider mb-2 block">Title</label>
              <input 
                type="text" 
                value={editedTask.title}
                onChange={e => handleChange('title', e.target.value)}
                className="w-full h-[52px] px-5 bg-[#F6F8F4] border border-[#E8EEE5] rounded-[16px] focus:outline-none focus:border-[#8BA090] text-[15px] font-bold text-[var(--color-primary)] placeholder-[#8BA090] transition-colors"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[12px] font-bold text-[#8BA090] uppercase tracking-wider mb-2 block">Priority</label>
                <div className="flex flex-wrap gap-2">
                   {PRIORITIES.map(p => (
                     <button
                       key={p}
                       onClick={() => handleChange('priority', p)}
                       className={`px-3 py-1.5 rounded-[12px] text-[12px] font-bold transition-all ${
                         editedTask.priority === p ? 'bg-[var(--color-primary)] text-white' : 'bg-[#F6F8F4] text-[#8BA090]'
                       }`}
                     >
                       {p}
                     </button>
                   ))}
                </div>
              </div>
            </div>

            <div>
               <label className="text-[12px] font-bold text-[#8BA090] uppercase tracking-wider mb-2 block">Category</label>
               <div className="flex flex-wrap gap-2">
                 {CATEGORIES.map(c => (
                   <button
                     key={c.id}
                     onClick={() => handleChange('category', c.id)}
                     className={`px-3 py-1.5 flex items-center gap-1.5 rounded-[12px] text-[12px] font-bold transition-all ${
                       editedTask.category === c.id ? 'bg-[var(--color-primary)] text-white' : 'bg-[#F6F8F4] text-[#8BA090]'
                     }`}
                   >
                     {c.icon} {c.label}
                   </button>
                 ))}
                 {editedTask.category && !CATEGORIES.find(c => c.id === editedTask.category) && (
                   <button
                     className="px-3 py-1.5 rounded-[12px] bg-[var(--color-primary)] text-white text-[12px] font-bold"
                   >
                     {editedTask.category}
                   </button>
                 )}
                 <button 
                   onClick={() => {
                     const cat = window.prompt("Enter new category name:");
                     if (cat && cat.trim()) handleChange('category', cat.trim());
                   }}
                   className="px-3 py-1.5 rounded-[12px] bg-[#F6F8F4] text-[#8BA090] text-[12px] font-bold hover:bg-[#E8EEE5]"
                 >
                   + Custom
                 </button>
               </div>
            </div>

            <div className="flex gap-3">
               <div className="flex-1">
                  <label className="text-[12px] font-bold text-[#8BA090] uppercase tracking-wider mb-2 block">Due Date</label>
                  <label className="flex items-center h-[52px] px-4 bg-[#F6F8F4] border border-[#E8EEE5] rounded-[16px] cursor-pointer">
                    <Calendar className="w-4 h-4 text-[#8BA090] flex-shrink-0 mr-2" />
                    <input 
                      type="date" 
                      value={editedTask.due_date || ''}
                      onChange={e => handleChange('due_date', e.target.value)}
                      className="bg-transparent focus:outline-none text-[14px] font-bold text-[var(--color-primary)] flex-1 min-w-0"
                    />
                  </label>
               </div>
               <div className="flex-1">
                  <label className="text-[12px] font-bold text-[#8BA090] uppercase tracking-wider mb-2 block">Due Time</label>
                  <label className="flex items-center h-[52px] px-4 bg-[#F6F8F4] border border-[#E8EEE5] rounded-[16px] cursor-pointer">
                    <Clock className="w-4 h-4 text-[#8BA090] flex-shrink-0 mr-2" />
                    <input 
                      type="time" 
                      value={editedTask.due_time || ''}
                      onChange={e => handleChange('due_time', e.target.value)}
                      className="bg-transparent focus:outline-none text-[14px] font-bold text-[var(--color-primary)] flex-1 min-w-0"
                    />
                  </label>
               </div>
            </div>

            <div>
              <label className="text-[12px] font-bold text-[#8BA090] uppercase tracking-wider mb-2 block">Reminder</label>
              <div className="flex flex-wrap gap-2">
                {['None', '5 min before', '15 min before', '1 hour before', '1 day before'].map(r => (
                  <button
                    key={r}
                    onClick={() => handleChange('reminder', r)}
                    className={`px-3 py-1.5 rounded-[12px] text-[12px] font-bold transition-all ${
                      editedTask.reminder === r || (!editedTask.reminder && r === 'None') 
                        ? 'bg-[var(--color-primary)] text-white' 
                        : 'bg-[#F6F8F4] text-[#8BA090]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[12px] font-bold text-[#8BA090] uppercase tracking-wider mb-2 block flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Subtasks
              </label>
              <div className="space-y-2 mb-3">
                {editedTask.subtasks?.map(st => (
                   <div key={st.id} className="flex items-center gap-3 bg-[#F6F8F4] p-3 rounded-[12px]">
                     <button onClick={() => toggleSubtask(st.id)} className={`w-5 h-5 rounded-[6px] border flex items-center justify-center shrink-0 ${st.completed ? 'bg-[var(--color-success)] border-[var(--color-success)] text-white' : 'border-[#8BA090] text-transparent'}`}>
                       <Check className="w-3 h-3" />
                     </button>
                     <span className={`text-[14px] font-medium flex-1 ${st.completed ? 'line-through text-[#8BA090]' : 'text-[var(--color-primary)]'}`}>{st.title}</span>
                     <button onClick={() => removeSubtask(st.id)} className="text-[#8BA090] hover:text-red-500 shrink-0">
                       <X className="w-4 h-4" />
                     </button>
                   </div>
                ))}
              </div>
              <input 
                type="text" 
                placeholder="+ Add subtask and press enter"
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                onKeyDown={handleAddSubtask}
                className="w-full p-3 bg-transparent border-b border-[#E8EEE5] focus:outline-none focus:border-[#8BA090] text-[14px] font-medium text-[var(--color-primary)] placeholder-[#8BA090]"
              />
            </div>

            <div>
              <label className="text-[12px] font-bold text-[#8BA090] uppercase tracking-wider mb-2 block flex items-center gap-2">
                <AlignLeft className="w-4 h-4" /> Description / Notes
              </label>
              <textarea 
                value={editedTask.description || ''}
                onChange={e => handleChange('description', e.target.value)}
                className="w-full h-24 p-5 bg-[#F6F8F4] border border-[#E8EEE5] rounded-[16px] focus:outline-none focus:border-[#8BA090] text-[14px] font-medium text-[var(--color-primary)] placeholder-[#8BA090] resize-none"
                placeholder="Add more details..."
              />
            </div>
          </div>

          <div className="mt-8">
            <button 
              onClick={() => onSave(editedTask)}
              className="w-full h-[52px] bg-[var(--color-primary)] text-white font-bold rounded-[16px] text-[15px] shadow-sm active:scale-[0.98] transition-transform"
            >
              Save Changes
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
