import { Building, IdCard, MapPin, Factory, TrendingUp } from 'lucide-react';
import { CompanyInfo } from "./types";
import React from 'react';

interface CompanyInfoPanelProps {
  companyInfo?: CompanyInfo;
}

const CompanyInfoPanel: React.FC<CompanyInfoPanelProps> = ({ companyInfo }) => {
  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div>
          <h3 className="text-2xl font-bold mb-4">회사 정보 자동 연동</h3>
          <p className="text-slate-300 mb-6 leading-relaxed">
            모든 문서에 회사 정보가 자동으로 입력됩니다. 
            사업자등록증 정보를 기반으로 정확한 문서를 생성합니다.
          </p>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Building className="w-5 h-5 text-blue-400" />
              <span>{companyInfo?.name || "주식회사 해피솔라"}</span>
            </div>
            <div className="flex items-center space-x-3">
              <IdCard className="w-5 h-5 text-green-400" />
              <span>사업자등록번호: {companyInfo?.businessNumber || "578-87-02666"}</span>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-red-400" />
              <span>{companyInfo?.address || "전라남도 장흥군 장흥읍 장흥로 30, 2층"}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Factory className="w-5 h-5 text-yellow-400" />
              <span>{companyInfo?.businessType || "건설업, 전기공사업, 태양광발전소 부대장비"}</span>
            </div>
          </div>
        </div>
        <div className="text-center">
          <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <div className="w-24 h-24 mx-auto mb-4 gradient-bg rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-12 h-12 text-white" />
            </div>
            <h4 className="text-xl font-semibold mb-2">스마트 자동화</h4>
            <p className="text-slate-300 text-sm">AI 기술로 업무 효율성을 극대화하세요</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoPanel; 