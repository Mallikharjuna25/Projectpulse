import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';
import { Button } from '../../components/common/Button.jsx';
import { Card } from '../../components/common/Card.jsx';

export const ForbiddenPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-center">
      <Card className="max-w-md p-8">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="text-3xl font-black text-rose-600 dark:text-rose-400 mb-1">403</div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Access Forbidden</h1>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          You do not have permission to access this resource or view records from another college tenant.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/">
            <Button size="sm" icon={Home}>
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

