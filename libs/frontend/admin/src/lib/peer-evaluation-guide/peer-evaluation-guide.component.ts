import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PeerEvaluationGuideStore, ThemeService } from '@mas/frontend-shared-data-access';
import { EditorComponent } from '@tinymce/tinymce-angular';

@Component({
  selector: 'mas-peer-evaluation-guide-admin',
  imports: [EditorComponent, ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-3">Peer Evaluation Guide</h2>
      <form #form="ngForm" class="flex flex-col gap-4" [formGroup]="peerEvalForm" (ngSubmit)="onSubmit()">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <editor
              apiKey="goqs3emxc9qfnlk1vk4gq4a1ciccd4vlpl7e02cruoew0y9v"
              formControlName="body"
              [init]="{
                license_key: 'gpl',
                base_url: '/tinymce',
                suffix: '.min',
                plugins: 'lists link table code help wordcount',
                toolbar:
                  'undo redo | blocks | bold italic | numlist bullist | alignleft aligncenter alignright alignjustify | outdent indent',
                promotion: false,
                skin: themeService.darkMode() ? 'oxide-dark' : undefined,
                content_css: themeService.darkMode() ? 'dark' : undefined,
              }"
            />
            @if (
              (peerEvalForm.get('body')?.touched || form.submitted) && peerEvalForm.get('body')?.errors?.['required']
            ) {
              <mat-error>Body is required.</mat-error>
            }
          </div>
        </div>
        <button mat-raised-button color="primary" type="submit" class="w-10 ml-auto">Save</button>
      </form>
    </div>
  `,
  host: {
    class: 'block',
  },
})
export default class PeerEvaluationGuideAdminComponent {
  private fb = inject(NonNullableFormBuilder);
  peerEvaluationGuideStore = inject(PeerEvaluationGuideStore);
  themeService = inject(ThemeService);

  peerEvalForm = this.fb.group({
    id: ['', Validators.required],
    body: ['', Validators.required],
  });

  constructor() {
    this.peerEvaluationGuideStore.getPeerEvaluationGuide();
    effect(() => {
      const guideData = this.peerEvaluationGuideStore.peerEvaluationGuide();
      if (guideData) {
        this.peerEvalForm.patchValue(guideData);
      }
    });
  }

  onSubmit() {
    if (this.peerEvalForm.invalid) {
      return;
    }

    this.peerEvaluationGuideStore.patchPeerEvaluationGuide(this.peerEvalForm.getRawValue());
  }
}
