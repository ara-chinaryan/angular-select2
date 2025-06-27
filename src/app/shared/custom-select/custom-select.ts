import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, forwardRef, HostListener, Input, Output, ViewChild } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-custom-select',
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './custom-select.html',
  styleUrl: './custom-select.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelect),
      multi: true,
    },
  ],
})
export class CustomSelect {
  @Input() options: any[] = [];
  @Input() valueField: string = 'id';
  @Input() labelField: string = 'name';
  @Input() imageField: string = 'image';
  @Input() placeholder: string = 'Select';
  @Input() config: {
    multiple?: boolean;
    searchable?: boolean;
    selectAllButton?: boolean;
    maxVisibleItems?: number;
  } = {
      multiple: false,
      searchable: true,
      selectAllButton: true,
      maxVisibleItems: 100
    };



  @Output() valueChange = new EventEmitter<any>();
  @Output() ngModelChange = new EventEmitter<any>();
  @Output() onSelectItem = new EventEmitter<any>();

  @ViewChild('labelContainer') labelContainer!: ElementRef;
  containerWidth = 0;


  selectedValue: any = null;
  selectedValues: any[] = [];

  searchTerm: string = '';
  dropdownOpen = false;

  allOptions: any[] = [];
  filteredOptions: any[] = [];
  visibleOptions: any[] = [];

  batchSize = 100;
  currentChunk = 0;


  onChange = (_: any) => { };
  onTouched = () => { };

  @HostListener('window:resize')
  onResize() {
    this.updateContainerWidth();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (!this.elementRef.nativeElement.contains(target)) {
      this.dropdownOpen = false;
      this.resetFilter();
    }
  }

  constructor(private elementRef: ElementRef) { }



  ngOnInit() {
    this.allOptions = [...this.options];
    this.resetFilter();
  }

  resetFilter() {
    this.searchTerm = '';
    this.filteredOptions = [...this.allOptions];
    this.currentChunk = 1;
    this.visibleOptions = this.filteredOptions.slice(0, this.config.maxVisibleItems ?? 100);
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
    this.filteredOptions = [...this.allOptions];
    if (!this.dropdownOpen) {
      this.resetFilter();
    }
  }

  filterOptions() {
    const term = this.searchTerm.toLowerCase();
    this.filteredOptions = this.allOptions.filter(o =>
      o[this.labelField].toLowerCase().includes(term)
    );

    this.currentChunk = 0;
    this.visibleOptions = this.filteredOptions.slice(0, this.batchSize);
  }

  onScroll(event: Event) {
    const target = event.target as HTMLElement;

    const threshold = 100;
    const atBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - threshold;

    if (atBottom && this.visibleOptions.length < this.filteredOptions.length) {
      const nextChunk = this.filteredOptions.slice(
        this.currentChunk + (this.config.maxVisibleItems ?? 100),
        this.currentChunk + 2 * (this.config.maxVisibleItems ?? 100)
      );

      this.visibleOptions.push(...nextChunk);
      this.currentChunk += this.batchSize;
    }
  }



  selectItem(item: any) {
    if (this.config.multiple) {
      const exists = this.selectedValues.includes(item[this.valueField]);
      if (exists) {
        this.selectedValues = this.selectedValues.filter(v => v !== item[this.valueField]);
      } else {
        this.selectedValues.push(item[this.valueField]);
      }

      const selectedItems = this.options.filter(option =>
        this.selectedValues.includes(option[this.valueField])
      );

      this.valueChange.emit(this.selectedValues);
      this.onChange(this.selectedValues);
      this.onSelectItem.emit(selectedItems);
      this.dropdownOpen = false;

    } else {
      const isSame = this.selectedValue === item[this.valueField];

      this.selectedValue = isSame ? null : item[this.valueField];

      this.valueChange.emit(this.selectedValue);
      this.onChange(this.selectedValue);
      this.onTouched();

      this.onSelectItem.emit(isSame ? null : item);

      this.dropdownOpen = false;
    }
  }

  writeValue(value: any): void {
    if (this.config.multiple) {
      this.selectedValues = Array.isArray(value) ? value : [];
    } else {
      this.selectedValue = value;
    }
  }


  get selectedLabel(): string {
    if (this.config.multiple) {
      const labels = this.options
        .filter(o => this.selectedValues.includes(o[this.valueField]))
        .map(o => o[this.labelField]);
      return labels.join(', ');
    } else {
      const found = this.options.find(o => o[this.valueField] === this.selectedValue);
      return found ? found[this.labelField] : '';
    }
  }

  areAllSelected(): boolean {
    return this.selectedValues.length === this.options.length;
  }


  selectAll() {
    this.dropdownOpen = false;
    this.selectedValues = this.options.map(o => o[this.valueField]);
    const selectedItems = [...this.options];
    this.valueChange.emit(this.selectedValues);
    this.onChange(this.selectedValues);
    this.onSelectItem.emit(selectedItems);
  }

  unselectAll() {
    this.dropdownOpen = false;
    this.selectedValues = [];
    this.valueChange.emit(this.selectedValues);
    this.onChange(this.selectedValues);
    this.onSelectItem.emit([]);
  }

  get displaySelectedItems(): { item: any, hidden: boolean }[] {
    if (!this.config.multiple) {
      const selected = this.options.find(
        o => o[this.valueField] === this.selectedValue
      );
      return selected ? [{ item: selected, hidden: false }] : [];
    }

    const selectedItems = this.options.filter(o =>
      this.selectedValues.includes(o[this.valueField])
    );

    if (!this.containerWidth || selectedItems.length === 0) {
      return [];
    }

    const avgCharWidth = 8;
    const labelPadding = 16;

    let usedWidth = 0;
    let result: { item: any; hidden: boolean }[] = [];

    for (const item of selectedItems) {
      const label = item[this.labelField];
      const labelWidth = label.length * avgCharWidth + labelPadding;

      if (usedWidth + labelWidth > this.containerWidth - 50) {
        break;
      }

      result.push({ item, hidden: false });
      usedWidth += labelWidth;
    }

    const hiddenCount = selectedItems.length - result.length;

    if (hiddenCount > 0) {
      result.push({
        item: { [this.labelField]: `+${hiddenCount}` },
        hidden: true
      });
    }

    return result;
  }

  emitSelectedItems() {
    this.ngModelChange.emit(this.selectedValues);
    const selectedObjects = this.options.filter(o =>
      this.selectedValues.includes(o[this.valueField])
    );
    this.onSelectItem.emit(selectedObjects);
  }

  removeSelected(item: any, event: MouseEvent) {
    event.stopPropagation();

    const value = item[this.valueField || 'id'];

    if (this.config.multiple) {
      this.selectedValues = this.selectedValues.filter(val => val !== value);
      this.emitSelectedItems();
      this.valueChange.emit(this.selectedValues);
      this.onChange(this.selectedValues);
    } else {
      if (this.selectedValue === value) {
        this.selectedValue = null;
        this.valueChange.emit(null);
        this.onChange(null);
        this.onTouched();
        this.onSelectItem.emit(null);
      }
    }
  }



  ngAfterViewInit(): void {
    setTimeout(() => this.updateContainerWidth(), 0);
  }



  updateContainerWidth() {
    if (this.labelContainer) {
      this.containerWidth = this.labelContainer.nativeElement.offsetWidth;
    }
  }


  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
}
