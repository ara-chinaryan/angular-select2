import { Component, OnInit } from '@angular/core';
import { CustomSelectComponent } from "./shared/custom-select/custom-select.component";
import { FormBuilder, FormsModule, ReactiveFormsModule, UntypedFormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { largeData } from '../../public/large-data';

@Component({
  selector: 'app-root',
  imports: [FormsModule, CustomSelectComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  myOptions: any [] = [];
  selectedItemObjects: any[] = [];
  form: UntypedFormGroup | any;


  constructor(private fb: FormBuilder,) {}

  ngOnInit() {
    this.form = this.fb.group({
      multi: [[], Validators.required],
    });
    this.myOptions = largeData;
  }

  handleMulti(items: any[]) {
    this.selectedItemObjects = items;
  }

  onSubmit() {
    console.log(this.form?.value);
    console.log(this.selectedItemObjects);
  }
}
