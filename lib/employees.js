import employees from '../config/employees.json';

export function getEmployees() {
  return employees;
}

export function findEmployee(name) {
  return employees.find((e) => e.name === name);
}
