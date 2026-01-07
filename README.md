# 🚗 Angular Fleet Management Dashboard

A modern, fully responsive Angular 17+ standalone-component admin dashboard built for fleet management and vehicle analytics. Features a clean sidebar navigation, dynamic horizontal tab routing, and a professional UI theme perfect for transportation and logistics applications.

This project is ideal for building fleet management systems, vehicle tracking dashboards, revenue analytics platforms, or any transport-focused enterprise admin control panel.

---

## 🚀 Features

### 🔧 UI & Components

- **Responsive sidebar** with smooth collapse/expand animation
- **Horizontal tab navigation** dynamically rendered per route
- **Single-level sidebar menu** with clean, intuitive navigation
- **Gradient user profile card** with hover effects
- **Fully customizable CSS theme** using CSS variables (no SCSS required)
- **Modern, clean layout** inspired by enterprise dashboards
- **PrimeIcons integration** for consistent iconography
- **Professional animations** and micro-interactions throughout

### 🧭 Routing & Navigation

- **Smart active state detection** - sidebar automatically highlights current route
- **Dynamic tab system** - horizontal tabs appear based on route configuration
- **Multi-category sidebar menu** (Main, Analytics, Management)
- **Router-outlet page container** for modular app structure
- **Seamless navigation** between sections with persistent state

### 📊 Dashboard Modules

- **Dashboard** - Overview, Statistics, Reports
- **Vehicle Analysis** - Daily, Weekly, Monthly, Yearly insights
- **Income Prediction** - Short Term, Long Term, Trends
- **Revenue Reports** - Overview, By Vehicle, By Location
- **Transactions** - All, Pending, Completed, Failed
- **Vehicle Management** - All Vehicles, Active, Inactive, Maintenance
- **Locations & Users** - Complete management sections

### 📱 Responsive Design

- **Desktop-first** with mobile optimization
- **Collapsible sidebar** (280px → 80px icon-only mode)
- **Touch-friendly** interface for tablets and mobile devices
- **Adaptive tab navigation** - icons only on small screens
- **Flexible CSS grid-based** content area

### ⚡ Modern Angular Setup

- Built using **Angular Standalone Components** (No NgModules!)
- **Clean, modular architecture**
- **Type-safe routing** configuration
- **RxJS integration** for reactive navigation
- Reusable layout via `<app-main-layout>`

---

## 📁 Project Structure

```
src/
 ├── app/
 │    ├── layout/
 │    │    └── main-layout/
 │    │         ├── main-layout.html         # Layout template
 │    │         ├── main-layout.ts           # Layout component logic
 │    │         └── main-layout.css          # Layout styles
 │    │
 │    ├── pages/
 │    │    ├── dashboard/
 │    │    │    ├── overview/
 │    │    │    ├── stats/
 │    │    │    └── reports/
 │    │    │
 │    │    ├── vehicle-analysis/
 │    │    │    ├── daily/
 │    │    │    ├── weekly/
 │    │    │    ├── monthly/
 │    │    │    └── yearly/
 │    │    │
 │    │    ├── prediction/
 │    │    │    ├── short-term/
 │    │    │    ├── long-term/
 │    │    │    └── trends/
 │    │    │
 │    │    ├── revenue/
 │    │    ├── transactions/
 │    │    ├── vehicles/
 │    │    ├── locations/
 │    │    └── users/
 │    │
 │    ├── app.routes.ts                      # Route configuration
 │    └── app.ts                             # Root component
 │
 ├── main.ts                                 # Bootstrap file
 └── styles.css                              # Global styles
```

---

## 🔨 Installation

### Prerequisites

Make sure you have the following installed:

- **Node.js** ≥ 18.x
- **Angular CLI** ≥ 17.x
- **npm** or **yarn**

### Install Angular CLI globally

```bash
npm install -g @angular/cli
```

### Clone the repository

```bash
git clone https://github.com/your-username/gopay-dashboard.git
cd gopay-dashboard
```

### Install dependencies

```bash
npm install --legacy-peer-deps
```

---

## ▶️ Running the Project

### Start the development server

```bash
ng serve
```

The app will run at:

```
http://localhost:4200
```

### Build for production

```bash
ng build --configuration production
```

Build output will be in `dist/` folder.

---

## 🧩 Available Scripts

| Script                               | Description                 |
| ------------------------------------ | --------------------------- |
| `ng serve`                           | Run development server      |
| `ng build`                           | Build for production        |
| `ng test`                            | Run unit tests              |
| `ng lint`                            | Lint the codebase           |
| `ng generate component pages/[name]` | Generate new page component |

---

## 🎨 UI Preview

### 📌 Dashboard Layout

![Dashboard](./docs/screenshots/dashboard.png)
_Main dashboard with sidebar and horizontal tabs_

### 📌 Sidebar Expanded

![Sidebar Expanded](./docs/screenshots/sidebar-expanded.png)
_Full sidebar with user profile and navigation menu_

### 📌 Sidebar Collapsed

![Sidebar Collapsed](./docs/screenshots/sidebar-collapsed.png)
_Icon-only collapsed sidebar (80px width)_

