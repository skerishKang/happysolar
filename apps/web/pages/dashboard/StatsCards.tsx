import { Card } from '@/components/ui/card';
import { File, Clock, TrendingUp, Users } from 'lucide-react';
import { DocumentStats } from './types';
import React from 'react';

interface StatsCardsProps {
  stats?: DocumentStats;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 animate-slide-up">
      <Card className="p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <File className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">이번 달 생성</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.monthlyDocuments || 0}</p>
          </div>
        </div>
      </Card>
      <Card className="p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">절약 시간</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.timeSaved || "0시간"}</p>
          </div>
        </div>
      </Card>
      <Card className="p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">효율성 증가</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.efficiency || "0%"}</p>
          </div>
        </div>
      </Card>
      <Card className="p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">활성 사용자</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.activeUsers || 0}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StatsCards; 