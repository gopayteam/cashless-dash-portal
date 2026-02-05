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
import { DeletedParcelsComponent } from './pages/parcels/deleted-parcels/deleted-parcels';
import { SignInComponent } from './pages/auth/signin/signin';
import { SignUpComponent } from './pages/auth/signup/signup';
import { AuthGuard } from '../@core/services/auth.guard';
import { AllDriversComponent } from './pages/drivers/all/drivers';
import { ActiveDriversComponent } from './pages/drivers/active/drivers';
import { InactiveDriversComponent } from './pages/drivers/inactive/drivers';
import { NotificationsComponent } from './pages/profile/notifications/notifications';
import { SettingsComponent } from './pages/profile/settings/settings';
import { roleGuard } from '../@core/services/role.guard';
import { UserProfileComponent } from './pages/profile/update-profile/update-profile';
import { AddVehicleComponent } from './pages/forms/vehicle/add-vehicle/add-vehicle';
import { RegisterParcelManagerComponent } from './pages/forms/parcel_manager/register-parcel-manager/register-parcel-manager';
import { UpdateParcelManagerComponent } from './pages/forms/parcel_manager/update-parcel-manager/update-parcel-manager';
import { ParcelManagerUsersComponent } from './pages/users/parcel-managers/parcel-managers';
import { RegisterAdminComponent } from './pages/forms/admin/register-admin/register-admin';
import { UpdateAdminComponent } from './pages/forms/admin/update-admin/update-admin';
import { RegisterUserComponent } from './pages/forms/user/register-user/register-user';
import { UpdateUserComponent } from './pages/forms/user/update-user/update-user';
import { RegisterConductorComponent } from './pages/forms/conductor/register-conductor/register-conductor';
import { UpdateConductorComponent } from './pages/forms/conductor/update-conductor/update-conductor';
import { RegisterPassengerComponent } from './pages/forms/passenger/register-passenger/register-passenger';
import { UpdatePassengerComponent } from './pages/forms/passenger/update-passenger/update-passenger';
import { RegisterDriverComponent } from './pages/forms/driver/register-driver/register-driver';
import { UpdateDriverComponent } from './pages/forms/driver/update-driver/update-driver';
import { UpdateInvestorComponent } from './pages/forms/investor/update-investor/update-investor';
import { RegisterInvestorComponent } from './pages/forms/investor/register-investor/register-investor';
import { RegisterMarshalComponent } from './pages/forms/marshal/register-marshal/register-marshal';
import { UpdateMarshalComponent } from './pages/forms/marshal/update-marshal/update-marshal';
import { ApproversComponent } from './pages/users/approvers/approvers';
import { InspectorsComponent } from './pages/users/inspectors/inspectors';
import { DashmastersComponent } from './pages/users/dashmasters/dashmasters';
import { UpdateDashmasterComponent } from './pages/forms/dashmaster/update-dashmaster/update-dashmaster';
import { RegisterDashmasterComponent } from './pages/forms/dashmaster/register-dashmaster/register-dashmaster';
import { UpdateApproverComponent } from './pages/forms/approver/update-approver/update-approver';
import { RegisterApproverComponent } from './pages/forms/approver/register-approver/register-approver';
import { RegisterInspectorComponent } from './pages/forms/inspector/register-inspector/register-inspector';
import { UpdateInspectorComponent } from './pages/forms/inspector/update-inspector/update-inspector';
import { UpdateVehicleComponent } from './pages/forms/vehicle/update-vehicle/update-vehicle';

