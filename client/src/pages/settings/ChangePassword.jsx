import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { changePassword } from '../../services/authService';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function ChangePassword() {
  const { user, setUser } = useAuth();
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async ({ currentPassword, newPassword }) => {
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setUser((u) => ({ ...u, mustChangePassword: false }));
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  return (
    <div className="max-w-md flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Change Password</h1>
        <p className="text-sm text-gray-500">Update the password used to sign in</p>
      </div>

      {user?.mustChangePassword && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <ShieldAlert size={18} className="mt-0.5 shrink-0" />
          <p>
            You're still using the default password your administrator set for this account.
            We recommend changing it now.
          </p>
        </div>
      )}

      <Card className="p-6">
        <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
          <Input
            label="Current Password"
            type="password"
            error={errors.currentPassword?.message}
            {...register('currentPassword', { required: 'Required' })}
          />
          <Input
            label="New Password"
            type="password"
            error={errors.newPassword?.message}
            {...register('newPassword', {
              required: 'Required',
              minLength: { value: 8, message: 'At least 8 characters' },
              pattern: { value: /\d/, message: 'Must include at least one number' },
            })}
          />
          <Input
            label="Confirm New Password"
            type="password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Required',
              validate: (value) => value === watch('newPassword') || 'Passwords do not match',
            })}
          />
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="mt-2">
            {isSubmitting ? 'Saving...' : 'Change Password'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
