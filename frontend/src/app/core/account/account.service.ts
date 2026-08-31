import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ProfileJson, UserJson, NewUserJson } from './models/account-json';

@Service()
export class AccountService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  profile() {
    return this.http.get<ProfileJson>(`${this.base}/profile`);
  }

  updateProfile(body: Partial<ProfileJson>) {
    return this.http.put<ProfileJson>(`${this.base}/profile`, body);
  }

  users() {
    return this.http.get<UserJson[]>(`${this.base}/users`);
  }

  createUser(body: NewUserJson) {
    return this.http.post<UserJson>(`${this.base}/users`, body);
  }

  deleteUser(id: number) {
    return this.http.delete<void>(`${this.base}/users/${id}`);
  }
}
