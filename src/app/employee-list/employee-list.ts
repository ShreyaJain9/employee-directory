import { Component, inject, OnInit} from '@angular/core';
import { EmployeeService } from '../service/employee-service';
import { Employee } from '../models/employee.model';
import { error } from 'console';

@Component({
  imports: [],
  selector: 'app-employee-list',
  styleUrl: './employee-list.css',
  templateUrl: './employee-list.html',
})
export class EmployeeList implements OnInit
{
  private employeeService: EmployeeService = inject(EmployeeService);
  employees: Employee[] = [];

  ngOnInit(): void {
    this.employeeService.getEmployees().subscribe({
      next: (data: Employee[]) =>{
        this.employees = data;
      },
      error: (error) => {
        console.error(`Error fetching employees: `, error);
      }
    })
  }
}
