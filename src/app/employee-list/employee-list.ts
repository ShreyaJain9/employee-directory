import { Component, inject, OnInit} from '@angular/core';
import { EmployeeService } from '../service/employee-service';
import { Employee } from '../models/employee.model';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { error } from 'console';
import { DecimalPipe, DatePipe, CurrencyPipe, PercentPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { escape } from 'querystring';

@Component({
  imports: [DecimalPipe, DatePipe, CurrencyPipe, DecimalPipe, DatePipe, FormsModule],
  selector: 'app-employee-list',
  styleUrl: './employee-list.css',
  templateUrl: './employee-list.html',
})
export class EmployeeList implements OnInit
{
  private employeeService: EmployeeService = inject(EmployeeService);
  private searchSubject: Subject<string> = new Subject<string>();

  employees: Employee[] = [];
  totalCount: number = 0;
  isLoading: boolean = true;
  
  // dropdown option
  departments: string[] = [];
  statuses: string[] = [];
  locations: string[] = [];

  // View or Delete
  selectedEmployee: Employee | null = null;

  // Editing 

  editingEmployeeId: number | null = null;
  editFormData: Partial<Employee> = {};

  // Add Employee
  showAddForm: boolean = false;
  NewEmployeeData: Partial<Employee> = {};

  ngOnInit(): void {

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((term) =>{
      // console.log('search', term);
      // this.searchTerm = term;
      // this.filterEmployees();

      this.employeeService.setSearchTerm(term);
      this.refreshEmployees();
    })

    this.isLoading = true;
    this.employeeService.getEmployees().subscribe({
      next: (data: Employee[]) =>{
        this.employeeService.setEmployees(data);

        this.departments = this.employeeService.getDepartments();
        this.statuses = this.employeeService.getStatuses();
        this.locations = this.employeeService.getLocations();

        this.refreshEmployees();
        this.totalCount = data.length;
        this.isLoading = false;
      },
      error: (error) => {
        console.error(`Error fetching employees: `, error);
        this.isLoading = false;
      }
    });
  }

  private refreshEmployees(): void
  {
    this.employees = this.employeeService.getFilteredAndSortedEmployees();
  }

  get currentPage(): number{
    return this.employeeService.getCurrentPage();
  }

  get totalpages(): number
  {
    return this.employeeService.getTotalPage();
  }

  get PageSize(): number{
    return this.employeeService.getPageSize();
  }

  get filteredCount(): number
  {
    return this.employeeService.getFilteredCount();
  }

  // pagetionsMethad

  onPageChange(page: number): void{
    this.employeeService.setPage(page);
    this.refreshEmployees();
  }

  onNextPage(): void{
    this.employeeService.nextPage();
    this.refreshEmployees();
  }

  onPreviousPage(): void{
    this.employeeService.previousPage();
    this.refreshEmployees();
  }

  get rangeStart(): number{
    if (this.filteredCount === 0)
    {
      return 0;
    }
    return (this.currentPage -1) * this.PageSize + 1;
  }

  get rangeEnd(): number{
    const end = this.currentPage * this.PageSize;
    return end > this.filteredCount ? this.filteredCount : end;
  }

  get sortColumn(): string
  {
    return this.employeeService.getSortColumn();
  }

  get sortDirection(): 'asc' | 'desc'
  {
    return this.employeeService.getSortDirection();
  }
  
  onSearch(term: string): void
  {
    this.searchSubject.next(term);
  }

  onSort(column: string): void
  {
    this.employeeService.setSort(column);
    this.refreshEmployees();
  }

  onDepartmentFilter(department: string): void
  {
    this.employeeService.setDepartmentFilter(department);
    this.refreshEmployees();
  }

  onStatusFilter(status: string): void
  {
    this.employeeService.setDepartmentFilter(status);
    this.refreshEmployees();
  }

   onLocationFilter(location: string): void
  {
    this.employeeService.setDepartmentFilter(location);
    this.refreshEmployees();
  }

  // pagenations

  get pageNumbers(): number[]
  {
    return [...Array(this.totalpages).keys()].map(i => i + 1);
  }

  // View or Delete

  onViewEmployee(employee: Employee): void
  {
    this.selectedEmployee = employee;
  }

  onCloseDetails(): void{
    this.selectedEmployee = null;
  }

  onDeleteEmployee(employee: Employee): void
  {
    const confirmed : boolean = confirm(`Are you sure you want to delete ${employee.firstName} ${employee.lastName}?`);
    if (confirmed)
  {
    this.employeeService.deleteEmployee(employee.id).subscribe(
      {
        next: () =>{
          this.refreshEmployees();
        },
        error: (error: any) => {
          console.error('Error deleting employee: ', error)
        }
      }
    );
    this.refreshEmployees()
  }
}

// Edit Employee

onEditEmployee(employee: Employee): void
{
  this.editingEmployeeId = employee.id;
  this.editFormData = {...employee};

}

onCancelEdit(): void 
{
  this.editingEmployeeId = null;
  this.editFormData = {};
}

onSaveEmployee(): void{
  if (this.editingEmployeeId == null)
  {
    return;
  }
  this.employeeService.updateEmployee(this.editingEmployeeId, this.editFormData)
  .subscribe({
    next: () => {
       this.editingEmployeeId = null;
       this.editFormData = {};
       this.refreshEmployees();
    },
    error: (error) =>{
      console.error('Error deleting employee: ', error);
    }
  });
}
// Add Employee

  onToggleAddForm(): void{
    if(!this.showAddForm)
    {
      this.NewEmployeeData = {};
    }
    this.showAddForm = !this.showAddForm;
  }

  onCancelAdd(): void
  {
    this.showAddForm = false;
    this.NewEmployeeData = {};
  }

  onAddEmployee(): void
  {
    if(!this.NewEmployeeData.firstName || !this.NewEmployeeData.
      lastName || !this.NewEmployeeData.email
    )
    {
      return;
    }

    this.employeeService.addEmployee(this.NewEmployeeData).subscribe({
      next: () =>{
          this.showAddForm = false;
          this.NewEmployeeData = {};
          this.refreshEmployees();

      },
      error: (error) => {
        console.log('Error adding employee', error);
      }
    });
  }

  // Export to CSV
  onExportToCsv(): void
  {
   const employees = this.employeeService.getEmployeesForExport();

   if(employees.length === 0)
   {
    alert('No employees to export');
    return;
   }
  }

  // CSV
  // e.g: valuel, value2, value3

 exportToCsv(): void {
  const headers = [
    'ID',
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Department',
    'Designation',
    'Location',
    'Salary',
    'Join Date',
    'Status'
  ];

  // Escape CSV values
  const escapeCsvValue = (value: unknown): string => {
    const stringValue = String(value ?? '');
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  // Convert employee data into CSV rows
  const rows = this.employees.map(emp => [
    escapeCsvValue(emp.id),
    escapeCsvValue(emp.firstName),
    escapeCsvValue(emp.lastName),
    escapeCsvValue(emp.email),
    escapeCsvValue(emp.phone),
    escapeCsvValue(emp.department),
    escapeCsvValue(emp.designation),
    escapeCsvValue(emp.location),
    escapeCsvValue(emp.salary),
    escapeCsvValue(emp.joinDate),
    escapeCsvValue(emp.status)
  ].join(','));

  // Combine headers and rows
  const csvContent = [
    headers.map(escapeCsvValue).join(','),
    ...rows
  ].join('\r\n');

  // Create CSV file
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;'
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = 'employees.csv';

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
}
}