import { FormField } from './types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Upload, Mic, Check, X, Languages, FileText } from 'lucide-react';
import React from 'react';

interface DocumentFormProps {
  fields: FormField[];
  formData: Record<string, any>;
  onInputChange: (fieldIndex: number, value: any) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent, fieldIndex: number) => void;
  featureId: string;
}

export default function DocumentForm({ fields, formData, onInputChange, onFileChange, featureId }: DocumentFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {fields.map((field, index) => {
        const fieldKey = `field_${index}`;
        if (field.type === 'file') {
          const isAudioFile = featureId === 'minutes' && field.label.includes('음성');
          return (
            <div key={index} className="md:col-span-2">
              <Label className="text-sm font-bold text-gray-700 mb-3 block flex items-center space-x-2">
                <Upload className="w-4 h-4 text-indigo-500" />
                <span>{field.label}{field.required && ' *'}</span>
              </Label>
              <div 
                className="border-2 border-dashed rounded-2xl p-6 transition-all duration-200 cursor-pointer"
                onClick={(e) => { e.preventDefault(); }}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  onFileChange(e, index);
                }}
              >
                <div className="text-center">
                  {isAudioFile ? (
                    <Mic className="w-12 h-12 mx-auto mb-3 text-indigo-400" />
                  ) : (
                    <Upload className="w-12 h-12 mx-auto mb-3 text-indigo-400" />
                  )}
                  <p className="text-sm font-medium mb-2 text-gray-700">파일을 드래그하거나 클릭해서 업로드</p>
                  <p className="text-xs text-gray-500">{field.placeholder}</p>
                  {formData[fieldKey] && (
                    <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs text-green-600 font-medium flex items-center">
                        <Check className="w-3 h-3 mr-1" />
                        {formData[fieldKey].name}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onInputChange(index, null);
                          }}
                          className="text-xs h-6 px-2"
                        >
                          <X className="w-3 h-3 mr-1" />
                          제거
                        </Button>
                      </div>
                    </div>
                  )}
                  <input
                    id={`file-input-${index}`}
                    type="file"
                    accept={isAudioFile ? "audio/*" : "*"}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onFileChange(e, index);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <Button
                    type="button" variant="outline"
                    className="mt-3 w-full bg-white/80 hover:bg-white border-indigo-200 hover:border-indigo-300"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const fileInput = document.getElementById(`file-input-${index}`) as HTMLInputElement;
                      if (fileInput) {
                        fileInput.click();
                      }
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    파일 선택
                  </Button>
                </div>
              </div>
            </div>
          );
        } else if (field.type === 'select') {
          return (
            <div key={index} className={field.label.includes('번역') || field.label.includes('유형') ? 'md:col-span-2' : ''}>
              <Label className="text-sm font-bold text-gray-700 mb-2 block">
                {field.label}{field.required && ' *'}
                {field.label.includes('번역') && <Languages className="w-4 h-4 inline ml-1 text-blue-500" />}
              </Label>
              <Select 
                value={formData[fieldKey] || ''} 
                onValueChange={(value) => onInputChange(index, value)}
                required={field.required}
              >
                <SelectTrigger className="w-full border-gray-200 rounded-xl bg-white/80 hover:border-indigo-300 transition-colors">
                  <SelectValue placeholder="선택해주세요" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {field.options?.map((option) => (
                    <SelectItem key={option} value={option} className="rounded-lg">{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        } else if (field.type === 'textarea') {
          return (
            <div key={index} className="md:col-span-2">
              <Label className="text-sm font-bold text-gray-700 mb-2 block">
                {field.label}{field.required && ' *'}
              </Label>
              <Textarea
                value={formData[fieldKey] || ''}
                onChange={(e) => onInputChange(index, e.target.value)}
                placeholder={field.placeholder}
                rows={4}
                required={field.required}
                className="resize-none border-gray-200 rounded-xl bg-white/80 hover:border-indigo-300 transition-colors"
              />
            </div>
          );
        } else if (field.type === 'checkbox') {
          return (
            <div key={index} className="md:col-span-2">
              <div className="flex items-center space-x-3 bg-gray-50 rounded-xl p-4">
                <input
                  type="checkbox"
                  id={fieldKey}
                  checked={formData[fieldKey] || false}
                  onChange={(e) => onInputChange(index, e.target.checked)}
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <Label htmlFor={fieldKey} className="text-sm font-medium text-gray-700">
                  {field.label}
                </Label>
              </div>
            </div>
          );
        } else {
          return (
            <div key={index}>
              <Label className="text-sm font-bold text-gray-700 mb-2 block">
                {field.label}{field.required && ' *'}
              </Label>
              <Input
                type={field.type}
                value={formData[fieldKey] || ''}
                onChange={(e) => onInputChange(index, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                className="border-gray-200 rounded-xl bg-white/80 hover:border-indigo-300 transition-colors"
              />
            </div>
          );
        }
      })}
    </div>
  );
} 