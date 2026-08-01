import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { tap } from 'rxjs';
import { SavingsData } from '../../savings-data.model';

@Component({
  selector: 'mas-savings-form',
  imports: [ReactiveFormsModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (savingsForm) {
      <form [formGroup]="savingsForm" #form="ngForm" class="flex flex-col gap-4">
        <mat-form-field>
          <mat-label>Initial Deposit</mat-label>
          <input matInput formControlName="initialDeposit" placeholder="Amount" type="number" />
          <mat-icon matPrefix>attach_money</mat-icon>
          @if (
            (savingsForm.controls['initialDeposit'].dirty || form.submitted) &&
            !savingsForm.controls['initialDeposit'].valid
          ) {
            <mat-error>Please provide an initial deposit amount</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label>Monthly Contribution</mat-label>
          <input matInput formControlName="monthlyContribution" placeholder="Amount" type="number" />
          <mat-icon matPrefix>attach_money</mat-icon>
          @if (
            (savingsForm.controls['monthlyContribution'].dirty || form.submitted) &&
            !savingsForm.controls['monthlyContribution'].valid
          ) {
            <mat-error>Please provide a monthly contribution amount</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label>Period</mat-label>
          <input matInput formControlName="period" placeholder="Amount" type="number" />
          <span matSuffix>months</span>
          @if ((savingsForm.controls['period'].dirty || form.submitted) && !savingsForm.controls['period'].valid) {
            <mat-error>Please provide a timeframe in months</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label>APY</mat-label>
          <input matInput formControlName="apy" placeholder="Amount" type="number" />
          <mat-icon matSuffix>percent</mat-icon>
          @if ((savingsForm.controls['apy'].dirty || form.submitted) && !savingsForm.controls['apy'].valid) {
            <mat-error>Please provide an APY value</mat-error>
          }
        </mat-form-field>

        <button mat-raised-button color="primary" type="submit">Calculate</button>
      </form>
    }
  `,
  host: {
    class: 'block',
  },
})
export class SavingsFormComponent implements OnInit {
  data = input.required<SavingsData>();
  formSubmit = output<SavingsData>();

  private formBuilder = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  savingsForm?: FormGroup;

  ngOnInit() {
    this.savingsForm = this.formBuilder.nonNullable.group({
      initialDeposit: [this.data().initialDeposit, [Validators.required, Validators.min(0)]],
      monthlyContribution: [this.data().monthlyContribution, [Validators.required, Validators.min(0)]],
      period: [this.data().period, [Validators.required, Validators.min(1)]],
      apy: [this.data().apy, [Validators.required, Validators.min(0)]],
    });

    this.savingsForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => this.onSubmit()),
      )
      .subscribe();
  }

  onSubmit() {
    if (!this.savingsForm || this.savingsForm.invalid) {
      return;
    }

    this.formSubmit.emit(this.savingsForm.getRawValue());
  }
}
