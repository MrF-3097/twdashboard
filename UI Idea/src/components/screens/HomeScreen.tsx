import { DashboardHeader } from '../DashboardHeader';
import { MonthlyKPICard } from '../MonthlyKPICard';
import { YTDCard } from '../YTDCard';
import { TransactionStats } from '../TransactionStats';
import { CommissionChart } from '../CommissionChart';
import { QuickActions } from '../QuickActions';

interface HomeScreenProps {
  onSwitchProfile: () => void;
}

export function HomeScreen({ onSwitchProfile }: HomeScreenProps) {
  return (
    <div className="h-full overflow-y-auto pb-24 bg-[#F8FAFC]">
      <DashboardHeader onSwitchProfile={onSwitchProfile} />
      <MonthlyKPICard />
      <YTDCard />
      <TransactionStats />
      <CommissionChart />
      <QuickActions />
    </div>
  );
}
