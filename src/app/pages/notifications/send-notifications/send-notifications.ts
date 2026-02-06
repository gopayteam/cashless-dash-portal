import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { BroadcastService } from '../../../../@core/services/broadcast.service';


interface AgentOption {
  value: Agent;
  label: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-broadcast-component',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  providers: [BroadcastService],
  templateUrl: './send-notifications.html',
  styleUrls: ['./send-notifications.css', '../../../../styles/global/_toast.css'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger(50, [
            animate('300ms cubic-bezier(0.4, 0, 0.2, 1)',
              style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class SendNotificationsComponent implements OnInit {
  // Form data
  broadcastData: BroadcastRequest = {
    agent: 'DASHMASTER',
    message: '',
    title: '',
    entityId: ''
  };

  // UI state
  isLoading = false;
  showSuccess = false;
  showError = false;
  responseMessage = '';
  totalRecipients = 0;
  characterCount = 0;
  titleCharacterCount = 0;

  // Agent options with icons and colors
  agents: AgentOption[] = [
    { value: 'DASHMASTER', label: 'Dashmaster', icon: '🎯', color: '#FF6B6B' },
    { value: 'APPROVER', label: 'Approver', icon: '✓', color: '#4ECDC4' },
    { value: 'INSPECTOR', label: 'Inspector', icon: '🔍', color: '#45B7D1' },
    { value: 'DRIVER', label: 'Driver', icon: '🚗', color: '#FFA07A' },
    { value: 'PARCEL', label: 'Parcel', icon: '📦', color: '#98D8C8' },
    { value: 'PASSENGER', label: 'Passenger', icon: '👤', color: '#A8E6CF' },
    { value: 'MARSHAL', label: 'Marshal', icon: '⚡', color: '#FFD93D' },
    { value: 'ADMIN', label: 'Admin', icon: '👑', color: '#C77DFF' },
    { value: 'CONDUCTOR', label: 'Conductor', icon: '🎫', color: '#6BCB77' },
    { value: 'INVESTOR', label: 'Investor', icon: '💼', color: '#4D96FF' }
  ];

  constructor(private broadcastService: BroadcastService) { }

  ngOnInit(): void {
    this.updateCharacterCount();
  }

  getSelectedAgent(): AgentOption | undefined {
    return this.agents.find(a => a.value === this.broadcastData.agent);
  }

  updateCharacterCount(): void {
    this.characterCount = this.broadcastData.message.length;
    this.titleCharacterCount = this.broadcastData.title.length;
  }

  sendBroadcast(): void {
    // Validation
    if (!this.broadcastData.title.trim()) {
      this.showErrorMessage('Please enter a title');
      return;
    }

    if (!this.broadcastData.message.trim()) {
      this.showErrorMessage('Please enter a message');
      return;
    }

    this.isLoading = true;
    this.showSuccess = false;
    this.showError = false;

    // Prepare request (remove empty entityId if not provided)
    const request: BroadcastRequest = {
      entityId: '',
      agent: this.broadcastData.agent,
      message: this.broadcastData.message.trim(),
      title: this.broadcastData.title.trim()
    };

    if (this.broadcastData.entityId?.trim()) {
      request.entityId = this.broadcastData.entityId.trim();
    }

    // Use the service
    this.broadcastService.sendBroadcast(request).subscribe({
      next: (response) => {
        if (response.status === 0) {
          this.totalRecipients = response.totalRecords;
          this.responseMessage = response.message;
          this.showSuccessMessage();
          this.resetForm();
        } else {
          this.showErrorMessage(response.message || 'Broadcast failed');
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.showErrorMessage(error.message || 'Failed to send broadcast. Please try again.');
        this.isLoading = false;
      }
    });
  }

  showSuccessMessage(): void {
    this.showSuccess = true;
    setTimeout(() => {
      this.showSuccess = false;
    }, 5000);
  }

  showErrorMessage(message: string): void {
    this.responseMessage = message;
    this.showError = true;
    setTimeout(() => {
      this.showError = false;
    }, 5000);
  }

  resetForm(): void {
    this.broadcastData = {
      agent: 'DASHMASTER',
      message: '',
      title: '',
      entityId: ''
    };
    this.updateCharacterCount();
  }

  isFormValid(): boolean {
    return this.broadcastData.title.trim().length > 0 &&
      this.broadcastData.message.trim().length > 0;
  }
}
