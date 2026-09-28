import employees from '../config/employees.json';

export function getEmployees() {
  return employees;
}

export function findEmployee(name) {
  return employees.find((e) => e.name === name);
}

// Login for each employee: lowercase name with spaces removed, plus "@123".
// Username and password are the same, e.g. "Kavee" -> kavee@123 / kavee@123.
export function employeeLogin(name) {
  return name.toLowerCase().replace(/\s+/g, '') + '@123';
}

export function findEmployeeByLogin(username, password) {
  return (
    employees.find((e) => {
      const login = employeeLogin(e.name);
      return username === login && password === login;
    }) || null
  );
}
