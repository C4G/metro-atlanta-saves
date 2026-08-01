import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { PartnersStore } from '@mas/frontend-shared-data-access';
import { URL_REGEX } from '@mas/frontend-shared-util';
import { Partner } from '@prisma/client';

@Component({
  selector: 'mas-add-partner',
  imports: [MatDialogModule, MatInput, MatButton, MatFormField, MatLabel, ReactiveFormsModule, MatError],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} Partner</h2>
    <form #form="ngForm" [formGroup]="partnerForm" (ngSubmit)="submitForm()">
      <mat-dialog-content>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" cdkFocusInitial />
            @if (
              (partnerForm.get('name')?.touched || form.submitted) && partnerForm.get('name')?.errors?.['required']
            ) {
              <mat-error>Name is required.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Address</mat-label>
            <input matInput formControlName="address" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Website URL</mat-label>
            <input matInput formControlName="website" />
            @if (
              (partnerForm.get('website')?.touched || form.submitted) && partnerForm.get('website')?.errors?.['pattern']
            ) {
              <mat-error>Please enter a valid URL.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>X URL</mat-label>
            <input matInput formControlName="twitter" />
            @if (
              (partnerForm.get('twitter')?.touched || form.submitted) && partnerForm.get('twitter')?.errors?.['pattern']
            ) {
              <mat-error>Please enter a valid URL.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Facebook URL</mat-label>
            <input matInput formControlName="facebook" />
            @if (
              (partnerForm.get('facebook')?.touched || form.submitted) &&
              partnerForm.get('facebook')?.errors?.['pattern']
            ) {
              <mat-error>Please enter a valid URL.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Linked In URL</mat-label>
            <input matInput formControlName="linkedIn" />
            @if (
              (partnerForm.get('linkedIn')?.touched || form.submitted) &&
              partnerForm.get('linkedIn')?.errors?.['pattern']
            ) {
              <mat-error>Please enter a valid URL.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Tiktok URL</mat-label>
            <input matInput formControlName="tiktok" />
            @if (
              (partnerForm.get('tiktok')?.touched || form.submitted) && partnerForm.get('tiktok')?.errors?.['pattern']
            ) {
              <mat-error>Please enter a valid URL.</mat-error>
            }
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancel</button>
        <button mat-raised-button color="primary" type="submit">{{ data ? 'Save' : 'Add' }}</button>
      </mat-dialog-actions>
    </form>
  `,
  host: {
    class: 'block',
  },
})
export class AddPartnerComponent {
  private fb = inject(FormBuilder);
  private partnersStore = inject(PartnersStore);
  data = inject<Partner | null>(MAT_DIALOG_DATA);

  partnerForm = this.fb.group({
    name: this.fb.control(this.data?.name ?? '', { nonNullable: true, validators: [Validators.required] }),
    address: [this.data?.address ?? null],
    website: [this.data?.website ?? null, Validators.pattern(URL_REGEX)],
    twitter: [this.data?.twitter ?? null, Validators.pattern(URL_REGEX)],
    facebook: [this.data?.facebook ?? null, Validators.pattern(URL_REGEX)],
    linkedIn: [this.data?.linkedIn ?? null, Validators.pattern(URL_REGEX)],
    tiktok: [this.data?.tiktok ?? null, Validators.pattern(URL_REGEX)],
  });

  submitForm() {
    if (this.partnerForm.invalid) {
      return;
    }

    const addPartnerData = this.partnerForm.getRawValue();

    if (this.data) {
      this.partnersStore.patchPartner({
        id: this.data.id,
        ...addPartnerData,
      });

      return;
    }

    this.partnersStore.addPartner(addPartnerData);
  }
}
