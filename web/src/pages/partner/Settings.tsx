import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export function PartnerSettings() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Settings</h1>
      <div className="max-w-xl space-y-4">
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[#111827]">Change Password</h3>
          <Input label="Current Password" type="password" placeholder="••••••••" />
          <Input label="New Password" type="password" placeholder="••••••••" />
          <Input label="Confirm New Password" type="password" placeholder="••••••••" />
          <Button>Update Password</Button>
        </div>
        <div className="bg-white rounded-[12px] border border-[#E6E8F5] shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[#111827]">Notification Preferences</h3>
          {['New applications', 'Interview reminders', 'Student placement updates'].map(item => (
            <label key={item} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-[#4F46E5]" />
              <span className="text-sm text-[#4B5563]">{item}</span>
            </label>
          ))}
          <Button>Save Preferences</Button>
        </div>
      </div>
    </div>
  )
}
