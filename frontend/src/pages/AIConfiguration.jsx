import { useState, useEffect } from 'react';
import { CogIcon, KeyIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const AIConfiguration = () => {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [isUsingCustomKey, setIsUsingCustomKey] = useState(false);
  const [message, setMessage] = useState('');
  const [currentWorkingModel, setCurrentWorkingModel] = useState('gemini-2.5-flash');

  const models = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
  ];

  const defaultModel = 'gemini-2.5-flash'; // Default from .env

  useEffect(() => {
    // Check if this is a page refresh or tab navigation
    const isPageRefresh = !sessionStorage.getItem('appInitialized');
    
    if (isPageRefresh) {
      // Only reset on actual page refresh
      localStorage.removeItem('customApiKey');
      localStorage.setItem('selectedModel', defaultModel);
      localStorage.setItem('isUsingCustomKey', 'false');
      sessionStorage.setItem('appInitialized', 'true');
    }
    
    // Always clear input fields for security
    setApiKey('');
    
    // Load current configuration from localStorage
    const savedKeyStatus = localStorage.getItem('isUsingCustomKey') === 'true';
    const savedModel = localStorage.getItem('selectedModel') || defaultModel;
    
    setIsUsingCustomKey(savedKeyStatus);
    setSelectedModel(savedModel);
    setCurrentWorkingModel(savedModel);
    
    // Validate saved model exists
    if (!models.some(m => m.id === savedModel)) {
      localStorage.setItem('selectedModel', defaultModel);
      setSelectedModel(defaultModel);
      setCurrentWorkingModel(defaultModel);
    }
  }, []);

  const handleSaveConfiguration = () => {
    if (!apiKey.trim()) {
      setMessage('❌ Please enter an API key');
      return;
    }

    // Validate selected model exists
    const modelExists = models.some(m => m.id === selectedModel);
    const modelToSave = modelExists ? selectedModel : defaultModel;

    localStorage.setItem('customApiKey', apiKey);
    localStorage.setItem('selectedModel', modelToSave);
    localStorage.setItem('isUsingCustomKey', 'true');
    setIsUsingCustomKey(true);
    setCurrentWorkingModel(modelToSave);
    setMessage('✅ Configuration saved successfully!');
    
    setTimeout(() => setMessage(''), 3000);
  };

  const handleUseDefaultKey = () => {
    // Reset everything to defaults and clear custom API key
    localStorage.removeItem('customApiKey'); // Clear custom API key
    localStorage.setItem('isUsingCustomKey', 'false');
    localStorage.setItem('selectedModel', defaultModel);
    setIsUsingCustomKey(false);
    setCurrentWorkingModel(defaultModel);
    setSelectedModel(defaultModel); // Reset UI selector too
    setApiKey(''); // Clear input field
    setMessage('✅ Switched to default configuration');
    
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <header className="flex items-center gap-4">
        <div className="bg-blue-100 p-3 rounded-xl">
          <CogIcon className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">AI Configuration</h1>
          <p className="mt-2 text-lg text-gray-500 font-medium">Configure your AI model and API settings</p>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
        {/* Current Status */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <CheckCircleIcon className="h-6 w-6 mr-2 text-green-500" />
            Current Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">API Key Status</p>
              <p className={`text-lg font-bold ${isUsingCustomKey ? 'text-blue-600' : 'text-green-600'}`}>
                {isUsingCustomKey ? 'Using Custom Key' : 'Using Default Key'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Current Working Model</p>
              <p className="text-lg font-bold text-purple-600">
                {models.find(m => m.id === currentWorkingModel)?.name || 'Gemini 2.5 Flash'}
              </p>
              <p className="text-xs text-gray-500">
                {isUsingCustomKey ? '(Custom Configuration)' : '(Default Configuration)'}
              </p>
            </div>
          </div>
        </div>

        {/* Model Selection */}
        <div className="space-y-4">
          <label className="text-lg font-bold text-gray-900">AI Model Selection</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          >
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500">Select the AI model to use for interview analysis</p>
        </div>

        {/* API Key Input */}
        <div className="space-y-4">
          <label className="text-lg font-bold text-gray-900 flex items-center">
            <KeyIcon className="h-6 w-6 mr-2 text-blue-500" />
            API Key Configuration
          </label>
          <div className="relative">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key here..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg pr-12"
            />
            <KeyIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">
            Enter your own API key to use instead of the default project key
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={handleSaveConfiguration}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-2"
          >
            <CheckCircleIcon className="h-5 w-5" />
            Use Custom Key
          </button>
          
          <button
            onClick={handleUseDefaultKey}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg"
          >
            Use Default Key
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-xl font-bold text-sm ${
            message.includes('✅') 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Information */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h4 className="font-bold text-blue-900 mb-2">Important Notes:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your API key is stored locally in your browser</li>
            <li>• Custom keys will be used for all AI analysis requests</li>
            <li>• You can switch back to default key anytime</li>
            <li>• Make sure your API key has sufficient credits</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AIConfiguration;