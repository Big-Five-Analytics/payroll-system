import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { forgotPassword } from '../../services/authService';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async ({ email }) => {
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong, please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-950 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold text-gray-900">Forgot Password</h1>
          <p className="text-sm text-gray-500 mt-1">
            {submitted
              ? "We've notified an administrator"
              : "Enter your email and an administrator will be notified to help you regain access"}
          </p>
        </div>

        {submitted ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600 text-center">
              If an account exists with that email, an administrator has been notified and will
              reach out with a new password.
            </p>
            <Link to="/login">
              <Button className="w-full">Back to Sign In</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@bigfive.com"
              error={errors.email?.message}
              {...register('email', { required: 'Email is required' })}
            />
            <Button type="submit" disabled={submitting} className="w-full mt-2">
              {submitting ? 'Submitting...' : 'Request Reset'}
            </Button>
            <Link to="/login" className="text-sm text-center text-gray-500 hover:text-brand-600">
              Back to Sign In
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
