import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="kirana-card p-8 text-center max-w-md mx-auto my-12">
      <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold mb-4">
        404
      </div>
      <h1 className="text-xl font-bold text-slate-800">पेज नहीं मिला / Page Not Found</h1>
      <p className="text-sm text-slate-500 mt-2">
        The requested screen does not exist or will be available in future phases.
      </p>
      <div className="mt-6 flex justify-center">
        <Link to="/">
          <Button variant="primary" className="gap-2">
            <Home className="w-4 h-4" />
            होम पेज पर जाएं (Go Home)
          </Button>
        </Link>
      </div>
    </div>
  );
};
