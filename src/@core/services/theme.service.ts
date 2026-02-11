import { Injectable } from '@angular/core';
import { THEMES } from '../../styles/theme.config';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'app_theme';

  // applyTheme(entityId: string) {
  //   const theme = THEMES[entityId] || THEMES['default'];

  //   Object.entries(theme).forEach(([key, value]) => {
  //     document.documentElement.style.setProperty(key, value as string);
  //   });

  //   localStorage.setItem(this.STORAGE_KEY, entityId);
  // }

  // loadPersistedTheme() {
  //   const entityId = localStorage.getItem(this.STORAGE_KEY);
  //   if (entityId) {
  //     this.applyTheme(entityId);
  //   }
  // }

  applyTheme(entityId: string, mode: 'light' | 'dark' = 'light') {
    const theme =
      THEMES[entityId]?.[mode] ||
      THEMES['default'][mode];

    Object.entries(theme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value as string);
    });

    localStorage.setItem('app_theme', entityId);
    localStorage.setItem('app_theme_mode', mode);
  }

  loadPersistedTheme() {
    const entityId = localStorage.getItem('app_theme') || 'default';
    const mode = (localStorage.getItem('app_theme_mode') as 'light' | 'dark') || 'light';

    this.applyTheme(entityId, mode);
  }

  toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    const mode = isDark ? 'dark' : 'light';

    const entityId = localStorage.getItem('app_theme') || 'default';
    this.applyTheme(entityId, mode);
  }


  clearTheme() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.applyTheme('default');
  }
}