/* =====================================================
   ROUTES WITH ROLE-BASED ACCESS CONTROL
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
      {
        path: 'dashboard/home',
        component: DashboardComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_DASHBOARD'] }
      },
      {
        path: 'dashboard/stats',
        component: StatsComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_DASHBOARD'] }
      },
      {
        path: 'dashboard/reports',
        component: ReportsComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_DASHBOARD'] }
      },

      /* Transactions */
      {
        path: 'transactions/all',
        component: AllTransactionsComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_TRANSACTIONS'] }
      },
      {
        path: 'transactions/failed',
        component: FailedTransactionsComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_TRANSACTIONS'] }
      },
      {
        path: 'transactions/pending',
        component: PendingTransactionsComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_TRANSACTIONS'] }
      },

      /* Payments */
      {
        path: 'deposits/all',
        component: DebitTransactionsComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_TRANSACTIONS'] }
      },
      {
        path: 'withdrawals/all',
        component: CreditTransactionsComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_TRANSACTIONS'] }
      },
      {
        path: 'transfer-payment/1',
        component: CreditDriverComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_ADD', 'CAN_EDIT'] }
      },
      {
        path: 'transfer-payment/2',
        component: FundReassignmentComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_ADD', 'CAN_EDIT'] }
      },

      /* Parcels */
      {
        path: 'parcels/all',
        component: ParcelsComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_MANAGE_PARCELS'] }
      },
      {
        path: 'parcel-managers',
        component: ParcelManagersComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_MANAGE_PARCELS'] }
      },
      {
        path: 'parcel-offices/parcel-source',
        component: ParcelSourceComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_MANAGE_PARCELS'] }
      },
      {
        path: 'parcel-offices/parcel-destination',
        component: ParcelDestinationComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_MANAGE_PARCELS'] }
      },
      {
        path: 'deleted-parcels',
        component: DeletedParcelsComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_MANAGE_PARCELS', 'CAN_DELETE'] }
      },

      /* Drivers */
      {
        path: 'drivers/all',
        component: AllDriversComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_DRIVERS', 'CAN_VIEW_DRIVER'] }
      },
      {
        path: 'drivers/active',
        component: ActiveDriversComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_DRIVERS', 'CAN_VIEW_DRIVER'] }
      },
      {
        path: 'drivers/inactive',
        component: InactiveDriversComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_DRIVERS', 'CAN_VIEW_DRIVER'] }
      },

      /* Driver assignments */
      {
        path: 'driver-assignments/all',
        component: AllDriverAssignmentsComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_DRIVER_FLEET_REQUESTS', 'CAN_VIEW_DRIVER_FLEET'] }
      },
      {
        path: 'driver-assignments/active',
        component: AllActiveDriverAssignmentsComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_DRIVER_FLEET_REQUESTS', 'CAN_VIEW_DRIVER_FLEET'] }
      },
      {
        path: 'driver-assignments/inactive',
        component: AllInactiveDriverAssignmentsComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_DRIVER_FLEET_REQUESTS', 'CAN_VIEW_DRIVER_FLEET'] }
      },
      {
        path: 'driver-assignments/rejected',
        component: AllRejectedDriverAssignmentsComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_DRIVER_FLEET_REQUESTS', 'CAN_REJECT_DRIVER'] }
      },
      {
        path: 'driver-assignments/pending',
        component: AllPendingDriverAssignmentsComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_DRIVER_FLEET_REQUEST', 'CAN_APPROVE_DRIVER_FLEET'] }
      },

      /* Locations */
      {
        path: 'locations/stages',
        component: LocationStagesComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_STAGES', 'CAN_VIEW_STAGE', 'CAN_VIEW_LOCATIONS'] }
      },
      {
        path: 'locations/routes',
        component: LocationRoutesComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_ROUTES', 'CAN_VIEW_ROUTE', 'CAN_VIEW_LOCATIONS'] }
      },

      /* Vehicles */
      {
        path: 'vehicles/all',
        component: AllVehiclesComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_VEHICLES', 'CAN_VIEW_VEHICLE'] }
      },
      {
        path: 'vehicles/active',
        component: ActiveVehiclesComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_VEHICLES', 'CAN_VIEW_VEHICLE'] }
      },
      {
        path: 'vehicles/inactive',
        component: InactiveVehiclesComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_VEHICLES', 'CAN_VIEW_VEHICLE'] }
      },
      {
        path: 'vehicles/maintenance',
        component: MaintenanceVehiclesComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_VEHICLES', 'CAN_VIEW_VEHICLE', 'CAN_EDIT_VEHICLE'] }
      },

      /* Finance */
      {
        path: 'wallet/organization',
        component: OrganizationWalletComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_MANAGE_ORGANIZATION_WALLETS', 'CAN_MANAGE_ORG_WALLETS'] }
      },
      {
        path: 'wallet/user',
        component: UserWallet,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW'] }
      },
      {
        path: 'management-statements',
        component: WithdrawalStatementsComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_TRANSACTIONS', 'CAN_MANAGE_ORG_WALLETS'] }
      },
      {
        path: 'obligations',
        component: ObligationsComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_TRANSACTIONS', 'CAN_MANAGE_ORG_WALLETS'] }
      },

      /* Analysis */
      {
        path: 'vehicle-analysis/daily',
        component: DailyAnalysisComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_DASHBOARD', 'CAN_VIEW_VEHICLES'] }
      },
      {
        path: 'vehicle-analysis/weekly',
        component: WeeklyAnalysisComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_DASHBOARD', 'CAN_VIEW_VEHICLES'] }
      },
      {
        path: 'vehicle-analysis/monthly',
        component: MonthlyAnalysisComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_DASHBOARD', 'CAN_VIEW_VEHICLES'] }
      },
      {
        path: 'vehicle-analysis/yearly',
        component: YearlyAnalysisComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_DASHBOARD', 'CAN_VIEW_VEHICLES'] }
      },

      /* Prediction */
      {
        path: 'prediction/short-term',
        component: ShortTermPredictionComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_DASHBOARD', 'CAN_VIEW_TRANSACTIONS'] }
      },
      {
        path: 'prediction/long-term',
        component: LongTermPredictionComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_DASHBOARD', 'CAN_VIEW_TRANSACTIONS'] }
      },
      {
        path: 'prediction/trends',
        component: PredictionTrendsComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_DASHBOARD', 'CAN_VIEW_TRANSACTIONS'] }
      },

      /* Revenue */
      {
        path: 'revenue/all',
        component: RevenueComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_TRANSACTIONS', 'CAN_VIEW_DASHBOARD'] }
      },
      {
        path: 'revenue/by-vehicle',
        component: RevenueByVehicleComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_TRANSACTIONS', 'CAN_VIEW_VEHICLES'] }
      },
      {
        path: 'revenue/by-location',
        component: RevenueByLocationComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_TRANSACTIONS', 'CAN_VIEW_LOCATIONS'] }
      },

      /* Users */
      {
        path: 'users/all',
        component: GeneralUserComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_USERS', 'CAN_VIEW_USER'] }
      },
      {
        path: 'users/admins',
        component: AdminUserComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_ADMINS'] }
      },
      {
        path: 'users/conductors',
        component: ConductorsComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_TOUTS'] }
      },
      {
        path: 'users/super-drivers',
        component: DriverUserComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_DRIVERS', 'CAN_VIEW_DRIVER'] }
      },
      {
        path: 'users/passengers',
        component: CustomersComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_CUSTOMERS', 'CAN_VIEW_CUSTOMER', 'CAN_VIEW_PASSENGERS'] }
      },
      {
        path: 'users/deactivated',
        component: DeactivatedUsersComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_USERS', 'CAN_DELETE_USER'] }
      },
      {
        path: 'users/investors',
        component: InvestorsComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_INVESTORS', 'CAN_VIEW_INVESTOR'] }
      },
      {
        path: 'users/marshals',
        component: MarshalsComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_USERS'] }
      },
      {
        path: 'users/parcel-managers',
        component: ParcelManagerUsersComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_USERS'] }
      },

      {
        path: 'users/inspectors',
        component: InspectorsComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_USERS'] }
      },

      {
        path: 'users/dashmasters',
        component: DashmastersComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_USERS'] }
      },

      {
        path: 'users/approvers',
        component: ApproversComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_USERS'] }
      },

      /* Audits */
      {
        path: 'audits/all',
        component: SystemAudits,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_ADMINS', 'CAN_VIEW_DASHBOARD'] }
      },
      {
        path: 'audits/user',
        component: UserAudits,
        canActivate: [roleGuard],
        data: { roles: ['CAN_VIEW_USERS', 'CAN_VIEW_ADMINS'] }
      },

      /* Profile - accessible to all authenticated users */
      {
        path: 'dashboard/notifications',
        component: NotificationsComponent
      },
      {
        path: 'dashboard/settings',
        component: SettingsComponent
      },
      {
        path: 'dashboard/profile',
        component: UserProfileComponent
      },

      /* Forms */

      {
        path: 'forms/register-user',
        component: RegisterUserComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_ADD_USER'] }
      },

      {
        path: 'forms/update-user/:id',
        component: UpdateUserComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_EDIT_USER'] }
      },

      {
        path: 'forms/register-admin',
        component: RegisterAdminComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_ADD_USER'] }
      },

      {
        path: 'forms/update-admin/:id',
        component: UpdateAdminComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_EDIT_USER'] }
      },

      {
        path: 'forms/register-conductor',
        component: RegisterConductorComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_ADD_USER'] }
      },

      {
        path: 'forms/update-conductor/:id',
        component: UpdateConductorComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_EDIT_USER'] }
      },

      {
        path: 'forms/register-passenger',
        component: RegisterPassengerComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_ADD_USER'] }
      },

      {
        path: 'forms/update-passenger/:id',
        component: UpdatePassengerComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_EDIT_USER'] }
      },

      {
        path: 'forms/register-driver',
        component: RegisterDriverComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_ADD_USER'] }
      },

      {
        path: 'forms/update-driver/:id',
        component: UpdateDriverComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_EDIT_USER'] }
      },

      {
        path: 'forms/register-investor',
        component: RegisterInvestorComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_ADD_USER'] }
      },

      {
        path: 'forms/update-investor/:id',
        component: UpdateInvestorComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_EDIT_USER'] }
      },

      {
        path: 'forms/register-marshal',
        component: RegisterMarshalComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_ADD_USER'] }
      },

      {
        path: 'forms/update-marshal/:id',
        component: UpdateMarshalComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_EDIT_USER'] }
      },


      {
        path: 'forms/add-vehicle',
        component: AddVehicleComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_ADD_VEHICLE', 'CAN_EDIT_VEHICLE'] }
      },

      {
        path: 'forms/update-vehicle/:id',
        component: UpdateVehicleComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_ADD_VEHICLE', 'CAN_EDIT_VEHICLE'] }
      },

      {
        path: 'forms/add-parcel-manager',
        component: RegisterParcelManagerComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_ADD_USER'] }
      },

      {
        path: 'forms/update-parcel-manager/:id',
        component: UpdateParcelManagerComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_EDIT_USER'] }
      },

      {
        path: 'forms/register-dashmaster',
        component: RegisterDashmasterComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_ADD_USER'] }
      },

      {
        path: 'forms/update-dashmaster/:id',
        component: UpdateDashmasterComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_EDIT_USER'] }
      },

      {
        path: 'forms/register-approver',
        component: RegisterApproverComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_ADD_USER'] }
      },

      {
        path: 'forms/update-approver/:id',
        component: UpdateApproverComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_EDIT_USER'] }
      },

      {
        path: 'forms/register-inspector',
        component: RegisterInspectorComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_ADD_USER'] }
      },

      {
        path: 'forms/update-inspector/:id',
        component: UpdateInspectorComponent,
        canActivate: [roleGuard],
        data: { roles: ['CAN_EDIT_USER'] }
      },

      /* Default protected redirect */
      { path: '', redirectTo: 'dashboard/home', pathMatch: 'full' }
    ]
  },

  /* =======================
     FALLBACK
  ======================= */
  { path: '**', redirectTo: 'auth/signin' }
];
