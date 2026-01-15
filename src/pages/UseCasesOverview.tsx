import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { mockUseCases, filterUseCasesByCapabilities } from '@/data/mockUseCases';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UseCasesOverview() {
  const navigate = useNavigate();
  const currentUser = useAppStore((state) => state.currentUser);

  const userCapabilities = currentUser?.license?.grantedCapabilities || [];
  const availableUseCases = filterUseCasesByCapabilities(mockUseCases, userCapabilities);

  const handleUseCaseClick = (useCaseId: string) => {
    navigate(`/use-cases/${useCaseId}`);
  };

  const handleBackClick = () => {
    if (currentUser?.role === 'org_admin') {
      navigate('/admin-dashboard');
    } else {
      navigate('/user-dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackClick}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Terug
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Wat wil je doen met AI?
                </h1>
                <p className="text-slate-600 text-sm mt-1">
                  Kies een toepassing die past bij jouw werkzaamheden
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {availableUseCases.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg">
              Geen toepassingen beschikbaar voor jouw AI-vaardigheden.
            </p>
            <p className="text-slate-500 text-sm mt-2">
              Neem contact op met je organisatiebeheerder voor meer toegang.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {availableUseCases.map((useCase) => (
              <button
                key={useCase.id}
                onClick={() => handleUseCaseClick(useCase.id)}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 text-left border border-slate-200 hover:border-primary/30 group"
              >
                <div className="text-3xl mb-3">{useCase.icon}</div>
                <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                  {useCase.title}
                </h3>
                <p className="text-slate-600 text-sm mt-1">{useCase.description}</p>
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-blue-800 font-medium text-sm">ℹ️ Over deze toepassingen</p>
          <p className="text-blue-700 text-sm mt-1">
            Deze toepassingen zijn goedgekeurd door jouw organisatie en voldoen aan de EU AI Act.
            Elke toepassing laat zien wat wel en niet is toegestaan binnen de richtlijnen.
          </p>
        </div>
      </div>
    </div>
  );
}
