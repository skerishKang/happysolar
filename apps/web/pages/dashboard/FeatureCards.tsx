import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import React from 'react';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  textColor: string;
  buttonColor: string;
  estimatedTime: string;
  badge: string;
  aiFeatures: string[];
}

interface FeatureCardsProps {
  features: Feature[];
  openModal: (featureId: string) => void;
}

const FeatureCards: React.FC<FeatureCardsProps> = ({ features, openModal }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
      {features.map((feature) => {
        const IconComponent = feature.icon;
        return (
          <Card 
            key={feature.id}
            className="p-0 shadow-lg border-0 card-hover cursor-pointer group overflow-hidden bg-white/80 backdrop-blur-sm"
            onClick={() => openModal(feature.id)}
          >
            <CardContent className="p-0">
              <div className={`h-2 bg-gradient-to-r ${feature.color}`}></div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <Badge className={`${feature.bgColor} ${feature.textColor} text-xs font-bold px-3 py-1 rounded-full border-2 border-current`}>
                    {feature.badge}
                  </Badge>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                  {feature.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {feature.aiFeatures?.map((aiFeature, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border"
                    >
                      {aiFeature}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">{feature.estimatedTime}</span>
                  </div>
                  <Button className={`${feature.buttonColor} text-white transition-all duration-300 shadow-lg hover:shadow-xl`}>
                    <span className="font-medium">AI 생성 시작</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default FeatureCards; 