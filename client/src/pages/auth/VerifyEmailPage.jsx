import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { authApi } from '../../services/authApi.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setSuccess(false);
      setMessage('No verification token provided in URL.');
      return;
    }

    const verify = async () => {
      try {
        const res = await authApi.verifyEmail(token);
        setSuccess(true);
        setMessage(res.message || 'Your email has been verified successfully!');
      } catch (err) {
        setSuccess(false);
        setMessage(err.message || 'Verification link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card className="p-8 text-center">
          {loading ? (
            <div className="py-8">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                Verifying your institutional email...
              </p>
            </div>
          ) : success ? (
            <div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Email Verified!</h2>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {message}
              </p>
              <div className="mt-6">
                <Link to="/login">
                  <Button size="md" className="w-full" icon={ArrowRight}>
                    Sign In to Your Workspace
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verification Failed</h2>
              <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 leading-relaxed">
                {message}
              </p>
              <div className="mt-6">
                <Link to="/login">
                  <Button variant="secondary" size="md" className="w-full">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

