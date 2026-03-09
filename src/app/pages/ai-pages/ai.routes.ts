// ============================================================
// AI Pages Routes
// Add these to your app's route config / lazy-loaded routes
// ============================================================
import { Routes } from '@angular/router';

// Adjust import paths to match your project structure
import { ChatbotComponent } from './chatbot/chatbot';
import { RagQueryComponent } from './rag/rag-query';
import { IntentManagementComponent } from './intents/intent-management';
import { FaqManagementComponent } from './faq/faq-management';

// If you use an AuthGuard, add canActivate: [AuthGuard] to each route
export const AI_ROUTES: Routes = [
  {
    path: 'chatbot',
    component: ChatbotComponent,
    title: 'AI Assistant',
  },
  {
    path: 'rag',
    component: RagQueryComponent,
    title: 'Knowledge Base Query',
  },
  {
    path: 'intents',
    component: IntentManagementComponent,
    title: 'Intent Management',
  },
  {
    path: 'knowledge-base',
    component: FaqManagementComponent,
    title: 'Knowledge Base',
  },
];

// ── Usage in your main router ──────────────────────────────
// In your app.routes.ts or pages.routes.ts, add:
//
//   {
//     path: 'ai',
//     loadChildren: () => import('./pages/ai/ai.routes').then(m => m.AI_ROUTES),
//   }
//
// This gives you:
//   /ai/chatbot
//   /ai/rag
//   /ai/intents
//   /ai/knowledge-base

// ── Adding the chat widget to specific pages ───────────────
// In any component you want the floating widget on, add:
//
//   import { ChatWidgetComponent } from '../../components/chat-widget/chat-widget.component';
//
//   @Component({
//     imports: [..., ChatWidgetComponent],
//     template: `
//       <!-- your page content -->
//       <app-chat-widget position="bottom-right"></app-chat-widget>
//     `
//   })
