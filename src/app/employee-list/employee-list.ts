import { Component, inject, OnInit} from '@angular/core';
import { EmployeeService } from '../service/employee-service';
import { Employee } from '../models/employee.model';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { error } from 'console';
import { DecimalPipe, DatePipe } from '@angular/common';

@Component({
  imports: [DecimalPipe, DatePipe ],
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
  
  departments: string[] = [];
  statuses: string[] = [];
  locations: string[] = [];

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
}
