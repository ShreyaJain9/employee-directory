import { Service } from '@angular/core';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Employee } from '../models/employee.model';
import { environment } from '../environments/environments';
import { Observable } from 'rxjs';

@Service()
export class EmployeeService {
    private http: HttpClient = inject(HttpClient);
    private apiUrl: string = `${environment.apiUrl}/employees`;

    private allEmployes: Employee[] = [];
    private serachTerm: string = '';
    private sortColumn: string = '';
    private serachColumn: string = '';
    private sortDirection: 'asc' | 'desc' = 'asc';

    // Filter Properties

    private filterDepartment: string = '';
    private filterStatus: string = '';
    private filterLocation: string = '';

    // Paginations Properties

    private currentPage: number = 1;
    private pageSize: number = 10;
    private filteredCount: number = 0;


    getEmployees(): Observable<Employee[]> {
        return this.http.get<Employee[]>(this.apiUrl);
    }

    setEmployees(employees: Employee[]): void {
        this.allEmployes = employees;
    }

    getSortColumn(): string {
        return this.sortColumn;
    }

    getSortDirection(): 'asc' | 'desc' {
        return this.sortDirection;
    }

    getFilteredAndSortedEmployees(): Employee[] {
        let result = [...this.allEmployes];

        if (this.serachTerm.trim()) {
            const term = this.serachTerm.toLowerCase().trim();

            result = result.filter((employee: Employee) => {
                return (
                    employee.firstName.toLowerCase().includes(term) ||
                    employee.lastName.toLowerCase().includes(term) ||
                    employee.email.toLowerCase().includes(term) ||
                    employee.department.toLowerCase().includes(term) ||
                    employee.designation.toLowerCase().includes(term) ||
                    employee.location.toLowerCase().includes(term)
                );
            });
        }

        if (this.filterDepartment)
        {
            result = result.filter(emp => emp.department === this.filterDepartment)
        }

        if (this.filterStatus)
        {
            result = result.filter(emp => emp.status === this.filterStatus)
        }

        if (this.filterLocation)
        {
            result = result.filter(emp => emp.location === this.filterLocation)
        }

        result = this.applySort(result);

        this.filteredCount = result.length;

        const startIndex = (this.currentPage -1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        result = result.slice(startIndex, endIndex);

        return result;

    }

    setSearchTerm(term: string): void {
        this.serachTerm = term;
        this.currentPage = 1;
    }

    setSort(column: string): void {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        }
        else {
            this.sortColumn = column;
            this.sortDirection = 'asc';

        }
    }

    private applySort(employees: Employee[]): Employee[] {
        if (!this.sortColumn) {
            return employees;
        }

        return [...employees].sort((a: Employee, b: Employee) => {
            const valueA = a[this.sortColumn as keyof Employee];
            const valueB = b[this.sortColumn as keyof Employee];

            let comparison = 0;

            if (typeof valueA === 'string' && typeof valueB === 'string') {
                comparison = valueA.toLocaleUpperCase().localeCompare(valueB.toLowerCase());
            }
            else if (typeof valueA === 'number' && typeof valueB === 'number') {
                comparison = valueA - valueB;
            }

            return this.sortDirection === 'desc' ? comparison * -1 : comparison;
        });
    }


    getDepartments(): string[] {
        const departments: string[] = this.allEmployes.map(
            emp => emp.department
        );

        return [...new Set(departments)].sort();
    }

    getStatuses(): string[] {
        const statuses: string[] = this.allEmployes.map(
            emp => emp.status
        );

        return [...new Set(statuses)].sort();
    }

    getLocations(): string[] {
        const location: string[] = this.allEmployes.map(
            emp => emp.location
        );

        return [...new Set(location)].sort();
    }

    setDepartmentFilter(department: string): void
    {
        this.filterDepartment = department;
        this.currentPage = 1;
    }

    setStatusFilter(status: string): void
    {
        this.filterStatus = status;
        this.currentPage = 1;
    }

    setLocationFilter(location: string): void
    {
        this.filterLocation = location;
        this.currentPage = 1;
    }

    // pagetinations gatter

    getCurrentPage(): number{
        return this.currentPage;
    }

    getPageSize(): number{
        return this.pageSize;
    }
    
    getTotalPage(): number{
        return Math.ceil(this.filteredCount/ this.pageSize);
    }

    getFilteredCount(): number{
        return this.filteredCount;
    }

    // pagetions navegations

    setPage(page: number): void
    {
        if(page < 1){
            return;
        }

        if (page > this.getTotalPage()){
            return;
        }
        this.currentPage = page;
    }
    nextPage(): void{
        if(this.currentPage < this.getTotalPage())
        {
            this.currentPage++;
        }
    }

    previousPage(): void{
        if(this.currentPage > 1)
        {
            this.currentPage--;
        }

    }
    deleteEmployee(id: number): Observable<unknown>{
        this.allEmployes = this.allEmployes.filter(emp => emp.id != id);

        const newTotalPages = Math.ceil(this.allEmployes.length / this.pageSize);
        if (this.currentPage > newTotalPages)
        {
            this.currentPage = newTotalPages;
        }
        else if(newTotalPages == 0)
        {
            this.currentPage = 1;
        }

        return this.http.delete(`${this.apiUrl}/${id}`)
    }

    updateEmployee(id: number, updateData: Partial<Employee>): Observable<Employee>
    
    {

        const index = this.allEmployes.findIndex(emp => emp.id === id);

        if (index === -1)
        {
            return new Observable<Employee>;
        }

        this.allEmployes[index] = {...this.allEmployes[index], ...updateData};

        return this.http.put<Employee>(`${this.apiUrl}/${id}`, updateData)
        // {
        //     return;
        // }
    }

    addEmployee(data: Partial<Employee>): Observable<Employee>{
        const newId = this.allEmployes.reduce(
            (max, emp) => emp.id> max? emp.id: max, 0
        ) + 1;

        const newEmployee : Employee = {
            id: newId,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phone: data.phone || '',
            department: data.department || 'Engineering',
            designation: data.department || '',
            location: data.department || 'New York',
            salary: data.salary || 0,
            joinDate: new Date().toISOString().split('T')[0],
            status: data.status || 'Active',
            managerId: null,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' +newId

        };

        this.allEmployes.push(newEmployee);

        return this.http.post<Employee>(this.apiUrl, newEmployee);
    };

    // Export to CSV

    getEmployeesForExport(): Employee[]
    {
      
         let result = [...this.allEmployes];

        if (this.serachTerm.trim()) {
            const term = this.serachTerm.toLowerCase().trim();

            result = result.filter((employee: Employee) => {
                return (
                    employee.firstName.toLowerCase().includes(term) ||
                    employee.lastName.toLowerCase().includes(term) ||
                    employee.email.toLowerCase().includes(term) ||
                    employee.department.toLowerCase().includes(term) ||
                    employee.designation.toLowerCase().includes(term) ||
                    employee.location.toLowerCase().includes(term)
                );
            });
        }

        if (this.filterDepartment)
        {
            result = result.filter(emp => emp.department === this.filterDepartment)
        }

        if (this.filterStatus)
        {
            result = result.filter(emp => emp.status === this.filterStatus)
        }

        if (this.filterLocation)
        {
            result = result.filter(emp => emp.location === this.filterLocation)
        }

        result = this.applySort(result);

        // this.filteredCount = result.length;

        result = this.applySort(result);

        return result;

    }
}
