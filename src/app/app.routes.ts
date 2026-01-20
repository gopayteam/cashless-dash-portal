import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { DashboardComponent } from './pages/dashboard/home/dashboard';
import { StatsComponent } from './pages/dashboard/stats/stats';
import { ReportsComponent } from './pages/dashboard/reports/reports';
import { DailyAnalysisComponent } from './pages/vehicle-analysis/daily/daily';
import { WeeklyAnalysisComponent } from './pages/vehicle-analysis/weekly/weekly';
import { MonthlyAnalysisComponent } from './pages/vehicle-analysis/monthly/monthly';
import { YearlyAnalysisComponent } from './pages/vehicle-analysis/yearly/yearly';
import { ShortTermPredictionComponent } from './pages/prediction/short-term/short-term';
import { PredictionTrendsComponent } from './pages/prediction/trends/trends';
import { LongTermPredictionComponent } from './pages/prediction/long-term/long-term';
import { FailedTransactionsComponent } from './pages/transactions/failed/failed';
import { PendingTransactionsComponent } from './pages/transactions/pending/pending';
import { AllTransactionsComponent } from './pages/transactions/all/all';
import { RevenueComponent } from './pages/revenue/all/all';
import { RevenueByVehicleComponent } from './pages/revenue/by-vehicle/by-vehicle';
import { RevenueByLocationComponent } from './pages/revenue/by-location/by-location';
import { AllVehiclesComponent } from './pages/vehicles/all/all';
import { ActiveVehiclesComponent } from './pages/vehicles/active/active';
import { InactiveVehiclesComponent } from './pages/vehicles/inactive/inactive';
import { MaintenanceVehiclesComponent } from './pages/vehicles/maintenance/maintenance';
import { CustomersComponent } from './pages/users/customers/customers';
import { AdminUserComponent } from './pages/users/admin/admin';
import { DebitTransactionsComponent } from './pages/payments/debit-transactions/debit-transactions';
import { CreditTransactionsComponent } from './pages/payments/credit-transactions/credit-transactions';
import { CreditDriverComponent } from './pages/payments/credit-driver/create-payment';
import { FundReassignmentComponent } from './pages/payments/fund-reassignment/fund-reassignment';
import { ParcelsComponent } from './pages/parcels/all/parcels';
import { ParcelManagersComponent } from './pages/parcels/parcel-managers/parcel-managers';
import { OrganizationWalletComponent } from './pages/finance/organization-wallet/organization-wallet';
import { WithdrawalStatementsComponent } from './pages/finance/statements/statements';
import { ObligationsComponent } from './pages/finance/obligations/obligations';
import { GeneralUserComponent } from './pages/users/general/general';
import { ConductorsComponent } from './pages/users/conductors/conductors';
import { DeactivatedUsersComponent } from './pages/users/deactivated/deactivated';
import { InvestorsComponent } from './pages/users/investors/investors';
import { MarshalsComponent } from './pages/users/marshals/marshals';
import { ParcelSourceComponent } from './pages/parcels/parcel-source/parcel-source';
import { ParcelDestinationComponent } from './pages/parcels/parcel-destination/parcel-destination';
import { LocationStagesComponent } from './pages/locations/stages/stages';
import { LocationRoutesComponent } from './pages/locations/routes/routes';
import { AllDriverAssignmentsComponent } from './pages/driver-assignment/all/all';
import { AllActiveDriverAssignmentsComponent } from './pages/driver-assignment/active/active';
import { AllRejectedDriverAssignmentsComponent } from './pages/driver-assignment/rejected/rejected';
import { AllPendingDriverAssignmentsComponent } from './pages/driver-assignment/pending/pending';
import { UserWallet } from './pages/finance/user-wallet/user-wallet';
import { AllInactiveDriverAssignmentsComponent } from './pages/driver-assignment/inactive/inactive';
import { DriverUserComponent } from './pages/users/driver/driver';
import { UserAudits } from './pages/audits/user-audits/user-audits';
import { SystemAudits } from './pages/audits/system-audits/system-audits';
import { DeletedParcels } from './pages/parcels/deleted-parcels/deleted-parcels';
import { SignInComponent } from './pages/auth/signin/signin';
import { SignUpComponent } from './pages/auth/signup/signup';
import { AuthGuard } from '../@core/services/auth.guard';
import { AllDriversComponent } from './pages/drivers/all/drivers';
import { ActiveDriversComponent } from './pages/drivers/active/drivers';
import { InactiveDriversComponent } from './pages/drivers/inactive/drivers';
import { NotificationsComponent } from './pages/profile/notifications/notifications';
import { SettingsComponent } from './pages/profile/settings/settings';

/* =====================================================
   ROUTES
===================================================== */