### 📌 Vehicle Analysis with Tabs

![Vehicle Analysis](./docs/screenshots/vehicle-analysis.png)
_Horizontal tab navigation for Daily, Weekly, Monthly, Yearly views_

---

## ⚙️ Customization

### 🎨 Change Theme Colors

Edit root CSS variables in `main-layout.css`:

```css
:root {
  --primary-color: #dc3545; /* Main brand color */
  --primary-hover: #c82333; /* Hover state */
  --sidebar-width: 280px; /* Expanded sidebar */
  --sidebar-collapsed-width: 80px; /* Collapsed sidebar */
  --topbar-height: 70px; /* Top bar height */
  --text-color: #495057; /* Primary text */
  --text-light: #6c757d; /* Secondary text */
  --bg-light: #f8f9fa; /* Page background */
  --border-color: #e9ecef; /* Borders */
}
```

### 🧭 Add New Sidebar Menu Items

Edit the `main-layout.ts` component:

```typescript
<li class="menu-item">
  <button
    class="menu-link"
    [class.menu-link--active]="isRouteActive('/new-section')"
    (click)="navigate('/new-section')"
  >
    <span class="menu-link-content">
      <i class="pi pi-star menu-icon"></i>
      <span class="menu-text">New Section</span>
    </span>
  </button>
</li>
```

### 🗂️ Configure Route Tabs

Add tab configuration in `main-layout.ts`:

```typescript
private navigationConfig: NavConfig[] = [
  {
    route: '/new-section',
    tabs: [
      { label: 'Tab 1', icon: 'pi pi-home', path: '/new-section/tab1' },
      { label: 'Tab 2', icon: 'pi pi-chart', path: '/new-section/tab2' },
    ],
  },
  // ... other routes
];
```

### 🆕 Create New Pages

```bash
ng generate component pages/fleet-tracking
```

Then register the route in `app.routes.ts`:

```typescript
{
  path: 'fleet-tracking',
  component: FleetTrackingComponent
}
```

---

## 🔒 Authentication Integration (Future)

This template is UI-only. You can integrate authentication:

- **Firebase Auth** - Google, Email/Password
- **JWT Auth** - Node.js, Django, FastAPI backend
- **OAuth 2.0** - Google, GitHub, Microsoft
- **Auth Guards** - Protect routes with Angular guards

Example auth guard structure:

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  return authService.isAuthenticated() || inject(Router).parseUrl('/login');
};
```

---

## 🧱 Tech Stack

| Area                 | Technology                          |
| -------------------- | ----------------------------------- |
| **Framework**        | Angular 17+ (Standalone Components) |
| **Styling**          | Pure CSS with CSS Variables         |
| **Icons**            | PrimeIcons                          |
| **Routing**          | Angular Router                      |
| **State Management** | RxJS (Optional: NgRx, Signals)      |
| **Build Tool**       | Angular CLI / Vite                  |
| **Type Safety**      | TypeScript 5+                       |

---

## 📦 Dependencies

### Core Dependencies

- `@angular/core` - Angular framework
- `@angular/router` - Routing system
- `@angular/common` - Common utilities
- `primeicons` - Icon library

### Development Dependencies

- `@angular/cli` - CLI tooling
- `typescript` - Type safety
- `rxjs` - Reactive programming

---

## 🗺️ Roadmap

- [ ] Add user authentication system
- [ ] Implement real-time vehicle tracking map
- [ ] Add chart visualizations (Chart.js / D3.js)
- [ ] Create data export functionality (CSV, PDF)
- [ ] Add dark mode toggle
- [ ] Implement notifications system
- [ ] Add vehicle maintenance scheduler
- [ ] Create mobile-optimized views
- [ ] Add multi-language support (i18n)
- [ ] Implement role-based access control

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

For major changes, please open an issue first to discuss what you'd like to change.

---

## 📝 Code Style

- Follow Angular style guide
- Use meaningful variable and function names
- Add comments for complex logic
- Keep components small and focused
- Use TypeScript strict mode

---

## 🐛 Known Issues

- None currently reported

Found a bug? Please [open an issue](https://github.com/your-username/gopay-dashboard/issues).

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 GOPAY Dashboard

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 👨‍💻 Author

**Your Name**

- GitHub: [@your-username](https://github.com/your-username)
- LinkedIn: [Your Profile](https://linkedin.com/in/your-profile)
- Email: your.email@example.com

---

## 🙏 Acknowledgments

- Angular Team for the amazing framework
- PrimeNG Team for PrimeIcons
- Community contributors and testers

---

## 💬 Support

Need help? Have questions?

- 📧 Email: support@gopay.com
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/gopay-dashboard/discussions)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/gopay-dashboard/issues)

---

## ⭐ Star History

If you find this project useful, please consider giving it a star! ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=your-username/gopay-dashboard&type=Date)](https://star-history.com/#your-username/gopay-dashboard&Date)

---

<div align="center">
  <p>Made with ❤️ for the Angular community</p>
  <p>© 2024 GOPAY Dashboard. All rights reserved.</p>
</div>
