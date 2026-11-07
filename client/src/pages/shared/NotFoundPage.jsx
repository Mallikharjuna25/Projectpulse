import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/common/Button.jsx';
import { Card } from '../../components/common/Card.jsx';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-center">
      <Card className="max-w-md p-8">
        <div className="text-5xl font-black text-brand-600 dark:text-brand-400 mb-2">404</div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Page Not Found</h1>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          The requested page does not exist, was moved, or belongs to another college tenant that you cannot access.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/">
            <Button size="sm" icon={Home}>
              Return Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

