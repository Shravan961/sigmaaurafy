
import { useState, useEffect } from 'react';
import { Task } from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';
import { isToday, getDateString } from '@/utils/helpers';

export const useLocalTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (stored) {
      try {
        setTasks(JSON.parse(stored));
      } catch (error) {
        console.error('Error parsing tasks:', error);
        setTasks([]);
      }
    }
  }, []);

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(newTasks));
  };

  const addTask = (task: Task) => {
    const newTasks = [task, ...tasks];
    saveTasks(newTasks);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const newTasks = tasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    );
    saveTasks(newTasks);
  };

  const deleteTask = (id: string) => {
    const newTasks = tasks.filter(task => task.id !== id);
    saveTasks(newTasks);
  };

  const getTasksForDate = (dateString: string): Task[] => {
    return tasks.filter(task => task.dueDate === dateString);
  };

  const getTodaysTasks = (): Task[] => {
    return getTasksForDate(getDateString());
  };

  const getTodaysCompletedCount = (): number => {
    return getTodaysTasks().filter(task => task.completed).length;
  };

  const getTodaysTotalCount = (): number => {
    return getTodaysTasks().length;
  };

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    getTasksForDate,
    getTodaysTasks,
    getTodaysCompletedCount,
    getTodaysTotalCount
  };
};
