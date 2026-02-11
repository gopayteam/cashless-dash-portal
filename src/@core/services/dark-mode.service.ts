// @core/services/dark-mode.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DarkModeService {
  private readonly DARK_MODE_KEY = 'darkModeEnabled';
  private darkModeSubject: BehaviorSubject<boolean>;

  constructor() {
    // Check if dark mode was previously enabled
    const savedMode = localStorage.getItem(this.DARK_MODE_KEY);
    const isDarkMode = savedMode === 'true';

    this.darkModeSubject = new BehaviorSubject<boolean>(isDarkMode);

    // Apply initial theme
    this.applyTheme(isDarkMode);
  }

  /**
   * Get the current dark mode state as an observable
   */
  get darkMode$(): Observable<boolean> {
    return this.darkModeSubject.asObservable();
  }

  /**
   * Get the current dark mode state synchronously
   */
  get isDarkMode(): boolean {
    return this.darkModeSubject.value;
  }

  /**
   * Toggle dark mode on/off
   */
  toggleDarkMode(): void {
    const newMode = !this.darkModeSubject.value;
    this.setDarkMode(newMode);
  }


  /**
   * Set dark mode to a specific state
   * @param enabled - true for dark mode, false for light mode
   */
  setDarkMode(enabled: boolean): void {
    this.darkModeSubject.next(enabled);
    this.applyTheme(enabled);
    this.savePreference(enabled);
  }

  /**
   * Apply the theme by adding/removing dark-mode class from body
   */
  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  /**
   * Save the user's preference to localStorage
   */
  private savePreference(isDark: boolean): void {
    localStorage.setItem(this.DARK_MODE_KEY, isDark.toString());
  }

  /**
   * Clear saved preference
   */
  clearPreference(): void {
    localStorage.removeItem(this.DARK_MODE_KEY);
  }
}
