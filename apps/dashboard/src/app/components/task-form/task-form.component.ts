import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Task, TaskStatus, TaskCategory, CreateTaskDto, UpdateTaskDto } from '../../models/task.model';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.css']
})
export class TaskFormComponent implements OnInit {
  @Input() task: Task | null = null;
  @Input() isOpen = false;
  @Input() isSaving = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreateTaskDto | { id: string; data: UpdateTaskDto }>();

  taskForm!: FormGroup;
  isEditMode = false;

  taskStatuses = [
    { value: TaskStatus.TODO, label: 'To Do' },
    { value: TaskStatus.IN_PROGRESS, label: 'In Progress' },
    { value: TaskStatus.DONE, label: 'Done' }
  ];

  taskCategories = [
    { value: TaskCategory.WORK, label: 'Work' },
    { value: TaskCategory.PERSONAL, label: 'Personal' },
    { value: TaskCategory.URGENT, label: 'Urgent' },
    { value: TaskCategory.OTHER, label: 'Other' }
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(): void {
    this.isEditMode = !!this.task;
    if (this.task && this.taskForm) {
      this.populateForm();
    } else if (this.taskForm) {
      this.taskForm.reset({
        status: TaskStatus.TODO,
        category: TaskCategory.OTHER
      });
    }
  }

  private initForm(): void {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      status: [TaskStatus.TODO, Validators.required],
      category: [TaskCategory.OTHER, Validators.required],
      dueDate: [''],
      assignedToId: ['']
    });
  }

  private populateForm(): void {
    if (this.task) {
      this.taskForm.patchValue({
        title: this.task.title,
        description: this.task.description || '',
        status: this.task.status,
        category: this.task.category,
        dueDate: this.task.dueDate ? this.formatDateForInput(new Date(this.task.dueDate)) : '',
        assignedToId: this.task.assignedToId || ''
      });
    }
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      const formValue = this.taskForm.value;

      if (this.isEditMode && this.task) {
        const updateData: UpdateTaskDto = {
          title: formValue.title,
          description: formValue.description || undefined,
          status: formValue.status,
          category: formValue.category,
          dueDate: formValue.dueDate || undefined,
          assignedToId: formValue.assignedToId || undefined
        };
        this.save.emit({ id: this.task.id, data: updateData });
      } else {
        const createData: CreateTaskDto = {
          title: formValue.title,
          description: formValue.description || undefined,
          status: formValue.status,
          category: formValue.category,
          dueDate: formValue.dueDate || undefined,
          assignedToId: formValue.assignedToId || undefined
        };
        this.save.emit(createData);
      }
    }
  }

  onClose(): void {
    this.taskForm.reset({
      status: TaskStatus.TODO,
      category: TaskCategory.OTHER
    });
    this.close.emit();
  }

  get titleControl() {
    return this.taskForm.get('title');
  }
}
