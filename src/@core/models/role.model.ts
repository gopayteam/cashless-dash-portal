export enum Role {
  Admin = 'Admin',
  Client = 'Client',
  User = 'User',
}



// {
//     "status": 0,
//     "message": "Login successfully.",
//     "data": {
//         "token": "eytokennoonecalguess",
//         "email": "super.metro@gmail.com",
//         "channel": "PORTAL",
//         "profile": "SUPER_METRO_ADMIN",
//         "lastName": "Admin",
//         "entityId": "GS000002",
//         "firstName": "SuperMetro",
//         "firstLogin": false,
//         "username": "super.metro@gmail.com",
//         "phoneNumber": "254712345678",
//         "roles": [
//             {
//                 "name": "CAN_APPROVE_DRIVER_FLEET",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_REJECT_DRIVER",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_APPROVE_DRIVER",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_DRIVER_FLEET_REQUEST",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_DRIVER_FLEET",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_DRIVER_FLEET_REQUESTS",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_LOCATIONS",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_WORKFLOWS",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_DELETE_ROLE",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_EDIT_ROLE",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_ADD_ROLE",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_ROLES",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_ROLE",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_DELETE_PROFILE",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_EDIT_PROFILE",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_ADD_PROFILE",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_PROFILES",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_PROFILE",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_RBAC",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_PASSENGERS",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_PASSENGER",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_CUSTOMERS",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_CUSTOMER",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_TOUTS",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_DRIVERS",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_DRIVER",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_INVESTORS",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_INVESTOR",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_ADMINS",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_DELETE_USER",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_EDIT_USER",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_ADD_USER",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_USERS",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_USER",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_DELETE_ROUTE",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_EDIT_ROUTE",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_ADD_ROUTE",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_ROUTES",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_ROUTE",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_DELETE_STAGE",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_EDIT_STAGE",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_ADD_STAGE",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_STAGES",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_STAGE",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_DELETE_VEHICLE",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_EDIT_VEHICLE",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_ADD_VEHICLE",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_VEHICLES",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_VEHICLE",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_EDIT_ORGANIZATION",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_ORGANIZATIONS",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_ORGANIZATION",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_TRANSACTIONS",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_DELETE_BUSINESS_HOUR",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_EDIT_BUSINESS_HOUR",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_ADD_BUSINESS_HOUR",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_BUSINESS_HOURS",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_BUSINESS_HOUR",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_DELETE_PAYMENT_TYPE",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_EDIT_PAYMENT_TYPE",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_ADD_PAYMENT_TYPE",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_PAYMENT_TYPES",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_PAYMENT_TYPE",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_DELETE_HOLIDAY",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_EDIT_HOLIDAY",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_ADD_HOLIDAY",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_HOLIDAYS",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_HOLIDAY",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_DELETE_CATEGORY",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_EDIT_CATEGORY",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_ADD_CATEGORY",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_CATEGORIES",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_CATEGORY",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_EDIT_PAYMENT_METHOD",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_ADD_PAYMENT_METHOD",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_PAYMENT_METHODS",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_PAYMENT_METHOD",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_CONFIGURATIONS",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_VIEW_DASHBOARD",
//                 "remarks": "Admin system role"
//             },
//             {
//                 "name": "CAN_SENT_FIREBASE_TOKEN",
//                 "remarks": "System role"
//             },
//             {
//                 "name": "CAN_CHANGE_PASSWORD",
//                 "remarks": "System role"
//             },
//             {
//                 "name": "CAN_VALIDATE_TOKEN",
//                 "remarks": "System role"
//             },
//             {
//                 "name": "CAN_SELF_REGISTER",
//                 "remarks": "System role"
//             },
//             {
//                 "name": "CAN_RATE_USER",
//                 "remarks": "System role"
//             },
//             {
//                 "name": "CAN_DELETE",
//                 "remarks": "System role"
//             },
//             {
//                 "name": "CAN_VIEW",
//                 "remarks": "System role"
//             },
//             {
//                 "name": "CAN_EDIT",
//                 "remarks": "System role"
//             },
//             {
//                 "name": "CAN_ADD",
//                 "remarks": "System role"
//             },
//             {
//                 "name": "CAN_MANAGE_PARCELS",
//                 "remarks": "parcels management role"
//             },
//             {
//                 "name": "CAN_MANAGE_ORGANIZATION_WALLETS",
//                 "remarks": "Admin role"
//             },
//             {
//                 "name": "CAN_MANAGE_ORG_WALLETS",
//                 "remarks": "Wallets management role"
//             }
//         ]
//     },
//     "totalRecords": 0
// }
