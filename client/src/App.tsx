import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Search, Upload, Stethoscope, AlertCircle } from 'lucide-react';
import { ProcedureSearchCard } from '@/components/ProcedureSearchCard';
import { PriceComparisonCard } from '@/components/PriceComparisonCard';
import { ImportDataForm } from '@/components/ImportDataForm';
import type { 
  MedicalProcedure, 
  ProcedureComparison
} from '../../server/src/schema';

function App() {
  const [procedures, setProcedures] = useState<MedicalProcedure[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MedicalProcedure[]>([]);
  const [selectedComparison, setSelectedComparison] = useState<ProcedureComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Load all procedures on mount
  const loadProcedures = useCallback(async () => {
    try {
      const result = await trpc.getAllProcedures.query();
      setProcedures(result);
    } catch (error) {
      console.error('Failed to load procedures:', error);
    }
  }, []);

  useEffect(() => {
    loadProcedures();
  }, [loadProcedures]);

  // Search procedures
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await trpc.searchProcedures.query({
        query: searchQuery,
        max_results: 20
      });
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Get price comparison for a procedure
  const handleViewComparison = async (procedureId: number) => {
    setIsLoading(true);
    try {
      const comparison = await trpc.getProcedureComparison.query(procedureId);
      setSelectedComparison(comparison);
    } catch (error) {
      console.error('Failed to get comparison:', error);
      setSelectedComparison(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful import
  const handleImportSuccess = () => {
    loadProcedures();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Medical Procedure Price Comparison
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            🏥 Compare medical procedure costs across different practices and find the best prices for your healthcare needs
          </p>
        </div>

        <Tabs defaultValue="search" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search & Compare
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            {/* Search Section */}
            <Card className="medical-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-600" />
                  🔍 Search Medical Procedures
                </CardTitle>
                <CardDescription>
                  Enter the name of a medical procedure to find and compare prices across different practices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    placeholder="e.g., MRI scan, Blood test, X-ray..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()}
                    className="search-input flex-1"
                  />
                  <Button onClick={handleSearch} disabled={isSearching} className="bg-blue-600 hover:bg-blue-700">
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Card className="medical-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-green-600" />
                    Search Results ({searchResults.length})
                  </CardTitle>
                  <CardDescription>
                    Click "Compare Prices" to see pricing from different medical practices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {searchResults.map((procedure: MedicalProcedure) => (
                      <ProcedureSearchCard
                        key={procedure.id}
                        procedure={procedure}
                        onViewComparison={handleViewComparison}
                        isLoading={isLoading}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Results Message */}
            {searchQuery && !isSearching && searchResults.length === 0 && (
              <Card className="medical-card">
                <CardContent className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No procedures found</h3>
                  <p className="text-gray-500">
                    Try searching with different keywords or check if the procedure has been imported yet.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Price Comparison Results */}
            {selectedComparison && (
              <Card className="medical-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    💰 Price Comparison: {selectedComparison.procedure.name}
                  </CardTitle>
                  {selectedComparison.procedure.description && (
                    <CardDescription>{selectedComparison.procedure.description}</CardDescription>
                  )}
                  {selectedComparison.procedure.category && (
                    <Badge variant="outline" className="w-fit mt-2">
                      📂 {selectedComparison.procedure.category}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedComparison.pricing_options.length === 0 ? (
                    <Alert>
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        📋 No pricing information available for this procedure yet. Try importing some data or contact medical practices directly.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-700">
                          💡 Found <strong>{selectedComparison.pricing_options.length}</strong> pricing option{selectedComparison.pricing_options.length !== 1 ? 's' : ''} from different medical practices. 
                          {selectedComparison.pricing_options.some(o => o.is_lowest_price) && (
                            <span className="block mt-1 font-medium">
                              🎯 Look for the "Best Price!" badge to find the most affordable option.
                            </span>
                          )}
                        </p>
                      </div>
                      <PriceComparisonCard comparison={selectedComparison} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            <ImportDataForm onImportSuccess={handleImportSuccess} />

            {/* Current Data Summary */}
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                  📊 Current Database Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{procedures.length}</div>
                    <div className="text-sm text-blue-700">Total Procedures</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
                    <div className="text-2xl font-bold text-green-600">📊</div>
                    <div className="text-sm text-green-700">Ready for Comparison</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">🏥</div>
                    <div className="text-sm text-purple-700">Multiple Practices</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;