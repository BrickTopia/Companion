import { Card } from '@/components/ui/card';
import { Search, Info, Settings, Camera } from 'lucide-react';
import { useState } from 'react';
import IngredientList from '@/components/ingredients/IngredientList';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [activeTab, setActiveTab] = useState('ingredients');
  const navigate = useNavigate();

  const renderContent = () => {
    switch (activeTab) {
      case 'ingredients':
        return <IngredientList />;
      case 'info':
        return (
          <Card className="bg-white/50 backdrop-blur-sm shadow-sm p-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Information
            </h2>
            <p className="text-gray-600">
              Learn about celiac safety and how to use this app effectively.
            </p>
          </Card>
        );
      case 'settings':
        return <SettingsPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-pastel-blue/20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/70 backdrop-blur-sm border-b border-white/20 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Celiac Safe</h1>
          {activeTab === 'ingredients' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/scan')}
              className="ml-2"
            >
              <Camera className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 pt-20 pb-20 animate-fade-in">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-sm border-t border-white/20 z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-around py-2">
            <button
              onClick={() => setActiveTab('ingredients')}
              className={`p-2 rounded-lg flex flex-col items-center transition-colors ${
                activeTab === 'ingredients'
                  ? 'bg-pastel-blue/20 text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:bg-pastel-blue/10'
              }`}
            >
              <Search size={24} />
              <span className="text-xs mt-1">Search</span>
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`p-2 rounded-lg flex flex-col items-center transition-colors ${
                activeTab === 'info'
                  ? 'bg-pastel-blue/20 text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:bg-pastel-blue/10'
              }`}
            >
              <Info size={24} />
              <span className="text-xs mt-1">Info</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`p-2 rounded-lg flex flex-col items-center transition-colors ${
                activeTab === 'settings'
                  ? 'bg-pastel-blue/20 text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:bg-pastel-blue/10'
              }`}
            >
              <Settings size={24} />
              <span className="text-xs mt-1">Settings</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Index;
