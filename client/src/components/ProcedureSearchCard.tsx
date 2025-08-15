import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Calendar, FileText } from 'lucide-react';
import type { MedicalProcedure } from '../../../server/src/schema';

interface ProcedureSearchCardProps {
  procedure: MedicalProcedure;
  onViewComparison: (procedureId: number) => void;
  isLoading: boolean;
}

export function ProcedureSearchCard({ 
  procedure, 
  onViewComparison, 
  isLoading 
}: ProcedureSearchCardProps) {
  return (
    <div className="medical-card p-4 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">{procedure.name}</h3>
              {procedure.description && (
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  {procedure.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3 pl-11">
            {procedure.category && (
              <Badge variant="secondary" className="text-xs">
                📂 {procedure.category}
              </Badge>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              Added {procedure.created_at.toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <Button
          onClick={() => onViewComparison(procedure.id)}
          disabled={isLoading}
          className="ml-4 bg-blue-600 hover:bg-blue-700 flex-shrink-0"
          size="sm"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          {isLoading ? 'Loading...' : 'Compare Prices'}
        </Button>
      </div>
    </div>
  );
}