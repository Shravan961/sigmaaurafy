import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar as CalendarIcon, Clock, CheckCircle, Trash2, MessageCircle, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocalTasks } from '@/hooks/useLocalTasks';
import { generateId, getTimestamp, formatDate } from '@/utils/helpers';
import { toast } from "sonner";
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

interface DailyPlannerProps {
  onSendToChat?: (message: string) => void;
}

export const DailyPlanner: React.FC<DailyPlannerProps> = ({ onSendToChat }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNote, setNewTaskNote] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  
  const { 
    tasks, 
    addTask, 
    updateTask, 
    deleteTask, 
    getTasksForDate 
  } = useLocalTasks();

  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
  const tasksForSelectedDate = getTasksForDate(selectedDateString);

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    const newTask = {
      id: generateId(),
      title: newTaskTitle.trim(),
      dueDate: selectedDateString,
      completed: false,
      timestamp: getTimestamp(),
      note: newTaskNote.trim() || undefined,
    };

    addTask(newTask);
    setNewTaskTitle('');
    setNewTaskNote('');
    setShowAddTask(false);
    toast.success('Task added to calendar!');
    // DO NOT redirect to chat - stay on planner
  };

  const handleToggleTask = (taskId: string, completed: boolean, title: string) => {
    updateTask(taskId, { completed });
    toast.success(completed ? 'Task completed!' : 'Task marked as incomplete');
    // DO NOT redirect to chat - stay on planner
  };

  const handleDeleteTask = (taskId: string, title: string) => {
    if (window.confirm(`Delete "${title}"?`)) {
      deleteTask(taskId);
      toast.success('Task deleted');
      // DO NOT redirect to chat - stay on planner
    }
  };

 const sendAllTasksSummaryToChat = () => {
  if (!onSendToChat) return;

  const allDates = Object.keys(tasks);
  let summary = `📋 **Full Task Summary**\n\n`;

  if (allDates.length === 0) {
    summary += `📝 You have no tasks scheduled.`;
  } else {
    allDates.forEach((dateStr) => {
      const dailyTasks = getTasksForDate(dateStr);
      if (dailyTasks.length > 0) {
        const formattedDate = format(new Date(dateStr), 'EEEE, MMMM do, yyyy');
        summary += `📅 **${formattedDate}**\n`;

        dailyTasks.forEach((task, index) => {
          const status = task.completed ? '✅ Completed' : '⏳ Pending';
          summary += `  ${index + 1}. ${task.title}\n`;
          summary += `     📊 Status: ${status}\n`;
          if (task.note) {
            summary += `     📝 ${task.note}\n`;
          }
        });

        summary += '\n';
      }
    });
  }

  onSendToChat(summary);
  toast.success('Full task summary sent to chat!');
};

  const getWeekDays = () => {
    const start = startOfWeek(selectedDate);
    const end = endOfWeek(selectedDate);
    return eachDayOfInterval({ start, end });
  };

  const hasTasksOnDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return getTasksForDate(dateString).length > 0;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewMode === 'day') {
      setSelectedDate(direction === 'next' ? addDays(selectedDate, 1) : subDays(selectedDate, 1));
    } else if (viewMode === 'week') {
      setSelectedDate(direction === 'next' ? addDays(selectedDate, 7) : subDays(selectedDate, 7));
    } else {
      setSelectedDate(direction === 'next' ? addDays(selectedDate, 30) : subDays(selectedDate, 30));
    }
  };

  return (
    <div className="space-y-4 bg-background min-h-screen p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          AI Calendar Planner
        </h2>
        <p className="text-muted-foreground">
          Organize your day with AI assistance
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-center space-x-2 mb-4">
        {(['day', 'week', 'month'] as const).map((mode) => (
          <Button
            key={mode}
            variant={viewMode === mode ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode(mode)}
            className="capitalize"
          >
            {mode}
          </Button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">
          {viewMode === 'day' && format(selectedDate, 'EEEE, MMMM do, yyyy')}
          {viewMode === 'week' && `Week of ${format(startOfWeek(selectedDate), 'MMM do')}`}
          {viewMode === 'month' && format(selectedDate, 'MMMM yyyy')}
        </h3>
        <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border-0"
              modifiers={{
                hasTasks: (date) => hasTasksOnDate(date)
              }}
              modifiersStyles={{
                hasTasks: { 
                  backgroundColor: 'hsl(var(--primary) / 0.1)',
                  color: 'hsl(var(--primary))',
                  fontWeight: 'bold'
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4" />
                <span>Tasks for {format(selectedDate, 'MMM do')}</span>
                <Badge variant="secondary" className="text-xs">
                  {tasksForSelectedDate.length}
                </Badge>
              </div>
              {onSendToChat && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={sendDaySummaryToChat}
                  className="text-xs bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Chat Summary
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {/* Add Task */}
            {!showAddTask ? (
              <Button
                onClick={() => setShowAddTask(true)}
                className="w-full"
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            ) : (
              <Card className="p-3 bg-muted/50">
                <div className="space-y-2">
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Task title..."
                    className="text-sm"
                    autoFocus
                  />
                  <Textarea
                    value={newTaskNote}
                    onChange={(e) => setNewTaskNote(e.target.value)}
                    placeholder="Add notes (optional)..."
                    className="text-sm min-h-[60px]"
                  />
                  <div className="flex space-x-2">
                    <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()} size="sm" className="flex-1">
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAddTask(false);
                        setNewTaskTitle('');
                        setNewTaskNote('');
                      }}
                      size="sm"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Tasks List */}
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {tasksForSelectedDate.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No tasks for this date</p>
                    <p className="text-xs mt-1">Add a task to get started</p>
                  </div>
                ) : (
                  tasksForSelectedDate
                    .sort((a, b) => a.completed ? 1 : b.completed ? -1 : 0)
                    .map((task) => (
                      <Card key={task.id} className={`p-3 ${task.completed ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'border-border'}`}>
                        <div className="flex items-start space-x-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleTask(task.id, !task.completed, task.title)}
                            className={`mt-0.5 ${task.completed ? 'text-green-600' : 'text-muted-foreground'}`}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {task.title}
                            </p>
                            {task.note && (
                              <p className="text-xs text-muted-foreground mt-1 bg-muted/50 p-2 rounded">
                                {task.note}
                              </p>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTask(task.id, task.title)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Week View */}
      {viewMode === 'week' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Week Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {getWeekDays().map((day) => {
                const dayTasks = getTasksForDate(format(day, 'yyyy-MM-dd'));
                const isSelected = format(day, 'yyyy-MM-dd') === selectedDateString;
                
                return (
                  <div 
                    key={day.toISOString()} 
                    className={`p-2 rounded border cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-primary/10 border-primary' : 'border-border'}`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="text-xs font-medium text-center">
                      {format(day, 'EEE')}
                    </div>
                    <div className="text-sm font-bold text-center">
                      {format(day, 'd')}
                    </div>
                    {dayTasks.length > 0 && (
                      <div className="text-xs text-center mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {dayTasks.length}
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};