import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🎉 Inventory Management System
        </h1>
        <p className="text-gray-600">
          The application is loading successfully!
        </p>
        <div className="mt-4 space-y-2">
          <div className="bg-green-100 text-green-800 p-2 rounded">
            ✅ React is working
          </div>
          <div className="bg-blue-100 text-blue-800 p-2 rounded">
            ✅ TailwindCSS is working
          </div>
          <div className="bg-purple-100 text-purple-800 p-2 rounded">
            🚀 Ready to start!
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
