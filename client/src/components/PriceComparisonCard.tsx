import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Phone, Mail, MapPin, MessageSquare, TrendingDown, Clock } from 'lucide-react';
import type { ProcedureComparison } from '../../../server/src/schema';

interface PriceComparisonCardProps {
  comparison: ProcedureComparison;
}

export function PriceComparisonCard({ comparison }: PriceComparisonCardProps) {
  const lowestPrice = Math.min(...comparison.pricing_options.map(option => option.cost));
  const highestPrice = Math.max(...comparison.pricing_options.map(option => option.cost));
  const savings = highestPrice - lowestPrice;

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <Card className="medical-card border-blue-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-blue-600">${lowestPrice.toFixed(2)}</div>
              <div className="text-sm text-blue-700">Lowest Price</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-red-600">${highestPrice.toFixed(2)}</div>
              <div className="text-sm text-red-700">Highest Price</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-green-600">${savings.toFixed(2)}</div>
              <div className="text-sm text-green-700">Potential Savings</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Options */}
      <div className="space-y-3">
        {comparison.pricing_options.map((option, index) => (
          <Card 
            key={index} 
            className={option.is_lowest_price ? 'price-card-lowest' : 'price-card-normal'}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  {/* Practice Header */}
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full ${
                      option.is_lowest_price ? 'bg-green-200' : 'bg-gray-200'
                    }`}>
                      <Building2 className={`w-4 h-4 ${
                        option.is_lowest_price ? 'text-green-700' : 'text-gray-600'
                      }`} />
                    </div>
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {option.practice.name}
                    </h4>
                    {option.is_lowest_price && (
                      <Badge className="bg-green-600 hover:bg-green-700 text-white">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        Best Price! 💰
                      </Badge>
                    )}
                  </div>
                  
                  {/* Practice Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    {option.practice.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{option.practice.address}</span>
                      </div>
                    )}
                    {option.practice.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <a 
                          href={`tel:${option.practice.phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {option.practice.phone}
                        </a>
                      </div>
                    )}
                    {option.practice.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <a 
                          href={`mailto:${option.practice.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {option.practice.email}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>Updated {option.updated_at.toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Notes */}
                  {option.notes && (
                    <div className="bg-blue-50 border-l-4 border-blue-300 p-3 rounded-r">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{option.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Price Display */}
                <div className="text-right ml-6 flex-shrink-0">
                  <div className={`text-3xl font-bold ${
                    option.is_lowest_price ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    ${option.cost.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{option.currency}</div>
                  {option.is_lowest_price && (
                    <div className="text-xs text-green-600 font-medium mt-1">
                      Save ${(highestPrice - option.cost).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}