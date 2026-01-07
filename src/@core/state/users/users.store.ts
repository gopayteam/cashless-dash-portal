// import { Injectable } from "@angular/core";

// @Injectable()
// export class UsersStore extends ComponentStore<any> {

//   readonly users$ = this.select(state => state.users);

//   readonly loadUsers = this.effect(() =>
//     this.data.get(API_ENDPOINTS.USERS).pipe(
//       tap(users => this.patchState({ users }))
//     )
//   );

//   constructor(private data: DataService) {
//     super({ users: [] });
//   }
// }
