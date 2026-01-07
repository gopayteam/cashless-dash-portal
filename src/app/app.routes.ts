import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { StatsComponent } from './pages/dashboard/stats/stats';
import { ReportsComponent } from './pages/dashboard/reports/reports';
import { DailyAnalysisComponent } from './pages/vehicle-analysis/daily/daily';
import { WeeklyAnalysisComponent } from './pages/vehicle-analysis/weekly/weekly';
import { MonthlyAnalysisComponent } from './pages/vehicle-analysis/monthly/monthly';
import { YearlyAnalysisComponent } from './pages/vehicle-analysis/yearly/yearly';
import { ShortTermPredictionComponent } from './pages/prediction/short-term/short-term';
import { PredictionTrendsComponent } from './pages/prediction/trends/trends';
import { LongTermPredictionComponent } from './pages/prediction/long-term/long-term';
import { CompletedTransactionsComponent } from './pages/transactions/completed/completed';
import { FailedTransactionsComponent } from './pages/transactions/failed/failed';
import { PendingTransactionsComponent } from './pages/transactions/pending/pending';
import { TransactionsComponent } from './pages/transactions/all/all';
import { RevenueComponent } from './pages/revenue/all/all';
import { RevenueByVehicleComponent } from './pages/revenue/by-vehicle/by-vehicle';
import { RevenueByLocationComponent } from './pages/revenue/by-location/by-location';
import { AllVehiclesComponent } from './pages/vehicles/all/all';
import { ActiveVehiclesComponent } from './pages/vehicles/active/active';
import { InactiveVehiclesComponent } from './pages/vehicles/inactive/inactive';
import { MaintenanceVehiclesComponent } from './pages/vehicles/maintenance/maintenance';
import { DriversComponent } from './pages/users/drivers/drivers';
import { CustomersComponent } from './pages/users/customers/customers';
import { AdminUserComponent } from './pages/users/admin/admin';
import { LocationsComponent } from './pages/locations/locations';
import { DebitTransactionsComponent } from './pages/payments/debit-transactions/debit-transactions';
import { CreditTransactionsComponent } from './pages/payments/credit-transactions/credit-transactions';
import { CreditDriverComponent } from './pages/payments/credit-driver/create-payment';
import { FundReassignmentComponent } from './pages/payments/fund-reassignment/fund-reassignment';
import { ParcelsComponent } from './pages/parcels/all/parcels';
import { ParcelManagersComponent } from './pages/parcels/parcel-managers/parcel-managers';
import { ParcelOfficesComponent } from './pages/parcels/parcel-offices/parcel-offices';
import { DriverAssignmentComponent } from './pages/driver-assignment/driver-assignment';
import { OrganizationWalletComponent } from './pages/finance/organization-wallet/organization-wallet';
import { WithdrawalStatementsComponent } from './pages/finance/statements/statements';
import { ObligationsComponent } from './pages/finance/obligations/obligations';
import { GeneralUserComponent } from './pages/users/general/general';
import { ConductorsComponent } from './pages/users/conductors/conductors';
import { DeactivatedUsersComponent } from './pages/users/deactivated/deactivated';
import { InvestorsComponent } from './pages/users/investors/investors';
import { MarshalsComponent } from './pages/users/marshals/marshals';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'dashboard/home', component: DashboardComponent },
      { path: 'dashboard/stats', component: StatsComponent },
      { path: 'dashboard/reports', component: ReportsComponent },

      { path: 'transactions/all', component: TransactionsComponent },
      { path: 'transactions/completed', component: CompletedTransactionsComponent },
      { path: 'transactions/failed', component: FailedTransactionsComponent },
      { path: 'transactions/pending', component: PendingTransactionsComponent },

      { path: 'deposits/all', component: DebitTransactionsComponent },
      { path: 'withdrawals/all', component: CreditTransactionsComponent },
      { path: 'withdrawals/all', component: CreditTransactionsComponent },
      { path: 'transfer-payment/1', component: CreditDriverComponent },
      { path: 'transfer-payment/2', component: FundReassignmentComponent },

      { path: 'drivers', component: DriversComponent },
      { path: 'parcels/all', component: ParcelsComponent },
      { path: 'parcel-managers', component: ParcelManagersComponent },
      { path: 'parcel-Offices', component: ParcelOfficesComponent },

      { path: 'driver-assignments', component: DriverAssignmentComponent },

      { path: 'locations/all', component: LocationsComponent },

      { path: 'vehicles/all', component: AllVehiclesComponent },
      { path: 'vehicles/active', component: ActiveVehiclesComponent },
      { path: 'vehicles/inactive', component: InactiveVehiclesComponent },
      { path: 'vehicles/maintenance', component: MaintenanceVehiclesComponent },

      { path: 'organization-wallet', component: OrganizationWalletComponent },
      { path: 'management-statements', component: WithdrawalStatementsComponent },
      { path: 'obligations', component: ObligationsComponent },

      { path: 'vehicle-analysis/daily', component: DailyAnalysisComponent },
      { path: 'vehicle-analysis/weekly', component: WeeklyAnalysisComponent },
      { path: 'vehicle-analysis/monthly', component: MonthlyAnalysisComponent },
      { path: 'vehicle-analysis/yearly', component: YearlyAnalysisComponent },

      { path: 'prediction/short-term', component: ShortTermPredictionComponent },
      { path: 'prediction/long-term', component: LongTermPredictionComponent },
      { path: 'prediction/trends', component: PredictionTrendsComponent },

      { path: 'revenue/all', component: RevenueComponent },
      { path: 'revenue/by-vehicle', component: RevenueByVehicleComponent },
      { path: 'revenue/by-location', component: RevenueByLocationComponent },

      { path: 'users/all', component: GeneralUserComponent },
      { path: 'users/admins', component: AdminUserComponent },
      { path: 'users/conductors', component: ConductorsComponent },
      { path: 'users/drivers', component: DriversComponent },
      { path: 'users/customers', component: CustomersComponent },
      { path: 'users/deactivated', component: DeactivatedUsersComponent },
      { path: 'users/inactive', component: DeactivatedUsersComponent },
      { path: 'users/investors', component: InvestorsComponent },
      { path: 'users/marshals', component: MarshalsComponent },

      { path: '', redirectTo: '/dashboard/home', pathMatch: 'full' },
    ],
  },

  { path: '**', redirectTo: '/dashboard/home' },
];
