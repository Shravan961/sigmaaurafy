
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Smile, Frown, Meh, TrendingUp, BarChart3 } from 'lucide-react';
import { useLocalMood } from '@/hooks/useLocalMood';
import { generateId, getTimestamp, formatDateTime, isToday } from '@/utils/helpers';
import { toast } from "sonner";

export const WellnessDashboard: React.FC = () => {
  const [moodScore, setMoodScore] = useState<number>(5);
  const [moodNote, setMoodNote] = useState('');
  
  const { moods, addMood, getTodaysMoodScore, getLatestMood, getWeeklyAverage } = useLocalMood();

  const handleLogMood = () => {
    if (moodScore < 1 || moodScore > 10) {
      toast.error('Please select a mood score between 1 and 10');
      return;
    }

    const newMood = {
      id: generateId(),
      moodScore,
      note: moodNote.trim() || undefined,
      timestamp: getTimestamp(),
    };

    addMood(newMood);
    setMoodNote('');
    setMoodScore(5);
    toast.success('Mood logged successfully!');
  };

  const getMoodIcon = (score: number) => {
    if (score >= 8) return <Smile className="h-6 w-6 text-green-500" />;
    if (score >= 6) return <Meh className="h-6 w-6 text-yellow-500" />;
    if (score >= 4) return <Meh className="h-6 w-6 text-orange-500" />;
    return <Frown className="h-6 w-6 text-red-500" />;
  };

  const getMoodColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    if (score >= 4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getMoodText = (score: number) => {
    if (score >= 9) return 'Excellent';
    if (score >= 7) return 'Good';
    if (score >= 5) return 'Okay';
    if (score >= 3) return 'Low';
    return 'Poor';
  };

  const todaysMood = getTodaysMoodScore();
  const weeklyAverage = getWeeklyAverage();
  const latestMood = getLatestMood();
  const recentMoods = moods.slice(0, 7);

  const wellnessTips = [
    "Take 5 deep breaths when feeling stressed",
    "Get 7-9 hours of quality sleep each night",
    "Spend 10 minutes in nature daily",
    "Practice gratitude by noting 3 good things each day",
    "Stay hydrated with 8 glasses of water",
    "Take regular breaks from screens",
    "Connect with friends and family",
    "Exercise for at least 20 minutes daily",
  ];

  const randomTip = wellnessTips[Math.floor(Math.random() * wellnessTips.length)];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Wellness Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Track your wellbeing and build healthy habits
        </p>
      </div>

      {/* Current Mood Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
          <CardContent className="p-4 text-center">
            <Heart className="h-8 w-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {todaysMood !== null ? `${todaysMood}/10` : '—'}
            </div>
            <div className="text-sm opacity-90">Today's Mood</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {weeklyAverage !== null ? `${weeklyAverage}/10` : '—'}
            </div>
            <div className="text-sm opacity-90">Weekly Average</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{moods.length}</div>
            <div className="text-sm opacity-90">Total Entries</div>
          </CardContent>
        </Card>
      </div>

      {/* Mood Logging */}
      <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5" />
            <span>Log Your Mood</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              How are you feeling? (1-10)
            </label>
            <div className="flex items-center space-x-4">
              <Input
                type="range"
                min="1"
                max="10"
                value={moodScore}
                onChange={(e) => setMoodScore(parseInt(e.target.value))}
                className="flex-1"
              />
              <div className="flex items-center space-x-2 min-w-24">
                {getMoodIcon(moodScore)}
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {moodScore}/10
                </span>
              </div>
            </div>
            <div className="text-center mt-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {getMoodText(moodScore)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (optional)
            </label>
            <Textarea
              value={moodNote}
              onChange={(e) => setMoodNote(e.target.value)}
              placeholder="How are you feeling? What's on your mind?"
              rows={3}
            />
          </div>

          <Button onClick={handleLogMood} className="w-full">
            Log Mood
          </Button>
        </CardContent>
      </Card>

      {/* Recent Mood Visualization */}
      {recentMoods.length > 0 && (
        <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Recent Mood Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end space-x-2 h-32">
              {recentMoods.reverse().map((mood, index) => (
                <div key={mood.id} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full rounded-t ${getMoodColor(mood.moodScore)} transition-all duration-300`}
                    style={{ height: `${(mood.moodScore / 10) * 100}%` }}
                  ></div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
                    {isToday(mood.timestamp) ? 'Today' : new Date(mood.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wellness Tip */}
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">💡 Wellness Tip</h3>
          <p className="text-indigo-100">{randomTip}</p>
        </CardContent>
      </Card>

      {/* Recent Mood History */}
      {moods.length > 0 && (
        <Card className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Recent Mood Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {moods.slice(0, 5).map((mood) => (
                <div key={mood.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-700/50 rounded">
                  <div className="flex items-center space-x-3">
                    {getMoodIcon(mood.moodScore)}
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {mood.moodScore}/10 - {getMoodText(mood.moodScore)}
                      </div>
                      {mood.note && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          "{mood.note}"
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDateTime(mood.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
