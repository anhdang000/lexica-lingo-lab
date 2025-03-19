
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Fire, TrendingUp, CheckCircle2, BarChart3 } from 'lucide-react';

const ProgressDashboard: React.FC = () => {
  // Sample statistics for the dashboard
  const stats = {
    streak: 7,
    wordsLearned: 148,
    accuracy: 92,
    wordsReviewed: 324
  };

  return (
    <Card className="glass dark:glass-dark border-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-cyan-50/30 dark:from-gray-800 dark:to-gray-800/60 -z-10" />
      <CardHeader className="pb-3">
        <CardTitle className="text-xl text-gray-800 dark:text-white flex items-center">
          <BarChart3 className="mr-2 h-5 w-5 text-cyan-500" />
          Learning Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Streak */}
          <div className="bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-800/20 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {stats.streak}
              </span>
              <span className="rounded-full bg-amber-200/50 dark:bg-amber-800/30 p-2">
                <Fire className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </span>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">Day Streak</p>
          </div>

          {/* Words Learned */}
          <div className="bg-gradient-to-br from-cyan-100 to-cyan-50 dark:from-cyan-900/40 dark:to-cyan-800/20 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                {stats.wordsLearned}
              </span>
              <span className="rounded-full bg-cyan-200/50 dark:bg-cyan-800/30 p-2">
                <CheckCircle2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </span>
            </div>
            <p className="text-xs text-cyan-700 dark:text-cyan-300 mt-2">Words Learned</p>
          </div>

          {/* Accuracy */}
          <div className="bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-800/20 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.accuracy}%
              </span>
              <span className="rounded-full bg-purple-200/50 dark:bg-purple-800/30 p-2">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </span>
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">Accuracy</p>
          </div>

          {/* Words Reviewed */}
          <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/20 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.wordsReviewed}
              </span>
              <span className="rounded-full bg-blue-200/50 dark:bg-blue-800/30 p-2">
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </span>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">Reviews Completed</p>
          </div>
        </div>

        {/* Study Recommendation */}
        <div className="mt-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
          <h4 className="font-medium text-sm text-gray-800 dark:text-white mb-2">Today's Goal</h4>
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              12 words due for review
            </div>
            <button className="px-3 py-1 text-xs bg-cyan-500 hover:bg-cyan-600 text-white rounded-full">
              Study Now
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressDashboard;
