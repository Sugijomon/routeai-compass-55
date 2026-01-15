import { useNavigate, useParams } from 'react-router-dom';
import { mockUseCases } from '@/data/mockUseCases';
import { ArrowLeft, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function UseCaseDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const useCase = mockUseCases.find((uc) => uc.id === id);

  if (!useCase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 text-lg">Toepassing niet gevonden</p>
          <Button onClick={() => navigate('/use-cases')} className="mt-4">
            Terug naar overzicht
          </Button>
        </div>
      </div>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-orange-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/use-cases')} className="flex items-center gap-2 mb-2">
            <ArrowLeft className="w-4 h-4" />
            Terug naar overzicht
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{useCase.icon}</div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900">{useCase.title}</h1>
                <p className="text-slate-600 mt-1">{useCase.description}</p>
              </div>
              {useCase.approvedByOrg && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Goedgekeurd door jouw organisatie
                </Badge>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h2 className="font-semibold text-green-800">Wat is toegestaan</h2>
              </div>
              <ul className="space-y-2">
                {useCase.allowedUses.map((use, index) => (
                  <li key={index} className="flex items-start gap-2 text-green-700 text-sm">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {use}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h2 className="font-semibold text-red-800">Wat is niet toegestaan</h2>
              </div>
              <ul className="space-y-2">
                {useCase.prohibitedUses.map((use, index) => (
                  <li key={index} className="flex items-start gap-2 text-red-700 text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {use}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-700 font-medium">Risiconiveau</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-full ${useCase.riskLevel === 'low' ? getRiskColor('low') : 'bg-slate-200'}`} />
                    <span className="text-sm text-slate-600">Laag</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-full ${useCase.riskLevel === 'medium' ? getRiskColor('medium') : 'bg-slate-200'}`} />
                    <span className="text-sm text-slate-600">Midden</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-full ${useCase.riskLevel === 'high' ? getRiskColor('high') : 'bg-slate-200'}`} />
                    <span className="text-sm text-slate-600">Hoog</span>
                  </div>
                </div>
              </div>
              <p className="text-slate-500 text-sm mt-2">Altijd controleren voor gebruik</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-blue-800 text-sm font-medium">Gebruikt: Conversational AI (EU-geconfigureerd)</p>
                  <p className="text-blue-700 text-sm mt-1">Model en leverancier vastgelegd door organisatiebeheer</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button className="w-full" size="lg" onClick={() => console.log('Start use-case:', useCase.id)}>
                Start met {useCase.title}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={() => navigate('/use-cases')}>
            Terug naar alle toepassingen
          </Button>
        </div>
      </div>
    </div>
  );
}
