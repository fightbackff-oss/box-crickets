import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Check, Clock, Trash2, Search, Filter, AlertCircle, Calendar, Edit2, ListTodo, ChevronRight, X } from 'lucide-react';
import { Task, Subtask } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { TaskEditModal } from '../components/TaskEditModal';

const CATEGORIES = [
  { id: 'Business', label: 'Business', icon: '💼' },
  { id: 'Study', label: 'Study', icon: '📚' },
  { id: 'Personal', label: 'Personal', icon: '🏠' },
  { id: 'Finance', label: 'Finance', icon: '💰' },
  { id: 'Health', label: 'Health', icon: '🏋️' }
];

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Quick Add
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // Edit & Advanced Add
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'Priority' | 'Due Date' | 'Recent' | 'Alphabetical'>('Recent');
  const [searchQuery, setSearchQuery] = useState('');

  // UI state
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      const deviceId = localStorage.getItem('timezy_device_id');
      if (!deviceId) return;

      const cached = localStorage.getItem('timezy_tasks_cache');
      if (cached) setTasks(JSON.parse(cached));
      
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
         setIsLoading(false);
         return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', deviceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        // Merge fetched data with local fields if they don't exist in DB
        const merged = data.map(serverTask => {
          const cachedTask = cached ? JSON.parse(cached).find((t: Task) => t.id === serverTask.id) : null;
          return {
            ...serverTask,
            subtasks: cachedTask?.subtasks || [],
            category: serverTask.category || cachedTask?.category || null,
            priority: serverTask.priority || cachedTask?.priority || 'Medium',
          };
        });
        setTasks(merged);
        localStorage.setItem('timezy_tasks_cache', JSON.stringify(merged));
      }
    } catch (err) {
      console.error(err);
      if (!navigator.onLine) {
         toast.info('Loaded tasks from offline cache');
      }
    } finally {
      setIsLoading(false);
    }
  }

  function triggerSuccess() {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#5B8C5A', '#A3C4A5', '#F6F8F4', '#4A6B50'],
      disableForReducedMotion: true
    });
  }

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const deviceId = localStorage.getItem('timezy_device_id');
      if (!deviceId) return;

      const newTask = {
        title: newTaskTitle,
        user_id: deviceId,
        status: 'Todo',
        priority: 'Medium',
      };

      const { data, error } = await supabase.from('tasks').insert([newTask]).select();

      if (error) throw error;
      if (data) {
        const fullTask = { ...data[0], subtasks: [] };
        const updatedTasks = [fullTask, ...tasks];
        setTasks(updatedTasks);
        localStorage.setItem('timezy_tasks_cache', JSON.stringify(updatedTasks));
        toast.success('Task Created');
      }
      setIsAdding(false);
      setNewTaskTitle('');
    } catch (err) {
      const fallbackTask = { id: Math.random().toString(), title: newTaskTitle, status: 'Todo', priority: 'Medium', user_id: '1', subtasks: [], created_at: new Date().toISOString() } as any;
      const updatedTasks = [fallbackTask, ...tasks];
      setTasks(updatedTasks);
      localStorage.setItem('timezy_tasks_cache', JSON.stringify(updatedTasks));
      toast.success('Task Created Locally');
      setIsAdding(false);
      setNewTaskTitle('');
    }
  }

  async function handleSaveTask(taskToSave: Task) {
    try {
      // Don't send subtasks to supabase to avoid schema errors
      const { subtasks, ...dbData } = taskToSave;
      
      if (taskToSave.id.includes('.')) {
        // Was created locally, id is a float string from Math.random()
        throw new Error('Local task');
      }
      
      const { error } = await supabase.from('tasks').update(dbData).eq('id', taskToSave.id);
      if (error) throw error;
      
      updateTaskLocal(taskToSave.id, taskToSave);
      toast.success('Task Updated');
    } catch (err) {
      updateTaskLocal(taskToSave.id, taskToSave);
      toast.success('Task Updated Locally');
    }
    setEditingTask(null);
  }

  async function toggleStatus(task: Task) {
    const newStatus = task.status === 'Completed' ? 'Todo' : 'Completed';
    try {
      if (newStatus === 'Completed') triggerSuccess();
      if (!task.id.includes('.')) {
        await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
      }
      updateTaskLocal(task.id, { status: newStatus });
      toast.success(newStatus === 'Completed' ? 'Task Completed' : 'Task Reopened');
    } catch (err) {
      updateTaskLocal(task.id, { status: newStatus });
      toast.success('Status updated locally');
    }
  }

  function updateTaskLocal(id: string, updates: Partial<Task>) {
    const updatedCallback = (prev: Task[]) => {
      const result = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      localStorage.setItem('timezy_tasks_cache', JSON.stringify(result));
      return result;
    };
    setTasks(updatedCallback);
  }

  async function deleteTask(id: string) {
    try {
      if (!id.includes('.')) {
        await supabase.from('tasks').delete().eq('id', id);
      }
      removeTaskLocal(id);
      toast.success('Task Deleted');
    } catch (err) {
      removeTaskLocal(id);
      toast.success('Task Deleted Locally');
    }
  }

  function removeTaskLocal(id: string) {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    localStorage.setItem('timezy_tasks_cache', JSON.stringify(updated));
  }

  const getPriorityColor = (priority: string = 'Medium') => {
    switch (priority) {
      case 'Urgent': return 'bg-red-100 text-red-700';
      case 'High': return 'bg-orange-100 text-orange-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Low': return 'bg-[#F2F7F2] text-[#5B8C5A]';
      default: return 'bg-[#E5F5F7] text-[#4A868C]';
    }
  };
  
  const getCategoryIcon = (catName: string) => {
    const cat = CATEGORIES.find(c => c.id === catName);
    return cat ? cat.icon : '📌';
  };

  const isTaskOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'Completed') return false;
    const due = new Date(task.due_date);
    due.setHours(23, 59, 59, 999);
    return due < new Date();
  };

  const isTaskToday = (task: Task) => {
    if (!task.due_date) return false;
    const due = new Date(task.due_date).toDateString();
    return due === new Date().toDateString();
  };

  const [customCategories, setCustomCategories] = useState<string[]>([]);
  useEffect(() => {
    const custom = Array.from(new Set(tasks.map(t => t.category).filter(c => c && !CATEGORIES.find(cat => cat.id === c)))) as string[];
    setCustomCategories(custom);
  }, [tasks]);

  const renderTaskCard = (task: Task) => {
    const stCount = task.subtasks?.length || 0;
    const stComp = task.subtasks?.filter(s => s.completed).length || 0;
    const isOverdue = isTaskOverdue(task);

    return (
      <motion.div 
        key={task.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative overflow-hidden rounded-[20px] bg-red-500 shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
      >
        <div className="absolute right-0 inset-y-0 w-24 bg-red-500 flex items-center justify-end pr-6">
          <Trash2 className="w-5 h-5 text-white" />
        </div>
        <div className="absolute left-0 inset-y-0 w-24 bg-[var(--color-success)] flex items-center justify-start pl-6">
          <Check className="w-5 h-5 text-white" />
        </div>
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.5}
          onDragEnd={(e, info) => {
            if (info.offset.x < -80) {
              deleteTask(task.id);
            } else if (info.offset.x > 80) {
              toggleStatus(task);
            }
          }}
          whileTap={{ scale: 0.99 }}
          className="relative bg-white p-4 rounded-[20px] border border-[#E8EEE5] flex items-center gap-4 z-10 touch-pan-y shadow-sm"
        >
          <motion.button 
            whileTap={{ scale: 0.8 }}
            onClick={(e) => { e.stopPropagation(); toggleStatus(task); }}
            className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
              task.status === 'Completed' ? 'bg-[var(--color-success)] border-[var(--color-success)] text-white' : 'border-[#DCE8D7] bg-[#F6F8F4] text-transparent hover:border-[#8BA090]'
            }`}
          >
            <Check className="w-4 h-4" strokeWidth={3} />
          </motion.button>
          
          <div className="flex-1 min-w-0" onClick={() => setEditingTask(task)}>
            <div className="flex items-start justify-between gap-2">
              <p className={`text-[16px] font-bold truncate ${task.status === 'Completed' ? 'line-through text-[#8BA090]' : 'text-[var(--color-primary)]'}`}>
                {task.title}
              </p>
              {task.category && (
                <span className="text-[16px]" title={task.category}>{getCategoryIcon(task.category)}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-extrabold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                {task.priority || 'Medium'}
              </span>
              {task.due_date && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-[6px] flex items-center gap-1 ${
                  isOverdue && task.status !== 'Completed' ? 'bg-red-50 text-red-600' : 'bg-[#F6F8F4] text-[#8BA090]'
                }`}>
                  <Clock className="w-3 h-3" />
                  {new Date(task.due_date).toLocaleDateString()}
                  {task.due_time && ` ${task.due_time}`}
                </span>
              )}
              {task.reminder && task.reminder !== 'None' && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-[6px] bg-[#F6F8F4] text-[#8BA090] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {task.reminder}
                </span>
              )}
              {stCount > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-[6px] bg-[#F6F8F4] text-[#8BA090] flex items-center gap-1">
                  <ListTodo className="w-3 h-3" />
                  {stComp}/{stCount} completed
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const filteredTasks = useMemo(() => {
    let result = tasks.filter(t => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        t.title.toLowerCase().includes(q) || 
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.subtasks && t.subtasks.some(st => st.title.toLowerCase().includes(q)));
        
      if (!matchesSearch) return false;
      
      switch (activeFilter) {
        case 'Completed': return t.status === 'Completed';
        case 'Overdue': return isTaskOverdue(t);
        case 'Today': return isTaskToday(t);
        case 'Tomorrow': {
           if (!t.due_date) return false;
           const tmr = new Date();
           tmr.setDate(tmr.getDate() + 1);
           return new Date(t.due_date).toDateString() === tmr.toDateString();
        }
        case 'This Week': {
           if (!t.due_date) return false;
           const due = new Date(t.due_date);
           const now = new Date();
           const next7Days = new Date();
           next7Days.setDate(now.getDate() + 7);
           return due >= now && due <= next7Days;
        }
        case 'All': break;
        default: if(t.category !== activeFilter) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'Priority': {
          const pMap: Record<string, number> = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
          return pMap[b.priority] - pMap[a.priority];
        }
        case 'Due Date': {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        case 'Alphabetical': return a.title.localeCompare(b.title);
        case 'Recent':
        default: {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeB - timeA;
        }
      }
    });
    
    return result;
  }, [tasks, activeFilter, searchQuery, sortBy]);

  const groupedTasks = useMemo(() => {
    if (activeFilter !== 'All') return { filterOnly: filteredTasks };

    const overdue: Task[] = [];
    const today: Task[] = [];
    const upcoming: Task[] = [];
    const completed: Task[] = [];
    const others: Task[] = [];

    const now = new Date();
    const todayStr = now.toDateString();
    
    const next7Days = new Date();
    next7Days.setDate(now.getDate() + 7);

    filteredTasks.forEach(t => {
      if (t.status === 'Completed') {
        completed.push(t);
        return;
      }
      if (isTaskOverdue(t)) {
        overdue.push(t);
        return;
      }
      if (!t.due_date) {
        others.push(t);
        return;
      }
      const dueStr = new Date(t.due_date).toDateString();
      if (dueStr === todayStr) {
        today.push(t);
      } else if (new Date(t.due_date) <= next7Days) {
        upcoming.push(t);
      } else {
        others.push(t);
      }
    });

    return { overdue, today, upcoming, completed, others };
  }, [filteredTasks, activeFilter]);

  const overdueCount = tasks.filter(t => isTaskOverdue(t) && t.status !== 'Completed').length;


  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-20 relative min-h-full pt-4 cursor-default">
      <div>
        <h2 className="text-[20px] font-medium text-[#4A6B50]">Your</h2>
        <h1 className="text-[28px] font-extrabold text-[var(--color-primary)] leading-tight mt-0.5">Action Items.</h1>
      </div>

      <div className="flex items-center space-x-2">
        <div className="flex-1 relative flex items-center bg-white rounded-[16px] shadow-sm border border-[#E8EEE5]">
          <Search className="w-5 h-5 text-[#8BA090] ml-3 flex-shrink-0" />
          <input 
            type="text" 
            placeholder="Search tasks, categories..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-3 bg-transparent focus:outline-none text-[15px] font-medium text-[var(--color-primary)] placeholder-[#8BA090]"
          />
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`w-[48px] h-[48px] flex-shrink-0 rounded-[16px] border flex items-center justify-center shadow-sm transition-colors ${showFilters ? 'bg-[var(--color-primary)] text-white border-transparent' : 'bg-white border-[#E8EEE5] text-[#4A6B50]'}`}
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>
      
      <AnimatePresence>
        {showFilters && (
           <motion.div 
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: 'auto', opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             className="overflow-hidden"
           >
             <div className="bg-white p-4 rounded-[20px] shadow-sm border border-[#E8EEE5] space-y-4">
                <div>
                   <p className="text-[11px] font-bold text-[#8BA090] uppercase tracking-wider mb-2">Sort By</p>
                   <div className="flex flex-wrap gap-2">
                     {['Recent', 'Priority', 'Due Date', 'Alphabetical'].map(s => (
                       <button
                         key={s}
                         onClick={() => setSortBy(s as any)}
                         className={`px-3 py-1.5 rounded-[10px] text-[12px] font-bold transition-all ${sortBy === s ? 'bg-[var(--color-primary)] text-white' : 'bg-[#F6F8F4] text-[#8BA090]'}`}
                       >
                         {s}
                       </button>
                     ))}
                   </div>
                </div>
             </div>
           </motion.div>
        )}
      </AnimatePresence>

      <div className="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide flex-nowrap">
        {['All', 'Today', 'Tomorrow', 'This Week', 'Completed', 'Overdue', ...CATEGORIES.map(c => c.label), ...customCategories].map((filter) => (
          <button 
            key={filter} 
            onClick={() => setActiveFilter(filter)}
            className={`whitespace-nowrap px-4 py-2 rounded-[14px] text-[13px] font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeFilter === filter 
              ? 'bg-[var(--color-primary)] text-white shadow-md transform scale-[1.02]' 
              : filter === 'Overdue' && overdueCount > 0
                ? 'bg-red-50 text-red-600 border border-red-200'
                : 'bg-white text-[#8BA090] border border-[#E8EEE5] hover:bg-[#F6F8F4]'
            }`}
          >
            {filter === 'Overdue' && overdueCount > 0 && <span className="w-2 h-2 rounded-full bg-red-500 mr-1 animate-pulse" />}
            {filter}
          </button>
        ))}
      </div>
      
      <div className="space-y-3 pb-20 mt-2">
        {isLoading && tasks.length === 0 ? (
          // Skeleton Loader
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-[20px] shadow-sm border border-[#E8EEE5] flex items-center gap-4">
              <div className="w-6 h-6 rounded-full bg-[#E8EEE5] animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#E8EEE5] rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-[#E8EEE5] rounded w-1/4 animate-pulse"></div>
              </div>
            </div>
          ))
        ) : filteredTasks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-[24px] border border-[#E8EEE5] shadow-sm mt-4 text-center"
          >
            <div className="w-16 h-16 bg-[#F6F8F4] rounded-[20px] flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-[#8BA090]" />
            </div>
            <h3 className="text-[18px] font-extrabold text-[var(--color-primary)] mb-1">No Tasks Yet</h3>
            <p className="text-[14px] font-medium text-[#8BA090] mb-6 max-w-[200px] leading-relaxed">
              Create your first task and start organizing your day.
            </p>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-6 py-3 bg-[var(--color-primary)] text-white font-bold rounded-[16px] shadow-sm"
            >
              Create Task
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {groupedTasks.filterOnly && (
               <div className="space-y-3">
                 <AnimatePresence mode="popLayout">
                    {groupedTasks.filterOnly.map(task => renderTaskCard(task))}
                 </AnimatePresence>
               </div>
            )}
            
            {groupedTasks.overdue && groupedTasks.overdue.length > 0 && (
               <div className="space-y-3">
                 <h3 className="text-[14px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-2">
                   <AlertCircle className="w-4 h-4" /> Overdue Tasks
                 </h3>
                 <AnimatePresence mode="popLayout">
                    {groupedTasks.overdue.map(task => renderTaskCard(task))}
                 </AnimatePresence>
               </div>
            )}

            {groupedTasks.today && groupedTasks.today.length > 0 && (
               <div className="space-y-3">
                 <h3 className="text-[14px] font-bold text-[var(--color-primary)] uppercase tracking-wider flex items-center gap-2">
                   <Calendar className="w-4 h-4 text-[#8BA090]" /> Today's Tasks
                 </h3>
                 <AnimatePresence mode="popLayout">
                    {groupedTasks.today.map(task => renderTaskCard(task))}
                 </AnimatePresence>
               </div>
            )}

            {groupedTasks.upcoming && groupedTasks.upcoming.length > 0 && (
               <div className="space-y-3">
                 <h3 className="text-[14px] font-bold text-[#8BA090] uppercase tracking-wider flex items-center gap-2">
                   <Clock className="w-4 h-4" /> Upcoming
                 </h3>
                 <AnimatePresence mode="popLayout">
                    {groupedTasks.upcoming.map(task => renderTaskCard(task))}
                 </AnimatePresence>
               </div>
            )}

            {groupedTasks.others && groupedTasks.others.length > 0 && (
               <div className="space-y-3">
                 <h3 className="text-[14px] font-bold text-[#8BA090] uppercase tracking-wider">
                   Later / No Date
                 </h3>
                 <AnimatePresence mode="popLayout">
                    {groupedTasks.others.map(task => renderTaskCard(task))}
                 </AnimatePresence>
               </div>
            )}

            {groupedTasks.completed && groupedTasks.completed.length > 0 && (
               <div className="space-y-3">
                 <h3 className="text-[14px] font-bold text-[#8BA090] uppercase tracking-wider flex items-center gap-2">
                   <Check className="w-4 h-4" /> Completed
                 </h3>
                 <AnimatePresence mode="popLayout">
                    {groupedTasks.completed.map(task => renderTaskCard(task))}
                 </AnimatePresence>
               </div>
            )}
          </div>
        )}
      </div>

      {/* QUICK ADD MODAL */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-[var(--color-primary)]/20 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setIsAdding(false)}
          >
            <motion.div 
              initial={{ y: 80, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 80, scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-[32px] p-6 shadow-[0_20px_60px_rgb(0,0,0,0.15)]"
            >
              <form onSubmit={handleQuickAdd}>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="What needs to be done?" 
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="w-full text-[20px] font-extrabold text-[var(--color-primary)] placeholder-[#A0C0A3] focus:outline-none bg-transparent mb-6"
                />
                
                <div className="flex items-center gap-3">
                  <button type="submit" className="flex-1 h-[56px] bg-[var(--color-primary)] text-white font-bold rounded-[20px] text-[16px] shadow-sm active:scale-[0.98] transition-transform">
                    Save Task
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingTask && (
          <TaskEditModal 
            task={editingTask} 
            onSave={handleSaveTask} 
            onClose={() => setEditingTask(null)} 
          />
        )}
      </AnimatePresence>

      <motion.button 
        onClick={() => setIsAdding(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed right-6 w-16 h-16 bg-[var(--color-primary)] text-white rounded-[24px] flex items-center justify-center shadow-[0_8px_30px_rgb(34,66,41,0.3)] z-40 outline-none"
        style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <Plus className="w-8 h-8" />
      </motion.button>
    </div>
  );
}
