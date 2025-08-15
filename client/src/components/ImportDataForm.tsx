import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Upload, FileText, Info } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import type { BulkImportDataInput } from '../../../server/src/schema';

interface ImportDataFormProps {
  onImportSuccess: () => void;
}

export function ImportDataForm({ onImportSuccess }: ImportDataFormProps) {
  const [importData, setImportData] = useState('');
  const [importStatus, setImportStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const sampleData = {
    procedures: [
      {
        name: "MRI Scan - Brain",
        description: "Magnetic resonance imaging of the brain with contrast",
        category: "Imaging",
        practices: [
          {
            practice_name: "City Medical Center",
            practice_address: "123 Main Street, Downtown",
            practice_phone: "555-0123",
            practice_email: "appointments@citymedical.com",
            cost: 1200.00,
            currency: "USD",
            notes: "Includes radiologist consultation and CD with images"
          },
          {
            practice_name: "General Hospital",
            practice_address: "456 Oak Avenue, Midtown",
            practice_phone: "555-0456",
            practice_email: "scheduling@generalhospital.org",
            cost: 950.00,
            currency: "USD",
            notes: "Weekend appointments available"
          }
        ]
      }
    ]
  };

  const handleBulkImport = async () => {
    if (!importData.trim()) {
      setImportStatus('error:Please enter import data');
      return;
    }

    setIsLoading(true);
    setImportStatus('');
    
    try {
      // Parse the JSON data
      const parsedData: BulkImportDataInput = JSON.parse(importData);
      
      // Validate the structure
      if (!parsedData.procedures || !Array.isArray(parsedData.procedures)) {
        throw new Error('Invalid data structure: expected procedures array');
      }

      const result = await trpc.bulkImportData.mutate(parsedData);
      setImportStatus(`success:Successfully imported: ${result.imported_procedures} procedures, ${result.imported_practices} practices, ${result.imported_pricing_entries} pricing entries`);
      setImportData('');
      
      // Notify parent component to reload data
      onImportSuccess();
    } catch (error) {
      console.error('Import failed:', error);
      setImportStatus(`error:Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleData = () => {
    setImportData(JSON.stringify(sampleData, null, 2));
    setImportStatus('');
  };

  const isSuccess = importStatus.startsWith('success:');
  const isError = importStatus.startsWith('error:');
  const statusMessage = importStatus.replace(/^(success|error):/, '');

  return (
    <div className="space-y-6">
      {/* Data Format Guide */}
      <Card className="medical-card border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4 text-blue-600" />
            📋 Data Format Guide
          </CardTitle>
          <CardDescription>
            Use this JSON structure for importing medical procedure data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Sample JSON Structure:</span>
              <Button 
                onClick={loadSampleData} 
                size="sm" 
                variant="outline"
                className="text-xs"
              >
                Load Sample
              </Button>
            </div>
            <pre className="text-xs text-gray-600 overflow-x-auto">
{`{
  "procedures": [
    {
      "name": "MRI Scan - Brain",
      "description": "Magnetic resonance imaging...",
      "category": "Imaging",
      "practices": [
        {
          "practice_name": "City Medical Center",
          "practice_address": "123 Main Street",
          "practice_phone": "555-0123",
          "practice_email": "info@citymed.com",
          "cost": 1200.00,
          "currency": "USD",
          "notes": "Includes consultation"
        }
      ]
    }
  ]
}`}
            </pre>
          </div>
          
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription className="text-sm">
              <strong>💡 Tips:</strong> All practice fields except name and cost are optional. 
              The system will automatically create or update procedures and practices as needed.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Import Form */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-600" />
            Import Your Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            placeholder="Paste your JSON data here or click 'Load Sample' above to see the format..."
            value={importData}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setImportData(e.target.value)}
            className="import-textarea w-full h-40 p-3 border border-gray-300 rounded-md font-mono text-sm resize-none"
          />
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {importData ? `${importData.length} characters` : 'No data entered'}
            </div>
            <Button 
              onClick={handleBulkImport}
              disabled={isLoading || !importData.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? 'Importing...' : '📤 Import Data'}
            </Button>
          </div>
          
          {importStatus && (
            <Alert className={isSuccess ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}>
              {isSuccess ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <AlertDescription className={`whitespace-pre-wrap ${
                isSuccess ? 'text-green-700' : 'text-red-700'
              }`}>
                {statusMessage}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}