export const routes: Routes = [

  /* =======================
     PUBLIC (NO AUTH)
  ======================= */
  {
    path: 'auth',
    children: [
      { path: 'signin', component: SignInComponent },
      { path: 'signup', component: SignUpComponent },
      { path: '', redirectTo: 'signin', pathMatch: 'full' }
    ]
  },

  /* =======================
     PROTECTED (AUTH REQUIRED)
  ======================= */
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [

      /* Dashboard */
      { path: 'dashboard/home', component: DashboardComponent },
      { path: 'dashboard/stats', component: StatsComponent },
      { path: 'dashboard/reports', component: ReportsComponent },

      /* Transactions */
      { path: 'transactions/all', component: AllTransactionsComponent },
      { path: 'transactions/failed', component: FailedTransactionsComponent },
      { path: 'transactions/pending', component: PendingTransactionsComponent },

      /* Payments */
      { path: 'deposits/all', component: DebitTransactionsComponent },
      { path: 'withdrawals/all', component: CreditTransactionsComponent },
      { path: 'transfer-payment/1', component: CreditDriverComponent },
      { path: 'transfer-payment/2', component: FundReassignmentComponent },

      /* Parcels */
      { path: 'parcels/all', component: ParcelsComponent },
      { path: 'parcel-managers', component: ParcelManagersComponent },
      { path: 'parcel-offices/parcel-source', component: ParcelSourceComponent },
      { path: 'parcel-offices/parcel-destination', component: ParcelDestinationComponent },
      { path: 'deleted-parcels', component: DeletedParcels },

      /* Drivers */
      { path: 'drivers/all', component: AllDriversComponent },
      { path: 'drivers/active', component: ActiveDriversComponent },
      { path: 'drivers/inactive', component: InactiveDriversComponent },

      /* Driver assignments */
      { path: 'driver-assignments/all', component: AllDriverAssignmentsComponent },
      { path: 'driver-assignments/active', component: AllActiveDriverAssignmentsComponent },
      { path: 'driver-assignments/inactive', component: AllInactiveDriverAssignmentsComponent },
      { path: 'driver-assignments/rejected', component: AllRejectedDriverAssignmentsComponent },
      { path: 'driver-assignments/pending', component: AllPendingDriverAssignmentsComponent },

      /* Locations */
      { path: 'locations/stages', component: LocationStagesComponent },
      { path: 'locations/routes', component: LocationRoutesComponent },

      /* Vehicles */
      { path: 'vehicles/all', component: AllVehiclesComponent },
      { path: 'vehicles/active', component: ActiveVehiclesComponent },
      { path: 'vehicles/inactive', component: InactiveVehiclesComponent },
      { path: 'vehicles/maintenance', component: MaintenanceVehiclesComponent },

      /* Finance */
      { path: 'wallet/organization', component: OrganizationWalletComponent },
      { path: 'wallet/user', component: UserWallet },
      { path: 'management-statements', component: WithdrawalStatementsComponent },
      { path: 'obligations', component: ObligationsComponent },

      /* Analysis */
      { path: 'vehicle-analysis/daily', component: DailyAnalysisComponent },
      { path: 'vehicle-analysis/weekly', component: WeeklyAnalysisComponent },
      { path: 'vehicle-analysis/monthly', component: MonthlyAnalysisComponent },
      { path: 'vehicle-analysis/yearly', component: YearlyAnalysisComponent },

      /* Prediction */
      { path: 'prediction/short-term', component: ShortTermPredictionComponent },
      { path: 'prediction/long-term', component: LongTermPredictionComponent },
      { path: 'prediction/trends', component: PredictionTrendsComponent },

      /* Revenue */
      { path: 'revenue/all', component: RevenueComponent },
      { path: 'revenue/by-vehicle', component: RevenueByVehicleComponent },
      { path: 'revenue/by-location', component: RevenueByLocationComponent },

      /* Users */
      { path: 'users/all', component: GeneralUserComponent },
      { path: 'users/admins', component: AdminUserComponent },
      { path: 'users/conductors', component: ConductorsComponent },
      { path: 'users/drivers', component: DriverUserComponent },
      { path: 'users/customers', component: CustomersComponent },
      { path: 'users/deactivated', component: DeactivatedUsersComponent },
      { path: 'users/investors', component: InvestorsComponent },
      { path: 'users/marshals', component: MarshalsComponent },

      /* Audits */
      { path: 'audits/all', component: SystemAudits },
      { path: 'audits/user', component: UserAudits },

      /* Profile */
      { path: 'dashboard/notifications', component: NotificationsComponent },
      { path: 'dashboard/profile', component: SettingsComponent },

      /* Default protected redirect */
      { path: '', redirectTo: 'dashboard/home', pathMatch: 'full' }
    ]
  },

  /* =======================
     FALLBACK
  ======================= */
  { path: '**', redirectTo: 'auth/signin' }
];
